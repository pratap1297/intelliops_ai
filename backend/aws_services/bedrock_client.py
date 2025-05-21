import json
import asyncio
import logging
import boto3
import uuid
import os
import time
from botocore.config import Config
from botocore.exceptions import BotoCoreError, NoCredentialsError
from fastapi import APIRouter, HTTPException, Query, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models
from ..routers.logs import add_log

# Configure logging first
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env'))

# Log that we're loading environment variables
logger.info(f"Loading AWS credentials from .env file")

# AWS Bedrock client configuration
config = Config(
    connect_timeout=600,
    read_timeout=600,
    retries={'max_attempts': 5, 'mode': 'adaptive'},
    max_pool_connections=50
)

# Default AWS credentials from .env file
DEFAULT_AWS_ACCESS_KEY = os.getenv("AWS_ACCESS_KEY_ID")
DEFAULT_AWS_SECRET_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
DEFAULT_AWS_REGION = os.getenv("AWS_REGION", "us-east-1")

# Log the AWS credentials (partially masked for security)
if DEFAULT_AWS_ACCESS_KEY:
    logger.info(f"AWS Access Key loaded: {DEFAULT_AWS_ACCESS_KEY[:4]}...{DEFAULT_AWS_ACCESS_KEY[-4:]}")
    logger.info(f"AWS Region: {DEFAULT_AWS_REGION}")
else:
    logger.warning("AWS credentials not found in .env file")

# Default Bedrock agent configuration (fallback values)
DEFAULT_AGENT_ID = os.getenv("AWS_BEDROCK_AGENT_ID", "NOPNUNTEOB")
DEFAULT_AGENT_ALIAS_ID = os.getenv("AWS_BEDROCK_AGENT_ALIAS_ID", "UHMWSV1HUM")

# Log the agent configuration
logger.info(f"Using Bedrock Agent ID: {DEFAULT_AGENT_ID}")
logger.info(f"Using Bedrock Agent Alias ID: {DEFAULT_AGENT_ALIAS_ID}")

# Request and response models
class ChatRequest(BaseModel):
    message: str
    session_id: str = None
    history: list[dict] = []  # List of previous messages
    aws_access_key: str = None
    aws_secret_key: str = None
    aws_region: str = None
    agent_id: str = None
    agent_alias_id: str = None

class ChatResponse(BaseModel):
    session_id: str
    response: str

def get_bedrock_agent_client(
    aws_access_key=None, 
    aws_secret_key=None, 
    aws_region=None
):
    """
    Create and return a Bedrock agent client using the provided credentials.
    If no credentials are provided, it will use the ones from the .env file.
    """
    # Use provided credentials or fall back to defaults from .env
    aws_access_key = aws_access_key or DEFAULT_AWS_ACCESS_KEY
    aws_secret_key = aws_secret_key or DEFAULT_AWS_SECRET_KEY
    aws_region = aws_region or DEFAULT_AWS_REGION
    
    if not aws_access_key or not aws_secret_key:
        logger.error("AWS credentials not found in .env file and not provided in request")
        raise ValueError("AWS credentials not provided and not found in .env file. Check your .env file or provide credentials in the request.")
        
    try:
        agent_client = boto3.client(
            service_name='bedrock-agent-runtime',
            region_name=aws_region,
            aws_access_key_id=aws_access_key,
            aws_secret_access_key=aws_secret_key,
            config=config
        )
        return agent_client
    except NoCredentialsError:
        raise ValueError("Invalid AWS credentials")
    except BotoCoreError as e:
        raise ValueError(f"Error initializing Bedrock client: {str(e)}")

