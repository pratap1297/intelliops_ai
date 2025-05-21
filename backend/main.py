from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
import os
import logging
import time
from dotenv import load_dotenv
from .database import engine, Base
from . import models
from .routers import auth, prompts, settings, chat, documents, roles, user_roles, chat_threads, favorite_prompts, users, provider_access, navigation, debug
from .aws_services.bedrock_client import router as aws_bedrock_router
from .aws_services.settings import router as aws_settings_router
from .gcp_services.settings import router as gcp_settings_router
from .routers.gcp_chat import router as gcp_chat_router
from .routers.gcp_simple import router as gcp_simple_router
from .routers.logs import router as logs_router
from .init_navigation import initialize_navigation

# Configure logging with rotating file handler
import sys
from logging.handlers import RotatingFileHandler

# Ensure logs directory exists
log_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'logs')
os.makedirs(log_dir, exist_ok=True)
log_file = os.path.join(log_dir, 'backend.log')

# Create formatters and handlers
log_format = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
formatter = logging.Formatter(log_format)

# Rotating file handler
file_handler = RotatingFileHandler(
    filename=log_file,
    maxBytes=10*1024*1024,  # 10MB
    backupCount=5,
    encoding='utf-8'
)
file_handler.setFormatter(formatter)
file_handler.setLevel(logging.INFO)

# Console handler
console_handler = logging.StreamHandler(sys.stdout)
console_handler.setFormatter(formatter)
console_handler.setLevel(logging.INFO)

# Get the root logger and remove any existing handlers
root_logger = logging.getLogger()
for handler in root_logger.handlers[:]: # Remove any existing handlers
    root_logger.removeHandler(handler)

# Add our handlers and set level
root_logger.addHandler(file_handler)
root_logger.addHandler(console_handler)
root_logger.setLevel(logging.INFO)

# Create module logger
logger = logging.getLogger(__name__)

# Also configure uvicorn's logger
uvicorn_logger = logging.getLogger("uvicorn")
uvicorn_logger.handlers = []  # Remove default handlers
uvicorn_logger.addHandler(file_handler)
uvicorn_logger.addHandler(console_handler)

# Load environment variables
load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create database tables
    logger.info("Starting application initialization...")
    try:
        # Database initialization
        try:
            # Base.metadata.drop_all(bind=engine) # Uncomment to drop tables on startup (for development)
            models.Base.metadata.create_all(bind=engine) # Use the imported models module
            logger.info("Database tables created successfully.")
        except Exception as db_error:
            logger.error(f"Error creating database tables: {db_error}", exc_info=True)
            # Continue application startup even if database initialization fails
            # This allows the application to start with limited functionality
            logger.warning("Application will start with limited database functionality")
        
        # Initialize navigation items
        try:
            initialize_navigation()
            logger.info("Navigation items initialized successfully.")
        except Exception as nav_error:
            logger.error(f"Error initializing navigation items: {nav_error}", exc_info=True)
            logger.warning("Application will start with default navigation")
        
        # Check AWS credentials
        aws_access_key = os.getenv("AWS_ACCESS_KEY_ID")
        aws_secret_key = os.getenv("AWS_SECRET_ACCESS_KEY")
        if not aws_access_key or not aws_secret_key:
            logger.warning("AWS credentials not found in environment variables. AWS services may not function properly.")
        
        logger.info("Application initialization completed successfully")
    except Exception as e:
        logger.error(f"Unexpected error during application initialization: {e}", exc_info=True)
        logger.warning("Application will start with limited functionality")
        # We don't re-raise the exception to allow the application to start
    
    yield
    
    # Shutdown: Add cleanup logic here if needed
    logger.info("Shutting down application...")

app = FastAPI(
    title="IntelliOps AI Backend",
    description="API for managing IntelliOps AI data and operations.",
    version="0.1.0",
    lifespan=lifespan # Use the lifespan context manager
)

# Get CORS origins from environment variables
# Default to localhost origins if not specified
default_origins = "http://localhost,http://localhost:5173,http://localhost:8080,http://127.0.0.1:5173,http://127.0.0.1:8080"
cors_origins_str = os.getenv("CORS_ORIGINS", default_origins)

