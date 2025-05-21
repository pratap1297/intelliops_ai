import json
import asyncio
import logging
import boto3
from botocore.config import Config
from botocore.exceptions import BotoCoreError, NoCredentialsError
from fastapi import HTTPException
import os
import uuid
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables from .env file
load_dotenv()

# Default AWS credentials from .env file
DEFAULT_AWS_ACCESS_KEY = os.getenv("AWS_ACCESS_KEY_ID")
DEFAULT_AWS_SECRET_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
DEFAULT_AWS_REGION = os.getenv("AWS_REGION", "us-east-1")

# Default Bedrock agent configuration
DEFAULT_AGENT_ID = "NOPNUNTEOB"
DEFAULT_AGENT_ALIAS_ID = "UHMWSV1HUM"

# AWS Bedrock client configuration
config = Config(
    connect_timeout=600,
    read_timeout=600,
    retries={'max_attempts': 5, 'mode': 'adaptive'},
    max_pool_connections=50
)

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
        import uuid
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
        raise ValueError(f"Error invoking Bedrock agent: {str(e)}")

# Example usage:
# async def example():
#     response = await invoke_bedrock_agent(
#         message="Hello, how can you help me?",
#         aws_access_key="YOUR_ACCESS_KEY",  # Optional if in .env
#         aws_secret_key="YOUR_SECRET_KEY",  # Optional if in .env
#         agent_id="YOUR_AGENT_ID",         # Optional, uses default if not provided
#         agent_alias_id="YOUR_AGENT_ALIAS_ID" # Optional, uses default if not provided
#     )
#     print(response)
