from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from typing import List, Optional

from .. import models, schemas, crud
from ..database import get_db
from ..dependencies import get_current_active_user

router = APIRouter(
    prefix="/favorite-prompts",
    tags=["favorite prompts"],
    dependencies=[Depends(get_current_active_user)],  # Require authentication for all routes
    responses={404: {"description": "Not found"}},
)

@router.get("/", response_model=List[schemas.FavoritePrompt])
def read_favorite_prompts(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Get a list of the current user's favorite prompts (basic information only).
    """
    return crud.get_favorite_prompts_for_user(db, user_id=current_user.id, skip=skip, limit=limit)

@router.get("/details", response_model=List[schemas.Prompt])
def read_favorite_prompts_with_details(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Get a list of the current user's favorite prompts with full prompt details.
    """
    prompts = crud.get_favorite_prompts_with_details(db, user_id=current_user.id, skip=skip, limit=limit)
    # Ensure we always return a list, even if empty
    if prompts is None:
        return []
    return prompts

@router.get("/{prompt_id}", response_model=bool)
def check_is_favorite(
    prompt_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Check if a prompt is in the user's favorites.
    Returns true if the prompt is a favorite, false otherwise.
    """
    # Check if prompt exists first
    db_prompt = crud.get_prompt(db, prompt_id=prompt_id)
    if db_prompt is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Prompt with id {prompt_id} not found"
        )
    
    return crud.check_is_favorite(db, user_id=current_user.id, prompt_id=prompt_id)

@router.post("/", response_model=schemas.FavoritePrompt, status_code=status.HTTP_201_CREATED)
def create_favorite_prompt(
    favorite: schemas.FavoritePromptBase,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Add a prompt to the user's favorites.
    """
    # Check if prompt exists
    db_prompt = crud.get_prompt(db, prompt_id=favorite.prompt_id)
    if db_prompt is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Prompt with id {favorite.prompt_id} not found"
        )
    
    # Create favorite prompt
    favorite_data = schemas.FavoritePromptCreate(
        prompt_id=favorite.prompt_id,
        user_id=current_user.id
    )
    
    try:
        return crud.create_favorite_prompt(db=db, favorite=favorite_data)
    except HTTPException as e:
        raise e

@router.delete("/{prompt_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_favorite_prompt(
    prompt_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Remove a prompt from the user's favorites.
    """
    # Delete favorite prompt
    success = crud.delete_favorite_prompt(db, user_id=current_user.id, prompt_id=prompt_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Favorite prompt with id {prompt_id} not found for this user"
        )
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.get("/admin/user/{user_id}", response_model=List[schemas.Prompt])
def read_user_favorite_prompts_admin(
    user_id: int,
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Admin endpoint to get a list of favorite prompts for a specific user.
    """
    # Check if user is admin
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access other users' favorites. Admin privileges required."
        )
    
    # Check if user exists
    user = crud.get_user(db, user_id=user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {user_id} not found"
        )
    
    return crud.get_favorite_prompts_with_details(db, user_id=user_id, skip=skip, limit=limit)
