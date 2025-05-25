from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Base
from sqlalchemy import select
from fastapi.responses import JSONResponse
import os
import json
from fastapi import Query
from ..dependencies import get_current_admin_user
from ..models import User

# Define a whitelist of allowed tables for security
ALLOWED_TABLES = [
    "navigation_items",
    "prompts",
    "chat_threads",
    "chat_messages",
    # Add other non-sensitive tables as needed
]

# Define allowed columns per table to prevent exposure of sensitive data
ALLOWED_COLUMNS = {
    "navigation_items": ["id", "title", "path", "position", "order", "is_enabled", "tooltip"],
    "prompts": ["id", "title", "description", "category", "cloud_provider", "is_system", "created_at", "updated_at"],
    "chat_threads": ["id", "title", "cloud_provider", "created_at", "updated_at"],
    "chat_messages": ["id", "thread_id", "role", "created_at"],
    # Add other tables and their safe columns
}

# Check if we're in production environment
IS_PRODUCTION = os.getenv("ENVIRONMENT", "development").lower() == "production"

router = APIRouter(prefix="/debug", tags=["Debug"])

@router.get("/orm-tables")
def get_orm_tables(db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_user)):
    # Only admin users can access this endpoint
    # If in production, restrict to only allowed tables
    
    tables = []
    for table in Base.metadata.sorted_tables:
        # In production, only show allowed tables
        if IS_PRODUCTION and table.name not in ALLOWED_TABLES:
            continue
            
        columns = []
        for col in table.columns:
            # In production, only show allowed columns
            if IS_PRODUCTION and table.name in ALLOWED_COLUMNS and col.name not in ALLOWED_COLUMNS[table.name]:
                continue
                
            columns.append({
                "name": col.name,
                "type": str(col.type),
                "nullable": col.nullable,
                "primary_key": col.primary_key
            })
        tables.append({
            "name": table.name,
            "columns": columns
        })
    return JSONResponse(content={"tables": tables})

@router.get("/orm-table-data")
def get_orm_table_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
    table: str = Query(..., description="Table name"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    filter: str = Query(None, description="JSON object as string for filtering, e.g. '{\"email\":\"foo@bar.com\"}'")
):
    # Security check - only allow access to whitelisted tables
    if table not in ALLOWED_TABLES:
        return JSONResponse(content={"error": "Access to this table is not allowed"}, status_code=403)
        
    # Find the table by name
    target_table = None
    for t in Base.metadata.sorted_tables:
        if t.name == table:
            target_table = t
            break
    if target_table is None:
        return JSONResponse(content={"error": "Table not found"}, status_code=404)

    stmt = select(target_table)

    # Filtering
    if filter:
        try:
            filter_dict = json.loads(filter)
            for key, value in filter_dict.items():
                # Security check - only allow filtering on whitelisted columns
                if key not in ALLOWED_COLUMNS.get(table, []):
                    return JSONResponse(content={"error": f"Filtering on column '{key}' is not allowed"}, status_code=403)
                    
                if key in target_table.c:
                    # Use parameterized query through SQLAlchemy
                    stmt = stmt.where(target_table.c[key] == value)
        except json.JSONDecodeError:
            return JSONResponse(content={"error": "Invalid JSON format in filter parameter"}, status_code=400)
        except Exception:
            return JSONResponse(content={"error": "Invalid filter parameter"}, status_code=400)

    # Pagination
    total = db.execute(select([target_table.count()])).scalar() if hasattr(target_table, 'count') else None
    stmt = stmt.offset((page - 1) * page_size).limit(page_size)
    import datetime
    rows = db.execute(stmt).fetchall()
    def serialize_row(row):
        d = {}
        for k, v in dict(row._mapping).items():
            # Only include allowed columns in the response
            if k in ALLOWED_COLUMNS.get(table, []):
                if isinstance(v, (datetime.datetime, datetime.date, datetime.time)):
                    d[k] = v.isoformat()
                else:
                    d[k] = v
        return d
    row_dicts = [serialize_row(row) for row in rows]
    return JSONResponse(content={
        "name": target_table.name,
        "rows": row_dicts,
        "page": page,
        "page_size": page_size,
        "total": total
    })

@router.get("/orm-table-list")
def get_orm_table_list(current_user: User = Depends(get_current_admin_user)):
    # Only return allowed tables, especially in production
    if IS_PRODUCTION:
        return JSONResponse(content={"tables": ALLOWED_TABLES})
    else:
        return JSONResponse(content={"tables": [t.name for t in Base.metadata.sorted_tables]})
