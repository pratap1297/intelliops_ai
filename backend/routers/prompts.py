from fastapi import APIRouter, Depends, HTTPException, status, Response, Query
from sqlalchemy.orm import Session
from typing import List, Optional

# Use relative imports
from .. import crud, models, schemas
from ..database import get_db
from ..dependencies import get_current_active_user

router = APIRouter(
    prefix="/prompts",
    tags=["prompts"],
    dependencies=[Depends(get_current_active_user)], # Require authentication for all prompt routes
    responses={404: {"description": "Not found"}},
)

@router.get("/", response_model=List[schemas.Prompt])
def read_prompts(
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None,
    cloud_provider: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Retrieve prompts for the current user (includes system prompts).
    Can be filtered by category and cloud provider.
    """
    prompts = crud.get_prompts(
        db, 
        skip=skip, 
        limit=limit, 
        user_id=current_user.id,
        category=category,
        cloud_provider=cloud_provider
    )
    # Ensure we always return a list, even if empty
    if prompts is None:
        return []
    return prompts

@router.get("/admin/all", response_model=List[schemas.Prompt])
def read_all_prompts_admin(
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None,
    cloud_provider: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Admin endpoint to retrieve all prompts in the system.
    Can be filtered by category and cloud provider.
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access all prompts. Admin privileges required."
        )
    
    prompts = crud.get_all_prompts_for_admin(
        db, 
        skip=skip, 
        limit=limit,
        category=category,
        cloud_provider=cloud_provider
    )
    return prompts

@router.get("/system", response_model=List[schemas.Prompt])
def read_system_prompts(
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None,
    cloud_provider: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Retrieve only system prompts.
    Can be filtered by category and cloud provider.
    """
    prompts = crud.get_system_prompts(
        db, 
        skip=skip, 
        limit=limit,
        category=category,
        cloud_provider=cloud_provider
    )
    return prompts

@router.get("/user", response_model=List[schemas.Prompt])
def read_user_prompts(
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None,
    cloud_provider: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Retrieve only prompts created by the current user.
    Can be filtered by category and cloud provider.
    """
    prompts = crud.get_user_prompts(
        db, 
        user_id=current_user.id,
        skip=skip, 
        limit=limit,
        category=category,
        cloud_provider=cloud_provider
    )
    return prompts

@router.get("/{prompt_id}", response_model=schemas.Prompt)
def read_prompt(
    prompt_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Retrieve a specific prompt by ID.
    """
    db_prompt = crud.get_prompt(db, prompt_id=prompt_id)
    if db_prompt is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prompt not found")
    
    # Check if this is a favorite for the current user
    is_favorite = crud.check_is_favorite(db, user_id=current_user.id, prompt_id=prompt_id)
    
    # Return the prompt with additional information
    prompt_dict = schemas.Prompt.model_validate(db_prompt).model_dump()
    prompt_dict["is_favorite"] = is_favorite
    
    return prompt_dict

@router.post("/", response_model=schemas.Prompt, status_code=status.HTTP_201_CREATED)
def create_prompt_for_user(
    prompt: schemas.PromptCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Create a new prompt associated with the current user.
    System prompts can only be created by admins.
    """
    # Check if prompt ID already exists
    existing_prompt = crud.get_prompt(db=db, prompt_id=prompt.id)
    if existing_prompt:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Prompt with ID '{prompt.id}' already exists."
        )
    
    # Prevent non-admins from creating system prompts
    if prompt.is_system and not current_user.is_admin:
         raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create system prompts."
        )

    # Create prompt, linking it to the current user unless it's a system prompt
    owner_id = current_user.id if not prompt.is_system else None
    return crud.create_prompt(db=db, prompt=prompt, owner_id=owner_id)

@router.put("/{prompt_id}", response_model=schemas.Prompt)
def update_prompt(
    prompt_id: str,
    prompt_update: schemas.PromptUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Update a prompt. Users can only update their own non-system prompts.
    Admins can update any prompt.
    """
    db_prompt = crud.get_prompt(db, prompt_id=prompt_id)
    if db_prompt is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prompt not found")

    # Permission check
    if not current_user.is_admin and db_prompt.user_id != current_user.id:
         raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this prompt."
        )
    if db_prompt.is_system and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update system prompts."
        )

    updated_prompt = crud.update_prompt(db=db, prompt_id=prompt_id, prompt_update=prompt_update, user_id=current_user.id)
    if updated_prompt is None: # Should not happen if first check passed, but good practice
         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prompt not found during update")
    return updated_prompt

@router.delete("/{prompt_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_prompt(
    prompt_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Delete a prompt. Users can only delete their own non-system prompts.
    Admins can delete any prompt.
    """
    db_prompt = crud.get_prompt(db, prompt_id=prompt_id)
    if db_prompt is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prompt not found")

    # Permission check
    if not current_user.is_admin and db_prompt.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this prompt."
        )
    if db_prompt.is_system and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete system prompts."
        )

    deleted = crud.delete_prompt(db=db, prompt_id=prompt_id)
    if deleted is None: # Should not happen if first check passed
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prompt not found during delete")

    return Response(status_code=status.HTTP_204_NO_CONTENT)
