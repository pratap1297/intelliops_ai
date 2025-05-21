from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from .. import models, schemas, crud
from ..database import get_db
from ..dependencies import get_current_user

router = APIRouter(
    prefix="/api/roles",
    tags=["roles"],
    responses={404: {"description": "Not found"}},
)

# Role endpoints
@router.get("/", response_model=List[schemas.Role])
def read_roles(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Only admin users can list all roles
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access all roles"
        )
    return crud.get_roles(db, skip=skip, limit=limit)

@router.post("/", response_model=schemas.Role, status_code=status.HTTP_201_CREATED)
def create_role(
    role: schemas.RoleCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Only admin users can create roles
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create roles"
        )
    
    # Check if role with same name already exists
    db_role = crud.get_role_by_name(db, name=role.name)
    if db_role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Role with name '{role.name}' already exists"
        )
    
    return crud.create_role(db=db, role=role)

@router.get("/{role_id}", response_model=schemas.Role)
def read_role(
    role_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Only admin users can view role details
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view role details"
        )
    
    db_role = crud.get_role(db, role_id=role_id)
    if db_role is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Role with id {role_id} not found"
        )
    return db_role

@router.put("/{role_id}", response_model=schemas.Role)
def update_role(
    role_id: int,
    role_update: schemas.RoleBase,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Only admin users can update roles
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update roles"
        )
    
    db_role = crud.update_role(db, role_id=role_id, role_update=role_update)
    if db_role is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Role with id {role_id} not found"
        )
    return db_role

@router.delete("/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_role(
    role_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Only admin users can delete roles
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete roles"
        )
    
    success = crud.delete_role(db, role_id=role_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Role with id {role_id} not found"
        )
    return None

# Role Permission endpoints
@router.get("/{role_id}/permissions", response_model=List[schemas.RolePermission])
def read_role_permissions(
    role_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Only admin users can view role permissions
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view role permissions"
        )
    
    # Check if role exists
    db_role = crud.get_role(db, role_id=role_id)
    if db_role is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Role with id {role_id} not found"
        )
    
    return crud.get_role_permissions(db, role_id=role_id)

@router.post("/{role_id}/permissions", response_model=schemas.RolePermission, status_code=status.HTTP_201_CREATED)
def create_role_permission(
    role_id: int,
    permission: schemas.PermissionBase,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Only admin users can create role permissions
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create role permissions"
        )
    
    # Check if role exists
    db_role = crud.get_role(db, role_id=role_id)
    if db_role is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Role with id {role_id} not found"
        )
    
    # Create the permission
    role_permission = schemas.RolePermissionCreate(
        role_id=role_id,
        permission=permission.permission
    )
    
    return crud.create_role_permission(db=db, permission=role_permission)

@router.delete("/{role_id}/permissions/{permission_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_role_permission(
    role_id: int,
    permission_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Only admin users can delete role permissions
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete role permissions"
        )
    
    # Check if role exists
    db_role = crud.get_role(db, role_id=role_id)
    if db_role is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Role with id {role_id} not found"
        )
    
    # Delete the permission
    success = crud.delete_role_permission(db, permission_id=permission_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Permission with id {permission_id} not found"
        )
    return None
