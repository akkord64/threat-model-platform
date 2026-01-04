from fastapi import APIRouter
from app.api.v1.endpoints import diagrams

api_router = APIRouter()
api_router.include_router(diagrams.router, prefix="/diagrams", tags=["diagrams"])
