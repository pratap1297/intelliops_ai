# backend/routers/documents.py
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
import shutil # For saving file locally (example)
import os # For path joining (example)
import uuid
import logging
logger = logging.getLogger(__name__)


# Use relative imports
from .. import crud, models, schemas
from ..database import get_db
from ..dependencies import get_current_active_user

# --- Configuration for Local File Storage (Example) ---
# In a real app, use proper configuration management (e.g., .env)
# and consider cloud storage (S3, Azure Blob, GCS)
UPLOAD_DIRECTORY = "./uploaded_docs" # Create this directory relative to where you run uvicorn
if not os.path.exists(UPLOAD_DIRECTORY):
    os.makedirs(UPLOAD_DIRECTORY)
# --- End Example Configuration ---


router = APIRouter(
    prefix="/api/documents",
    tags=["documents"],
    dependencies=[Depends(get_current_active_user)], # Require authentication
    responses={404: {"description": "Not found"}},
)

@router.post("/", response_model=schemas.Document, status_code=status.HTTP_201_CREATED)
async def upload_document( # Use async for file I/O
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Upload a document for the current user.
    Saves file metadata to the database and the file to a configured location.
    """
    # --- Example: Save file locally ---
    # Replace with your actual storage logic (e.g., upload to S3)
    # Ensure filenames are unique or handled to avoid overwrites
    safe_filename = f"{current_user.id}_{uuid.uuid4()}_{file.filename}" # Example using UUID for uniqueness
    file_location = os.path.join(UPLOAD_DIRECTORY, safe_filename)
    try:
        with open(file_location, "wb+") as file_object:
            shutil.copyfileobj(file.file, file_object)
        # In a real scenario, the 'url' might be a relative path if serving static files,
        # or a full URL if using cloud storage.
        document_url = file_location # Placeholder URL (needs adjustment based on serving strategy)
    except Exception as e:
         # Clean up partially written file if error occurs
        if os.path.exists(file_location):
            os.remove(file_location)
        logger.error(f"Error saving file {file.filename}: {e}") # Log error
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Could not save file: {file.filename}")
    finally:
        # Ensure file handle is closed even if copyfileobj raises an error
        if hasattr(file, 'file') and hasattr(file.file, 'close'):
             file.file.close()
    # --- End Example Storage Logic ---

    # Create document metadata in DB
    document_create = schemas.DocumentCreate(
        filename=file.filename, # Store original filename
        url=document_url, # Use the actual URL/path from storage logic
        # user_id will be set by crud function based on current_user
    )

    try:
        db_document = crud.create_document(db=db, document=document_create, user_id=current_user.id)
    except Exception as db_error:
        # If DB write fails after file is saved, we should ideally delete the saved file
        if os.path.exists(file_location):
            try:
                os.remove(file_location) # Rollback file save
            except Exception as del_err:
                logger.error(f"Error rolling back file save for {file_location}: {del_err}") # Log rollback error
        logger.error(f"Error saving document metadata for {file.filename}: {db_error}") # Log DB error
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not save document metadata after file upload.")

    return db_document


@router.get("/", response_model=List[schemas.Document])
def list_documents(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    List documents uploaded by the current user.
    """
    documents = crud.get_documents_for_user(db, user_id=current_user.id, skip=skip, limit=limit)
    return documents


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document( # Use async if file deletion involves I/O
    document_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Delete a document (metadata and the actual file) owned by the current user.
    """
    # Get document metadata first to find the file path/URL
    db_document = crud.get_document(db, document_id=document_id, user_id=current_user.id)
    if db_document is None:
        # Don't reveal if the document exists but belongs to another user
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    # --- Example: Delete file locally ---
    # Replace with your actual storage deletion logic (e.g., delete from S3)
    file_location = db_document.url # Assuming the URL is the local file path
    file_deleted = False
    operation_successful = True # Track overall success

    if file_location and isinstance(file_location, str): # Check if URL is a non-empty string
        try:
            if os.path.exists(file_location):
                os.remove(file_location)
                file_deleted = True
                print(f"Deleted file: {file_location}")
            else:
                 print(f"Warning: File not found at {file_location} for document ID {document_id}. Assuming already deleted or URL is incorrect.")
                 file_deleted = True # Treat as deleted if not found
        except Exception as e:
            # Log error, but proceed to attempt DB record deletion anyway
            print(f"Error deleting file {file_location}: {e}. Proceeding to delete metadata.")
            # Depending on policy, you might raise 500 here and *not* delete the metadata
            operation_successful = False # Mark that file deletion failed
            file_deleted = False # Explicitly mark as not deleted
    else:
        print(f"Warning: No valid file location (URL) stored for document ID {document_id}. Proceeding to delete metadata only.")
        file_deleted = True # No file to delete, so consider this step 'done'
    # --- End Example Deletion Logic ---

    # Delete the DB record regardless of file deletion success/failure (adjust policy if needed)
    try:
        deleted_meta = crud.delete_document(db=db, document_id=document_id, user_id=current_user.id)
        if deleted_meta is None:
             # Should not happen if first check passed and record wasn't deleted concurrently
             print(f"Warning: Document metadata for ID {document_id} was not found during delete confirmation (race condition?).")
             # If the record is gone, the goal is achieved, so don't raise 404 unless file deletion failed AND we need consistency
             if not operation_successful:
                 # If file deletion failed AND metadata is unexpectedly gone, it's weird.
                 # But typically we still return success (204) if the target resource is gone.
                 pass
    except Exception as db_del_err:
        print(f"Error deleting document metadata for ID {document_id}: {db_del_err}")
        # Raise 500 if DB deletion fails, as the state is inconsistent
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to delete document metadata.")

    # If file deletion failed but metadata deletion succeeded, should we report error?
    # Current logic: Prioritize removing the metadata link. Report success (204).
    # Alternative: Raise 500 if operation_successful is False.

    # Return No Content on successful deletion (or if file/record was already gone)
    # Return statement removed as FastAPI handles 204 No Content response body
