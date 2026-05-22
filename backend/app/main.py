from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.api.v1.router import router as api_v1_router
from app.core.config import settings
from app.core.database import init_db

from app.api.routes import (
    auth,
    prompts,
    history,
    niches,
)

init_db()

app = FastAPI(
    title=settings.APP_NAME,
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    api_v1_router,
    prefix="/api/v1",
    tags=["API v1"],
)

app.include_router(
    auth.router,
    prefix="/api/auth",
    tags=["Authentication"],
)

app.include_router(
    prompts.router,
    prefix="/api/prompts",
    tags=["Prompts"],
)

app.include_router(
    history.router,
    prefix="/api/history",
    tags=["History"],
)

app.include_router(
    niches.router,
    prefix="/api/niches",
    tags=["Niches"],
)


@app.get("/api/health", tags=["Health"])
async def api_health():
    return {
        "status": "ok",
        "app": settings.APP_NAME,
    }


if settings.FRONTEND_DIR.exists():

    @app.get("/", include_in_schema=False)
    async def frontend_index():
        return FileResponse(settings.FRONTEND_DIR / "index.html")

    app.mount(
        "/",
        StaticFiles(directory=settings.FRONTEND_DIR, html=True),
        name="frontend",
    )

else:

    @app.get("/")
    async def root():
        return {
            "message": "AI Prompt Generator API Running",
            "docs": "/docs",
        }
