from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, List, Optional
from pydantic import BaseModel
from app.database import get_db
from sqlalchemy.orm import Session
from app.models import User, NavigationItem, UserNavigationPermission
from app.dependencies import get_current_active_user

router = APIRouter(prefix="/api/navigation", tags=["navigation"])


class NavItemBase(BaseModel):
    id: str
    title: str
    path: str
    tooltip: str
    position: str
    order: int
    isEnabled: bool
    requiredRole: Optional[str] = None


class NavItemCreate(NavItemBase):
    pass


class NavItemUpdate(NavItemBase):
    pass


class NavItem(NavItemBase):
    class Config:
        orm_mode = True


class UserPermission(BaseModel):
    navItems: Dict[str, bool]


@router.get("/items", response_model=List[NavItem])
async def get_navigation_items(db: Session = Depends(get_db)):
    """Get all navigation items"""
    items = db.query(NavigationItem).all()
    return items


@router.post("/items", response_model=NavItem)
async def create_navigation_item(
    item: NavItemCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new navigation item (admin only)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can create navigation items"
        )
    
    # Check if item with this ID already exists
    existing_item = db.query(NavigationItem).filter(NavigationItem.id == item.id).first()
    if existing_item:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Navigation item with ID {item.id} already exists"
        )
    
    # Create new item
    db_item = NavigationItem(
        id=item.id,
        title=item.title,
        path=item.path,
        tooltip=item.tooltip,
        position=item.position,
        order=item.order,
        is_enabled=item.isEnabled,
        required_role=item.requiredRole
    )
    
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


@router.put("/items/{item_id}", response_model=NavItem)
async def update_navigation_item(
    item_id: str,
    item: NavItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update an existing navigation item (admin only)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can update navigation items"
        )
    
    # Find the item
    db_item = db.query(NavigationItem).filter(NavigationItem.id == item_id).first()
    if not db_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Navigation item with ID {item_id} not found"
        )
    
    # Update the item
    db_item.title = item.title
    db_item.path = item.path
    db_item.tooltip = item.tooltip
    db_item.position = item.position
    db_item.order = item.order
    db_item.is_enabled = item.isEnabled
    db_item.required_role = item.requiredRole
    
    db.commit()
    db.refresh(db_item)
    return db_item


@router.delete("/items/{item_id}", response_model=dict)
async def delete_navigation_item(
    item_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete a navigation item (admin only)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can delete navigation items"
        )
    
    # Find the item
    db_item = db.query(NavigationItem).filter(NavigationItem.id == item_id).first()
    if not db_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Navigation item with ID {item_id} not found"
        )
    
    # Delete the item
    db.delete(db_item)
    db.commit()
    return {"success": True}


@router.get("/permissions/{user_id}", response_model=UserPermission)
async def get_user_permissions(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get navigation permissions for a specific user"""
    # Only admins or the user themselves can access their permissions
    if current_user.role != "admin" and str(current_user.id) != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this user's navigation settings"
        )
    
    # Find the user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found"
        )
    
    # Get user's permissions
    permissions = db.query(UserNavigationPermission).filter(
        UserNavigationPermission.user_id == user_id
    ).all()
    
    # Convert to dictionary format
    nav_items = {}
    for perm in permissions:
        nav_items[perm.nav_item_id] = perm.is_enabled
    
    return {"navItems": nav_items}


@router.post("/permissions/{user_id}", response_model=UserPermission)
async def save_user_permissions(
    user_id: str,
    permissions: UserPermission,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Save navigation permissions for a specific user (admin only)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can update user permissions"
        )
    
    # Find the user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found"
        )
    
    # Delete existing permissions for this user
    db.query(UserNavigationPermission).filter(
        UserNavigationPermission.user_id == user_id
    ).delete()
    
    # Save new permissions
    for nav_item_id, is_enabled in permissions.navItems.items():
        # Verify that the navigation item exists
        nav_item = db.query(NavigationItem).filter(NavigationItem.id == nav_item_id).first()
        if not nav_item:
            continue  # Skip non-existent items
        
        # Create permission
        db_permission = UserNavigationPermission(
            user_id=user_id,
            nav_item_id=nav_item_id,
            is_enabled=is_enabled
        )
        db.add(db_permission)
    
    db.commit()
    return permissions
