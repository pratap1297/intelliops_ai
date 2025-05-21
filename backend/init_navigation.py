from sqlalchemy.orm import Session
from .models import NavigationItem
from .database import get_db
import logging

# Configure logger
logger = logging.getLogger(__name__)

# Default navigation items that match the frontend configuration
DEFAULT_NAV_ITEMS = [
    {
        "id": "new-chat",
        "title": "New Chat",
        "path": "/chat",
        "tooltip": "Start a new conversation",
        "position": "sidebar",
        "order": 10,
        "is_enabled": True,
        "required_role": None
    },
    {
        "id": "chat-history",
        "title": "Chat History",
        "path": "/chat/history",
        "tooltip": "Browse saved conversations",
        "position": "sidebar",
        "order": 20,
        "is_enabled": True,
        "required_role": None
    },
    {
        "id": "infrastructure",
        "title": "Infrastructure",
        "path": "/infrastructure",
        "tooltip": "Manage cloud infrastructure",
        "position": "sidebar",
        "order": 30,
        "is_enabled": True,
        "required_role": None
    },
    {
        "id": "prompt-library",
        "title": "Prompt Library",
        "path": "/prompt-library",
        "tooltip": "Access saved prompts & templates",
        "position": "sidebar",
        "order": 40,
        "is_enabled": True,
        "required_role": None
    },
    {
        "id": "logs",
        "title": "System Logs",
        "path": "/logs",
        "tooltip": "View system activity logs",
        "position": "sidebar",
        "order": 50,
        "is_enabled": True,
        "required_role": None
    },
    {
        "id": "security",
        "title": "Security",
        "path": "/security",
        "tooltip": "Manage security & permissions",
        "position": "sidebar",
        "order": 60,
        "is_enabled": True,
        "required_role": "admin"
    },
    {
        "id": "notifications",
        "title": "Notifications",
        "path": "/notifications",
        "tooltip": "View alerts & notifications",
        "position": "sidebar",
        "order": 70,
        "is_enabled": True,
        "required_role": None
    },
    {
        "id": "finops",
        "title": "FinOps",
        "path": "/finops",
        "tooltip": "Monitor cloud costs & usage",
        "position": "sidebar",
        "order": 80,
        "is_enabled": True,
        "required_role": "admin"
    },
    {
        "id": "settings",
        "title": "Settings",
        "path": "/settings",
        "tooltip": "Configure application settings",
        "position": "bottom",
        "order": 10,
        "is_enabled": True,
        "required_role": None
    },
    {
        "id": "profile",
        "title": "Profile",
        "path": "/profile",
        "tooltip": "Manage your profile",
        "position": "bottom",
        "order": 20,
        "is_enabled": True,
        "required_role": None
    },
    {
        "id": "admin",
        "title": "Admin",
        "path": "/admin",
        "tooltip": "Admin dashboard",
        "position": "bottom",
        "order": 30,
        "is_enabled": True,
        "required_role": "admin"
    },
    {
        "id": "backend-test",
        "title": "API Test",
        "path": "/backend-test",
        "tooltip": "Test backend API endpoints",
        "position": "bottom",
        "order": 40,
        "is_enabled": True,
        "required_role": "admin"
    }
]

def init_navigation_items(db: Session):
    """Initialize the navigation_items table with default values"""
    # Check if we already have navigation items
    existing_count = db.query(NavigationItem).count()
    if existing_count > 0:
        logger.info(f"Navigation items already exist ({existing_count} items found). Skipping initialization.")
        return
    
    logger.info("Initializing navigation items...")
    
    # Create navigation items
    for item_data in DEFAULT_NAV_ITEMS:
        nav_item = NavigationItem(
            id=item_data["id"],
            title=item_data["title"],
            path=item_data["path"],
            tooltip=item_data["tooltip"],
            position=item_data["position"],
            order=item_data["order"],
            is_enabled=item_data["is_enabled"],
            required_role=item_data["required_role"]
        )
        db.add(nav_item)
    
    # Commit the changes
    db.commit()
    logger.info(f"Added {len(DEFAULT_NAV_ITEMS)} default navigation items to the database")

# Function to run during application startup
def initialize_navigation():
    """Initialize navigation items during application startup"""
    db = next(get_db())
    try:
        init_navigation_items(db)
    finally:
        db.close()
