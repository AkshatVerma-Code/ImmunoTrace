from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "ImmunoTrace"
    database_url: str = "sqlite:///./immunotrace.db"
    cookie_secure: bool = False
    frontend_origin: str = "http://localhost:5173"
    storage_path: str = "../storage"
    max_upload_mb: int = 15
    gemini_api_key: str | None = None
    gemini_base_url: str = "https://generativelanguage.googleapis.com/v1beta"
    gemini_model: str = "gemini-3.8-flash"

    model_config = SettingsConfigDict(env_file="../.env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
