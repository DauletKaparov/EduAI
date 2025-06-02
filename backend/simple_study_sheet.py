import os
import asyncio
from pymongo import MongoClient
from datetime import datetime
from bson import ObjectId
import sys
sys.path.append('/Users/dauletkaparov/Desktop/MVP2/backend')
from dotenv import load_dotenv
import json

# Load environment variables
load_dotenv()

# MongoDB connection settings
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017')
DB_NAME = os.getenv('DB_NAME', 'eduai_db')

# Connect to MongoDB
client = MongoClient(MONGO_URI)
db = client[DB_NAME]

class SimpleContentGenerator:
    def __init__(self):
        pass
    
    async def generate_study_sheet(self, topic_id, user_knowledge_level, contents):
        """Generate a simplified study sheet based on content"""
        
        # Get the topic name
        topic = db.topics.find_one({'_id': ObjectId(topic_id)})
        topic_name = topic.get('name', 'Unknown Topic')
        
        # Filter content by type
        explanations = [c for c in contents if c.get('type') == 'explanation']
        examples = [c for c in contents if c.get('type') == 'example']
        
        # Sort content by difficulty - more appropriate for user's knowledge level first
        explanations.sort(key=lambda x: abs(x.get('difficulty', 5.0) - user_knowledge_level))
        examples.sort(key=lambda x: abs(x.get('difficulty', 5.0) - user_knowledge_level))
        
        # Create study sheet
        study_sheet = {
            'title': f'Study Sheet: {topic_name}',
            'sections': []
        }
        
        # Add introduction
        if explanations:
            intro_text = explanations[0].get('body', '')
            # Simplify the intro if it's too long
            if len(intro_text) > 500:
                intro_text = intro_text[:500] + '...'
            
            study_sheet['sections'].append({
                'title': 'Introduction',
                'content': intro_text
            })
        
        # Add key concepts from explanations
        if len(explanations) > 1:
            concepts_text = ''
            for i, exp in enumerate(explanations[1:]):
                concepts_text += f"### {exp.get('title')}\n\n"
                concepts_text += exp.get('body', '') + "\n\n"
                if i < len(explanations) - 2:  # Don't add separator after the last item
                    concepts_text += "---\n\n"
            
            study_sheet['sections'].append({
                'title': 'Key Concepts',
                'content': concepts_text
            })
        
        # Add examples section
        if examples:
            examples_text = ''
            for i, ex in enumerate(examples):
                examples_text += f"### {ex.get('title')}\n\n"
                examples_text += ex.get('body', '') + "\n\n"
                if i < len(examples) - 1:  # Don't add separator after the last item
                    examples_text += "---\n\n"
            
            study_sheet['sections'].append({
                'title': 'Examples',
                'content': examples_text
            })
        
        # Add summary section
        key_terms = []
        for exp in explanations:
            if 'key_terms' in exp:
                key_terms.extend(exp.get('key_terms', []))
        
        if key_terms:
            key_terms = list(set(key_terms))  # Remove duplicates
            terms_text = "This study sheet covered the following key terms:\n\n"
            terms_text += ", ".join([f"**{term}**" for term in key_terms])
            
            study_sheet['sections'].append({
                'title': 'Summary',
                'content': terms_text
            })
        
        return study_sheet

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
    
    # Initialize our simplified content generator
    content_generator = SimpleContentGenerator()
    
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
    
    # Also save as JSON for potential use with frontend
    with open('study_sheet_output.json', 'w') as f:
        json.dump(study_sheet, f, indent=2)
    print(f"Study sheet also saved to 'study_sheet_output.json'\n")

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
    
    print("\nNow try the second topic:\n")
    if len(topics) > 1:
        selected_topic = topics[1]
        topic_id = selected_topic.get('_id')
        print(f"Selected topic: {selected_topic.get('name')} (ID: {topic_id})\n")
        await generate_study_sheet(topic_id, knowledge_level=5.0)

# Run the main function
if __name__ == '__main__':
    asyncio.run(main())
