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
    
    # Connect to the database
    connection = engine.connect()
    transaction = connection.begin()
    
    try:
        # Check if column already exists to avoid errors
        check_query = text("SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='is_active'")
        result = connection.execute(check_query)
        column_exists = result.first() is not None
        
        if not column_exists:
            print("Adding is_active column to users table...")
            # Add the is_active column with a default value of True
            alter_query = text("ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE")
            connection.execute(alter_query)
            print("Column added successfully!")
        else:
            print("Column is_active already exists in users table. Skipping.")
        
        # Commit the transaction
        transaction.commit()
        print("Migration completed successfully!")
        
    except Exception as e:
        # Rollback in case of error
        transaction.rollback()
        print(f"Error during migration: {e}")
        raise
    finally:
        # Close the connection
        connection.close()

if __name__ == "__main__":
    run_migration()
