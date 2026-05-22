import os
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List

try:
    from pydantic_settings import BaseSettings, SettingsConfigDict
except ModuleNotFoundError:
    BaseSettings = None
    SettingsConfigDict = None


# ==========================================
# PATHS
# ==========================================
BASE_DIR = Path(__file__).resolve().parents[2]
PROJECT_ROOT = BASE_DIR.parent
FRONTEND_DIR = PROJECT_ROOT / "frontend"
DEFINITIONS_DIR = BASE_DIR / "app" / "definitions"

ENV_FILE = BASE_DIR / ".env"

DEFAULT_DATABASE_URL = (
    f"sqlite:///{(BASE_DIR / 'prompt_generator.db').as_posix()}"
)
DEFAULT_ALLOWED_ORIGINS = (
    "http://127.0.0.1:5500,"
    "http://localhost:5500,"
    "http://127.0.0.1:8000,"
    "http://localhost:8000"
)


# ==========================================
# FALLBACK ENV PARSER
# ==========================================
def load_env_file() -> Dict[str, str]:
    if not ENV_FILE.exists():
        return {}

    values: Dict[str, str] = {}

    for raw_line in ENV_FILE.read_text(
        encoding="utf-8"
    ).splitlines():

        line = raw_line.strip()

        if (
            not line
            or line.startswith("#")
            or "=" not in line
        ):
            continue

        key, value = line.split("=", 1)

        values[key.strip()] = (
            value.strip()
            .strip('"')
            .strip("'")
        )

    return values


def cast_env_value(value: str, default: Any) -> Any:
    if isinstance(default, bool):
        return value.lower() in {
            "1",
            "true",
            "yes",
            "on",
        }

    if isinstance(default, int):
        return int(value)

    return value


# ==========================================
# FALLBACK SETTINGS
# ==========================================
class FallbackSettings:
    APP_NAME: str = "AI Prompt Generator"

    ENVIRONMENT: str = "development"

    SECRET_KEY: str = "change-me-in-production"

    ALGORITHM: str = "HS256"

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    DATABASE_URL: str = DEFAULT_DATABASE_URL

    OPENROUTER_API_KEY: str = ""

    OPENROUTER_MODEL: str = "openrouter/free"

    USE_MOCK_LLM: bool = False

    ALLOWED_ORIGINS: str = DEFAULT_ALLOWED_ORIGINS

    AUTH_USERNAME: str = ""

    AUTH_PASSWORD_HASH: str = ""

    BASE_DIR: Path = BASE_DIR

    PROJECT_ROOT: Path = PROJECT_ROOT

    FRONTEND_DIR: Path = FRONTEND_DIR

    DEFINITIONS_DIR: Path = DEFINITIONS_DIR

    def __init__(self):
        env_values = load_env_file()

        for key, default in self.defaults().items():
            raw_value = os.getenv(
                key,
                env_values.get(key)
            )

            value = (
                cast_env_value(raw_value, default)
                if raw_value is not None
                else default
            )

            setattr(self, key, value)

    @classmethod
    def defaults(cls) -> Dict[str, Any]:
        return {
            key: value
            for key, value in cls.__dict__.items()
            if key.isupper()
        }

    @property
    def origins(self) -> List[str]:
        return [
            origin.strip()
            for origin in self.ALLOWED_ORIGINS.split(",")
            if origin.strip()
        ]


# ==========================================
# PYDANTIC SETTINGS
# ==========================================
if BaseSettings and SettingsConfigDict:

    class Settings(BaseSettings):
        APP_NAME: str = "AI Prompt Generator"

        ENVIRONMENT: str = "development"

        SECRET_KEY: str = "change-me-in-production"

        ALGORITHM: str = "HS256"

        ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

        DATABASE_URL: str = DEFAULT_DATABASE_URL

        OPENROUTER_API_KEY: str = ""

        OPENROUTER_MODEL: str = "openrouter/free"

        USE_MOCK_LLM: bool = False

        ALLOWED_ORIGINS: str = DEFAULT_ALLOWED_ORIGINS

        AUTH_USERNAME: str = ""

        AUTH_PASSWORD_HASH: str = ""

        BASE_DIR: Path = BASE_DIR

        PROJECT_ROOT: Path = PROJECT_ROOT

        FRONTEND_DIR: Path = FRONTEND_DIR

        DEFINITIONS_DIR: Path = DEFINITIONS_DIR

        model_config = SettingsConfigDict(
            env_file=str(ENV_FILE),
            case_sensitive=True,
            extra="ignore",
        )

        @property
        def origins(self) -> List[str]:
            return [
                origin.strip()
                for origin in self.ALLOWED_ORIGINS.split(",")
                if origin.strip()
            ]

else:
    Settings = FallbackSettings


# ==========================================
# CACHED SETTINGS INSTANCE
# ==========================================
@lru_cache
def get_settings():
    return Settings()


settings = get_settings()
