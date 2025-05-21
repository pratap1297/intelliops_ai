# Script to create an admin user in the database

import sys
import os
from sqlalchemy.orm import Session

# Add the parent directory to the path so we can import our modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import SessionLocal, engine
from backend import models, schemas, utils

def create_admin_user(email: str, password: str, name: str = "Admin"):
    """Create an admin user in the database"""
    db = SessionLocal()
    try:
        # Check if user already exists
        existing_user = db.query(models.User).filter(models.User.email == email).first()
        if existing_user:
            print(f"User with email {email} already exists.")
            # Update to admin if not already
            if not existing_user.is_admin:
                existing_user.is_admin = True
                db.commit()
                print(f"User {email} has been updated to admin status.")
            else:
                print(f"User {email} is already an admin.")
            return existing_user
        
        # Create new admin user
        hashed_password = utils.get_password_hash(password)
        db_user = models.User(
            email=email,
            name=name,
            hashed_password=hashed_password,
            is_admin=True  # Set as admin
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        print(f"Admin user {email} created successfully.")
        return db_user
    finally:
        db.close()

def create_default_roles(db: Session):
    """Create default roles if they don't exist"""
    default_roles = [
        {"name": "Admin", "description": "Full system access"},
        {"name": "User", "description": "Standard user access"},
        {"name": "Viewer", "description": "Read-only access"}
    ]
    
    for role_data in default_roles:
        existing_role = db.query(models.Role).filter(models.Role.name == role_data["name"]).first()
        if not existing_role:
            new_role = models.Role(**role_data)
            db.add(new_role)
            print(f"Created role: {role_data['name']}")
    
    db.commit()

def setup_provider_access(db: Session, user_id: int):
    """Setup default provider access for a user"""
    providers = ["aws", "azure", "gcp", "onprem"]
    
    for provider in providers:
        existing_access = db.query(models.ProviderAccess).filter(
            models.ProviderAccess.user_id == user_id,
            models.ProviderAccess.provider == provider
        ).first()
        
        if not existing_access:
            # For admin users, enable all providers by default
            db_access = models.ProviderAccess(
                user_id=user_id,
                provider=provider,
                has_access=True,
                is_active=True
            )
            db.add(db_access)
            print(f"Added {provider} access for user ID {user_id}")
    
    db.commit()

def main():
    # Create database tables if they don't exist
    models.Base.metadata.create_all(bind=engine)
    
    # Create admin user
    admin_email = "admin@intelliops.com"
    admin_password = "admin123"  # This should be changed in production
    admin_name = "Admin User"
    
    db = SessionLocal()
    try:
        # Create default roles
        create_default_roles(db)
        
        # Create admin user
        admin_user = create_admin_user(admin_email, admin_password, admin_name)
        
        # Setup provider access for admin
        setup_provider_access(db, admin_user.id)
        
        print("\nAdmin user setup complete!")
        print(f"Email: {admin_email}")
        print(f"Password: {admin_password}")
        print("\nIMPORTANT: Change this password after first login!")
    finally:
        db.close()

if __name__ == "__main__":
    main()
