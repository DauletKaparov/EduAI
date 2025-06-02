import os
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# MongoDB connection settings
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017')
DB_NAME = os.getenv('DB_NAME', 'eduai_db')

# Connect to MongoDB
client = MongoClient(MONGO_URI)
db = client[DB_NAME]

# Look for admin user
admin_user = db.users.find_one({'username': 'admin'})

if admin_user:
    print('Admin user found:')
    print(f'Username: {admin_user.get("username")}')
    print(f'Email: {admin_user.get("email")}')
    print(f'Has password_hash: {"password_hash" in admin_user}')
    if "password_hash" in admin_user:
        print(f'Password hash: {admin_user["password_hash"][:20]}...')
    print(f'Created at: {admin_user.get("created_at")}')
else:
    print('Admin user not found in the database')