async def invoke_bedrock_agent(
    message, 
    session_id=None,
    aws_access_key=None, 
    aws_secret_key=None, 
    aws_region=None,
    agent_id=None,
    agent_alias_id=None,
    db: Session = None
):
    """
    Simple function to invoke AWS Bedrock agent and get a response.
    
    Note: This function prioritizes using the AWS credentials from the .env file
    and the agent IDs from the AWS settings page.
    """
    logger.info("=== AWS BEDROCK AGENT INVOCATION DEBUG ===")
    logger.info(f"Incoming request - message: {message[:50]}..., session_id: {session_id}")
    logger.info(f"Provided agent_id: {agent_id}, agent_alias_id: {agent_alias_id}")
    
    # Reload environment variables to get the latest settings
    load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env'), override=True)
    logger.info(f"Env vars - AWS_BEDROCK_AGENT_ID: {os.getenv('AWS_BEDROCK_AGENT_ID')}, AWS_BEDROCK_AGENT_ALIAS_ID: {os.getenv('AWS_BEDROCK_AGENT_ALIAS_ID')}")
    
    # Generate a session ID if not provided
    if not session_id:
        session_id = str(uuid.uuid4())
        logger.info(f"Generated new session ID: {session_id}")
    
    # Always try to get settings from database first
    logger.info("Attempting to get agent IDs from database")
    if db:
        # Try to get settings from database
        logger.info("Database session available, querying for AWS settings")
        settings = db.query(models.AwsSettings).filter(models.AwsSettings.is_active == True).order_by(models.AwsSettings.id.desc()).first()
        if settings:
            logger.info(f"Found settings in database: agent_id={settings.agent_id}, agent_alias_id={settings.agent_alias_id}")
            # Always use database settings if available, overriding any provided values
            agent_id = settings.agent_id
            agent_alias_id = settings.agent_alias_id
            logger.info(f"Using Bedrock Agent ID from database: {agent_id}")
            logger.info(f"Using Bedrock Agent Alias ID from database: {agent_alias_id}")
        else:
            # Only if no database settings, use provided values or fall back to defaults
            logger.info("No settings found in database")
            if not agent_id or not agent_alias_id:
                logger.info("No agent IDs provided, falling back to defaults")
                agent_id = agent_id or DEFAULT_AGENT_ID
                agent_alias_id = agent_alias_id or DEFAULT_AGENT_ALIAS_ID
                logger.info(f"Using fallback agent_id: {agent_id}, agent_alias_id: {agent_alias_id}")
            else:
                logger.info(f"Using provided agent_id: {agent_id}, agent_alias_id: {agent_alias_id}")
    else:
        # No database session, use provided values or fall back to defaults
        logger.info("No database session available")
        if not agent_id or not agent_alias_id:
            logger.info("No agent IDs provided, falling back to defaults")
            agent_id = agent_id or DEFAULT_AGENT_ID
            agent_alias_id = agent_alias_id or DEFAULT_AGENT_ALIAS_ID
            logger.info(f"Using fallback agent_id: {agent_id}, agent_alias_id: {agent_alias_id}")
        else:
            logger.info(f"Using provided agent_id: {agent_id}, agent_alias_id: {agent_alias_id}")
    
    try:
        # Get the Bedrock agent client
        logger.info("Getting Bedrock agent client")
        bedrock_agent_runtime = get_bedrock_agent_client(
            aws_access_key=aws_access_key,
            aws_secret_key=aws_secret_key,
            aws_region=aws_region
        )
        
        # Prepare the request
        request_body = {
            'inputText': message,
            'enableTrace': True
        }
        
        # Create request log entry
        request_log = {
            "log_type": "request",
            "provider": "aws",
            "session_id": session_id,
            "endpoint": "bedrock-agent-runtime.invoke_agent",
            "request_data": {
                "agentId": agent_id,
                "agentAliasId": agent_alias_id,
                "message": message
            }
        }
        
        if db:  # Only log if we have a database session
            add_log(db, request_log)
        
        logger.info(f"Invoking AWS Bedrock agent with ID: {agent_id}, alias: {agent_alias_id}")
        
        # Measure response time
        start_time = time.time()
        
        # Invoke the agent
        response = bedrock_agent_runtime.invoke_agent(
            agentId=agent_id,
            agentAliasId=agent_alias_id,
            sessionId=session_id,
            inputText=message,
            enableTrace=True
        )
        
        # Calculate duration
        duration_ms = int((time.time() - start_time) * 1000)
        
        # Process the EventStream response
        logger.info("Processing EventStream response")
        full_response = ""
        
        # The response is an EventStream object that we need to iterate through
        try:
            # EventStream needs to be processed by iterating through it
            for event in response['completion']:
                if 'chunk' in event:
                    chunk = event['chunk']['bytes'].decode('utf-8')
                    full_response += chunk
            
            logger.info(f"AWS Bedrock agent response received, length: {len(full_response)}")
            
            # Create response log entry
            response_log = {
                "log_type": "response",
                "provider": "aws",
                "session_id": session_id,
                "endpoint": "bedrock-agent-runtime.invoke_agent",
                "response_data": {
                    "completion": full_response[:500],  # Limit size for logging
                    "trace": ""  # Can't easily extract trace from EventStream
                },
                "status_code": 200,
                "duration_ms": duration_ms
            }
            
            if db:  # Only log if we have a database session
                add_log(db, response_log)
        except Exception as e:
            logger.error(f"Error processing EventStream: {str(e)}")
            raise ValueError(f"Error processing EventStream: {str(e)}")
            
        # Validate the response
        if not full_response:
            logger.error("Empty response from Bedrock")
            raise ValueError("Empty response from Bedrock")
            
        # Log a preview of the response
        logger.info(f"Response preview: {full_response[:100]}...")
        
        logger.info(f"Full response length: {len(full_response)} characters")
        logger.info(f"Response preview: {full_response[:100]}...")
                
        return full_response
    
    except (BotoCoreError, NoCredentialsError) as e:
        error_message = f"AWS Bedrock client error: {str(e)}"
        logger.error(error_message)
        
        # Create error log entry
        error_log = {
            "log_type": "error",
            "provider": "aws",
            "session_id": session_id,
            "endpoint": "bedrock-agent-runtime.invoke_agent",
            "error_message": error_message,
            "status_code": 500
        }
        
        if db:  # Only log if we have a database session
            add_log(db, error_log)
            
        raise HTTPException(status_code=500, detail=error_message)
    except Exception as e:
        error_message = f"Error invoking AWS Bedrock agent: {str(e)}"
        logger.error(error_message)
        
        # Create error log entry
        error_log = {
            "log_type": "error",
            "provider": "aws",
            "session_id": session_id,
            "endpoint": "bedrock-agent-runtime.invoke_agent",
            "error_message": error_message,
            "status_code": 500
        }
        
        if db:  # Only log if we have a database session
            add_log(db, error_log)
            
        raise HTTPException(status_code=500, detail=error_message)

