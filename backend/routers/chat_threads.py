from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from .. import models, schemas, crud
from ..database import get_db
from ..dependencies import get_current_user

router = APIRouter(
    prefix="/api/chat",
    tags=["chat"],
    responses={404: {"description": "Not found"}},
)

# Chat Thread endpoints
@router.get("/threads", response_model=List[schemas.ChatThread])
def read_chat_threads(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return crud.get_chat_threads_for_user(db, user_id=current_user.id, skip=skip, limit=limit)

@router.post("/threads", response_model=schemas.ChatThread, status_code=status.HTTP_201_CREATED)
def create_chat_thread(
    thread: schemas.ChatThreadBase,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Create a new chat thread for the current user
    thread_data = schemas.ChatThreadCreate(
        **thread.dict(),
        user_id=current_user.id
    )
    return crud.create_chat_thread(db=db, thread=thread_data)

@router.get("/threads/{thread_id}", response_model=schemas.ChatThread)
def read_chat_thread(
    thread_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_thread = crud.get_chat_thread(db, thread_id=thread_id, user_id=current_user.id)
    if db_thread is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Chat thread with id {thread_id} not found"
        )
    return db_thread

@router.put("/threads/{thread_id}", response_model=schemas.ChatThread)
def update_chat_thread(
    thread_id: int,
    title: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_thread = crud.update_chat_thread(db, thread_id=thread_id, user_id=current_user.id, title=title)
    if db_thread is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Chat thread with id {thread_id} not found"
        )
    return db_thread

@router.delete("/threads/{thread_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_chat_thread(
    thread_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    success = crud.delete_chat_thread(db, thread_id=thread_id, user_id=current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Chat thread with id {thread_id} not found"
        )
    return None

# Chat Message endpoints
@router.get("/threads/{thread_id}/messages", response_model=List[schemas.ChatMessage])
def read_chat_messages(
    thread_id: int,
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Check if thread exists and belongs to the current user
    db_thread = crud.get_chat_thread(db, thread_id=thread_id, user_id=current_user.id)
    if db_thread is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Chat thread with id {thread_id} not found"
        )
    
    return crud.get_chat_messages_for_thread(db, thread_id=thread_id, skip=skip, limit=limit)

@router.post("/threads/{thread_id}/messages", response_model=schemas.ChatMessage, status_code=status.HTTP_201_CREATED)
def create_chat_message(
    thread_id: int,
    message: schemas.ChatMessageBase,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Check if thread exists and belongs to the current user
    db_thread = crud.get_chat_thread(db, thread_id=thread_id, user_id=current_user.id)
    if db_thread is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Chat thread with id {thread_id} not found"
        )
    
    # Create a new chat message for the thread
    message_data = schemas.ChatMessageCreate(
        **message.dict(),
        thread_id=thread_id
    )
    return crud.create_chat_message(db=db, message=message_data)

@router.delete("/messages/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_chat_message(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Get the message to check ownership
    db_message = crud.get_chat_message(db, message_id=message_id)
    if db_message is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Chat message with id {message_id} not found"
        )
    
    # Check if the message belongs to a thread owned by the current user
    db_thread = crud.get_chat_thread(db, thread_id=db_message.thread_id, user_id=current_user.id)
    if db_thread is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this message"
        )
    
    # Delete the message
    success = crud.delete_chat_message(db, message_id=message_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Chat message with id {message_id} not found"
        )
    return None
