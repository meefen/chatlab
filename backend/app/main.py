from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
import time
import logging

from .config import settings
from .database import create_tables
from .api import auth, users, characters, conversations, ai

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="ChatLab API",
    description="Multi-character educational theorist chat application",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(TrustedHostMiddleware, allowed_hosts=["*"])

@app.middleware("http")
async def log_requests(request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    
    if request.url.path.startswith("/api"):
        logger.info(f"{request.method} {request.url.path} {response.status_code} in {process_time:.4f}s")
    
    return response

@app.on_event("startup")
async def startup_event():
    await create_tables()
    logger.info("Database tables created")

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(users.router, tags=["users"])
app.include_router(characters.router, prefix="/api/characters", tags=["characters"])
app.include_router(conversations.router, prefix="/api/conversations", tags=["conversations"])
app.include_router(ai.router, prefix="/api/ai", tags=["ai"])

@app.get("/")
async def root():
    return {"message": "ChatLab API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}