import argparse
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from auth.utils.auth_utils import get_password_hash
from core.config_loader import settings
from core.database import Base
from user.models.user import User


def setup_library(username, email, password):
    """Set up the library database with an initial admin user"""
    DATABASE_URL = f"postgresql://{settings.POSTGRESQL_USERNAME}:{settings.POSTGRESQL_PASSWORD}@{settings.POSTGRESQL_SERVER}:{settings.POSTGRESQL_PORT}/{settings.POSTGRESQL_DATABASE}"
    
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    # Create all tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    # Create admin user
    db = SessionLocal()
    password_hash = get_password_hash(password)
    
    # Check if user already exists
    user = db.query(User).filter(User.email == email).first()
    if user:
        print(f"User with email {email} already exists.")
        return
    
    # Create new admin user
    new_user = User(
        username=username,
        email=email,
        password=password_hash,
        is_active=True
    )
    
    db.add(new_user)
    db.commit()
    print(f"Admin user '{username}' created successfully!")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Set up the Wild Branch Library with an initial admin user")
    parser.add_argument("--username", required=True, help="Admin username")
    parser.add_argument("--email", required=True, help="Admin email")
    parser.add_argument("--password", required=True, help="Admin password")
    
    args = parser.parse_args()
    
    setup_library(args.username, args.email, args.password)