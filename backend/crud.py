from sqlalchemy.orm import Session
import logging
logger = logging.getLogger(__name__)

from typing import List, Optional
from sqlalchemy.exc import IntegrityError
from passlib.context import CryptContext
from sqlalchemy.sql import func
from fastapi import HTTPException

# Use relative imports
from . import models
from . import schemas
# Import from the utils package
from .utils import get_password_hash, verify_password

# Password hashing setup (consider moving to utils.py if not already there)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# === User CRUD ===

def get_user(db: Session, user_id: int) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.email == email).first()

def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[models.User]:
    return db.query(models.User).offset(skip).limit(limit).all()

def create_user(db: Session, user: schemas.UserCreate) -> models.User:
    hashed_password = get_password_hash(user.password)
    # Create user with hashed password
    db_user = models.User(
        email=user.email,
        name=user.name,
        hashed_password=hashed_password,
        is_admin=False # Default new users are not admin
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user_password(db: Session, user: models.User, new_password: str) -> models.User:
    user.hashed_password = get_password_hash(new_password)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def update_user(db: Session, user_id: int, user_update: schemas.UserUpdate) -> models.User:
    db_user = get_user(db, user_id=user_id)
    if not db_user:
        return None
    
    update_data = user_update.model_dump(exclude_unset=True)
    
    # Log the update operation, especially for is_active status changes
    logger.debug(f"Updating user {user_id} with data: {update_data}")
    
    # Check if we're updating the is_active status
    if 'is_active' in update_data:
        previous_status = db_user.is_active
        new_status = update_data['is_active']
        logger.debug(f"User {user_id} activation status change: {previous_status} -> {new_status}")
    
    # Apply all updates
    for key, value in update_data.items():
        setattr(db_user, key, value)
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Log the final state after update
    logger.debug(f"User {user_id} updated. Current state: id={db_user.id}, email={db_user.email}, is_active={db_user.is_active}, is_admin={db_user.is_admin}")
    
    return db_user

def delete_user(db: Session, user_id: int) -> bool:
    db_user = get_user(db, user_id=user_id)
    if not db_user:
        return False
    
    db.delete(db_user)
    db.commit()
    return True

# === Provider Access CRUD ===

def get_provider_access_by_id(db: Session, provider_access_id: int) -> Optional[models.ProviderAccess]:
    return db.query(models.ProviderAccess).filter(models.ProviderAccess.id == provider_access_id).first()

def get_provider_access(db: Session, user_id: int, provider: str) -> Optional[models.ProviderAccess]:
    return db.query(models.ProviderAccess).filter(
        models.ProviderAccess.user_id == user_id,
        models.ProviderAccess.provider == provider
    ).first()

def get_provider_access_by_user_id(db: Session, user_id: int) -> List[models.ProviderAccess]:
    return db.query(models.ProviderAccess).filter(models.ProviderAccess.user_id == user_id).all()

def create_provider_access(db: Session, provider_access: schemas.ProviderAccessCreate) -> models.ProviderAccess:
    db_provider_access = models.ProviderAccess(
        user_id=provider_access.user_id,
        provider=provider_access.provider,
        has_access=provider_access.has_access,
        is_active=provider_access.is_active
    )
    db.add(db_provider_access)
    db.commit()
    db.refresh(db_provider_access)
    return db_provider_access

def update_provider_access(db: Session, db_provider_access: models.ProviderAccess, provider_access: schemas.ProviderAccessUpdate) -> models.ProviderAccess:
    # Log the current state before update
    logger.debug(f"Provider Access BEFORE update: user_id={db_provider_access.user_id}, provider={db_provider_access.provider}, has_access={db_provider_access.has_access}, is_active={db_provider_access.is_active}")
    
    # Log what we're trying to update to
    logger.debug(f"Provider Access update requested: has_access={provider_access.has_access}, is_active={provider_access.is_active}")
    
    # Check if we're changing the is_active status
    if db_provider_access.is_active != provider_access.is_active:
        logger.debug(f"Provider Access is_active status changing: {db_provider_access.is_active} -> {provider_access.is_active}")
    
    # Update the provider access record
    db_provider_access.has_access = provider_access.has_access
    db_provider_access.is_active = provider_access.is_active
    
    db.add(db_provider_access)
    db.commit()
    db.refresh(db_provider_access)
    
    # Log the state after update
    logger.debug(f"Provider Access AFTER update: user_id={db_provider_access.user_id}, provider={db_provider_access.provider}, has_access={db_provider_access.has_access}, is_active={db_provider_access.is_active}")
    
    return db_provider_access

def delete_provider_access(db: Session, provider_access_id: int) -> bool:
    db_provider_access = get_provider_access_by_id(db, provider_access_id=provider_access_id)
    if not db_provider_access:
        return False
    
    db.delete(db_provider_access)
    db.commit()
    return True

# === Prompt CRUD ===

def get_prompt(db: Session, prompt_id: str) -> Optional[models.Prompt]:
    return db.query(models.Prompt).filter(models.Prompt.id == prompt_id).first()

def get_prompts(db: Session, skip: int = 0, limit: int = 100, user_id: Optional[int] = None, category: Optional[str] = None, cloud_provider: Optional[str] = None) -> List[models.Prompt]:
    query = db.query(models.Prompt)
    
    # Filter by user_id (including system prompts)
    if user_id:
        query = query.filter((models.Prompt.user_id == user_id) | (models.Prompt.is_system == True))
    
    # Filter by category if provided
    if category:
        query = query.filter(models.Prompt.category == category)
    
    # Filter by cloud_provider if provided
    if cloud_provider:
        query = query.filter(models.Prompt.cloud_provider == cloud_provider)
    
    return query.order_by(models.Prompt.created_at.desc()).offset(skip).limit(limit).all()

def get_system_prompts(db: Session, skip: int = 0, limit: int = 100, category: Optional[str] = None, cloud_provider: Optional[str] = None) -> List[models.Prompt]:
    query = db.query(models.Prompt).filter(models.Prompt.is_system == True)
    
    # Filter by category if provided
    if category:
        query = query.filter(models.Prompt.category == category)
    
    # Filter by cloud_provider if provided
    if cloud_provider:
        query = query.filter(models.Prompt.cloud_provider == cloud_provider)
    
    return query.order_by(models.Prompt.created_at.desc()).offset(skip).limit(limit).all()

def get_user_prompts(db: Session, user_id: int, skip: int = 0, limit: int = 100, category: Optional[str] = None, cloud_provider: Optional[str] = None) -> List[models.Prompt]:
    query = db.query(models.Prompt).filter(models.Prompt.user_id == user_id)
    
    # Filter by category if provided
    if category:
        query = query.filter(models.Prompt.category == category)
    
    # Filter by cloud_provider if provided
    if cloud_provider:
        query = query.filter(models.Prompt.cloud_provider == cloud_provider)
    
    return query.order_by(models.Prompt.created_at.desc()).offset(skip).limit(limit).all()

def get_all_prompts_for_admin(db: Session, skip: int = 0, limit: int = 100, category: Optional[str] = None, cloud_provider: Optional[str] = None) -> List[models.Prompt]:
    query = db.query(models.Prompt)
    
    # Filter by category if provided
    if category:
        query = query.filter(models.Prompt.category == category)
    
    # Filter by cloud_provider if provided
    if cloud_provider:
        query = query.filter(models.Prompt.cloud_provider == cloud_provider)
    
    return query.order_by(models.Prompt.created_at.desc()).offset(skip).limit(limit).all()

def create_prompt(db: Session, prompt: schemas.PromptCreate, owner_id: Optional[int] = None) -> models.Prompt:
    # If owner_id is None, it's considered a system prompt (or handled by caller)
    # Ensure ID is unique before creating
    db_prompt = models.Prompt(
        **prompt.model_dump(), # Use model_dump() in Pydantic v2
        user_id=owner_id if not prompt.is_system else None # Assign owner only if not system
    )
    db.add(db_prompt)
    db.commit()
    db.refresh(db_prompt)
    return db_prompt

def update_prompt(db: Session, prompt_id: str, prompt_update: schemas.PromptUpdate, user_id: int) -> Optional[models.Prompt]:
    db_prompt = get_prompt(db, prompt_id)
    if not db_prompt:
        return None
    
    update_data = prompt_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_prompt, key, value)
    
    # Update the timestamp
    db_prompt.updated_at = func.now()
    
    db.add(db_prompt)
    db.commit()
    db.refresh(db_prompt)
    return db_prompt

