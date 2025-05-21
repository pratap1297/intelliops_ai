from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import os
from dotenv import load_dotenv
import logging
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, crud

# Configure logging
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Default Bedrock agent configuration
DEFAULT_AGENT_ID = os.getenv("AWS_BEDROCK_AGENT_ID", "NOPNUNTEOB")
DEFAULT_AGENT_ALIAS_ID = os.getenv("AWS_BEDROCK_AGENT_ALIAS_ID", "UHMWSV1HUM")

# Create router
router = APIRouter(
    prefix="/aws-settings",
    tags=["AWS Settings"],
    responses={404: {"description": "Not found"}},
)

# Request and response models
class AwsSettingsRequest(BaseModel):
    agent_id: str
    agent_alias_id: str

class AwsSettingsResponse(BaseModel):
    agent_id: str
    agent_alias_id: str
    status: str

@router.get("/", response_model=AwsSettingsResponse)
async def get_aws_settings(db: Session = Depends(get_db)):
    """Get the current AWS Bedrock agent settings"""
    logger.info("=== GET AWS SETTINGS DEBUG ===")
    try:
        # Try to get settings from database first
        logger.info("Querying database for AWS settings")
        settings = db.query(models.AwsSettings).filter(models.AwsSettings.is_active == True).order_by(models.AwsSettings.id.desc()).first()
        
        if settings:
            logger.info(f"Found settings in database: agent_id={settings.agent_id}, agent_alias_id={settings.agent_alias_id}")
            return {
                "agent_id": settings.agent_id,
                "agent_alias_id": settings.agent_alias_id,
                "status": "success"
            }
        else:
            # Fall back to environment variables or defaults
            logger.info("No settings found in database, using environment variables or defaults")
            logger.info(f"DEFAULT_AGENT_ID={DEFAULT_AGENT_ID}, DEFAULT_AGENT_ALIAS_ID={DEFAULT_AGENT_ALIAS_ID}")
            return {
                "agent_id": DEFAULT_AGENT_ID,
                "agent_alias_id": DEFAULT_AGENT_ALIAS_ID,
                "status": "success"
            }
    except Exception as e:
        logger.error(f"Error getting AWS settings: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", response_model=AwsSettingsResponse)
async def update_aws_settings(request: AwsSettingsRequest, db: Session = Depends(get_db)):
    """Update the AWS Bedrock agent settings"""
    logger.info("=== UPDATE AWS SETTINGS DEBUG ===")
    logger.info(f"Received update request: agent_id={request.agent_id}, agent_alias_id={request.agent_alias_id}")
    
    try:
        # Validate the agent ID and agent alias ID
        if not request.agent_id or not request.agent_alias_id:
            logger.error("Invalid agent ID or agent alias ID provided")
            raise HTTPException(status_code=400, detail="Agent ID and Agent Alias ID are required")
        
        # Deactivate all existing settings
        logger.info("Deactivating existing settings")
        existing_settings = db.query(models.AwsSettings).filter(models.AwsSettings.is_active == True).all()
        logger.info(f"Found {len(existing_settings)} active settings to deactivate")
        
        for setting in existing_settings:
            setting.is_active = False
            logger.info(f"Deactivated setting ID {setting.id}: agent_id={setting.agent_id}, agent_alias_id={setting.agent_alias_id}")
        
        # Create new settings record
        logger.info("Creating new settings record")
        new_settings = models.AwsSettings(
            agent_id=request.agent_id,
            agent_alias_id=request.agent_alias_id,
            is_active=True
        )
        db.add(new_settings)
        db.commit()
        db.refresh(new_settings)
        logger.info(f"Created new settings record with ID {new_settings.id}")
        
        # Also update environment variables for immediate use
        logger.info("Updating environment variables for immediate use")
        os.environ["AWS_BEDROCK_AGENT_ID"] = request.agent_id
        os.environ["AWS_BEDROCK_AGENT_ALIAS_ID"] = request.agent_alias_id
        
        logger.info(f"Updated AWS Bedrock agent settings: agent_id={request.agent_id}, agent_alias_id={request.agent_alias_id}")
        logger.info(f"Current environment variables: AWS_BEDROCK_AGENT_ID={os.getenv('AWS_BEDROCK_AGENT_ID')}, AWS_BEDROCK_AGENT_ALIAS_ID={os.getenv('AWS_BEDROCK_AGENT_ALIAS_ID')}")
        
        return {
            "agent_id": request.agent_id,
            "agent_alias_id": request.agent_alias_id,
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Error updating AWS settings: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
