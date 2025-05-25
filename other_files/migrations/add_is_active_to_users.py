from sqlalchemy import create_engine, Column, Boolean, MetaData, Table, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Get database URL from environment or use default
database_url = os.getenv("DATABASE_URL", "postgresql://postgres:postgres123@localhost:5432/intelliops_ai")

# Create engine and session
engine = create_engine(database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
metadata = MetaData()

def run_migration():
    print("Starting migration: Adding is_active column to users table")
    
    # Define table and column names as variables for clarity and security
    table_name = "users"
    column_name = "is_active"
    
    # Connect to the database
    connection = engine.connect()
    transaction = connection.begin()
    
    try:
        # Check if column already exists to avoid errors - using parameterized query
        check_query = text("SELECT column_name FROM information_schema.columns WHERE table_name=:table AND column_name=:column")
        result = connection.execute(check_query, {"table": "users", "column": "is_active"})
        column_exists = result.first() is not None
        
        if not column_exists:
            print("Adding is_active column to users table...")
            # Add the is_active column with a default value of True - using parameterized query
            alter_query = text("ALTER TABLE :table ADD COLUMN :column BOOLEAN DEFAULT TRUE")
            connection.execute(alter_query, {"table": "users", "column": "is_active"})
            print("Column added successfully!")
        else:
            print("Column is_active already exists in users table. Skipping.")
        
        # Commit the transaction
        transaction.commit()
        print("Migration completed successfully!")
        
    except Exception as e:
        # Rollback the transaction in case of error
        transaction.rollback()
        # Use safer error reporting that doesn't expose full error details in production
        if os.getenv("ENVIRONMENT", "development").lower() == "production":
            print("Error occurred during migration. Check logs for details.")
        else:
            print(f"Error: {e}")
        raise
    finally:
        # Close the connection
        connection.close()

if __name__ == "__main__":
    run_migration()