def delete_prompt(db: Session, prompt_id: str) -> Optional[models.Prompt]:
    db_prompt = get_prompt(db, prompt_id)
    if not db_prompt:
        return None
    
    db.delete(db_prompt)
    db.commit()
    return db_prompt


# === Provider Access CRUD ===

def get_user_access(db: Session, user_id: int):
    return get_provider_access_for_user(db, user_id)

def get_provider_access_for_user(db: Session, user_id: int, provider: str = None):
    query = db.query(models.ProviderAccess).filter(models.ProviderAccess.user_id == user_id)
    
    # If provider is specified, filter by provider as well
    if provider:
        query = query.filter(models.ProviderAccess.provider == provider)
        return query.first()  # Return single record if provider is specified
    else:
        return query.all()  # Return all records if provider is not specified

def get_provider_access_by_provider(db: Session, user_id: int, provider: str):
    return db.query(models.ProviderAccess).filter(
        models.ProviderAccess.user_id == user_id,
        models.ProviderAccess.provider == provider
    ).first()

def create_provider_access(db: Session, provider_access: schemas.UserAccessCreate):
    db_access = models.ProviderAccess(**provider_access.dict())
    db.add(db_access)
    db.commit()
    db.refresh(db_access)
    return db_access

def update_provider_access(db: Session, user_id: int, provider: str, has_access: bool, is_active: bool):
    db_access = get_provider_access_by_provider(db, user_id, provider)
    if db_access:
        db_access.has_access = has_access
        db_access.is_active = is_active
        db.add(db_access)
        db.commit()
        db.refresh(db_access)
    return db_access

