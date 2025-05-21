import logging
import httpx
import time
import json
from backend.models import GcpSettings
from backend.database import get_db
from sqlalchemy.orm import Session
from backend.routers.logs import add_log

def get_active_gcp_settings(db: Session):
    settings = db.query(GcpSettings).filter(GcpSettings.is_active == True).first()
    if not settings:
        raise Exception("No active GCP settings found.")
    return settings

def start_gcp_session(session_id: str, db: Session):
    settings = get_active_gcp_settings(db)
    # Use session_endpoint for session creation
    url = settings.session_endpoint.rstrip('/')
    
    # Ensure the URL ends with the session ID
    if not url.endswith(session_id):
        url = f"{url}/{session_id}"
    
    logging.info(f"Starting GCP session: POST {url}")
    
    # For session creation, we may not need a payload
    # Some GCP APIs just need a POST to the session URL
    payload = {}
    
    # Create request log entry
    request_log = {
        "log_type": "request",
        "provider": "gcp",
        "session_id": session_id,
        "endpoint": url,
        "request_data": payload
    }
    add_log(db, request_log)
    
    # Measure response time
    start_time = time.time()
    
    try:
        with httpx.Client() as client:
            logging.info(f"[GCP CALL] Sending POST request to {url}...")
            logging.info(f"[GCP CALL] Request payload: {json.dumps(payload, default=str)}")
            resp = client.post(url, json=payload)
            logging.info(f"[GCP CALL] Response status: {resp.status_code}")
            logging.info(f"[GCP CALL] Response body: {resp.text}")
            
            # Calculate duration
            duration_ms = int((time.time() - start_time) * 1000)
            logging.info(f"GCP session response: {resp.status_code} {resp.text}")
            
            # Create response log entry
            response_data = resp.json() if resp.text and resp.status_code < 400 else {}
            response_log = {
                "log_type": "response",
                "provider": "gcp",
                "session_id": session_id,
                "endpoint": url,
                "response_data": response_data,
                "status_code": resp.status_code,
                "duration_ms": duration_ms
            }
            add_log(db, response_log)
            
            if resp.status_code >= 400:
                error_msg = f"Failed to start GCP session: {resp.text}"
                # Log error
                error_log = {
                    "log_type": "error",
                    "provider": "gcp",
                    "session_id": session_id,
                    "endpoint": url,
                    "error_message": error_msg,
                    "status_code": resp.status_code
                }
                add_log(db, error_log)
                raise Exception(error_msg)
                
            return response_data
    except Exception as e:
        # Log any exceptions
        error_log = {
            "log_type": "error",
            "provider": "gcp",
            "session_id": session_id,
            "endpoint": url,
            "error_message": str(e)
        }
        add_log(db, error_log)
        raise

