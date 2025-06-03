from pymongo import MongoClient
from bson import ObjectId
import os
from dotenv import load_dotenv
import json

# Load .env file
load_dotenv('/Users/dauletkaparov/Desktop/MVP2/backend/.env')

# Get MongoDB connection string from environment
MONGODB_URL = os.getenv('MONGODB_URL')
print(f"Connecting to MongoDB...")

# Connect to MongoDB
client = MongoClient(MONGODB_URL)
db = client['eduai_db']

# Check the problematic topic
problem_topic_id = '683c28374a2585cf8cee0ed8'
print(f"\nChecking topic with ID: {problem_topic_id}")

try:
    # Check if ID is valid
    if not ObjectId.is_valid(problem_topic_id):
        print(f"Invalid ObjectId format: {problem_topic_id}")
    else:
        # Get topic from database
        topic = db['topics'].find_one({'_id': ObjectId(problem_topic_id)})
        if topic:
            # Convert ObjectId to string for printing
            topic['_id'] = str(topic['_id'])
            print(f"Topic found: {json.dumps(topic, indent=2)}")
            
            # Check contents for this topic
            contents = list(db['contents'].find({'topic_id': problem_topic_id}))
            print(f"Found {len(contents)} content items for this topic")
            
            if len(contents) == 0:
                print("No content items found for this topic - this is the likely cause of the error")
        else:
            print(f"Topic not found with ID: {problem_topic_id}")
except Exception as e:
    print(f"Error checking topic: {str(e)}")

# For comparison, check a working topic
working_topic_id = '683c1595d29b7268315d3c60'
print(f"\nChecking working topic with ID: {working_topic_id}")
try:
    working_topic = db['topics'].find_one({'_id': ObjectId(working_topic_id)})
    if working_topic:
        working_topic['_id'] = str(working_topic['_id'])
        print(f"Working topic found: {json.dumps(working_topic, indent=2)}")
        
        # Check contents for working topic
        working_contents = list(db['contents'].find({'topic_id': working_topic_id}))
        print(f"Found {len(working_contents)} content items for working topic")
    else:
        print(f"Working topic not found with ID: {working_topic_id}")
except Exception as e:
    print(f"Error checking working topic: {str(e)}")
