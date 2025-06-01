import os
from dotenv import load_dotenv
from pymongo import MongoClient

# Load environment variables
load_dotenv()

# Get MongoDB URI from environment
mongo_uri = os.getenv("MONGO_URI")
db_name = os.getenv("DB_NAME")

print(f"Attempting to connect to MongoDB database: {db_name}")

# Create client and connect
client = MongoClient(mongo_uri)

try:
    # The ismaster command is cheap and does not require auth
    client.admin.command('ping')
    print("MongoDB connection successful!")
    
    # Get a handle to the eduai_db database
    db = client[db_name]
    
    # List all collections
    collections = db.list_collection_names()
    print(f"Existing collections: {collections}")
    
    print("MongoDB setup complete and ready for EduAI platform!")
except Exception as e:
    print(f"MongoDB connection failed: {e}")
