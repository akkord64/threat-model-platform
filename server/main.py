from fastapi import FastAPI
from app.core.config import settings
from app.api.api import api_router


app = FastAPI(title=settings.PROJECT_NAME)
app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
def health_check():
    return {"status": "healthy", "engine": "online"}