# Split the comma-separated string into a list
origins = cors_origins_str.split(",")

# Log the origins for debugging
logger.info(f"CORS origins configured: {origins}")

# Request logging middleware
from fastapi import status
from fastapi.responses import JSONResponse
from jose import JWTError

@app.middleware("http")
async def auth_error_middleware(request: Request, call_next):
    try:
        response = await call_next(request)
        # Check if it's an auth error response
        if response.status_code == status.HTTP_401_UNAUTHORIZED:
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={
                    "detail": {
                        "message": "Session expired",
                        "code": "TOKEN_EXPIRED"
                    }
                },
                headers={
                    "WWW-Authenticate": "Bearer",
                    "X-Error-Type": "token_expired"
                }
            )
        return response
    except JWTError as e:
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={
                "detail": {
                    "message": "Session expired",
                    "code": "TOKEN_EXPIRED"
                }
            },
            headers={
                "WWW-Authenticate": "Bearer",
                "X-Error-Type": "token_expired"
            }
        )

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    
    # Get request details
    method = request.method
    url = str(request.url)
    client_host = request.client.host if request.client else "unknown"
    
    # Log the incoming request
    logger.info(f"Request: {method} {url} from {client_host}")
    
    # Process the request
    try:
        response = await call_next(request)
        process_time = time.time() - start_time
        
        # Log the response status and timing
        status_code = response.status_code
        logger.info(f"Response: {status_code} for {method} {url} - Took {process_time:.3f}s")
        
        # Add custom header with processing time
        response.headers["X-Process-Time"] = str(process_time)
        
        # Log detailed info for 4xx and 5xx responses to help with debugging
        if status_code >= 400:
            logger.warning(f"Error response {status_code} for {method} {url}")
        
        return response
    except Exception as e:
        # Log exceptions
        process_time = time.time() - start_time
        logger.error(f"Error processing {method} {url}: {str(e)} - Took {process_time:.3f}s")
        raise

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(prompts.router, prefix="/api")
app.include_router(settings.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(documents.router, prefix="/api")
app.include_router(roles.router, prefix="/api")
app.include_router(user_roles.router, prefix="/api")
app.include_router(chat_threads.router, prefix="/api")
app.include_router(favorite_prompts.router, prefix="/api")
app.include_router(debug.router, prefix="/api")
app.include_router(provider_access.router, prefix="/api")
app.include_router(navigation.router, prefix="/api")
app.include_router(aws_bedrock_router, prefix="/api")
app.include_router(aws_settings_router, prefix="/api")
app.include_router(gcp_settings_router)  # No prefix, full path in route definition
app.include_router(gcp_chat_router)  # No prefix, full path in route definition
app.include_router(gcp_simple_router)  # Already working correctly
app.include_router(logs_router)  # No prefix, full path in route definition
# app.include_router(settings.router, prefix="/api")

# Mount static files directory
try:
    app.mount("/static", StaticFiles(directory="backend/static"), name="static")
    logger.info("Static files directory mounted successfully")
except Exception as e:
    logger.error(f"Error mounting static files directory: {e}")

@app.get("/", tags=["Root"])
def read_root():
    return {"message": "Welcome to IntelliOps AI Backend"}

@app.get("/test-gcp", tags=["Test"])
def test_gcp_endpoint():
    logger.info("Test GCP endpoint called")
    return {"status": "ok", "message": "Test GCP endpoint is working"}

@app.get("/aws-bedrock-test", tags=["AWS Bedrock"])
async def aws_bedrock_test():
    """Serve the AWS Bedrock test HTML page"""
    return FileResponse("backend/static/aws_bedrock.html")

@app.get("/aws-settings-page", tags=["AWS Settings"])
async def aws_settings_page():
    """Serve the AWS Settings HTML page"""
    return FileResponse("backend/static/aws_settings.html")

from fastapi import Depends
from sqlalchemy.orm import Session
from .database import get_db

from sqlalchemy import text

@app.get("/api/health", tags=["Health"])
def health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok", "backend": "FastAPI", "database": "PostgreSQL"}
    except Exception as e:
        return {"status": "error", "detail": str(e)}

