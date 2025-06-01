from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Any, Optional
from app.schemas.models import Content, ContentCreate, ContentInDB
from app.utils.auth import get_current_user
from app.database import contents_collection, topics_collection
from bson import ObjectId
from datetime import datetime

router = APIRouter()

@router.get("/", response_model=List[Content])
async def read_contents(
    topic_id: Optional[str] = Query(None, description="Filter contents by topic ID"),
    content_type: Optional[str] = Query(None, description="Filter by content type (explanation, example, resource)")
) -> Any:
    """
    Retrieve contents, optionally filtered by topic and type
    """
    query = {}
    if topic_id:
        if not ObjectId.is_valid(topic_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid topic ID format"
            )
        query["topic_id"] = topic_id
        
    if content_type:
        query["type"] = content_type
        
    contents = await contents_collection.find(query).to_list(1000)
    return contents

@router.get("/{content_id}", response_model=Content)
async def read_content(content_id: str) -> Any:
    """
    Get a specific content by id
    """
    if not ObjectId.is_valid(content_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid content ID format"
        )
    
    content = await contents_collection.find_one({"_id": ObjectId(content_id)})
    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content not found"
        )
    return content

@router.post("/", response_model=Content)
async def create_content(content: ContentCreate, current_user: Any = Depends(get_current_user)) -> Any:
    """
    Create new educational content (requires authentication)
    """
    # Validate topic_id exists
    if not ObjectId.is_valid(content.topic_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid topic ID format"
        )
        
    topic = await topics_collection.find_one({"_id": ObjectId(content.topic_id)})
    if not topic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Topic not found"
        )
    
    # Validate content type
    valid_types = ["explanation", "example", "resource", "practice"]
    if content.type not in valid_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Content type must be one of {valid_types}"
        )
    
    # Create new content with timestamp
    now = datetime.utcnow()
    content_dict = content.dict()
    content_dict["created_at"] = now
    content_dict["updated_at"] = now
    
    # Insert into database
    result = await contents_collection.insert_one(content_dict)
    
    # Get the created content
    created_content = await contents_collection.find_one({"_id": result.inserted_id})
    return created_content

@router.put("/{content_id}", response_model=Content)
async def update_content(
    content_id: str, 
    content_update: ContentCreate,
    current_user: Any = Depends(get_current_user)
) -> Any:
    """
    Update content (requires authentication)
    """
    if not ObjectId.is_valid(content_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid content ID format"
        )
    
    # Check if content exists
    content = await contents_collection.find_one({"_id": ObjectId(content_id)})
    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content not found"
        )
    
    # Validate topic_id exists
    if not ObjectId.is_valid(content_update.topic_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid topic ID format"
        )
        
    topic = await topics_collection.find_one({"_id": ObjectId(content_update.topic_id)})
    if not topic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Topic not found"
        )
    
    # Update content
    content_dict = content_update.dict()
    content_dict["updated_at"] = datetime.utcnow()
    
    await contents_collection.update_one(
        {"_id": ObjectId(content_id)},
        {"$set": content_dict}
    )
    
    # Get updated content
    updated_content = await contents_collection.find_one({"_id": ObjectId(content_id)})
    return updated_content

@router.delete("/{content_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_content(
    content_id: str,
    current_user: Any = Depends(get_current_user)
) -> None:
    """
    Delete content (requires authentication)
    """
    if not ObjectId.is_valid(content_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid content ID format"
        )
    
    # Check if content exists
    content = await contents_collection.find_one({"_id": ObjectId(content_id)})
    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content not found"
        )
    
    # Delete content
    await contents_collection.delete_one({"_id": ObjectId(content_id)})
    return None
