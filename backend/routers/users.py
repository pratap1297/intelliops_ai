from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from .. import crud, models, schemas
from ..database import get_db
from ..dependencies import get_current_active_user, get_current_admin_user

router = APIRouter(
    prefix="/users",
    tags=["users"],
)

@router.get("/me", response_model=schemas.User)
async def read_users_me(current_user: models.User = Depends(get_current_active_user)):
    """Get current user profile"""
    return current_user

@router.put("/me", response_model=schemas.User)
async def update_user_me(user_update: schemas.UserUpdate, 
                        current_user: models.User = Depends(get_current_active_user),
                        db: Session = Depends(get_db)):
    """Update current user profile"""
    updated_user = crud.update_user(db, current_user.id, user_update)
    return updated_user

@router.put("/me/password")
async def change_password(password_update: schemas.PasswordUpdate,
                        current_user: models.User = Depends(get_current_active_user),
                        db: Session = Depends(get_db)):
    """Change current user password"""
    if not crud.verify_password(password_update.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect current password")
    
    crud.update_user_password(db, current_user, password_update.new_password)
    return {"message": "Password updated successfully"}

# Admin endpoints for user management
@router.get("/", response_model=List[schemas.User])
async def read_users(
    skip: int = 0, 
    limit: int = 100, 
    current_user: models.User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get all users (admin only)"""
    return crud.get_users(db, skip=skip, limit=limit)

@router.get("/{user_id}", response_model=schemas.User)
async def read_user(
    user_id: int,
    current_user: models.User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get a specific user by ID (admin only)"""
    db_user = crud.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@router.put("/{user_id}", response_model=schemas.User)
async def update_user(
    user_id: int,
    user_update: schemas.UserUpdate,
    current_user: models.User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Update a user (admin only)"""
    # Prevent changing super admin status
    db_user = crud.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent removing admin status from the first admin user
    if db_user.id == 1 and "is_admin" in user_update.model_dump(exclude_unset=True) and not user_update.is_admin:
        raise HTTPException(status_code=400, detail="Cannot remove admin status from the primary admin user")
    
    updated_user = crud.update_user(db, user_id, user_update)
    return updated_user

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    current_user: models.User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Delete a user (admin only)"""
    # Prevent deleting the first admin user
    if user_id == 1:
        raise HTTPException(status_code=400, detail="Cannot delete the primary admin user")
    
    # Prevent self-deletion
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    success = crud.delete_user(db, user_id=user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return None
