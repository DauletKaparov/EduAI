from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import JSONResponse
from typing import Optional, List, Dict, Any
from bson import ObjectId
import asyncio

from ..database import get_database
from ..ai.content_generator import ContentGenerator

# Import our SimpleContentGenerator as fallback
import sys
sys.path.append('/Users/dauletkaparov/Desktop/MVP2/backend')
from simple_study_sheet import SimpleContentGenerator

router = APIRouter(
    prefix="/api/test",
    tags=["test"],
    responses={404: {"description": "Not found"}}
)

@router.get("/subjects")
async def list_subjects(db = Depends(get_database)):
    """
    List all subjects without requiring authentication.
    For testing purposes only.
    """
    subjects = list(db["subjects"].find())
    
    # Convert ObjectId to string for each subject
    for subject in subjects:
        subject["_id"] = str(subject["_id"])
    
    return subjects

@router.get("/topics")
async def list_topics(db = Depends(get_database)):
    """List all available topics without authentication"""
    topics = list(db["topics"].find())
    for topic in topics:
        topic["_id"] = str(topic["_id"])
    return topics

@router.get("/studysheet/{topic_id}")
async def generate_test_study_sheet(
    topic_id: str,
    knowledge_level: float = Query(5.0, ge=1.0, le=10.0),
    fetch_only: bool = Query(False),
    db = Depends(get_database)
):
    """Generate a study sheet for a topic without authentication"""
    try:
        # Validate the topic_id first
        if not ObjectId.is_valid(topic_id):
            raise HTTPException(status_code=400, detail="Invalid topic ID format")
            
        # Get the topic
        topic = db["topics"].find_one({"_id": ObjectId(topic_id)})
        if not topic:
            raise HTTPException(status_code=404, detail="Topic not found")
        
        # Get contents for this topic
        contents = list(db["contents"].find({"topic_id": topic_id}))
        
        if not contents:
            raise HTTPException(status_code=404, detail="No content found for this topic")
    except Exception as e:
        # Log the specific error for debugging
        import traceback
        print(f"Error processing request for topic {topic_id}: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")
    
    try:
        # If fetch_only is True, try to get an existing study sheet first
        if fetch_only:
            # Check if a study sheet already exists for this topic
            existing_study_sheet = db["study_sheets"].find_one({"topic_id": topic_id})
            if existing_study_sheet:
                # Convert ObjectId to string
                existing_study_sheet["_id"] = str(existing_study_sheet["_id"])
                return existing_study_sheet
        
        try:
            # Try to use the original ContentGenerator
            content_generator = ContentGenerator()
            study_sheet = await content_generator.generate_study_sheet(
                topic_id=topic_id,
                user_knowledge_level=knowledge_level,
                contents=contents
            )
        except Exception as e:
            # If that fails, use our SimpleContentGenerator
            print(f"Using fallback generator due to error: {str(e)}")
            simple_generator = SimpleContentGenerator()
            study_sheet = await simple_generator.generate_study_sheet(
                topic_id=topic_id,
                user_knowledge_level=knowledge_level,
                contents=contents
            )
    except Exception as e:
        # Log any errors during study sheet generation
        import traceback
        print(f"Error generating study sheet for topic {topic_id}: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error generating study sheet: {str(e)}")
        
    # Final result block with error handling
    try:
        # Store the generated study sheet in the database for future fetching
        try:
            # Add created_at timestamp if not present
            if "created_at" not in study_sheet:
                from datetime import datetime
                study_sheet["created_at"] = datetime.now().isoformat()
            
            # Remove _id if present (to avoid issues with insert)
            if "_id" in study_sheet:
                del study_sheet["_id"]
                
            # Insert the new study sheet
            db["study_sheets"].insert_one(study_sheet)
        except Exception as e:
            print(f"Failed to store study sheet: {str(e)}")
            # Continue even if storage fails - we still want to return the generated sheet
        
        # Make sure topic_id is a string in the response
        if "topic_id" in study_sheet and not isinstance(study_sheet["topic_id"], str):
            study_sheet["topic_id"] = str(study_sheet["topic_id"])
            
        return study_sheet
    except Exception as e:
        # Final catch-all error handling
        import traceback
        print(f"Error in final processing of study sheet: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error finalizing study sheet: {str(e)}")
