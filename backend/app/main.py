from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, subjects, topics, contents, questions, users, ai_generator, test_endpoints
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
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:8000",
    "http://localhost:8001",
    "http://localhost:8002",
    "http://localhost:8003",
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
app.include_router(test_endpoints.router)  # Already has prefix set in router definition

@app.on_event("startup")
async def startup():
    """Create database indexes on startup"""
    create_indexes()

@app.get("/", tags=["Root"])
async def root():
    return {"message": "Welcome to EduAI API"}

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8003))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
