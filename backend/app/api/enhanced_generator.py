from fastapi import APIRouter, Depends, HTTPException, Body, Query
from typing import Optional, List, Dict, Any
from datetime import datetime
import json
import os
from bson import ObjectId
from pymongo import MongoClient
from app.database import get_database
from app.utils.auth import get_current_user
from app.schemas.models import User
from app.api.test_endpoints import generate_test_study_sheet
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# Cache directory for study sheets
CACHE_DIR = os.path.join(os.getcwd(), "cache", "study_sheets")
os.makedirs(CACHE_DIR, exist_ok=True)

async def search_textbook_content(
    topic_name: str, 
    subject_name: str,
    education_system: Optional[str] = None,
    grade: Optional[str] = None,
    db = None
) -> List[Dict[str, Any]]:
    """
    Search for relevant content in uploaded textbooks based on topic and subject.
    Returns a list of relevant text snippets.
    """
    try:
        # Find textbooks matching subject and grade if specified
        query = {}
        if subject_name:
            query["subject"] = {"$regex": subject_name, "$options": "i"}
        if grade:
            query["grade"] = {"$regex": grade, "$options": "i"}
        
        textbooks = list(db.textbooks.find(query))
        
        if not textbooks:
            logger.info(f"No textbooks found for subject '{subject_name}' and grade '{grade}'")
            return []
        
        # For each textbook, find relevant content
        relevant_content = []
        
        for textbook in textbooks:
            textbook_id = textbook["_id"]
            
            # Find content for this textbook
            content_doc = db.textbook_content.find_one({"textbook_id": textbook_id})
            
            if not content_doc or not content_doc.get("content"):
                continue
                
            # For a real implementation, we would use more sophisticated text search
            # such as embedding-based semantic search or at least proper keyword search
            # For now, we'll use a simple text match
            topic_keywords = topic_name.lower().split()
            
            for page_content in content_doc["content"]:
                content_text = page_content.get("content", "").lower()
                
                # Simple relevance scoring based on keyword presence
                relevance_score = sum(1 for keyword in topic_keywords if keyword in content_text)
                
                if relevance_score > 0:
                    relevant_content.append({
                        "textbook_title": textbook["title"],
                        "page": page_content.get("page", 0),
                        "content": page_content["content"],
                        "relevance_score": relevance_score
                    })
        
        # Sort by relevance score
        relevant_content.sort(key=lambda x: x["relevance_score"], reverse=True)
        
        # Return top 10 most relevant snippets
        return relevant_content[:10]
        
    except Exception as e:
        logger.error(f"Error searching textbook content: {str(e)}")
        return []

