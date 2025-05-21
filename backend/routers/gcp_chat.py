from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.gcp_services.gcp_client import start_gcp_session, send_gcp_message
from backend.dependencies import get_current_active_user
import logging
import json
import os
import re

def format_ascii_tables(text):
    """
    Detects and formats ASCII tables in the response text to make them more readable.
    """
    # Check if the text contains an ASCII table (look for patterns like +---+---+)
    if not re.search(r'\+[-]+\+[-]+\+', text):
        return text  # No table detected, return original text
    
    try:
        # Split the text into lines
        lines = text.split('\n')
        
        # Find table boundaries
        table_start = None
        table_end = None
        
        for i, line in enumerate(lines):
            if line.startswith('+') and '+' in line[1:] and table_start is None:
                table_start = i
            elif line.startswith('+') and '+' in line[1:] and i > table_start + 1:
                table_end = i
        
        if table_start is not None and table_end is not None:
            # Extract table headers (usually in the second line of the table)
            header_line = lines[table_start + 1]
            headers = [h.strip() for h in header_line.split('|')[1:-1]]
            
            # Extract table rows
            rows = []
            for i in range(table_start + 3, table_end, 2):
                if i < len(lines):
                    row_line = lines[i]
                    row_values = [cell.strip() for cell in row_line.split('|')[1:-1]]
                    rows.append(row_values)
            
            # Format as Markdown table
            md_table = []
            md_table.append('| ' + ' | '.join(headers) + ' |')
            md_table.append('| ' + ' | '.join(['---' for _ in headers]) + ' |')
            
            for row in rows:
                md_table.append('| ' + ' | '.join(row) + ' |')
            
            # Replace the ASCII table with the Markdown table in the original text
            formatted_table = '\n'.join(md_table)
            
            # Replace the original table with the formatted one
            before_table = '\n'.join(lines[:table_start]) if table_start > 0 else ''
            after_table = '\n'.join(lines[table_end+1:]) if table_end < len(lines)-1 else ''
            
            if before_table:
                before_table += '\n\n'
            if after_table:
                after_table = '\n\n' + after_table
                
            return before_table + formatted_table + after_table
    
    except Exception as e:
        logging.error(f"Error formatting ASCII table: {str(e)}")
        # If anything goes wrong, return the original text
        return text
        
    # If we couldn't find a complete table, return the original text
    return text

# Define router without prefix to match our successful test
router = APIRouter()
logger = logging.getLogger("gcp_chat")

@router.get("/api/gcp-chat/test")
def test_gcp_chat_endpoint():
    logger.info("GCP chat test endpoint called")
    return {"status": "ok", "message": "GCP chat endpoint is working"}

@router.post("/api/gcp-chat")
async def gcp_chat(request: Request, db: Session = Depends(get_db), current_user=Depends(get_current_active_user)):
    try:
        data = await request.json()
        logger.info(f"Received GCP chat request: {data}")
        
        # Validate required fields
        session_id = data.get("session_id")
        if not session_id:
            raise HTTPException(status_code=400, detail="session_id is required")

        new_message = data.get("new_message")
        if not new_message:
            raise HTTPException(status_code=400, detail="new_message is required")

        # Automatically fill app_name and user_id
        app_name = os.getenv("APP_NAME", "agentic_adk")
        user_id = getattr(current_user, "id", None)
        if user_id is None:
            raise HTTPException(status_code=400, detail="user_id could not be determined from authentication context")

        # Always try to create the session first
        try:
            logger.info(f"Creating GCP session with session_id: {session_id}")
            session_resp = start_gcp_session(session_id, db)
            logger.info(f"GCP session created successfully: {session_resp}")
        except Exception as e:
            logger.warning(f"Session creation attempt resulted in: {str(e)}")
            logger.warning("Continuing with message sending anyway")
        
        # Now send the message without trying to create the session again
        # Pass None for user_id to let the send_gcp_message function extract it from the session URL
        # This ensures we use the same user_id that was used in session creation
        try:
            logger.info(f"Sending message to GCP agent with session_id: {session_id}")
            agent_resp = send_gcp_message(
                session_id=session_id, 
                new_message=new_message, 
                db=db, 
                app_name=None,  # Let it extract from session URL
                user_id=None,   # Let it extract from session URL
                start_session=False  # Don't try to create the session in this call
            )
            logger.info(f"GCP agent response received: {type(agent_resp)}")
            
            # Check for null response
            if agent_resp is None:
                logger.error("Received null response from GCP agent")
                return {
                    "session_id": session_id,
                    "response": "I'm sorry, I couldn't process your request. The GCP agent returned a null response."
                }
        except Exception as e:
            logger.error(f"Error sending message to GCP agent: {str(e)}", exc_info=True)
            return {
                "session_id": session_id,
                "response": f"I'm sorry, there was an error communicating with the GCP agent: {str(e)}"
            }
            
        # Extract the response text from the GCP response format
        # The frontend expects a response with 'session_id' and 'response' fields
        response_text = ""
        
        # Log the actual response structure for debugging
        logger.info(f"GCP response structure: {json.dumps(agent_resp, default=str)[:500]}...")
        
        # Handle different possible response formats
        # Format 1: Array of message objects with author and content
        if isinstance(agent_resp, list):
            # Handle array format - this is the new format we're seeing in the logs
            messages = agent_resp
            logger.info(f"Processing array response with {len(messages)} messages")
            
            # Find the last message that contains text content
            for msg in reversed(messages):
                logger.info(f"Checking message from author: {msg.get('author', 'unknown')}")
                if 'content' in msg and 'parts' in msg['content']:
                    parts = msg['content']['parts']
                    for part in parts:
                        # Check for text content
                        if 'text' in part:
                            response_text = part['text']
                            logger.info(f"Found text content in message from {msg.get('author', 'unknown')}")
                            break
                    # If we found text in this message, break the outer loop too
                    if response_text:
                        break
        
        # Format 2: Dictionary formats
        elif isinstance(agent_resp, dict):
            # Format 2a: Standard Vertex AI format with candidates
            if 'candidates' in agent_resp and len(agent_resp['candidates']) > 0:
                candidate = agent_resp['candidates'][0]
                if 'content' in candidate and 'parts' in candidate['content'] and len(candidate['content']['parts']) > 0:
                    response_text = candidate['content']['parts'][0].get('text', "")
            
            # Format 2b: Direct response field
            elif 'response' in agent_resp:
                response_text = agent_resp['response']
                
            # Format 2c: Single message with content and parts
            elif 'content' in agent_resp and 'parts' in agent_resp['content']:
                parts = agent_resp['content']['parts']
                if parts and len(parts) > 0:
                    response_text = parts[0].get('text', "")
        
        # If we still don't have a response, use a fallback
        if not response_text:
            logger.warning(f"Could not extract response text from GCP response: {agent_resp}")
            response_text = "I'm sorry, I couldn't process your request properly."
        
        # Format ASCII tables if present in the response
        response_text = format_ascii_tables(response_text)
        
        # Format response for frontend
        formatted_response = {
            "session_id": session_id,
            "response": response_text
        }
        
        logger.info(f"Formatted response for frontend: {formatted_response}")
        return formatted_response
    except HTTPException as he:
        # Re-raise HTTP exceptions
        logger.error(f"GCP chat HTTP error: {str(he)}")
        raise
    except Exception as e:
        logger.error(f"GCP chat error: {str(e)}", exc_info=True)
        # Return a more user-friendly error message
        return {
            "session_id": session_id if 'session_id' in locals() else "unknown",
            "response": f"I'm sorry, there was an error processing your request: {str(e)}"
        }