# === Role and Permission CRUD ===

def get_role(db: Session, role_id: int) -> Optional[models.Role]:
    return db.query(models.Role).filter(models.Role.id == role_id).first()

def get_role_by_name(db: Session, name: str) -> Optional[models.Role]:
    return db.query(models.Role).filter(models.Role.name == name).first()

def get_roles(db: Session, skip: int = 0, limit: int = 100) -> List[models.Role]:
    return db.query(models.Role).offset(skip).limit(limit).all()

def create_role(db: Session, role: schemas.RoleCreate) -> models.Role:
    db_role = models.Role(**role.dict())
    db.add(db_role)
    db.commit()
    db.refresh(db_role)
    return db_role

def update_role(db: Session, role_id: int, role_update: schemas.RoleBase) -> Optional[models.Role]:
    db_role = get_role(db, role_id)
    if db_role:
        for key, value in role_update.dict(exclude_unset=True).items():
            setattr(db_role, key, value)
        db.add(db_role)
        db.commit()
        db.refresh(db_role)
    return db_role

def delete_role(db: Session, role_id: int) -> bool:
    db_role = get_role(db, role_id)
    if db_role:
        db.delete(db_role)
        db.commit()
        return True
    return False

# Role Permission CRUD
def get_role_permission(db: Session, permission_id: int) -> Optional[models.RolePermission]:
    return db.query(models.RolePermission).filter(models.RolePermission.id == permission_id).first()

def get_role_permissions(db: Session, role_id: int) -> List[models.RolePermission]:
    return db.query(models.RolePermission).filter(models.RolePermission.role_id == role_id).all()

def create_role_permission(db: Session, permission: schemas.RolePermissionCreate) -> models.RolePermission:
    db_permission = models.RolePermission(**permission.dict())
    db.add(db_permission)
    db.commit()
    db.refresh(db_permission)
    return db_permission

def delete_role_permission(db: Session, permission_id: int) -> bool:
    db_permission = get_role_permission(db, permission_id)
    if db_permission:
        db.delete(db_permission)
        db.commit()
        return True
    return False

# User Role CRUD
def get_user_role(db: Session, user_role_id: int) -> Optional[models.UserRole]:
    return db.query(models.UserRole).filter(models.UserRole.id == user_role_id).first()

def get_user_roles(db: Session, user_id: int) -> List[models.UserRole]:
    return db.query(models.UserRole).filter(models.UserRole.user_id == user_id).all()