# Create the router
router = APIRouter(
    prefix="/aws-bedrock",
    tags=["AWS Bedrock"],
    responses={404: {"description": "Not found"}},
)

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, db: Session = Depends(get_db)):
    """
    Standard chat endpoint for AWS Bedrock.
    Send a message to AWS Bedrock agent and get a response.
    """
    try:
        # Generate a session ID if not provided
        if not request.session_id:
            session_id = str(uuid.uuid4())
        else:
            session_id = request.session_id
            
        # Invoke the Bedrock agent
        response = await invoke_bedrock_agent(
            message=request.message,
            session_id=session_id,
            aws_access_key=request.aws_access_key,
            aws_secret_key=request.aws_secret_key,
            aws_region=request.aws_region,
            agent_id=request.agent_id,
            agent_alias_id=request.agent_alias_id,
            db=db
        )
        
        return ChatResponse(session_id=session_id, response=response)
    except Exception as e:
        logger.error(f"Error in AWS Bedrock chat endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/test")
async def test_bedrock(
    message: str = Query(..., description="Message to send to the Bedrock agent"),
    agent_id: str = Query(None, description="Optional: Custom agent ID"),
    agent_alias_id: str = Query(None, description="Optional: Custom agent alias ID"),
    db: Session = Depends(get_db)
):
    """
    Test endpoint for AWS Bedrock agent using query parameters.
    This is a simple GET endpoint for testing in the browser.
    """
    try:
        # Generate a session ID
        session_id = str(uuid.uuid4())
            
        # Invoke the Bedrock agent
        response = await invoke_bedrock_agent(
            message=message,
            session_id=session_id,
            agent_id=agent_id,
            agent_alias_id=agent_alias_id,
            db=db
        )
        
        return {"session_id": session_id, "response": response}
    except Exception as e:
        logger.error(f"Error in AWS Bedrock test endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/prompts")
def get_prompts():
    """
    Get a list of example prompts for AWS Bedrock.
    """
    prompts = [
        "Create an EC2 instance (t2.micro, Ubuntu, us-east-1) with default settings.",
        "Delete EC2 instance with name: abc and Username: ABCEC2.",
        "Create an S3 bucket with Name: test-1234567 and default configuration.",
        "Delete S3 bucket with Name: test-1234567 and Username: ABCEC2.",
        "Scan for all available patches in instance i-xxx using a baseline.",
        "Scan for all available patches in instance i-xxx without a baseline.",
        "Install all patches using the baseline.",
        "Install all patches without a baseline.",
        "Summarize errors for log groups.",
        "Show error details for the specified log group.",
        "Create an incident for the error.",
        "List All incident"
    ]
    return JSONResponse(content=prompts)

@router.get("/config")
async def get_config(db: Session = Depends(get_db)):
    """Return the current AWS Bedrock configuration (without sensitive information)"""
    # Try to get settings from database first
    settings = db.query(models.AwsSettings).filter(models.AwsSettings.is_active == True).order_by(models.AwsSettings.id.desc()).first()
    
    if settings:
        agent_id = settings.agent_id
        agent_alias_id = settings.agent_alias_id
    else:
        # Fall back to environment variables or defaults
        agent_id = DEFAULT_AGENT_ID
        agent_alias_id = DEFAULT_AGENT_ALIAS_ID
    
    return {
        "aws_region": DEFAULT_AWS_REGION,
        "default_agent_id": agent_id,
        "default_agent_alias_id": agent_alias_id,
        "aws_credentials_configured": bool(DEFAULT_AWS_ACCESS_KEY and DEFAULT_AWS_SECRET_KEY)
    }

@router.get("/")
async def root():
    """Root endpoint for checking the AWS Bedrock API status."""
    return {"message": "Welcome to AWS Bedrock Chat API"}
