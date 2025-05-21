from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import os
from dotenv import load_dotenv
import logging

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
async def get_aws_settings():
    """Get the current AWS Bedrock agent settings"""
    try:
        return {
            "agent_id": DEFAULT_AGENT_ID,
            "agent_alias_id": DEFAULT_AGENT_ALIAS_ID,
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Error getting AWS settings: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", response_model=AwsSettingsResponse)
async def update_aws_settings(request: AwsSettingsRequest):
    """Update the AWS Bedrock agent settings"""
    try:
        # In a real implementation, you would save these to a database or config file
        # For now, we'll just return them as if they were saved
        
        # Update environment variables in memory (not persistent)
        os.environ["AWS_BEDROCK_AGENT_ID"] = request.agent_id
        os.environ["AWS_BEDROCK_AGENT_ALIAS_ID"] = request.agent_alias_id
        
        logger.info(f"Updated AWS Bedrock agent settings: agent_id={request.agent_id}, agent_alias_id={request.agent_alias_id}")
        
        return {
            "agent_id": request.agent_id,
            "agent_alias_id": request.agent_alias_id,
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Error updating AWS settings: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
