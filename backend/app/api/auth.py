from fastapi import APIRouter

router = APIRouter()

@router.get("/health")
async def auth_health():
    return {"status": "Auth service healthy"}