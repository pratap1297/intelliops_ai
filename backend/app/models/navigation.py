from sqlalchemy import Column, String, Integer, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class NavigationItem(Base):
    """Model for navigation items in the system"""
    __tablename__ = "navigation_items"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    path = Column(String, nullable=False)
    tooltip = Column(String, nullable=True)
    position = Column(String, nullable=False)  # 'sidebar' or 'bottom'
    order = Column(Integer, nullable=False, default=0)
    is_enabled = Column(Boolean, nullable=False, default=True)
    required_role = Column(String, nullable=True)  # Role required to see this item

    # Relationships
    user_permissions = relationship("UserNavigationPermission", back_populates="navigation_item")


class UserNavigationPermission(Base):
    """Model for user-specific navigation permissions"""
    __tablename__ = "user_navigation_permissions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    nav_item_id = Column(String, ForeignKey("navigation_items.id"), nullable=False)
    is_enabled = Column(Boolean, nullable=False, default=True)

    # Relationships
    user = relationship("User", back_populates="navigation_permissions")
    navigation_item = relationship("NavigationItem", back_populates="user_permissions")
