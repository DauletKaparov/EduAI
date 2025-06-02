from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field, EmailStr
from datetime import datetime
from bson import ObjectId

# Custom ObjectId field for Pydantic
class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate
        
    @classmethod
    def validate(cls, v, info=None):
        if not ObjectId.is_valid(v):
            if info:
                info.fail('Invalid ObjectId')
            else:
                raise ValueError("Invalid objectid")
        return ObjectId(v)
        
    @classmethod
    def __get_pydantic_json_schema__(cls, _core_schema, field_schema):
        field_schema.update(type="string")
        return field_schema

# Base model
class MongoBaseModel(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    
    model_config = {
        "validate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str}
    }

# Subject models
class SubjectBase(BaseModel):
    name: str
    description: str
    source: str = "EduAI"

class SubjectCreate(SubjectBase):
    metadata: Dict[str, Any] = Field(default_factory=dict)

class SubjectInDB(MongoBaseModel, SubjectBase):
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Subject(SubjectInDB):
    pass

# Topic models
class TopicBase(BaseModel):
    name: str
    description: str
    subject_id: str
    difficulty: float = 5.0
    source: str = "EduAI"

class TopicCreate(TopicBase):
    prerequisites: List[str] = Field(default_factory=list)
    source_url: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)

class TopicInDB(MongoBaseModel, TopicBase):
    prerequisites: List[str] = Field(default_factory=list)
    source_url: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Topic(TopicInDB):
    pass

# Content models
class ContentBase(BaseModel):
    topic_id: str
    type: str  # explanation, example, resource, etc.
    title: str
    body: str
    source: str = "EduAI"
    difficulty: float = 5.0

class ContentCreate(ContentBase):
    source_url: Optional[str] = None
    key_terms: List[str] = Field(default_factory=list)
    readability: Dict[str, float] = Field(default_factory=dict)
    metadata: Dict[str, Any] = Field(default_factory=dict)

class ContentInDB(MongoBaseModel, ContentBase):
    source_url: Optional[str] = None
    key_terms: List[str] = Field(default_factory=list)
    readability: Dict[str, float] = Field(default_factory=dict)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Content(ContentInDB):
    pass

# Question models
class QuestionBase(BaseModel):
    topic_id: str
    text: str
    correct_answer: str
    explanation: str
    difficulty: float = 5.0
    source: str = "EduAI"

class QuestionCreate(QuestionBase):
    content_id: Optional[str] = None
    options: List[str] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    source_url: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)

class QuestionInDB(MongoBaseModel, QuestionBase):
    content_id: Optional[str] = None
    options: List[str] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    source_url: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Question(QuestionInDB):
    pass

# User models
class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str
    preferences: Dict[str, Any] = Field(default_factory=dict)

class UserInDB(MongoBaseModel, UserBase):
    password_hash: str
    preferences: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class User(BaseModel):
    id: str
    username: str
    email: EmailStr
    preferences: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    updated_at: datetime

# Auth models
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# Progress models
class ProgressBase(BaseModel):
    user_id: str
    topic_id: str
    mastery_level: float = 0.0
    questions_answered: int = 0
    correct_answers: int = 0

class ProgressCreate(ProgressBase):
    metadata: Dict[str, Any] = Field(default_factory=dict)

class ProgressInDB(MongoBaseModel, ProgressBase):
    last_accessed: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Progress(ProgressInDB):
    pass
