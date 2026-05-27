import os
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Mini OntoFlow"
    openai_api_key: str = Field(default="", alias="OPENAI_API_KEY")
    openai_base_url: str = Field(default="", alias="OPENAI_BASE_URL")
    openai_model: str = Field(default="gpt-4.1-mini", alias="OPENAI_MODEL")
    mock_llm: bool = Field(default=False, alias="MOCK_LLM")

    base_dir: Path = Path(__file__).resolve().parents[1]
    data_dir: Path = base_dir / "data"
    equipment_db: Path = data_dir / "equipment_demo.db"
    platform_db: Path = data_dir / "platform.db"
    ontology_seed_path: Path = base_dir / "app" / "seed" / "ontology_v2.json"

    class Config:
        env_file = ".env"
        populate_by_name = True

    def get_api_key(self) -> str:
        return self.openai_api_key or os.getenv("DASHSCOPE_API_KEY", "")


settings = Settings()
