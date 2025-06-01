import os
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.database import Database
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# MongoDB connection settings
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "eduai_db")

# For async operations with Motor
async_client = AsyncIOMotorClient(MONGO_URI)
async_db = async_client[DB_NAME]

# For sync operations with PyMongo
sync_client = MongoClient(MONGO_URI)
sync_db = sync_client[DB_NAME]

# Collections
subjects_collection = async_db.subjects
topics_collection = async_db.topics
contents_collection = async_db.contents
questions_collection = async_db.questions
users_collection = async_db.users
progress_collection = async_db.progress

# Initialize indexes
def create_indexes():
    # Create indexes for better query performance
    sync_db.subjects.create_index("name")
    sync_db.topics.create_index("subject_id")
    sync_db.topics.create_index("name")
    sync_db.contents.create_index("topic_id")
    sync_db.contents.create_index([("title", "text"), ("body", "text")])
    sync_db.questions.create_index("topic_id")
    sync_db.users.create_index("email", unique=True)
    sync_db.users.create_index("username", unique=True)
    sync_db.progress.create_index([("user_id", 1), ("topic_id", 1)], unique=True)

# Helper to get database instance
def get_database() -> Database:
    return sync_db
