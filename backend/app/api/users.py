from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Any, Dict
from app.schemas.models import User, UserCreate, UserInDB, Progress, ProgressCreate
from app.utils.auth import get_current_user, get_password_hash
from app.database import users_collection, progress_collection
from bson import ObjectId
from datetime import datetime

router = APIRouter()

@router.get("/me/progress", response_model=List[Progress])
async def read_user_progress(
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get current user's learning progress
    """
    progress = await progress_collection.find(
        {"user_id": str(current_user.id)}
    ).to_list(1000)
    return progress

@router.post("/me/progress", response_model=Progress)
async def update_user_progress(
    progress: ProgressCreate,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Update user's learning progress for a topic
    """
    # Ensure user_id matches current user
    if progress.user_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User ID does not match authenticated user"
        )
    
    # Check if progress record exists
    existing_progress = await progress_collection.find_one({
        "user_id": progress.user_id,
        "topic_id": progress.topic_id
    })
    
    now = datetime.utcnow()
    progress_dict = progress.dict()
    progress_dict["last_accessed"] = now
    
    if existing_progress:
        # Update existing progress
        progress_dict["created_at"] = existing_progress.get("created_at", now)
        progress_dict["updated_at"] = now
        
        await progress_collection.update_one(
            {"_id": existing_progress["_id"]},
            {"$set": progress_dict}
        )
        
        updated_progress = await progress_collection.find_one({"_id": existing_progress["_id"]})
        return updated_progress
    else:
        # Create new progress record
        progress_dict["created_at"] = now
        progress_dict["updated_at"] = now
        
        result = await progress_collection.insert_one(progress_dict)
        created_progress = await progress_collection.find_one({"_id": result.inserted_id})
        return created_progress

@router.put("/me", response_model=User)
async def update_user(
    user_update: Dict[str, Any],
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Update current user's information
    """
    allowed_fields = ["username", "email", "preferences"]
    update_data = {k: v for k, v in user_update.items() if k in allowed_fields}
    
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid fields to update"
        )
    
    # Check if username is being updated and is unique
    if "username" in update_data and update_data["username"] != current_user.username:
        existing_user = await users_collection.find_one({"username": update_data["username"]})
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
    
    # Check if email is being updated and is unique
    if "email" in update_data and update_data["email"] != current_user.email:
        existing_user = await users_collection.find_one({"email": update_data["email"]})
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
    
    # Update user
    update_data["updated_at"] = datetime.utcnow()
    
    await users_collection.update_one(
        {"_id": ObjectId(current_user.id)},
        {"$set": update_data}
    )
    
    # Get updated user
    updated_user = await users_collection.find_one({"_id": ObjectId(current_user.id)})
    
    # Return user without password
    return {
        "id": str(updated_user["_id"]),
        "username": updated_user["username"],
        "email": updated_user["email"],
        "preferences": updated_user.get("preferences", {}),
        "created_at": updated_user.get("created_at"),
        "updated_at": updated_user.get("updated_at")
    }