def create_user_role(db: Session, user_role: schemas.UserRoleCreate) -> models.UserRole:
    db_user_role = models.UserRole(**user_role.dict())
    db.add(db_user_role)
    db.commit()
    db.refresh(db_user_role)
    return db_user_role

def delete_user_role(db: Session, user_role_id: int) -> bool:
    db_user_role = get_user_role(db, user_role_id)
    if db_user_role:
        db.delete(db_user_role)
        db.commit()
        return True
    return False

# User Role Permission CRUD
def get_user_permission(db: Session, permission_id: int) -> Optional[models.UserRolePermission]:
    return db.query(models.UserRolePermission).filter(models.UserRolePermission.id == permission_id).first()

def get_user_permissions(db: Session, user_id: int) -> List[models.UserRolePermission]:
    return db.query(models.UserRolePermission).filter(models.UserRolePermission.user_id == user_id).all()

def create_user_permission(db: Session, permission: schemas.UserRolePermissionCreate) -> models.UserRolePermission:
    db_permission = models.UserRolePermission(**permission.dict())
    db.add(db_permission)
    db.commit()
    db.refresh(db_permission)
    return db_permission

def update_user_permission(db: Session, permission_id: int, granted: bool) -> Optional[models.UserRolePermission]:
    db_permission = get_user_permission(db, permission_id)
    if db_permission:
        db_permission.granted = granted
        db.add(db_permission)
        db.commit()
        db.refresh(db_permission)
    return db_permission

def delete_user_permission(db: Session, permission_id: int) -> bool:
    db_permission = get_user_permission(db, permission_id)
    if db_permission:
        db.delete(db_permission)
        db.commit()
        return True
    return False

# === Provider Config CRUD ===

def get_provider_config(db: Session, user_id: int, provider: str) -> Optional[models.ProviderConfig]:
    return db.query(models.ProviderConfig).filter(
        models.ProviderConfig.user_id == user_id,
        models.ProviderConfig.provider == provider
    ).first()

def get_provider_configs_for_user(db: Session, user_id: int) -> List[models.ProviderConfig]:
    return db.query(models.ProviderConfig).filter(models.ProviderConfig.user_id == user_id).all()

def create_or_update_provider_config(db: Session, user_id: int, config_in: schemas.ProviderConfigCreate) -> models.ProviderConfig:
    db_config = get_provider_config(db, user_id, config_in.provider)
    if db_config:
        # Update existing config
        db_config.config = config_in.config
    else:
        # Create new config
        db_config = models.ProviderConfig(
            user_id=user_id,
            provider=config_in.provider,
            config=config_in.config
        )
    db.add(db_config)
    db.commit()
    db.refresh(db_config)
    return db_config

def delete_provider_config(db: Session, user_id: int, provider: str) -> Optional[models.ProviderConfig]:
    db_config = get_provider_config(db, user_id, provider)
    if db_config:
        db.delete(db_config)
        db.commit()
        return db_config
    return None

# === Chat Thread and Message CRUD ===

def get_chat_thread(db: Session, thread_id: int, user_id: int) -> Optional[models.ChatThread]:
    return db.query(models.ChatThread).filter(
        models.ChatThread.id == thread_id,
        models.ChatThread.user_id == user_id
    ).first()

