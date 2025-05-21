# backend/create_tables.py
import sys
import os

# No path manipulation needed if run from backend directory

# Import necessary components using absolute imports
import logging
logger = logging.getLogger(__name__)
logger.info("Importing database components...")
from database import Base, engine # Changed from .database
logger.info("Importing models...")
# Import all models to ensure they are registered with Base.metadata
import models # Changed from .models or relative import

logger.info("Creating database tables...")
try:
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created successfully (if they didn't exist).")
except Exception as e:
    logger.error(f"An error occurred during table creation: {e}")
