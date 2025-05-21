from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from backend.models import GcpSettings
from backend.database import get_db
import logging

# Define router without prefix to match our successful test
router = APIRouter()
logger = logging.getLogger("gcp_settings")

@router.get("/api/gcp-settings")
def get_gcp_settings(db: Session = Depends(get_db)):
    settings = db.query(GcpSettings).filter(GcpSettings.is_active == True).first()
    logger.info(f"Fetched GCP settings: {settings}")
    if not settings:
        raise HTTPException(status_code=404, detail="No GCP settings found.")
    return {
        "session_endpoint": settings.session_endpoint,
        "agent_run_endpoint": settings.agent_run_endpoint,
        "id": settings.id
    }

@router.post("/api/gcp-settings")
def set_gcp_settings(data: dict, db: Session = Depends(get_db)):
    session_endpoint = data.get("session_endpoint")
    agent_run_endpoint = data.get("agent_run_endpoint")
    if not session_endpoint or not agent_run_endpoint:
        logger.error("Missing required GCP endpoint fields.")
        raise HTTPException(status_code=400, detail="Both session_endpoint and agent_run_endpoint are required.")
    # Deactivate previous
    db.query(GcpSettings).filter(GcpSettings.is_active == True).update({"is_active": False})
    # Save new
    new_settings = GcpSettings(session_endpoint=session_endpoint, agent_run_endpoint=agent_run_endpoint, is_active=True)
    db.add(new_settings)
    db.commit()
    db.refresh(new_settings)
    logger.info(f"Saved new GCP settings: {new_settings}")
    return {"message": "GCP settings updated.", "id": new_settings.id}
