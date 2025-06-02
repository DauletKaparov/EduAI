import os
from pymongo import MongoClient
from datetime import datetime
from dotenv import load_dotenv
import sys
sys.path.append('/Users/dauletkaparov/Desktop/MVP2/backend')
from app.utils.auth import get_password_hash

# Load environment variables
load_dotenv()

# MongoDB connection settings
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017')
DB_NAME = os.getenv('DB_NAME', 'eduai_db')

# Connect to MongoDB
client = MongoClient(MONGO_URI)
db = client[DB_NAME]

# Admin user details
admin_username = 'admin'
admin_password = 'admin'
admin_email = 'admin@example.com'

# Check if admin user already exists
existing_user = db.users.find_one({'username': admin_username})
if existing_user:
    print(f'User {admin_username} already exists.')
    sys.exit(0)

# Create admin user
hashed_password = get_password_hash(admin_password)
current_time = datetime.utcnow()

admin_user = {
    'username': admin_username,
    'email': admin_email,
    'password_hash': hashed_password,
    'preferences': {
        'knowledge_level': 5.0,
        'prefer_explanations': 0.6,
        'prefer_examples': 0.3,
        'prefer_resources': 0.1,
        'prefer_length': 0.5
    },
    'created_at': current_time,
    'updated_at': current_time
}

# Insert into database
result = db.users.insert_one(admin_user)

print(f'Admin user created with ID: {result.inserted_id}')
