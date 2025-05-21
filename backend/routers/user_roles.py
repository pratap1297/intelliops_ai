from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from .. import models, schemas, crud
from ..database import get_db
from ..dependencies import get_current_user

router = APIRouter(
    prefix="/api/users",
    tags=["user roles"],
    responses={404: {"description": "Not found"}},
)

# User Role endpoints
@router.get("/{user_id}/roles", response_model=List[schemas.UserRole])
def read_user_roles(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Check if the user is admin or is requesting their own roles
    if not current_user.is_admin and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view roles for this user"
        )
    
    # Check if user exists
    db_user = crud.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {user_id} not found"
        )
    
    return crud.get_user_roles(db, user_id=user_id)

@router.post("/{user_id}/roles", response_model=schemas.UserRole, status_code=status.HTTP_201_CREATED)
def create_user_role(
    user_id: int,
    role_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Only admin users can assign roles
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to assign roles"
        )
    
    # Check if user exists
    db_user = crud.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {user_id} not found"
        )
    
    # Check if role exists
    db_role = crud.get_role(db, role_id=role_id)
    if db_role is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Role with id {role_id} not found"
        )
    
    # Create the user role
    user_role = schemas.UserRoleCreate(
        user_id=user_id,
        role_id=role_id
    )
    
    try:
        return crud.create_user_role(db=db, user_role=user_role)
    except IntegrityError:
        # Handle case where user already has this role
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User already has this role assigned"
        )

@router.delete("/{user_id}/roles/{user_role_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user_role(
    user_id: int,
    user_role_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Only admin users can remove roles
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to remove roles"
        )
    
    # Check if user exists
    db_user = crud.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {user_id} not found"
        )
    
    # Check if user role exists
    db_user_role = crud.get_user_role(db, user_role_id=user_role_id)
    if db_user_role is None or db_user_role.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User role with id {user_role_id} not found for this user"
        )
    
    # Delete the user role
    success = crud.delete_user_role(db, user_role_id=user_role_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User role with id {user_role_id} not found"
        )
    return None

# User Permission endpoints
@router.get("/{user_id}/permissions", response_model=List[schemas.UserRolePermission])
def read_user_permissions(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Check if the user is admin or is requesting their own permissions
    if not current_user.is_admin and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view permissions for this user"
        )
    
    # Check if user exists
    db_user = crud.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {user_id} not found"
        )
    
    return crud.get_user_permissions(db, user_id=user_id)

@router.post("/{user_id}/permissions", response_model=schemas.UserRolePermission, status_code=status.HTTP_201_CREATED)
def create_user_permission(
    user_id: int,
    permission: schemas.PermissionBase,
    granted: bool = True,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Only admin users can assign permissions
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to assign permissions"
        )
    
    # Check if user exists
    db_user = crud.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {user_id} not found"
        )
    
    # Create the user permission
    user_permission = schemas.UserRolePermissionCreate(
        user_id=user_id,
        permission=permission.permission,
        granted=granted
    )
    
    try:
        return crud.create_user_permission(db=db, permission=user_permission)
    except IntegrityError:
        # Handle case where user already has this permission
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User already has this permission assigned"
        )

@router.put("/{user_id}/permissions/{permission_id}")
def update_user_permission(
    user_id: int,
    permission_id: int,
    granted: bool,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Only admin users can update permissions
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update permissions"
        )
    
    # Check if user exists
    db_user = crud.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {user_id} not found"
        )
    
    # Check if permission exists
    db_permission = crud.get_user_permission(db, permission_id=permission_id)
    if db_permission is None or db_permission.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Permission with id {permission_id} not found for this user"
        )
    
    # Update the permission
    updated_permission = crud.update_user_permission(db, permission_id=permission_id, granted=granted)
    if updated_permission is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Permission with id {permission_id} not found"
        )
    return updated_permission

@router.delete("/{user_id}/permissions/{permission_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user_permission(
    user_id: int,
    permission_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Only admin users can remove permissions
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to remove permissions"
        )
    
    # Check if user exists
    db_user = crud.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {user_id} not found"
        )
    
    # Check if permission exists
    db_permission = crud.get_user_permission(db, permission_id=permission_id)
    if db_permission is None or db_permission.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Permission with id {permission_id} not found for this user"
        )
    
    # Delete the permission
    success = crud.delete_user_permission(db, permission_id=permission_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Permission with id {permission_id} not found"
        )
    return None
