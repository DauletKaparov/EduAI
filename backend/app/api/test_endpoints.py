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
    db = Depends(get_database)
):
    """Generate a study sheet for a topic without authentication"""
    # Get the topic
    topic = db["topics"].find_one({"_id": ObjectId(topic_id)})
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    
    # Get contents for this topic
    contents = list(db["contents"].find({"topic_id": topic_id}))
    
    if not contents:
        raise HTTPException(status_code=404, detail="No content found for this topic")
    
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
    
    return study_sheet
