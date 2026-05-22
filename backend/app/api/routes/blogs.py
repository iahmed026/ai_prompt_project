from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.api.deps import (
    get_admin_subject_from_token,
    get_db,
    oauth2_scheme,
    require_admin_user,
)
from app.schemas.blog import BlogCreate, BlogListResponse, BlogRead, BlogUpdate
from app.services import blog_service


router = APIRouter(prefix="/blogs")


@router.get("", response_model=BlogListResponse)
def read_blogs(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=9, ge=1, le=50),
    search: Optional[str] = Query(default=None, max_length=120),
    include_unpublished: bool = Query(default=False),
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    if include_unpublished:
        get_admin_subject_from_token(token)

    records, total, pages = blog_service.list_blogs(
        db=db,
        page=page,
        page_size=page_size,
        search=search,
        include_unpublished=include_unpublished,
    )

    return BlogListResponse(
        items=records,
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
    )


@router.get("/{slug}", response_model=BlogRead)
def read_blog(
    slug: str,
    include_unpublished: bool = Query(default=False),
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    if include_unpublished:
        get_admin_subject_from_token(token)

    record = blog_service.get_blog_by_slug(
        db=db,
        slug=slug,
        include_unpublished=include_unpublished,
    )

    if not record:
        raise HTTPException(status_code=404, detail="Blog not found")

    return record


@router.post(
    "",
    response_model=BlogRead,
    status_code=status.HTTP_201_CREATED,
)
def create_blog(
    payload: BlogCreate,
    _: str = Depends(require_admin_user),
    db: Session = Depends(get_db),
):
    return blog_service.create_blog(db, payload)


@router.put("/{blog_id}", response_model=BlogRead)
def update_blog(
    blog_id: int,
    payload: BlogUpdate,
    _: str = Depends(require_admin_user),
    db: Session = Depends(get_db),
):
    record = blog_service.update_blog(db, blog_id, payload)

    if not record:
        raise HTTPException(status_code=404, detail="Blog not found")

    return record


@router.delete("/{blog_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_blog(
    blog_id: int,
    _: str = Depends(require_admin_user),
    db: Session = Depends(get_db),
):
    deleted = blog_service.delete_blog(db, blog_id)

    if not deleted:
        raise HTTPException(status_code=404, detail="Blog not found")

    return Response(status_code=status.HTTP_204_NO_CONTENT)
