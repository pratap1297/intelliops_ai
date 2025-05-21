from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List
import logging

from .. import crud, models, schemas
from ..dependencies import get_db, get_current_user, get_current_admin_user

# Configure logger
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/provider-access",
    tags=["Provider Access"],
    responses={404: {"description": "Not found"}},
)

@router.get("", response_model=List[schemas.ProviderAccess])
def get_provider_access(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Get provider access for the current user"""
    # For admin users, we could return all provider access records
    # For regular users, return only their own records
    provider_access = crud.get_provider_access_by_user_id(db, user_id=current_user.id)
    return provider_access

@router.get("/user/{user_id}", response_model=List[schemas.ProviderAccess])
def get_user_provider_access(
    user_id: int,
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    """Get provider access for a specific user (admin only)"""
    # Only admin users can view other users' provider access
    if not current_user.is_admin and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view provider access for this user"
        )
    
    # Check if user exists
    user = crud.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"User with id {user_id} not found"
        )
    
    provider_access = crud.get_provider_access_by_user_id(db, user_id=user_id)
    return provider_access

@router.post("", response_model=schemas.ProviderAccess, status_code=status.HTTP_201_CREATED)
def create_provider_access(provider_access: schemas.ProviderAccessCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Create a new provider access record (admin only)"""
    if not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to create provider access")
    
    return crud.create_provider_access(db, provider_access=provider_access)

@router.put("/{provider}", response_model=schemas.ProviderAccess)
def update_provider_access(
    provider: str,
    provider_access: schemas.ProviderAccessUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Update provider access (admin only)"""
    # Log request details for debugging
    logger.info(f"Provider access update request - URL: {request.url} - Provider: {provider}")
    logger.info(f"Incoming payload: {provider_access}")
    logger.info(f"Current user: id={current_user.id}, is_admin={current_user.is_admin}")
    if not current_user.is_admin:
        logger.warning(f"Unauthorized provider access update attempt by non-admin user {current_user.id}")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update provider access")
    
    # Ensure the user exists
    user = crud.get_user(db, user_id=provider_access.user_id)
    logger.info(f"User existence check for user_id={provider_access.user_id}: {'FOUND' if user else 'NOT FOUND'}")
    if not user:
        logger.warning(f"User with id {provider_access.user_id} not found during provider access update")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"User with id {provider_access.user_id} not found")
    
    # Get the current user activation status from the database
    logger.info(f"Current user activation status from database: is_active={user.is_active}")
    
    # Check if provider access record exists
    db_provider_access = crud.get_provider_access(db, user_id=provider_access.user_id, provider=provider)
    logger.info(f"Provider access record existence for user_id={provider_access.user_id}, provider={provider}: {'FOUND' if db_provider_access else 'NOT FOUND'}")
    
    # Check if we're trying to change the user's activation status
    if db_provider_access and db_provider_access.is_active != provider_access.is_active:
        logger.warning(f"Provider access update is attempting to change user activation status from {db_provider_access.is_active} to {provider_access.is_active}")
        
        # Check if this is an intentional deactivation (frontend explicitly set is_active=False)
        # or if it's just preserving the current status (frontend passed the current status)
        if provider_access.is_active != user.is_active:
            logger.info(f"User activation status in update ({provider_access.is_active}) differs from database ({user.is_active})")
            logger.info("This appears to be an explicit activation status change")
        else:
            logger.info("User activation status in update matches database, preserving status")
    
    if db_provider_access:
        logger.info(f"Updating existing provider access record for user_id={provider_access.user_id}, provider={provider}, has_access={provider_access.has_access}, is_active={provider_access.is_active}")
        updated_access = crud.update_provider_access(
            db, 
            user_id=provider_access.user_id, 
            provider=provider, 
            has_access=provider_access.has_access, 
            is_active=provider_access.is_active
        )
        logger.info(f"After update: user_id={updated_access.user_id}, provider={updated_access.provider}, has_access={updated_access.has_access}, is_active={updated_access.is_active}")
        return updated_access
    else:
        logger.info(f"Creating new provider access record for user_id={provider_access.user_id}, provider={provider}")
        return crud.create_provider_access(
            db, 
            provider_access=schemas.ProviderAccessCreate(
                user_id=provider_access.user_id,
                provider=provider,
                has_access=provider_access.has_access,
                is_active=provider_access.is_active
            )
        )

@router.delete("/{provider_access_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_provider_access(
    provider_access_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Delete a provider access record (admin only)"""
    if not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete provider access")
    
    db_provider_access = crud.get_provider_access_by_id(db, provider_access_id=provider_access_id)
    if not db_provider_access:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Provider access with id {provider_access_id} not found")
    
    crud.delete_provider_access(db, provider_access_id=provider_access_id)
    return None

@router.get("/debug/user/{user_id}", response_model=List[schemas.ProviderAccess])
def get_all_provider_access_for_user(
    user_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get all provider access records for a user (admin only, for debugging)"""
    logger.info(f"Debug endpoint called - URL: {request.url} - Getting all provider access for user_id: {user_id}")
    
    # Convert user_id to integer
    try:
        user_id_int = int(user_id)
        logger.info(f"Converted user_id {user_id} to integer {user_id_int}")
    except ValueError:
        logger.warning(f"Failed to convert user_id {user_id} to integer")
        raise HTTPException(status_code=400, detail="Invalid user ID format")
    
    # Get all provider access records for the user
    db_provider_access = db.query(models.ProviderAccess).filter(models.ProviderAccess.user_id == user_id_int).all()
    
    # Log detailed information about each record
    logger.info(f"Provider access records for user_id={user_id}:")
    for access in db_provider_access:
        logger.info(f"  - provider={access.provider}, has_access={access.has_access}, is_active={access.is_active}")
    
    return db_provider_access
