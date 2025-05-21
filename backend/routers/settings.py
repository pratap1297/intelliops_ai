# backend/routers/settings.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

# Use relative imports
from .. import crud, models, schemas, utils
from ..database import get_db
from ..dependencies import get_current_active_user

router = APIRouter(
    prefix="/api/settings",
    tags=["settings"],
    dependencies=[Depends(get_current_active_user)], # Require authentication
    responses={404: {"description": "Not found"}},
)

# --- User Profile ---

@router.get("/profile", response_model=schemas.User)
def read_user_profile(
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Get the profile of the currently authenticated user.
    """
    return current_user

@router.put("/profile", response_model=schemas.User)
def update_user_profile(
    user_update: schemas.User, # TODO: Replace with a dedicated UserUpdate schema
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Update the profile of the currently authenticated user.
    (Requires a UserUpdate schema to restrict editable fields)
    """
    # Example: Only allow updating the name for now
    # Create schemas.UserUpdate(BaseModel): name: Optional[str] = None ...
    if hasattr(user_update, 'name') and user_update.name is not None:
         current_user.name = user_update.name
    # Add email update logic here if needed, potentially requiring verification

    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.put("/password", status_code=status.HTTP_204_NO_CONTENT)
def update_password(
    password_update: schemas.PasswordUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Update the password for the currently authenticated user.
    """
    if not utils.verify_password(password_update.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password",
        )
    crud.update_user_password(db, user=current_user, new_password=password_update.new_password)
    # No response body needed for 204


# --- Provider Configurations ---

@router.get("/provider-configs", response_model=List[schemas.ProviderConfig])
def read_provider_configs(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Get all provider configurations for the current user.
    """
    return crud.get_provider_configs_for_user(db, user_id=current_user.id)


@router.put("/provider-configs/{provider}", response_model=schemas.ProviderConfig)
def create_or_update_provider_config(
    provider: str,
    config_in: schemas.ProviderConfigBase, # Input only needs provider and config dict
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Create or update a provider configuration for the current user.
    The provider name in the path must match the provider in the body.
    """
    if provider != config_in.provider:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provider name in path does not match provider in request body."
        )
    # Wrap ProviderConfigBase in ProviderConfigCreate before passing to crud
    config_create = schemas.ProviderConfigCreate(
        provider=config_in.provider,
        config=config_in.config,
        user_id=current_user.id # Add user_id
    )
    return crud.create_or_update_provider_config(db, user_id=current_user.id, config_in=config_create)


@router.delete("/provider-configs/{provider}", status_code=status.HTTP_204_NO_CONTENT)
def delete_provider_config(
    provider: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Delete a provider configuration for the current user.
    """
    deleted_config = crud.delete_provider_config(db, user_id=current_user.id, provider=provider)
    if deleted_config is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Provider configuration not found")
    # No response body needed for 204


# --- Provider Access (RBAC - Read Only for now) ---

@router.get("/provider-access", response_model=List[schemas.ProviderAccess])
def read_provider_access(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Get the access permissions (providers) for the current user.
    """
    # Get provider access for the current user
    return crud.get_provider_access_for_user(db, user_id=current_user.id)
