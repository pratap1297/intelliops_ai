import psycopg2
import os
from dotenv import load_dotenv
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

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

def init_navigation_items():
    """Initialize the navigation_items table with default values"""
    try:
        # Get database connection details from environment variables
        db_url = os.getenv("DATABASE_URL")
        if not db_url:
            logger.error("DATABASE_URL environment variable is not set")
            return
        
        # Parse the database URL
        # Format: postgresql://username:password@host:port/database
        parts = db_url.split('://', 1)[1].split('@')
        user_pass = parts[0].split(':')
        host_port_db = parts[1].split('/')
        host_port = host_port_db[0].split(':')
        
        username = user_pass[0]
        password = user_pass[1]
        host = host_port[0]
        port = host_port[1] if len(host_port) > 1 else '5432'
        database = host_port_db[1]
        
        # Connect to the database
        conn = psycopg2.connect(
            host=host,
            port=port,
            database=database,
            user=username,
            password=password
        )
        conn.autocommit = True
        cursor = conn.cursor()
        
        # Check if the navigation_items table exists - using parameterized query
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = %s 
                AND table_name = %s
            );
        """, ('public', 'navigation_items'))
        table_exists = cursor.fetchone()[0]
        
        if not table_exists:
            logger.info("navigation_items table does not exist. Creating it...")
            # Using a safer approach with table name as a parameter
            table_name = 'navigation_items'
            create_table_sql = """
                CREATE TABLE %s (
                    id VARCHAR(50) PRIMARY KEY,
                    title VARCHAR(100) NOT NULL,
                    path VARCHAR(255) NOT NULL,
                    tooltip VARCHAR(255),
                    position VARCHAR(20) NOT NULL,
                    "order" INTEGER NOT NULL DEFAULT 0,
                    is_enabled BOOLEAN DEFAULT TRUE,
                    required_role VARCHAR(50),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            """
            cursor.execute(create_table_sql % psycopg2.extensions.AsIs(table_name))
            logger.info("navigation_items table created successfully.")
        
        # Check if the table has any data - using parameterized query
        cursor.execute("SELECT COUNT(*) FROM %s;" % psycopg2.extensions.AsIs('navigation_items'))
        count = cursor.fetchone()[0]
        
        if count == 0:
            logger.info("Populating navigation_items table with default data...")
            
            # Insert default navigation items
            for item in DEFAULT_NAV_ITEMS:
                cursor.execute("""
                    INSERT INTO navigation_items 
                    (id, title, path, tooltip, position, "order", is_enabled, required_role) 
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s);
                """, (
                    item["id"],
                    item["title"],
                    item["path"],
                    item["tooltip"],
                    item["position"],
                    item["order"],
                    item["is_enabled"],
                    item["required_role"]
                ))
            
            logger.info("Added %s default navigation items to the database.", len(DEFAULT_NAV_ITEMS))
        else:
            logger.info("navigation_items table already has %s records. Skipping initialization.", count)
        
        # Close the connection
        cursor.close()
        conn.close()
        
    except Exception as e:
        logger.error("Error initializing navigation items: %s", str(e))
        # Don't expose full error details in production
        if os.getenv("ENVIRONMENT", "development").lower() != "production":
            logger.debug("Detailed error: %s", repr(e))

if __name__ == "__main__":
    init_navigation_items()
