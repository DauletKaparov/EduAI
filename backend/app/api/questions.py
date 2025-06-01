from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Any, Optional
from app.schemas.models import Question, QuestionCreate, QuestionInDB
from app.utils.auth import get_current_user
from app.database import questions_collection, topics_collection, contents_collection
from bson import ObjectId
from datetime import datetime

router = APIRouter()

@router.get("/", response_model=List[Question])
async def read_questions(
    topic_id: Optional[str] = Query(None, description="Filter questions by topic ID"),
    content_id: Optional[str] = Query(None, description="Filter questions by content ID"),
    difficulty: Optional[float] = Query(None, description="Filter by difficulty level")
) -> Any:
    """
    Retrieve questions, optionally filtered by topic, content, and difficulty
    """
    query = {}
    if topic_id:
        if not ObjectId.is_valid(topic_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid topic ID format"
            )
        query["topic_id"] = topic_id
        
    if content_id:
        if not ObjectId.is_valid(content_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid content ID format"
            )
        query["content_id"] = content_id
        
    if difficulty is not None:
        query["difficulty"] = difficulty
        
    questions = await questions_collection.find(query).to_list(1000)
    return questions

@router.get("/{question_id}", response_model=Question)
async def read_question(question_id: str) -> Any:
    """
    Get a specific question by id
    """
    if not ObjectId.is_valid(question_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid question ID format"
        )
    
    question = await questions_collection.find_one({"_id": ObjectId(question_id)})
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    return question

@router.post("/", response_model=Question)
async def create_question(question: QuestionCreate, current_user: Any = Depends(get_current_user)) -> Any:
    """
    Create a new question (requires authentication)
    """
    # Validate topic_id exists
    if not ObjectId.is_valid(question.topic_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid topic ID format"
        )
        
    topic = await topics_collection.find_one({"_id": ObjectId(question.topic_id)})
    if not topic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Topic not found"
        )
    
    # Validate content_id if provided
    if question.content_id:
        if not ObjectId.is_valid(question.content_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid content ID format"
            )
            
        content = await contents_collection.find_one({"_id": ObjectId(question.content_id)})
        if not content:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Content not found"
            )
    
    # Create new question with timestamp
    now = datetime.utcnow()
    question_dict = question.dict()
    question_dict["created_at"] = now
    question_dict["updated_at"] = now
    
    # Insert into database
    result = await questions_collection.insert_one(question_dict)
    
    # Get the created question
    created_question = await questions_collection.find_one({"_id": result.inserted_id})
    return created_question

@router.put("/{question_id}", response_model=Question)
async def update_question(
    question_id: str, 
    question_update: QuestionCreate,
    current_user: Any = Depends(get_current_user)
) -> Any:
    """
    Update a question (requires authentication)
    """
    if not ObjectId.is_valid(question_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid question ID format"
        )
    
    # Check if question exists
    question = await questions_collection.find_one({"_id": ObjectId(question_id)})
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    
    # Validate topic_id exists
    if not ObjectId.is_valid(question_update.topic_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid topic ID format"
        )
        
    topic = await topics_collection.find_one({"_id": ObjectId(question_update.topic_id)})
    if not topic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Topic not found"
        )
    
    # Update question
    question_dict = question_update.dict()
    question_dict["updated_at"] = datetime.utcnow()
    
    await questions_collection.update_one(
        {"_id": ObjectId(question_id)},
        {"$set": question_dict}
    )
    
    # Get updated question
    updated_question = await questions_collection.find_one({"_id": ObjectId(question_id)})
    return updated_question

@router.delete("/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_question(
    question_id: str,
    current_user: Any = Depends(get_current_user)
) -> None:
    """
    Delete a question (requires authentication)
    """
    if not ObjectId.is_valid(question_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid question ID format"
        )
    
    # Check if question exists
    question = await questions_collection.find_one({"_id": ObjectId(question_id)})
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    
    # Delete question
    await questions_collection.delete_one({"_id": ObjectId(question_id)})
    return None
