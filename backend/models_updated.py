from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Text, DateTime, JSON, JSONB, UniqueConstraint
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
    config = Column(JSONB, nullable=False)
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
