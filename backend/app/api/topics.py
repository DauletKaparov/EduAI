from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Any, Optional
from app.schemas.models import Topic, TopicCreate, TopicInDB
from app.utils.auth import get_current_user
from app.database import topics_collection, subjects_collection
from bson import ObjectId
from datetime import datetime

router = APIRouter()

@router.get("/", response_model=List[Topic])
async def read_topics(
    subject_id: Optional[str] = Query(None, description="Filter topics by subject ID")
) -> Any:
    """
    Retrieve topics, optionally filtered by subject
    """
    query = {}
    if subject_id:
        if not ObjectId.is_valid(subject_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid subject ID format"
            )
        query["subject_id"] = subject_id
        
    topics = await topics_collection.find(query).to_list(1000)
    return topics

@router.get("/{topic_id}", response_model=Topic)
async def read_topic(topic_id: str) -> Any:
    """
    Get a specific topic by id
    """
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
    return topic

@router.post("/", response_model=Topic)
async def create_topic(topic: TopicCreate, current_user: Any = Depends(get_current_user)) -> Any:
    """
    Create a new topic (requires authentication)
    """
    # Validate subject_id exists
    if not ObjectId.is_valid(topic.subject_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid subject ID format"
        )
        
    subject = await subjects_collection.find_one({"_id": ObjectId(topic.subject_id)})
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found"
        )
    
    # Create new topic with timestamp
    now = datetime.utcnow()
    topic_dict = topic.dict()
    topic_dict["created_at"] = now
    topic_dict["updated_at"] = now
    
    # Insert into database
    result = await topics_collection.insert_one(topic_dict)
    
    # Get the created topic
    created_topic = await topics_collection.find_one({"_id": result.inserted_id})
    return created_topic

@router.put("/{topic_id}", response_model=Topic)
async def update_topic(
    topic_id: str, 
    topic_update: TopicCreate,
    current_user: Any = Depends(get_current_user)
) -> Any:
    """
    Update a topic (requires authentication)
    """
    if not ObjectId.is_valid(topic_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid topic ID format"
        )
    
    # Check if topic exists
    topic = await topics_collection.find_one({"_id": ObjectId(topic_id)})
    if not topic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Topic not found"
        )
    
    # Validate subject_id exists
    if not ObjectId.is_valid(topic_update.subject_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid subject ID format"
        )
        
    subject = await subjects_collection.find_one({"_id": ObjectId(topic_update.subject_id)})
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found"
        )
    
    # Update topic
    topic_dict = topic_update.dict()
    topic_dict["updated_at"] = datetime.utcnow()
    
    await topics_collection.update_one(
        {"_id": ObjectId(topic_id)},
        {"$set": topic_dict}
    )
    
    # Get updated topic
    updated_topic = await topics_collection.find_one({"_id": ObjectId(topic_id)})
    return updated_topic

@router.delete("/{topic_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_topic(
    topic_id: str,
    current_user: Any = Depends(get_current_user)
) -> None:
    """
    Delete a topic (requires authentication)
    """
    if not ObjectId.is_valid(topic_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid topic ID format"
        )
    
    # Check if topic exists
    topic = await topics_collection.find_one({"_id": ObjectId(topic_id)})
    if not topic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Topic not found"
        )
    
    # Delete topic
    await topics_collection.delete_one({"_id": ObjectId(topic_id)})
    return None