def send_gcp_message(session_id: str, new_message: dict, db: Session, app_name: str = None, user_id = None, start_session: bool = True):
    try:
        settings = get_active_gcp_settings(db)
        # Get the base URL for the GCP agent
        url = settings.agent_run_endpoint.rstrip('/')
        logging.info(f"GCP agent endpoint URL: {url}")

        # Extract app_name and user_id from the session_endpoint to ensure consistency
        session_url = settings.session_endpoint.rstrip('/')
        import re
        
        # Extract app_name from session URL
        app_match = re.search(r"/apps/([^/]+)/", session_url)
        if app_match and not app_name:
            app_name = app_match.group(1)
            logging.info(f"Using app_name from session URL: {app_name}")
        elif not app_name:
            app_name = os.getenv("APP_NAME", "agentic_adk")
            logging.info(f"Using default app_name: {app_name}")
        
        # Extract user_id from session URL
        user_match = re.search(r"/users/([^/]+)/", session_url)
        if user_match and not user_id:
            user_id = user_match.group(1)
            logging.info(f"Using user_id from session URL: {user_id}")
        elif not user_id:
            user_id = f"u_{int(time.time())}"
            logging.info(f"Generated user_id: {user_id}")
        else:
            # If user_id is provided but doesn't match the session URL, use the one from the URL
            if user_match:
                user_id = user_match.group(1)
                logging.info(f"Overriding provided user_id with one from session URL: {user_id}")
            else:
                user_id = str(user_id)
                logging.info(f"Using provided user_id: {user_id}")
        
        logging.info(f"Using app_name: {app_name}, user_id: {user_id} for GCP request")

    except Exception as e:
        logging.error(f"Error getting GCP settings: {str(e)}", exc_info=True)
        error_log = {
            "log_type": "error",
            "provider": "gcp",
            "session_id": session_id,
            "endpoint": "unknown",
            "error_message": f"Error getting GCP settings: {str(e)}"
        }
        add_log(db, error_log)
        raise
    
    # Validate and format the message
    if not isinstance(new_message, dict):
        logging.warning(f"Invalid message format, expected dict but got {type(new_message)}")
        # Try to convert to proper format if it's a string
        if isinstance(new_message, str):
            new_message = {
                "role": "user",
                "parts": [{"text": new_message}]
            }
        else:
            # Fallback to empty message
            new_message = {
                "role": "user",
                "parts": [{"text": ""}]
            }
    
    # Ensure message has the required structure
    if "role" not in new_message:
        new_message["role"] = "user"
    if "parts" not in new_message:
        if "text" in new_message:
            # Handle case where text is directly in the message
            new_message["parts"] = [{"text": new_message["text"]}]
            del new_message["text"]
        else:
            # Default empty message
            new_message["parts"] = [{"text": ""}]
    
    # Create payload with all required fields
    payload = {
        "session_id": session_id,
        "new_message": new_message,
        "app_name": app_name,
        "user_id": user_id,
        "start_session": start_session  # Include start_session flag to create session if needed
    }
    logging.info(f"[GCP CALL] Preparing to send POST request to: {url}")
    logging.info(f"[GCP CALL] Request payload: {json.dumps(payload, default=str)}")
    
    # Create request log entry
    request_log = {
        "log_type": "request",
        "provider": "gcp",
        "session_id": session_id,
        "endpoint": url,
        "request_data": payload
    }
    add_log(db, request_log)
    
    # Measure response time
    start_time = time.time()
    
    try:
        # Set timeout to avoid hanging requests
        with httpx.Client(timeout=30.0) as client:
            resp = client.post(url, json=payload)
            
            # Calculate duration
            duration_ms = int((time.time() - start_time) * 1000)
            logging.info(f"GCP agent response: {resp.status_code} {resp.text[:200]}...")  # Limit log size
            
            # Parse response data
            try:
                if resp.text:
                    response_data = resp.json()
                else:
                    response_data = {}
            except json.JSONDecodeError as jde:
                logging.error(f"Failed to parse JSON response: {str(jde)}")
                response_data = {"raw_text": resp.text[:500]}  # Limit size for logging
            
            # Create response log entry
            response_log = {
                "log_type": "response",
                "provider": "gcp",
                "session_id": session_id,
                "endpoint": url,
                "response_data": response_data,
                "status_code": resp.status_code,
                "duration_ms": duration_ms
            }
            add_log(db, response_log)
            
            if resp.status_code >= 400:
                error_msg = f"Failed to send GCP message: {resp.text}"
                # Log error
                error_log = {
                    "log_type": "error",
                    "provider": "gcp",
                    "session_id": session_id,
                    "endpoint": url,
                    "error_message": error_msg,
                    "status_code": resp.status_code
                }
                add_log(db, error_log)
                raise Exception(error_msg)
                
            return response_data
    except Exception as e:
        # Log any exceptions
        error_log = {
            "log_type": "error",
            "provider": "gcp",
            "session_id": session_id,
            "endpoint": url,
            "error_message": str(e)
        }
        add_log(db, error_log)
        raise