def get_chat_threads_for_user(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[models.ChatThread]:
    return db.query(models.ChatThread).filter(
        models.ChatThread.user_id == user_id
    ).order_by(models.ChatThread.updated_at.desc()).offset(skip).limit(limit).all()

def create_chat_thread(db: Session, thread: schemas.ChatThreadCreate) -> models.ChatThread:
    db_thread = models.ChatThread(**thread.dict())
    db.add(db_thread)
    db.commit()
    db.refresh(db_thread)
    return db_thread

def update_chat_thread(db: Session, thread_id: int, user_id: int, title: str) -> Optional[models.ChatThread]:
    db_thread = get_chat_thread(db, thread_id, user_id)
    if db_thread:
        db_thread.title = title
        db.add(db_thread)
        db.commit()
        db.refresh(db_thread)
    return db_thread

def delete_chat_thread(db: Session, thread_id: int, user_id: int) -> bool:
    db_thread = get_chat_thread(db, thread_id, user_id)
    if db_thread:
        db.delete(db_thread)
        db.commit()
        return True
    return False

# Chat Message CRUD
def get_chat_message(db: Session, message_id: int) -> Optional[models.ChatMessage]:
    return db.query(models.ChatMessage).filter(models.ChatMessage.id == message_id).first()

def get_chat_messages_for_thread(db: Session, thread_id: int, skip: int = 0, limit: int = 100) -> List[models.ChatMessage]:
    return db.query(models.ChatMessage).filter(
        models.ChatMessage.thread_id == thread_id
    ).order_by(models.ChatMessage.created_at.asc()).offset(skip).limit(limit).all()

def create_chat_message(db: Session, message: schemas.ChatMessageCreate) -> models.ChatMessage:
    db_message = models.ChatMessage(**message.dict())
    db.add(db_message)
    # Update the thread's updated_at timestamp
    db_thread = db.query(models.ChatThread).filter(models.ChatThread.id == message.thread_id).first()
    if db_thread:
        db_thread.updated_at = func.now()
        db.add(db_thread)
    db.commit()
    db.refresh(db_message)
    return db_message

def delete_chat_message(db: Session, message_id: int) -> bool:
    db_message = get_chat_message(db, message_id)
    if db_message:
        db.delete(db_message)
        db.commit()
        return True
    return False

# === Favorite Prompts CRUD ===

def get_favorite_prompt(db: Session, user_id: int, prompt_id: str) -> Optional[models.FavoritePrompt]:
    return db.query(models.FavoritePrompt).filter(
        models.FavoritePrompt.user_id == user_id,
        models.FavoritePrompt.prompt_id == prompt_id
    ).first()

def get_favorite_prompts_for_user(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[models.FavoritePrompt]:
    return db.query(models.FavoritePrompt).filter(
        models.FavoritePrompt.user_id == user_id
    ).order_by(models.FavoritePrompt.created_at.desc()).offset(skip).limit(limit).all()

def get_favorite_prompts_with_details(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[models.Prompt]:
    # Get the user's favorite prompts with full prompt details
    favorite_prompts = db.query(models.Prompt).join(
        models.FavoritePrompt, models.FavoritePrompt.prompt_id == models.Prompt.id
    ).filter(
        models.FavoritePrompt.user_id == user_id
    ).order_by(models.FavoritePrompt.created_at.desc()).offset(skip).limit(limit).all()
    
    return favorite_prompts

def create_favorite_prompt(db: Session, favorite: schemas.FavoritePromptCreate) -> models.FavoritePrompt:
    try:
        db_favorite = models.FavoritePrompt(**favorite.model_dump())
        db.add(db_favorite)
        db.commit()
        db.refresh(db_favorite)
        return db_favorite
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="This prompt is already in favorites")

def delete_favorite_prompt(db: Session, user_id: int, prompt_id: str) -> bool:
    db_favorite = get_favorite_prompt(db, user_id=user_id, prompt_id=prompt_id)
    if not db_favorite:
        return False
    
    db.delete(db_favorite)
    db.commit()
    return True

def check_is_favorite(db: Session, user_id: int, prompt_id: str) -> bool:
    """Check if a prompt is in the user's favorites"""
    favorite = get_favorite_prompt(db, user_id=user_id, prompt_id=prompt_id)
    return favorite is not None

# === Document CRUD ===

def get_document(db: Session, document_id: int, user_id: int) -> Optional[models.Document]:
     return db.query(models.Document).filter(models.Document.id == document_id, models.Document.user_id == user_id).first()

def get_documents_for_user(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[models.Document]:
    return db.query(models.Document).filter(models.Document.user_id == user_id).offset(skip).limit(limit).all()

def create_document(db: Session, document: schemas.DocumentCreate, user_id: int) -> models.Document:
    db_document = models.Document(
        **document.model_dump(),
        user_id=user_id # Ensure user_id is set correctly
    )
    db.add(db_document)
    db.commit()
    db.refresh(db_document)
    return db_document

def delete_document(db: Session, document_id: int, user_id: int) -> Optional[models.Document]:
    db_document = get_document(db, document_id, user_id)
    if db_document:
        db.delete(db_document)
        db.commit()
        # Note: This only deletes the DB record. Actual file deletion (e.g., from S3) needs separate handling.
        return db_document
    return None
