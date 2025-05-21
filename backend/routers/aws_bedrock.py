from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
import logging
import uuid
import os
import boto3
import asyncio
from botocore.config import Config
from botocore.exceptions import BotoCoreError, NoCredentialsError
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logger = logging.getLogger(__name__)

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

# Default Bedrock agent configuration
DEFAULT_AGENT_ID = os.getenv("AWS_BEDROCK_AGENT_ID", "NOPNUNTEOB")
DEFAULT_AGENT_ALIAS_ID = os.getenv("AWS_BEDROCK_AGENT_ALIAS_ID", "UHMWSV1HUM")

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
        raise ValueError("AWS credentials not provided and not found in .env file")
        
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
    agent_alias_id=None
):
    """
    Simple function to invoke AWS Bedrock agent and get a response.
    
    Args:
        message (str): The user message to send to the agent
        session_id (str, optional): Session ID for conversation continuity
        aws_access_key (str, optional): AWS access key
        aws_secret_key (str, optional): AWS secret key
        aws_region (str, optional): AWS region
        agent_id (str, optional): Bedrock agent ID
        agent_alias_id (str, optional): Bedrock agent alias ID
        
    Returns:
        str: The agent's response text
    """
    # Generate a session ID if not provided
    if not session_id:
        session_id = str(uuid.uuid4())
    
    # Use provided agent IDs or defaults
    agent_id = agent_id or DEFAULT_AGENT_ID
    agent_alias_id = agent_alias_id or DEFAULT_AGENT_ALIAS_ID
    
    try:
        # Get the Bedrock agent client
        agent_client = get_bedrock_agent_client(
            aws_access_key, 
            aws_secret_key, 
            aws_region
        )
        
        # Invoke the agent
        response = await asyncio.to_thread(
            agent_client.invoke_agent,
            agentId=agent_id,
            agentAliasId=agent_alias_id,
            sessionId=session_id,
            inputText=message,
            enableTrace=True
        )
        
        # Extract the response text
        if not response or 'completion' not in response:
            raise ValueError("Invalid response format from Bedrock")
            
        # Combine all chunks into a single response
        full_response = ""
        for event in response["completion"]:
            if "chunk" in event:
                chunk = event["chunk"]["bytes"].decode("utf-8")
                full_response += chunk
                
        return full_response
    
    except Exception as e:
        logger.error(f"Error invoking Bedrock agent: {str(e)}", exc_info=True)
        raise ValueError(f"Error invoking Bedrock agent: {str(e)}")

# Request and response models
class ChatRequest(BaseModel):
    message: str
    session_id: str = None
    history: list[dict] = []  # List of previous messages
    provider: str = None  # Added to match frontend request
    aws_access_key: str = None
    aws_secret_key: str = None
    aws_region: str = None
    agent_id: str = None
    agent_alias_id: str = None

class ChatResponse(BaseModel):
    session_id: str
    response: str



router = APIRouter(
    prefix="/aws-bedrock",
    tags=["AWS Bedrock"],
    responses={404: {"description": "Not found"}},
)

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Standard chat endpoint for AWS Bedrock.
    Send a message to AWS Bedrock agent and get a response.
    """
    try:
        # Log the incoming request for debugging
        logger.info(f"Received AWS Bedrock chat request: {request.dict(exclude={'aws_secret_key'})}")

        # Generate a session ID if not provided
        if not request.session_id:
            session_id = str(uuid.uuid4())
        else:
            session_id = request.session_id
            
        # Check AWS credentials
        logger.info(f"Checking AWS credentials: Access Key exists: {bool(DEFAULT_AWS_ACCESS_KEY)}, Secret Key exists: {bool(DEFAULT_AWS_SECRET_KEY)}")
        if not DEFAULT_AWS_ACCESS_KEY or not DEFAULT_AWS_SECRET_KEY:
            logger.error("AWS credentials not found in environment variables")
            raise HTTPException(status_code=401, detail="AWS credentials not configured")

        # For safety, use a direct approach similar to our test script
        try:
            # Create the Bedrock agent client
            agent_client = boto3.client(
                service_name='bedrock-agent-runtime',
                region_name=DEFAULT_AWS_REGION,
                aws_access_key_id=DEFAULT_AWS_ACCESS_KEY,
                aws_secret_access_key=DEFAULT_AWS_SECRET_KEY
            )
            
            # Invoke the agent directly
            logger.info(f"Directly invoking Bedrock agent with message: {request.message}")
            
            # Use asyncio to run the blocking operation
            response_obj = await asyncio.to_thread(
                agent_client.invoke_agent,
                agentId=DEFAULT_AGENT_ID,
                agentAliasId=DEFAULT_AGENT_ALIAS_ID,
                sessionId=session_id,
                inputText=request.message,
                enableTrace=True
            )
            
            # Extract the response text
            if 'completion' in response_obj:
                full_response = ""
                for event in response_obj["completion"]:
                    if "chunk" in event:
                        chunk = event["chunk"]["bytes"].decode("utf-8")
                        full_response += chunk
                        
                logger.info(f"Bedrock agent response received, length: {len(full_response)}")
                return ChatResponse(session_id=session_id, response=full_response)
            else:
                logger.error("No 'completion' field in Bedrock response")
                return ChatResponse(
                    session_id=session_id, 
                    response="I'm sorry, I couldn't process your request properly."
                )
                
        except Exception as inner_e:
            logger.error(f"Exception during Bedrock invocation: {str(inner_e)}", exc_info=True)
            # Return a fallback response instead of error for better user experience
            return ChatResponse(
                session_id=session_id, 
                response="I'm sorry, I couldn't process your request at this time. Please try again later."
            )
    except Exception as e:
        logger.error(f"Unexpected error in AWS Bedrock chat endpoint: {str(e)}", exc_info=True)
        # Return a fallback response instead of error for better user experience
        return ChatResponse(
            session_id=request.session_id or str(uuid.uuid4()), 
            response="I'm sorry, I encountered an unexpected error. Please try again later."
        )

@router.get("/test")
async def test_bedrock(
    message: str = Query(..., description="Message to send to the Bedrock agent"),
    agent_id: str = Query(None, description="Optional: Custom agent ID"),
    agent_alias_id: str = Query(None, description="Optional: Custom agent alias ID")
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
            agent_alias_id=agent_alias_id
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
async def get_config():
    """Return the current AWS Bedrock configuration (without sensitive information)"""
    return {
        "aws_region": DEFAULT_AWS_REGION,
        "default_agent_id": DEFAULT_AGENT_ID,
        "default_agent_alias_id": DEFAULT_AGENT_ALIAS_ID,
        "aws_credentials_configured": bool(DEFAULT_AWS_ACCESS_KEY and DEFAULT_AWS_SECRET_KEY)
    }

@router.get("/")
async def root():
    """Root endpoint for checking the AWS Bedrock API status."""
    return {"message": "Welcome to AWS Bedrock Chat API"}
