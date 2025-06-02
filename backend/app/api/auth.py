from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
from app.schemas.models import Token, UserCreate, User
from app.utils.auth import authenticate_user, create_access_token, get_password_hash, ACCESS_TOKEN_EXPIRE_MINUTES, get_current_user
from app.database import users_collection
from typing import Any

router = APIRouter()

@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user = await authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/register", response_model=User)
async def register_user(user: UserCreate) -> Any:
    """
    Register a new user
    """
    # Check if username already exists
    if await users_collection.find_one({"username": user.username}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Check if email already exists
    if await users_collection.find_one({"email": user.email}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    current_time = datetime.utcnow()
    db_user = {
        "username": user.username,
        "email": user.email,
        "password_hash": hashed_password,
        "preferences": user.preferences,
        "created_at": current_time,
        "updated_at": current_time
    }
    
    # Insert into database
    result = await users_collection.insert_one(db_user)
    
    # Get the created user
    created_user = await users_collection.find_one({"_id": result.inserted_id})
    
    # Return user without password
    return {
        "id": str(created_user["_id"]),
        "username": created_user["username"],
        "email": created_user["email"],
        "preferences": created_user["preferences"],
        "created_at": created_user.get("created_at"),
        "updated_at": created_user.get("updated_at")
    }

@router.get("/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)) -> Any:
    """
    Get current user
    """
    return {
        "id": str(current_user.id),
        "username": current_user.username,
        "email": current_user.email,
        "preferences": current_user.preferences,
        "created_at": current_user.created_at,
        "updated_at": current_user.updated_at
    }
