from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Dict, Any
from app.schemas.models import User
from app.utils.auth import get_current_user
from app.database import contents_collection, topics_collection
from app.ai.content_generator import ContentGenerator
from app.ai.personalization_engine import PersonalizationEngine
from bson import ObjectId
from datetime import datetime

router = APIRouter()

# Initialize AI components
content_generator = ContentGenerator()
personalization_engine = PersonalizationEngine()

@router.post("/studysheet")
async def generate_study_sheet(
    topic_id: str,
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Generate a personalized study sheet for a topic
    """
    # Validate topic exists
    if not ObjectId.is_valid(topic_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid topic ID format"
        )
    
    topic = await topics_collection.find_one({"_id": ObjectId(topic_id)})
    if not topic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Topic not found"
        )
    
    # Get user knowledge level from preferences
    user_knowledge_level = current_user.preferences.get("knowledge_level", 5.0)
    
    # Get content for this topic
    contents = await contents_collection.find({"topic_id": topic_id}).to_list(1000)
    
    if not contents:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No content available for this topic"
        )
    
    # Generate study sheet
    study_sheet = await content_generator.generate_study_sheet(
        topic_id=topic_id,
        user_knowledge_level=user_knowledge_level,
        contents=contents
    )
    
    # Add topic and user information
    study_sheet["topic_name"] = topic.get("name")
    study_sheet["user_id"] = str(current_user.id)
    study_sheet["username"] = current_user.username
    
    return study_sheet

@router.post("/questions")
async def generate_questions(
    topic_id: str,
    num_questions: int = Query(5, ge=1, le=20),
    current_user: User = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    """
    Generate personalized practice questions for a topic
    """
    # Validate topic exists
    if not ObjectId.is_valid(topic_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid topic ID format"
        )
    
    topic = await topics_collection.find_one({"_id": ObjectId(topic_id)})
    if not topic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Topic not found"
        )
    
    # Get user knowledge level from preferences
    user_knowledge_level = current_user.preferences.get("knowledge_level", 5.0)
    
    # Get content for this topic
    contents = await contents_collection.find({"topic_id": topic_id}).to_list(1000)
    
    if not contents:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No content available for this topic"
        )
    
    # Generate questions
    questions = content_generator.generate_personalized_questions(
        content=contents,
        user_level=user_knowledge_level,
        num_questions=num_questions
    )
    
    return questions

@router.post("/recommendations")
async def get_recommendations(
    topic_id: str = None,
    limit: int = Query(5, ge=1, le=20),
    current_user: User = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    """
    Get personalized content recommendations
    """
    # Get all content to train the recommendation engine
    query = {}
    if topic_id:
        if not ObjectId.is_valid(topic_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid topic ID format"
            )
        query["topic_id"] = topic_id
    
    all_content = await contents_collection.find(query).to_list(1000)
    
    if not all_content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No content available for recommendations"
        )
    
    # Train recommendation engine
    personalization_engine.train(all_content)
    
    # Get recommendations
    user_data = {
        "id": str(current_user.id),
        "preferences": current_user.preferences
    }
    
    recommended_ids = personalization_engine.recommend_content(
        user_data=user_data,
        n_recommendations=limit,
        topic_id=topic_id
    )
    
    # Get content details for recommended IDs
    recommendations = []
    for content_id in recommended_ids:
        content = await contents_collection.find_one({"_id": ObjectId(content_id)})
        if content:
            recommendations.append(content)
    
    return recommendations
