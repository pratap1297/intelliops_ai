import json
import asyncio
import time
import logging
import uuid
from datetime import datetime
import os
from logging.handlers import RotatingFileHandler
from fastapi import HTTPException
from pydantic import BaseModel
import watchtower
import boto3
from botocore.config import Config
from botocore.exceptions import BotoCoreError, NoCredentialsError
import backoff
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# -------------------------------
# Logging Setup
# -------------------------------
def setup_logging():
    """Configure logging to CloudWatch and local file"""
    # Create logs directory if it doesn't exist
    log_dir = "logs"
    os.makedirs(log_dir, exist_ok=True)

    # Configure logging format
    log_format = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    formatter = logging.Formatter(log_format)

    # Setup file handler with rotation
    file_handler = RotatingFileHandler(
        filename=os.path.join(log_dir, 'aws_bedrock_service.log'),
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5
    )
    file_handler.setFormatter(formatter)

    # Setup CloudWatch handler
    region = os.getenv("AWS_REGION", "us-east-1")
    cloudwatch_handler = watchtower.CloudWatchLogHandler(
        log_group="ChatServiceLogs",
        log_stream_name=f"aws-bedrock-service-{datetime.now().strftime('%Y-%m-%d')}",
        boto3_client=boto3.client(
            'logs', 
            region_name=region,
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY")
        )
    )
    cloudwatch_handler.setFormatter(formatter)

    # Setup console handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)

    # Setup logger
    logger = logging.getLogger(__name__)
    logger.setLevel(logging.INFO)
    logger.addHandler(file_handler)
    logger.addHandler(cloudwatch_handler)
    logger.addHandler(console_handler)

    return logger

# Initialize logger
logger = setup_logging()

# -------------------------------
# AWS Bedrock Client Configuration
# -------------------------------
config = Config(
    connect_timeout=600,
    read_timeout=600,
    retries={'max_attempts': 5, 'mode': 'adaptive'},
    max_pool_connections=50
)

# AWS Configuration from environment variables
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")

# Bedrock Agent Configuration - Default values that can be overridden
DEFAULT_AGENT_ID = os.getenv("AWS_BEDROCK_AGENT_ID", "NOPNUNTEOB")
DEFAULT_AGENT_ALIAS_ID = os.getenv("AWS_BEDROCK_AGENT_ALIAS_ID", "UHMWSV1HUM")

def get_bedrock_client():
    """Create and return Bedrock runtime and agent-runtime clients"""
    try:
        # We need both runtime and agent-runtime clients
        runtime_client = boto3.client(
            service_name='bedrock-runtime',
            region_name=AWS_REGION,
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            config=config
        )
        agent_client = boto3.client(
            service_name='bedrock-agent-runtime',
            region_name=AWS_REGION,
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            config=config
        )
        return runtime_client, agent_client
    except NoCredentialsError:
        logger.error("AWS credentials not found.")
        raise HTTPException(status_code=401, detail="AWS credentials not configured.")
    except BotoCoreError as e:
        logger.error(f"Error initializing Bedrock client: {str(e)}")
        raise HTTPException(status_code=500, detail="Error connecting to AWS Bedrock.")

# -------------------------------
# Request and Response Models
# -------------------------------
class ChatRequest(BaseModel):
    session_id: str
    user_message: str
    history: list[dict] = []  # List of previous messages
    agent_id: str = None  # Optional, will use default if not provided
    agent_alias_id: str = None  # Optional, will use default if not provided

class ChatResponse(BaseModel):
    session_id: str
    response: str

# -------------------------------
# Conversation Context Generation
# -------------------------------
def generate_context(history, max_messages=5):
    """Generate a conversation context from the last few messages."""
    recent_messages = history[-max_messages:] if history else []
    if not recent_messages:
        return ""

    context = "Reference context (for understanding only):\n"
    for msg in recent_messages:
        role = "User" if msg["role"] == "user" else "Assistant"
        context += f"{role}: {msg['content']}\n"
    context += "\n---\nPlease respond to this message:"
    return context

# -------------------------------
# AWS Bedrock Invocation with Retry
# -------------------------------
@backoff.on_exception(
    backoff.expo,
    (BotoCoreError,),
    max_tries=3,
    max_time=60
)
async def invoke_bedrock_agent_streaming(session_id, user_message, context, agent_id=None, agent_alias_id=None):
    """
    Invoke Bedrock agent with streaming response.
    """
    _, agent_client = get_bedrock_client()
    
    # Use provided agent IDs or fall back to defaults
    agent_id = agent_id or DEFAULT_AGENT_ID
    agent_alias_id = agent_alias_id or DEFAULT_AGENT_ALIAS_ID

    try:
        logger.info(f"Sending request to Bedrock: Session ID: {session_id}, Message: {user_message}")
        logger.info(f"Using agent_id: {agent_id}, agent_alias_id: {agent_alias_id}")

        response = await asyncio.to_thread(
            agent_client.invoke_agent,
            agentId=agent_id,
            agentAliasId=agent_alias_id,
            sessionId=session_id,
            inputText=user_message,  # Just pass the user message directly
            enableTrace=True
        )

        logger.info(f"Raw Bedrock response metadata: {json.dumps({k: str(v) for k, v in response.items() if k != 'completion'})}")

        if not response or 'completion' not in response:
            logger.error("Invalid response format from Bedrock")
            raise HTTPException(status_code=500, detail="Invalid response from AI agent")

        return response

    except Exception as e:
        logger.error(f"Bedrock API Error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch response: {str(e)}")

