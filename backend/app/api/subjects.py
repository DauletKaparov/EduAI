from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Any
from app.schemas.models import Subject, SubjectCreate, SubjectInDB
from app.utils.auth import get_current_user
from app.database import subjects_collection
from bson import ObjectId
from datetime import datetime

router = APIRouter()

@router.get("/", response_model=List[Subject])
async def read_subjects() -> Any:
    """
    Retrieve all subjects
    """
    subjects = await subjects_collection.find().to_list(1000)
    return subjects

@router.get("/{subject_id}", response_model=Subject)
async def read_subject(subject_id: str) -> Any:
    """
    Get a specific subject by id
    """
    if not ObjectId.is_valid(subject_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid subject ID format"
        )
    
    subject = await subjects_collection.find_one({"_id": ObjectId(subject_id)})
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found"
        )
    return subject

@router.post("/", response_model=Subject)
async def create_subject(subject: SubjectCreate, current_user: Any = Depends(get_current_user)) -> Any:
    """
    Create a new subject (requires authentication)
    """
    # Create new subject with timestamp
    now = datetime.utcnow()
    subject_dict = subject.dict()
    subject_dict["created_at"] = now
    subject_dict["updated_at"] = now
    
    # Insert into database
    result = await subjects_collection.insert_one(subject_dict)
    
    # Get the created subject
    created_subject = await subjects_collection.find_one({"_id": result.inserted_id})
    return created_subject

@router.put("/{subject_id}", response_model=Subject)
async def update_subject(
    subject_id: str, 
    subject_update: SubjectCreate,
    current_user: Any = Depends(get_current_user)
) -> Any:
    """
    Update a subject (requires authentication)
    """
    if not ObjectId.is_valid(subject_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid subject ID format"
        )
    
    # Check if subject exists
    subject = await subjects_collection.find_one({"_id": ObjectId(subject_id)})
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found"
        )
    
    # Update subject
    subject_dict = subject_update.dict()
    subject_dict["updated_at"] = datetime.utcnow()
    
    await subjects_collection.update_one(
        {"_id": ObjectId(subject_id)},
        {"$set": subject_dict}
    )
    
    # Get updated subject
    updated_subject = await subjects_collection.find_one({"_id": ObjectId(subject_id)})
    return updated_subject

@router.delete("/{subject_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_subject(
    subject_id: str,
    current_user: Any = Depends(get_current_user)
) -> None:
    """
    Delete a subject (requires authentication)
    """
    if not ObjectId.is_valid(subject_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid subject ID format"
        )
    
    # Check if subject exists
    subject = await subjects_collection.find_one({"_id": ObjectId(subject_id)})
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found"
        )
    
    # Delete subject
    await subjects_collection.delete_one({"_id": ObjectId(subject_id)})
    return None
