from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, subjects, topics, contents, questions, users, ai_generator
from app.database import create_indexes

# Create FastAPI app
app = FastAPI(
    title="EduAI API",
    description="API for personalized educational content platform",
    version="0.1.0"
)

# Configure CORS
origins = [
    "http://localhost:3000",
    "http://localhost:8000",
    "https://eduai-platform.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(subjects.router, prefix="/api/subjects", tags=["Subjects"])
app.include_router(topics.router, prefix="/api/topics", tags=["Topics"])
app.include_router(contents.router, prefix="/api/contents", tags=["Contents"])
app.include_router(questions.router, prefix="/api/questions", tags=["Questions"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(ai_generator.router, prefix="/api/generate", tags=["AI Generator"])

@app.on_event("startup")
async def startup():
    """Create database indexes on startup"""
    create_indexes()

@app.get("/", tags=["Root"])
async def root():
    return {"message": "Welcome to EduAI API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
