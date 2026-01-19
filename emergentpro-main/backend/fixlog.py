import asyncio
import os
import bcrypt
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

# 1. Load environment variables exactly like server.py
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def fix_admin_login():
    # 2. Connect to the Database
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'defense_pm')
    
    print(f"--- DIAGNOSTIC START ---")
    print(f"Target Database: '{db_name}'")
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]

    email = "admin@defense.gov"
    password = "admin123"

    # 3. Check for duplicates
    count = await db.users.count_documents({"email": email})
    print(f"Existing users with email '{email}': {count}")

    # 4. WIPE ALL matching users (fixes the duplicate issue)
    if count > 0:
        print("Cleaning up old user records...")
        await db.users.delete_many({"email": email})
        print("Old records deleted.")

    # 5. Create a fresh Admin User
    print("Creating fresh Admin user...")
    # Hash the password exactly like server.py does
    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    new_admin = {
        "id": "user-admin-001",
        "email": email,
        "name": "Col. Rajesh Kumar",
        "role": "admin",
        "clearance_level": "top_secret",
        "password_hash": hashed,
        "created_at": "2024-01-20T10:00:00+00:00"
    }
    
    await db.users.insert_one(new_admin)
    print("✅ New Admin user created.")

    # 6. Verify immediately (Simulate Login)
    print("\n--- VERIFICATION TEST ---")
    user = await db.users.find_one({"email": email})
    
    if not user:
        print("❌ CRITICAL ERROR: User was inserted but cannot be found. DB Write failed.")
        return

    stored_hash = user.get('password_hash')
    # Test the password
    is_valid = bcrypt.checkpw(password.encode('utf-8'), stored_hash.encode('utf-8'))
    
    if is_valid:
        print(f"✅ Password verification passed!")
        print(f"You can now login with:")
        print(f"Email:    {email}")
        print(f"Password: {password}")
    else:
        print(f"❌ Password verification FAILED inside script. Hashing library issue.")

    client.close()

if __name__ == "__main__":
    asyncio.run(fix_admin_login())