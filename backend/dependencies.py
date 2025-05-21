from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
import os
import logging
from dotenv import load_dotenv

# Set up logger
logger = logging.getLogger("backend.dependencies")

from .database import get_db
from . import models
from . import schemas
from . import crud
# Import directly from utils.py
import os

# JWT Settings from environment variables or defaults
SECRET_KEY = os.getenv("SECRET_KEY", "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7")  # Default secret key for development
ALGORITHM = os.getenv("ALGORITHM", "HS256")

load_dotenv()

# Ensure SECRET_KEY and ALGORITHM are available
if not SECRET_KEY:
    import logging
    logger = logging.getLogger(__name__)
    logger.warning("SECRET_KEY not found in environment variables. Using default key from utils.py")

# Use correct token URL with leading slash
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail={"message": "Session expired", "code": "TOKEN_EXPIRED"},
        headers={
            "WWW-Authenticate": "Bearer",
            "X-Error-Type": "token_expired"
        }
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = schemas.TokenData(email=email)
    except JWTError as e:
        logger.error(f"JWT Error: {e}")
        raise credentials_exception

    user = crud.get_user_by_email(db, email=token_data.email)
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user: models.User = Depends(get_current_user)):
    # Check if user is authenticated
    if not current_user.is_authenticated:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    # Check if user is active (not soft deleted)
    if not current_user.is_active:
        print(f"[get_current_active_user] Attempt to access API by deactivated user: {current_user.email}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account has been deactivated. Please contact an administrator."
        )
    
    return current_user

def get_current_admin_user(current_user: models.User = Depends(get_current_active_user)):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have admin privileges"
        )
    return current_user

# RBAC utility functions
def get_user_permissions(db: Session, user_id: int):
    # Get all permissions from user's roles
    permissions = {}
    
    # Get user's roles
    user_roles = crud.get_user_roles(db, user_id=user_id)
    
    # For each role, get permissions
    for user_role in user_roles:
        role_permissions = crud.get_role_permissions(db, role_id=user_role.role_id)
        for perm in role_permissions:
            permissions[perm.permission] = True
    
    # Get user-specific permissions (overrides)
    user_permissions = crud.get_user_permissions(db, user_id=user_id)
    for perm in user_permissions:
        # User-specific permissions can grant or revoke permissions
        if perm.granted:
            permissions[perm.permission] = True
        else:
            permissions[perm.permission] = False
    
    return permissions

def has_permission(permission: str, current_user: models.User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    # Admin users have all permissions
    if current_user.is_admin:
        return True
    
    # Get user permissions
    permissions = get_user_permissions(db, current_user.id)
    
    # Check if user has the required permission
    return permissions.get(permission, False)

# Permission dependency factories
def require_permission(permission: str):
    def permission_dependency(current_user: models.User = Depends(get_current_active_user), db: Session = Depends(get_db)):
        if not has_permission(permission, current_user, db):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"User does not have the required permission: {permission}"
            )
        return current_user
    return permission_dependency

# Provider access dependency
def has_provider_access(provider: str, current_user: models.User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    # Admin users have access to all providers
    if current_user.is_admin:
        return True
    
    # Check if user has access to the provider
    provider_access = crud.get_provider_access_by_provider(db, user_id=current_user.id, provider=provider)
    return provider_access is not None and provider_access.has_access and provider_access.is_active

# Provider access dependency factory
def require_provider_access(provider: str):
    def provider_dependency(current_user: models.User = Depends(get_current_active_user), db: Session = Depends(get_db)):
        if not has_provider_access(provider, current_user, db):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"User does not have access to provider: {provider}"
            )
        return current_user
    return provider_dependency
