from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Threat Model API"
    GITHUB_TOKEN: str = ""
    GITHUB_REPO: str = ""
    
    class Config:
        env_file = ".env"

settings = Settings()
