from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form, status
from fastapi.responses import JSONResponse
from typing import Optional
from datetime import datetime
import os
import shutil
import uuid
from pymongo import MongoClient
from bson import ObjectId
from app.database import get_database
from app.utils.auth import get_current_user
from app.schemas.models import User
import pypdf

router = APIRouter()

# Create textbooks directory if it doesn't exist
UPLOAD_DIR = os.path.join(os.getcwd(), "uploads", "textbooks")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Function to extract text from PDF files
def extract_text_from_pdf(file_path: str):
    try:
        text_content = []
        with open(file_path, 'rb') as file:
            pdf_reader = pypdf.PdfReader(file)
            num_pages = len(pdf_reader.pages)
            
            for page_num in range(num_pages):
                page = pdf_reader.pages[page_num]
                text = page.extract_text()
                if text:
                    text_content.append({
                        "page": page_num + 1,
                        "content": text
                    })
        
        return text_content, num_pages
    except Exception as e:
        print(f"Error extracting text from PDF: {str(e)}")
        return [], 0

# Process textbook and extract knowledge
async def process_textbook(textbook_id: str, db: MongoClient):
    try:
        # Get textbook record
        textbook = db.textbooks.find_one({"_id": ObjectId(textbook_id)})
        if not textbook:
            print(f"Textbook with ID {textbook_id} not found")
            return
        
        file_path = textbook.get("file_path")
        if not file_path or not os.path.exists(file_path):
            print(f"File not found at path: {file_path}")
            db.textbooks.update_one(
                {"_id": ObjectId(textbook_id)},
                {"$set": {"status": "error", "error_message": "File not found"}}
            )
            return
        
        # Extract text based on file type
        file_extension = os.path.splitext(file_path)[1].lower()
        text_content = []
        num_pages = 0
        
        if file_extension == '.pdf':
            text_content, num_pages = extract_text_from_pdf(file_path)
        elif file_extension in ['.txt', '.text']:
            with open(file_path, 'r', encoding='utf-8') as file:
                content = file.read()
                text_content = [{"page": 1, "content": content}]
                num_pages = 1
        elif file_extension in ['.docx', '.doc']:
            # For simplicity, we'll just acknowledge that DOCX handling would be implemented here
            # This would typically use a library like python-docx
            text_content = [{"page": 1, "content": "DOCX processing would be implemented here"}]
            num_pages = 1
        
        # Store extracted content in database
        db.textbook_content.insert_one({
            "textbook_id": ObjectId(textbook_id),
            "content": text_content,
            "processed_at": datetime.utcnow()
        })
        
        # Update textbook status
        db.textbooks.update_one(
            {"_id": ObjectId(textbook_id)},
            {
                "$set": {
                    "status": "processed",
                    "pages_processed": num_pages,
                    "processed_at": datetime.utcnow()
                }
            }
        )
        
        print(f"Successfully processed textbook {textbook_id} with {num_pages} pages")
        
        # Index the content for future retrieval
        # This would involve more sophisticated text processing in a real implementation
        # For now, we're just storing the raw text
        
    except Exception as e:
        print(f"Error processing textbook {textbook_id}: {str(e)}")
        db.textbooks.update_one(
            {"_id": ObjectId(textbook_id)},
            {"$set": {"status": "error", "error_message": str(e)}}
        )

@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_textbook(
    file: UploadFile = File(...),
    title: str = Form(...),
    subject: str = Form(...),
    grade: str = Form(...),
    description: str = Form(""),
    user: User = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Upload a textbook file (PDF, DOCX, TXT) and process it for use in study sheet generation.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    # Validate file extension
    file_extension = os.path.splitext(file.filename)[1].lower()
    if file_extension not in ['.pdf', '.docx', '.doc', '.txt']:
        raise HTTPException(status_code=400, detail="Unsupported file format. Please upload PDF, DOCX, or TXT files")
    
    # Create unique filename
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_location = os.path.join(UPLOAD_DIR, unique_filename)
    
    try:
        # Save uploaded file
        with open(file_location, "wb+") as file_object:
            shutil.copyfileobj(file.file, file_object)
            
        # Create textbook record in database
        textbook_id = db.textbooks.insert_one({
            "title": title,
            "subject": subject,
            "grade": grade,
            "description": description,
            "filename": file.filename,
            "file_path": file_location,
            "uploaded_by": user.id,
            "uploaded_at": datetime.utcnow(),
            "status": "processing",
            "file_size": os.path.getsize(file_location),
        }).inserted_id
        
        # Process textbook in background (in a real app, this would be a background task)
        await process_textbook(str(textbook_id), db)
        
        return {
            "id": str(textbook_id),
            "title": title,
            "subject": subject,
            "grade": grade,
            "description": description,
            "filename": file.filename,
            "uploaded_at": datetime.utcnow().isoformat(),
            "status": "processing"
        }
        
    except Exception as e:
        if os.path.exists(file_location):
            os.remove(file_location)
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")

@router.get("/")
async def get_textbooks(
    user: User = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Get a list of all textbooks uploaded by the user.
    """
    textbooks = list(db.textbooks.find({"uploaded_by": user.id}))
    
    for textbook in textbooks:
        textbook["_id"] = str(textbook["_id"])
        # Don't expose file path
        if "file_path" in textbook:
            del textbook["file_path"]
    
    return textbooks

@router.get("/{textbook_id}")
async def get_textbook(
    textbook_id: str,
    user: User = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Get details for a specific textbook.
    """
    if not ObjectId.is_valid(textbook_id):
        raise HTTPException(status_code=400, detail="Invalid textbook ID")
    
    textbook = db.textbooks.find_one({"_id": ObjectId(textbook_id)})
    
    if not textbook:
        raise HTTPException(status_code=404, detail="Textbook not found")
    
    # Check if user has access to this textbook
    if str(textbook.get("uploaded_by")) != str(user.id):
        raise HTTPException(status_code=403, detail="You don't have permission to access this textbook")
    
    textbook["_id"] = str(textbook["_id"])
    # Don't expose file path
    if "file_path" in textbook:
        del textbook["file_path"]
    
    return textbook

# Test endpoint that doesn't require authentication
@router.post("/test/upload", status_code=status.HTTP_201_CREATED)
async def test_upload_textbook(
    file: UploadFile = File(...),
    title: str = Form(...),
    subject: str = Form(...),
    grade: str = Form(...),
    description: str = Form(""),
    db = Depends(get_database)
):
    """
    Test endpoint for uploading a textbook without authentication.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    # Generate mock response
    mock_id = str(uuid.uuid4())
    
    return {
        "id": mock_id,
        "title": title,
        "subject": subject,
        "grade": grade,
        "description": description,
        "filename": file.filename,
        "uploaded_at": datetime.utcnow().isoformat(),
        "status": "processing",
        "pages_processed": 0
    }