async def generate_enhanced_study_sheet(
    topic_id: str,
    db: MongoClient,
    knowledge_level: float = 5.0,
    education_system: Optional[str] = None,
    grade: Optional[str] = None,
    additional_info: Optional[str] = None,
    use_textbooks: bool = True
):
    """
    Generate an enhanced study sheet using textbook content and external knowledge.
    """
    try:
        # Get topic and subject information
        topic = db.topics.find_one({"_id": ObjectId(topic_id)})
        if not topic:
            logger.error(f"Topic with ID {topic_id} not found")
            raise HTTPException(status_code=404, detail="Topic not found")
            
        subject = db.subjects.find_one({"_id": ObjectId(topic.get("subject_id", ""))})
        subject_name = subject.get("name") if subject else "Unknown"
        
        topic_name = topic.get("name", "Unknown Topic")
        
        # Check cache for existing study sheet
        # Include all parameters that affect the content in the cache key
        additional_info_hash = str(hash(additional_info or '')) if additional_info else 'none'
        cache_key = f"{topic_id}_{knowledge_level}_{education_system}_{grade}_{additional_info_hash}_{use_textbooks}"
        cache_file = os.path.join(CACHE_DIR, f"{cache_key.replace(' ', '_')}.json")
        
        # Add timestamp-based cache invalidation - if cache is older than 24 hours, regenerate
        cache_exists = os.path.exists(cache_file)
        cache_is_fresh = False
        
        if cache_exists:
            cache_timestamp = os.path.getmtime(cache_file)
            cache_age_hours = (datetime.now().timestamp() - cache_timestamp) / 3600
            cache_is_fresh = cache_age_hours < 24  # Cache valid for 24 hours
            
        if cache_exists and cache_is_fresh:
            logger.info(f"Found fresh cached study sheet for {topic_name}")
            with open(cache_file, "r") as f:
                return json.load(f)
            
        logger.info(f"Generating new study sheet for {topic_name} (cache_exists={cache_exists}, fresh={cache_is_fresh})")
        
        # First, try to find relevant content from uploaded textbooks
        textbook_content = []
        if use_textbooks:
            textbook_content = await search_textbook_content(
                topic_name, 
                subject_name,
                education_system,
                grade,
                db
            )
        
        # Generate study sheet (in a real implementation, this would be more sophisticated)
        # Generate a free-form study sheet using topic information
        base_study_sheet = await generate_test_study_sheet(
            topic_id=topic_id,
            knowledge_level=knowledge_level,
            fetch_only=False,  # Always generate a new sheet
            db=db
        )
        
        # Enhance the study sheet with textbook content
        if textbook_content:
            # Add a new section for textbook references
            textbook_references = {
                "title": "Textbook References",
                "content": []
            }
            
            for idx, content in enumerate(textbook_content[:5]):  # Limit to 5 references
                textbook_references["content"].append({
                    "type": "text",
                    "text": f"From {content['textbook_title']}, Page {content['page']}:",
                    "style": "italic"
                })
                
                # Add a snippet of the content
                text_snippet = content["content"]
                if len(text_snippet) > 300:
                    text_snippet = text_snippet[:297] + "..."
                    
                textbook_references["content"].append({
                    "type": "text",
                    "text": text_snippet,
                    "style": "quote"
                })
                
                # Add a separator if not the last item
                if idx < len(textbook_content[:5]) - 1:
                    textbook_references["content"].append({
                        "type": "separator"
                    })
            
            # Add the references section to the study sheet
            if "sections" in base_study_sheet:
                base_study_sheet["sections"].append(textbook_references)
            
            # Update metadata
            if "metadata" in base_study_sheet:
                base_study_sheet["metadata"]["enhanced"] = True
                base_study_sheet["metadata"]["textbook_sources"] = len(textbook_content)
                base_study_sheet["metadata"]["education_system"] = education_system
                base_study_sheet["metadata"]["grade"] = grade
        
        # Add additional customization based on education system and grade
        if "metadata" in base_study_sheet:
            base_study_sheet["metadata"]["knowledge_level"] = knowledge_level
            if education_system:
                base_study_sheet["metadata"]["education_system"] = education_system
            if grade:
                base_study_sheet["metadata"]["grade"] = grade
            if additional_info:
                base_study_sheet["metadata"]["additional_info"] = additional_info
                
        # Cache the result
        with open(cache_file, "w") as f:
            json.dump(base_study_sheet, f)
        
        return base_study_sheet
        
    except Exception as e:
        logger.error(f"Error generating enhanced study sheet: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate study sheet: {str(e)}")

@router.post("/enhanced-study-sheet")
async def create_enhanced_study_sheet(
    topic_id: str = Body(...),
    knowledge_level: float = Body(5.0, ge=1.0, le=10.0),
    education_system: Optional[str] = Body(None),
    grade: Optional[str] = Body(None),
    additional_info: Optional[str] = Body(None),
    use_textbooks: bool = Body(True),
    user: User = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Generate an enhanced study sheet with customization options and textbook integration.
    """
    if not ObjectId.is_valid(topic_id):
        raise HTTPException(status_code=400, detail="Invalid topic ID format")
    
    # Call the generator function
    study_sheet = await generate_enhanced_study_sheet(
        topic_id=topic_id,
        db=db,
        knowledge_level=knowledge_level,
        education_system=education_system,
        grade=grade,
        additional_info=additional_info,
        use_textbooks=use_textbooks
    )
    
    # Store generation request in user history
    db.user_history.insert_one({
        "user_id": user.id,
        "action": "generate_enhanced_study_sheet",
        "topic_id": ObjectId(topic_id),
        "parameters": {
            "knowledge_level": knowledge_level,
            "education_system": education_system,
            "grade": grade,
            "use_textbooks": use_textbooks
        },
        "timestamp": datetime.utcnow()
    })
    
    return study_sheet

# Test endpoint that doesn't require authentication
@router.post("/test/enhanced-study-sheet")
async def test_enhanced_study_sheet(
    topic_id: str = Body(...),
    knowledge_level: float = Body(5.0, ge=1.0, le=10.0),
    education_system: Optional[str] = Body(None),
    grade: Optional[str] = Body(None),
    additional_info: Optional[str] = Body(None),
    use_textbooks: bool = Body(True),
    db = Depends(get_database)
):
    """
    Test endpoint for generating an enhanced study sheet without authentication.
    """
    if not ObjectId.is_valid(topic_id):
        raise HTTPException(status_code=400, detail="Invalid topic ID format")
    
    # Call the generator function
    study_sheet = await generate_enhanced_study_sheet(
        topic_id=topic_id,
        db=db,
        knowledge_level=knowledge_level,
        education_system=education_system,
        grade=grade,
        additional_info=additional_info,
        use_textbooks=use_textbooks
    )
    
    return study_sheet
