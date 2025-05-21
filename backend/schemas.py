from pydantic import BaseModel, EmailStr, Json, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# --- Base Schemas (Common fields) ---

class PromptBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    command: str
    cloud_provider: Optional[str] = None # Should match provider names ('aws', 'gcp', etc.')

class UserAccessBase(BaseModel):
    provider: str
    has_access: Optional[bool] = True
    is_active: Optional[bool] = True

class ProviderConfigBase(BaseModel):
    provider: str
    config: Dict[str, Any] # Using Dict for flexible JSON structure

class DocumentBase(BaseModel):
    filename: str
    url: str

class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None

class PermissionBase(BaseModel):
    permission: str

class ChatThreadBase(BaseModel):
    title: Optional[str] = None
    cloud_provider: Optional[str] = None

class ChatMessageBase(BaseModel):
    role: str # 'user' or 'assistant'
    content: str

class FavoritePromptBase(BaseModel):
    prompt_id: str

# --- Schemas for Creation (Data coming into the API) ---

class PromptCreate(PromptBase):
    id: str # Expecting the ID to be provided on creation (e.g., slug 'aws-1')
    is_system: Optional[bool] = False
    # user_id will be set based on the logged-in user or None for system prompts

class UserAccessCreate(UserAccessBase):
    user_id: int

class ProviderAccessCreate(UserAccessBase):
    user_id: int

class ProviderAccessUpdate(BaseModel):
    user_id: int
    has_access: bool
    is_active: bool

class ProviderConfigCreate(ProviderConfigBase):
    user_id: int

class DocumentCreate(DocumentBase):
    user_id: int # Will be set based on logged-in user during upload

class UserCreate(BaseModel): # Separate from UserBase as password is required only on create
    email: EmailStr
    name: str
    password: str

class RoleCreate(RoleBase):
    pass

class RolePermissionCreate(PermissionBase):
    role_id: int

class UserRoleCreate(BaseModel):
    role_id: int
    user_id: int

class UserRolePermissionCreate(PermissionBase):
    user_id: int
    granted: Optional[bool] = True

class ChatThreadCreate(ChatThreadBase):
    user_id: int

class ChatMessageCreate(ChatMessageBase):
    thread_id: int

class FavoritePromptCreate(FavoritePromptBase):
    user_id: int

# --- Schemas for Reading (Data going out from the API) ---

class Role(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class RolePermission(BaseModel):
    id: int
    role_id: int
    permission: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserRole(BaseModel):
    id: int
    user_id: int
    role_id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserRolePermission(BaseModel):
    id: int
    user_id: int
    permission: str
    granted: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ChatThread(BaseModel):
    id: int
    user_id: int
    title: Optional[str] = None
    cloud_provider: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ChatMessage(BaseModel):
    id: int
    thread_id: int
    role: str
    content: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class FavoritePrompt(BaseModel):
    id: int
    user_id: int
    prompt_id: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class User(BaseModel): # Schema for returning user info (no password)
    id: int
    email: EmailStr
    name: str
    is_admin: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Prompt(PromptBase): # Includes fields from Base + DB fields
    id: str
    user_id: Optional[int] = None
    is_system: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    is_favorite: Optional[bool] = None  # Added to indicate if this prompt is a favorite for the current user
    # Optionally include user details if needed in response
    # owner: Optional[User] = None

    class Config:
        from_attributes = True

class ProviderAccess(UserAccessBase):
    id: int
    user_id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ProviderConfig(ProviderConfigBase):
    id: int
    user_id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Document(DocumentBase):
    id: int
    user_id: int
    uploaded_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- Schemas for Updates ---

class PromptUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    command: Optional[str] = None
    cloud_provider: Optional[str] = None
    # Potentially add other fields if they should be updatable

class SettingsUpdate(BaseModel): # Example for /api/settings PUT
    # Define fields that can be updated in settings
    some_setting: Optional[str] = None
    another_setting: Optional[bool] = None

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    is_admin: Optional[bool] = None

class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetUpdate(BaseModel):
    reset_token: str # Assuming a token mechanism for reset
    new_password: str


# --- Authentication Schemas ---

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# --- Log Schema (Example) ---
class LogEntry(BaseModel):
    id: int
    timestamp: datetime
    level: str
    message: str
    user_id: Optional[int] = None
    provider: Optional[str] = None
    session_id: Optional[str] = None
    # Add other relevant fields

    class Config:
        from_attributes = True

# --- Chat Schemas (Based on api.md) ---
class ChatHistory(BaseModel):
    role: str # 'user' or 'assistant'
    content: str

class ChatRequest(BaseModel):
    session_id: Optional[str] = None # Or generate if None
    user_message: str
    history: List[ChatHistory] = []

class ChatResponse(BaseModel):
    session_id: str
    response: str
