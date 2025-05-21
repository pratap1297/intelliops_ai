from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from backend.database import get_db
from backend.models import ApiLog
import logging
import json

router = APIRouter()
logger = logging.getLogger("api_logs")

@router.get("/api/logs/test")
def test_log_creation(db: Session = Depends(get_db)):
    """Test endpoint to create a sample log entry"""
    try:
        # Create a test log entry
        test_log = {
            "log_type": "info",
            "provider": "test",
            "session_id": "test-session",
            "endpoint": "/api/logs/test",
            "request_data": {"test": True},
            "response_data": {"success": True},
            "status_code": 200,
            "duration_ms": 0
        }
        
        # Add the log
        log = add_log(db, test_log)
        
        if log:
            return {"message": "Test log created successfully", "log_id": log.id}
        else:
            return {"message": "Failed to create test log"}
    except Exception as e:
        logger.error(f"Error in test_log_creation: {str(e)}")
        return {"error": str(e)}

@router.get("/api/logs")
def get_logs(
    provider: Optional[str] = None,
    log_type: Optional[str] = None,
    session_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=100, description="Number of logs per page"),
    db: Session = Depends(get_db)
):
    """Get API logs with optional filtering and pagination"""
    try:
        # Start with base query
        query = db.query(ApiLog)
        
        # Apply filters
        if provider:
            query = query.filter(ApiLog.provider == provider)
        if log_type:
            query = query.filter(ApiLog.log_type == log_type)
        if session_id:
            query = query.filter(ApiLog.session_id == session_id)
        
        # Date filtering
        if start_date:
            try:
                start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                query = query.filter(ApiLog.timestamp >= start)
            except ValueError:
                logger.warning(f"Invalid start_date format: {start_date}")
        
        if end_date:
            try:
                end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                query = query.filter(ApiLog.timestamp <= end)
            except ValueError:
                logger.warning(f"Invalid end_date format: {end_date}")
        
        # Get total count for pagination metadata
        total_count = query.count()
        
        # Order by timestamp descending (newest first)
        query = query.order_by(ApiLog.timestamp.desc())
        
        # Apply pagination
        offset = (page - 1) * page_size
        logs = query.offset(offset).limit(page_size).all()
        
        # Calculate pagination metadata
        total_pages = (total_count + page_size - 1) // page_size  # Ceiling division
        has_next = page < total_pages
        has_prev = page > 1
        
        # Format for frontend
        result = []
        for log in logs:
            result.append({
                "id": str(log.id),
                "timestamp": log.timestamp.isoformat(),
                "type": log.log_type,
                "provider": log.provider,
                "session_id": log.session_id,
                "endpoint": log.endpoint,
                "content": log.request_data if log.log_type == "request" else log.response_data,
                "status": log.status_code,
                "duration": log.duration_ms,
                "error": log.error_message
            })
        
        # Add pagination metadata
        return {
            "logs": result,
            "pagination": {
                "total": total_count,
                "page": page,
                "page_size": page_size,
                "total_pages": total_pages,
                "has_next": has_next,
                "has_prev": has_prev
            }
        }
    except Exception as e:
        logger.error(f"Error retrieving logs: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error retrieving logs: {str(e)}")

# Helper function to add logs (used internally by other services)
def add_log(db: Session, log_data: dict):
    """Add a new API log entry"""
    try:
        # Debug logging
        logger.info(f"Adding log entry: {json.dumps(log_data, default=str)}")
        
        # Ensure all required fields are present
        if 'log_type' not in log_data:
            logger.error("Missing required field: log_type")
            log_data['log_type'] = 'error'  # Default
            
        if 'provider' not in log_data:
            logger.error("Missing required field: provider")
            log_data['provider'] = 'unknown'  # Default
        
        # Create and save the log
        log = ApiLog(**log_data)
        db.add(log)
        db.commit()
        db.refresh(log)
        
        logger.info(f"Successfully added log entry with ID: {log.id}")
        return log
    except Exception as e:
        logger.error(f"Error adding log: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        db.rollback()
        # Don't raise the exception to prevent API failures
        return None