# -------------------------------
# Response Cleaning
# -------------------------------
def clean_response(response: str) -> str:
    """Clean the response while preserving code blocks."""
    # Split the response into code and non-code parts
    parts = []
    in_code_block = False
    current_part = []

    for line in response.splitlines():
        if line.strip().startswith("```"):
            # Handle code block boundaries
            if in_code_block:
                current_part.append(line)
                parts.append('\n'.join(current_part))
                current_part = []
            else:
                if current_part:
                    parts.append('\n'.join(current_part))
                current_part = [line]
            in_code_block = not in_code_block
        else:
            # Handle content
            if in_code_block:
                # Preserve all content in code blocks
                current_part.append(line)
            else:
                # Clean non-code content
                line = line.strip()
                if line and not any(line.startswith(prefix) for prefix in
                    ("User:", "Assistant:", "Previous conversation:", "Reference context")):
                    current_part.append(line)

    # Add any remaining content
    if current_part:
        parts.append('\n'.join(current_part))

    return '\n\n'.join(parts)

# -------------------------------
# Logging Utilities
# -------------------------------
def log_request_response(session_id: str, request_type: str, user_message: str, response: str, duration: float):
    """Log request and response details"""
    try:
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "request_id": str(uuid.uuid4()),
            "session_id": session_id,
            "request_type": request_type,
            "user_message": user_message,
            "response_length": len(response),
            "response_content": response[:500],  # Log first 500 chars of response
            "duration_ms": round(duration * 1000, 2)
        }
        logger.info(f"Request/Response Log: {json.dumps(log_entry, ensure_ascii=False)}")

        # Add debug logging for response details
        logger.debug(f"Full response for session {session_id}:\n{response}")
    except Exception as e:
        logger.error(f"Error logging request/response: {str(e)}", exc_info=True)

# -------------------------------
# Streaming Response Generator
# -------------------------------
async def stream_response_generator(session_id, user_message, context, agent_id=None, agent_alias_id=None):
    """
    Generator that yields chunks directly from the agent response.
    """
    start_time = time.time()
    full_response = ""

    try:
        response = await invoke_bedrock_agent_streaming(
            session_id, 
            user_message, 
            context, 
            agent_id, 
            agent_alias_id
        )

        if response and "completion" in response:
            buffer = ""
            for event in response["completion"]:
                if "chunk" in event:
                    chunk = event["chunk"]["bytes"].decode("utf-8")
                    buffer += chunk
                    full_response += chunk
                    if chunk.strip():
                        cleaned_chunk = clean_response(chunk)
                        if cleaned_chunk:
                            yield json.dumps({
                                "session_id": session_id,
                                "chunk": cleaned_chunk
                            }) + "\n"
                            await asyncio.sleep(0.01)

        # Log the complete streaming session
        duration = time.time() - start_time
        log_request_response(
            session_id=session_id,
            request_type="chat_stream",
            user_message=user_message,
            response=full_response,
            duration=duration
        )

    except Exception as e:
        error_msg = f"Streaming error: {str(e)}"
        logger.error(error_msg, exc_info=True)
        yield json.dumps({
            "session_id": session_id,
            "chunk": f"Error: {str(e)}"
        }) + "\n"

# -------------------------------
# Main Chat Functions
# -------------------------------
async def process_chat(request: ChatRequest) -> ChatResponse:
    """Process a standard chat request"""
    start_time = time.time()
    session_id = request.session_id
    user_message = request.user_message
    history = request.history
    agent_id = request.agent_id
    agent_alias_id = request.agent_alias_id

    try:
        context = generate_context(history)
        response = await invoke_bedrock_agent_streaming(
            session_id, 
            user_message, 
            context, 
            agent_id, 
            agent_alias_id
        )

        full_response = ""
        if response and "completion" in response:
            for event in response["completion"]:
                if "chunk" in event:
                    chunk = event["chunk"]["bytes"].decode("utf-8")
                    full_response += chunk

        if not full_response.strip():
            logger.error("Empty response after processing")
            raise HTTPException(status_code=500, detail="Empty response from AI agent")

        cleaned_response = clean_response(full_response)

        # Log the request and response
        duration = time.time() - start_time
        log_request_response(
            session_id=session_id,
            request_type="chat",
            user_message=user_message,
            response=cleaned_response,
            duration=duration
        )

        return ChatResponse(session_id=session_id, response=cleaned_response)
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}", exc_info=True)
        raise
