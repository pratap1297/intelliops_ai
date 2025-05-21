from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Text, DateTime, JSON, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(128), nullable=False)
    is_admin = Column(Boolean, default=False)
    is_authenticated = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)  # Added field for user deactivation (soft delete)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    # Relationships
    roles = relationship("UserRole", back_populates="user", cascade="all, delete-orphan")
    provider_access = relationship("ProviderAccess", back_populates="user", cascade="all, delete-orphan")
    provider_configs = relationship("ProviderConfig", back_populates="user", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="user", cascade="all, delete-orphan")
    prompts = relationship("Prompt", back_populates="user")
    favorite_prompts = relationship("FavoritePrompt", back_populates="user", cascade="all, delete-orphan")
    chat_threads = relationship("ChatThread", back_populates="user", cascade="all, delete-orphan")
    permissions = relationship("UserRolePermission", back_populates="user", cascade="all, delete-orphan")
    navigation_permissions = relationship("UserNavigationPermission", back_populates="user", cascade="all, delete-orphan")

class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    users = relationship("UserRole", back_populates="role", cascade="all, delete-orphan")
    permissions = relationship("RolePermission", back_populates="role", cascade="all, delete-orphan")

class UserRole(Base):
    __tablename__ = "user_roles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role_id = Column(Integer, ForeignKey("roles.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="roles")
    role = relationship("Role", back_populates="users")

    # Unique constraint to prevent duplicate user-role assignments
    __table_args__ = (UniqueConstraint('user_id', 'role_id', name='_user_role_uc'),)

class RolePermission(Base):
    __tablename__ = "role_permissions"

    id = Column(Integer, primary_key=True, index=True)
    role_id = Column(Integer, ForeignKey("roles.id", ondelete="CASCADE"), nullable=False, index=True)
    permission = Column(String(100), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    role = relationship("Role", back_populates="permissions")

    # Unique constraint to prevent duplicate role-permission assignments
    __table_args__ = (UniqueConstraint('role_id', 'permission', name='_role_permission_uc'),)

class UserRolePermission(Base):
    __tablename__ = "user_role_permissions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    permission = Column(String(100), nullable=False)
    granted = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="permissions")

    # Unique constraint to prevent duplicate user-permission assignments
    __table_args__ = (UniqueConstraint('user_id', 'permission', name='_user_permission_uc'),)

class ProviderAccess(Base):
    __tablename__ = "provider_access"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    provider = Column(String(32), nullable=False)
    has_access = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    user = relationship("User", back_populates="provider_access")

    # Unique constraint to prevent duplicate user-provider assignments
    __table_args__ = (UniqueConstraint('user_id', 'provider', name='_user_provider_uc'),)

class Prompt(Base):
    __tablename__ = "prompts"

    id = Column(String(64), primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    category = Column(String(100), index=True)
    command = Column(Text, nullable=False)
    cloud_provider = Column(String(32), index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    is_system = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="prompts")
    favorites = relationship("FavoritePrompt", back_populates="prompt", cascade="all, delete-orphan")

class FavoritePrompt(Base):
    __tablename__ = "favorite_prompts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    prompt_id = Column(String(64), ForeignKey("prompts.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="favorite_prompts")
    prompt = relationship("Prompt", back_populates="favorites")

    # Unique constraint to prevent duplicate user-prompt favorites
    __table_args__ = (UniqueConstraint('user_id', 'prompt_id', name='_user_prompt_uc'),)

class ProviderConfig(Base):
    __tablename__ = "provider_configs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    provider = Column(String(32), nullable=False)
    config = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    user = relationship("User", back_populates="provider_configs")

    # Unique constraint to prevent duplicate user-provider configurations
    __table_args__ = (UniqueConstraint('user_id', 'provider', name='_user_provider_config_uc'),)

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    url = Column(Text, nullable=False)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    user = relationship("User", back_populates="documents")

class ChatThread(Base):
    __tablename__ = "chat_threads"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255))
    cloud_provider = Column(String(32), index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="chat_threads")
    messages = relationship("ChatMessage", back_populates="thread", cascade="all, delete-orphan")

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    thread_id = Column(Integer, ForeignKey("chat_threads.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(20), nullable=False)  # 'user' or 'assistant'
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    thread = relationship("ChatThread", back_populates="messages")


class GcpSettings(Base):
    __tablename__ = "gcp_settings"

    id = Column(Integer, primary_key=True, index=True)
    session_endpoint = Column(String(255), nullable=False)
    agent_run_endpoint = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    def __repr__(self):
        return f"<GcpSettings(id={self.id}, session_endpoint='{self.session_endpoint}', agent_run_endpoint='{self.agent_run_endpoint}', is_active={self.is_active})>"

class ApiLog(Base):
    __tablename__ = "api_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    log_type = Column(String(50), nullable=False)  # 'request', 'response', 'error', etc.
    provider = Column(String(50), nullable=False)  # 'aws', 'gcp', etc.
    session_id = Column(String(255), nullable=True)
    endpoint = Column(String(255), nullable=True)
    request_data = Column(JSON, nullable=True)
    response_data = Column(JSON, nullable=True)
    status_code = Column(Integer, nullable=True)
    duration_ms = Column(Integer, nullable=True)
    error_message = Column(Text, nullable=True)
    
    def __repr__(self):
        return f"<ApiLog(id={self.id}, timestamp='{self.timestamp}', type='{self.log_type}', provider='{self.provider}')>"

class NavigationItem(Base):
    __tablename__ = "navigation_items"

    id = Column(String(50), primary_key=True, index=True)
    title = Column(String(100), nullable=False)
    path = Column(String(255), nullable=False)
    tooltip = Column(String(255), nullable=True)
    position = Column(String(20), nullable=False)  # 'sidebar' or 'bottom'
    order = Column(Integer, nullable=False, default=0)
    is_enabled = Column(Boolean, default=True)
    required_role = Column(String(50), nullable=True)  # Role required to see this item
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    # Relationships
    user_permissions = relationship("UserNavigationPermission", back_populates="navigation_item", cascade="all, delete-orphan")


class UserNavigationPermission(Base):
    __tablename__ = "user_navigation_permissions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    nav_item_id = Column(String(50), ForeignKey("navigation_items.id", ondelete="CASCADE"), nullable=False, index=True)
    is_enabled = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="navigation_permissions")
    navigation_item = relationship("NavigationItem", back_populates="user_permissions")

class AwsSettings(Base):
    __tablename__ = "aws_settings"

    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(String(50), nullable=False)
    agent_alias_id = Column(String(50), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
