import os
import asyncio
from pymongo import MongoClient
from passlib.context import CryptContext
from dotenv import load_dotenv
import sys
sys.path.append('/Users/dauletkaparov/Desktop/MVP2/backend')

# Load environment variables
load_dotenv()

# MongoDB connection settings
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017')
DB_NAME = os.getenv('DB_NAME', 'eduai_db')

# Connect to MongoDB
client = MongoClient(MONGO_URI)
db = client[DB_NAME]

# Password context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    try:
        result = pwd_context.verify(plain_password, hashed_password)
        print(f'Password verification result: {result}')
        return result
    except Exception as e:
        print(f'Error verifying password: {str(e)}')
        return False

async def test_admin_login():
    # Get admin user from database
    admin_user = db.users.find_one({"username": "admin"})
    
    if not admin_user:
        print('Admin user not found in database')
        return
    
    print(f'Testing login for user: {admin_user["username"]}')
    
    # Test password verification
    plain_password = 'admin'
    password_hash = admin_user.get('password_hash')
    
    if not password_hash:
        print('No password hash found for admin user')
        return
    
    # Verify password
    is_password_correct = verify_password(plain_password, password_hash)
    
    if is_password_correct:
        print('✅ Authentication successful')
    else:
        print('❌ Authentication failed')
        print('This explains why login is failing in the application')

# Run the test
asyncio.run(test_admin_login())
