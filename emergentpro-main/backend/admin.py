import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
import bcrypt

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def reset_admin():
    # Connect to DB
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'defense_pm')
    
    print(f"Connecting to {mongo_url} (DB: {db_name})...")
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]

    # Admin Details
    email = "admin@defense.gov"
    password = "admin123"
    
    # Delete existing admin if any
    print(f"Removing existing user: {email}...")
    await db.users.delete_one({"email": email})

    # Create new admin
    print(f"Creating fresh admin user...")
    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    new_admin = {
        "id": "user-admin-001",
        "email": email,
        "name": "Col. Rajesh Kumar",
        "role": "admin",
        "clearance_level": "top_secret",
        "department": "Command Operations",
        "rank": "Colonel",
        "can_delegate": True,
        "password_hash": password_hash,
        "created_at": "2024-01-19T10:00:00+00:00"
    }

    await db.users.insert_one(new_admin)
    print("✅ Admin user reset successfully!")
    print(f"Login with: {email} / {password}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(reset_admin())