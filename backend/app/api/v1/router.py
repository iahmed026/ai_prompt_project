from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from httpx import HTTPError
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.niche import NicheCreate, OptionCreate
from app.schemas.prompt import (
    PromptGenerateRequest,
    PromptGenerateResponse,
    PromptHistoryResponse,
)
from app.api.routes.blogs import router as blogs_router
from app.services import niche_service, prompt_service


router = APIRouter()
router.include_router(blogs_router, tags=["Blogs"])


def get_history_client_id(
    x_client_id: Optional[str] = Header(default=None, alias="X-Client-Id"),
) -> str:
    try:
        return prompt_service.normalize_client_id(x_client_id or "")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/health")
def health_check():
    return {"status": "ok"}


@router.get("/ui-schema/")
def read_ui_schema():
    return niche_service.get_ui_schema()


@router.get("/ui-schema/niches/{niche_id}")
def read_niche(niche_id: str):
    try:
        return niche_service.get_niche_by_id(niche_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/ui-schema/niches")
def create_niche(payload: NicheCreate):
    try:
        return niche_service.create_custom_niche(
            label=payload.label,
            description=payload.description,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/ui-schema/niches/{niche_id}/add-option")
def add_niche_option(niche_id: str, payload: OptionCreate):
    try:
        return niche_service.add_custom_option(
            niche_id=niche_id,
            field=payload.field,
            option=payload.option,
        )
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/generate", response_model=PromptGenerateResponse)
async def generate_prompt(
    payload: PromptGenerateRequest,
    client_id: str = Depends(get_history_client_id),
    db: Session = Depends(get_db),
):
    try:
        return await prompt_service.generate_prompt(db, payload, client_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except HTTPError as exc:
        raise HTTPException(
            status_code=502,
            detail="External LLM provider request failed",
        ) from exc


@router.get("/history/", response_model=PromptHistoryResponse)
def read_history(
    limit: int = Query(default=20, ge=1, le=50),
    client_id: str = Depends(get_history_client_id),
    db: Session = Depends(get_db),
):
    return PromptHistoryResponse(
        history=prompt_service.list_history(db, client_id=client_id, limit=limit)
    )
