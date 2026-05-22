import math
import re
import unicodedata
from typing import List, Optional, Tuple

from sqlalchemy.orm import Session

from app.models.blog import Blog
from app.schemas.blog import BlogCreate, BlogUpdate


DEMO_BLOGS = [
    {
        "title": "How to Turn a Rough Idea Into a Strong AI Prompt",
        "summary": (
            "A practical workflow for turning vague business ideas into clear, "
            "high-performing prompts."
        ),
        "image_url": "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80",
        "author": "Prompt Studio Team",
        "published": True,
        "content": """# How to Turn a Rough Idea Into a Strong AI Prompt

Great prompts usually start with ordinary notes. The difference is structure.

## Start With the Job

Write one sentence that explains what the AI should help you produce. Keep it practical:

- A landing page outline
- A customer support reply
- A product launch email
- A technical explanation

## Add Context

The model needs enough background to make smart choices. Include the audience, product, constraints, and the decision you want the output to support.

## Define the Output

Tell the AI what the final answer should look like. Markdown, tables, bullet lists, checklists, and step-by-step formats all reduce ambiguity.

## Review and Tighten

After you generate a draft, improve the prompt by adding missing constraints and removing vague language. Prompt quality compounds quickly when you revise it like a brief.
""",
    },
    {
        "title": "Prompt Niches: Why Specific Workflows Beat Generic Templates",
        "summary": (
            "Niche-specific prompt options help teams produce more accurate, "
            "repeatable AI outputs."
        ),
        "image_url": "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80",
        "author": "Prompt Studio Team",
        "published": True,
        "content": """# Prompt Niches: Why Specific Workflows Beat Generic Templates

Generic prompt templates are useful, but niche workflows are stronger because they carry domain assumptions.

## What a Niche Adds

A niche gives the generator a focused vocabulary. Marketing prompts need conversion language. SaaS prompts need product and support clarity. Education prompts need learning outcomes.

## Better Defaults

When a workflow knows its niche, it can offer better tasks, constraints, output formats, and best practices before the user writes a single sentence.

## Cleaner Results

Specific inputs make it easier for the AI to avoid filler. The final prompt becomes a working brief instead of a generic instruction.
""",
    },
    {
        "title": "Using Markdown to Make AI Outputs Easier to Ship",
        "summary": (
            "Markdown gives generated content a clean structure that is easy to "
            "scan, edit, and move into real tools."
        ),
        "image_url": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
        "author": "Prompt Studio Team",
        "published": True,
        "content": """# Using Markdown to Make AI Outputs Easier to Ship

Markdown is one of the simplest ways to make generated content useful immediately.

## Why It Works

Markdown creates visible hierarchy without locking the content into a heavy format. Teams can paste it into docs, tickets, knowledge bases, and editors.

## Useful Patterns

- Use headings for sections
- Use bullet lists for options
- Use numbered lists for processes
- Use tables for comparisons
- Use fenced code blocks for examples

## Prompt Tip

Ask for markdown explicitly when the result needs to be reviewed, shared, or published. The extra structure makes the output easier to improve.
""",
    },
]


def slugify_title(title: str) -> str:
    normalized = unicodedata.normalize("NFKD", title)
    ascii_title = normalized.encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", ascii_title.lower()).strip("-")
    return slug or "blog-post"


def generate_unique_slug(
    db: Session,
    title: str,
    blog_id: Optional[int] = None,
) -> str:
    base_slug = slugify_title(title)
    slug = base_slug
    suffix = 2

    # Keep URLs readable while preventing collisions when titles repeat.
    while True:
        query = db.query(Blog).filter(Blog.slug == slug)

        if blog_id is not None:
            query = query.filter(Blog.id != blog_id)

        if not query.first():
            return slug

        slug = f"{base_slug}-{suffix}"
        suffix += 1


def list_blogs(
    db: Session,
    page: int = 1,
    page_size: int = 9,
    search: Optional[str] = None,
    include_unpublished: bool = False,
) -> Tuple[List[Blog], int, int]:
    safe_page = max(page, 1)
    safe_page_size = min(max(page_size, 1), 50)

    query = db.query(Blog)

    if not include_unpublished:
        query = query.filter(Blog.published.is_(True))

    if search:
        term = f"%{search.strip()}%"
        query = query.filter(Blog.title.ilike(term))

    total = query.count()
    pages = max(math.ceil(total / safe_page_size), 1)
    records = (
        query.order_by(Blog.created_at.desc(), Blog.id.desc())
        .offset((safe_page - 1) * safe_page_size)
        .limit(safe_page_size)
        .all()
    )

    return records, total, pages


def get_blog_by_slug(
    db: Session,
    slug: str,
    include_unpublished: bool = False,
) -> Optional[Blog]:
    query = db.query(Blog).filter(Blog.slug == slug)

    if not include_unpublished:
        query = query.filter(Blog.published.is_(True))

    return query.first()


def get_blog_by_id(db: Session, blog_id: int) -> Optional[Blog]:
    return db.query(Blog).filter(Blog.id == blog_id).first()


def create_blog(db: Session, payload: BlogCreate) -> Blog:
    data = payload.model_dump()
    record = Blog(
        **data,
        slug=generate_unique_slug(db, payload.title),
    )

    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def update_blog(db: Session, blog_id: int, payload: BlogUpdate) -> Optional[Blog]:
    record = get_blog_by_id(db, blog_id)

    if not record:
        return None

    data = payload.model_dump(exclude_unset=True)

    if "title" in data and data["title"] != record.title:
        data["slug"] = generate_unique_slug(db, data["title"], blog_id=record.id)

    for field, value in data.items():
        setattr(record, field, value)

    db.commit()
    db.refresh(record)
    return record


def delete_blog(db: Session, blog_id: int) -> bool:
    record = get_blog_by_id(db, blog_id)

    if not record:
        return False

    db.delete(record)
    db.commit()
    return True


def seed_demo_blogs(db: Session) -> None:
    if db.query(Blog.id).first():
        return

    for item in DEMO_BLOGS:
        create_blog(db, BlogCreate(**item))
