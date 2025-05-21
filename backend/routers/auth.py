from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.orm import Session
from datetime import timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext

# Create password context directly in this file to avoid circular imports
pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")

# Define password verification function directly
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

from .. import crud, models, schemas, utils
from ..database import get_db
from ..dependencies import create_access_token, get_current_active_user, get_current_user

router = APIRouter(
    prefix="/auth",
    tags=["auth"],
)

ACCESS_TOKEN_EXPIRE_MINUTES = 30 # Or load from config

@router.post("/register", response_model=schemas.User)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)

@router.post("/login")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Get user by email
    user = crud.get_user_by_email(db, email=form_data.username) # Use email as username
    
    # Check if user exists and password is correct
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if user is active (not soft deleted)
    if not user.is_active:
        print(f"[login] Login attempt by deactivated user: {user.email}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account has been deactivated. Please contact an administrator.",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    # Generate access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    # Return both token and user information for frontend convenience
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "is_admin": user.is_admin,
            "is_authenticated": True
        }
    }

# Add password reset endpoints later

@router.post("/refresh", response_model=schemas.Token)
def refresh_token(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Create a new access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": current_user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}
