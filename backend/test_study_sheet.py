import os
import asyncio
from pymongo import MongoClient
from datetime import datetime
from bson import ObjectId
import sys
sys.path.append('/Users/dauletkaparov/Desktop/MVP2/backend')
from app.ai.content_generator import ContentGenerator
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# MongoDB connection settings
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017')
DB_NAME = os.getenv('DB_NAME', 'eduai_db')

# Connect to MongoDB
client = MongoClient(MONGO_URI)
db = client[DB_NAME]

# Initialize content generator
content_generator = ContentGenerator()

async def list_topics():
    print('Available Topics:')
    topics = list(db.topics.find())
    
    if not topics:
        print('No topics found in the database')
        return None
    
    for i, topic in enumerate(topics):
        print(f"{i+1}. {topic.get('name')} (ID: {topic.get('_id')})"
            f" - Subject: {topic.get('subject_name', 'Unknown')}"
        )
    
    return topics

async def get_content_for_topic(topic_id):
    # Convert to ObjectId if string
    if isinstance(topic_id, str):
        topic_id = ObjectId(topic_id)
    
    # Find content for this topic
    contents = list(db.contents.find({'topic_id': str(topic_id)}))
    print(f'Found {len(contents)} content items for topic')
    return contents

async def generate_study_sheet(topic_id, knowledge_level=5.0):
    print(f'Generating study sheet for topic ID: {topic_id} with knowledge level: {knowledge_level}')
    
    # Get contents for this topic
    contents = await get_content_for_topic(topic_id)
    
    if not contents:
        print('No content available for this topic')
        return
    
    # Generate study sheet
    study_sheet = await content_generator.generate_study_sheet(
        topic_id=str(topic_id),
        user_knowledge_level=knowledge_level,
        contents=contents
    )
    
    print('\n' + '='*50)
    print(f"Study Sheet: {study_sheet.get('title', 'No Title')}\n")
    
    for section in study_sheet.get('sections', []):
        print(f"## {section.get('title')}\n")
        print(f"{section.get('content')}\n")
        print('-'*50)
    
    # Save to file
    with open('study_sheet_output.md', 'w') as f:
        f.write(f"# {study_sheet.get('title', 'Study Sheet')}\n\n")
        for section in study_sheet.get('sections', []):
            f.write(f"## {section.get('title')}\n\n")
            f.write(f"{section.get('content')}\n\n")
    
    print(f"\nStudy sheet saved to 'study_sheet_output.md'\n")

async def main():
    topics = await list_topics()
    
    if not topics:
        return
    
    # For demo purposes, we'll use the first topic
    selected_topic = topics[0]
    topic_id = selected_topic.get('_id')
    
    print(f"\nSelected topic: {selected_topic.get('name')} (ID: {topic_id})\n")
    
    # Generate study sheet with medium knowledge level
    await generate_study_sheet(topic_id, knowledge_level=5.0)

# Run the main function
if __name__ == '__main__':
    asyncio.run(main())
