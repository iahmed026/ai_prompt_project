from datetime import datetime, timezone
from html import unescape
from html.parser import HTMLParser
import math
import re
import unicodedata
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import quote, urlparse

import httpx
from sqlalchemy.orm import Session

from app.core.cache import get_cache, set_cache
from app.core.config import settings
from app.models.blog import Blog
from app.schemas.blog import BlogCreate, BlogUpdate


PROMPT_GENERATOR_SUMMARY = (
    "Learn how to transform vague, single-word AI prompts into highly detailed, "
    "context-aware frameworks that deliver perfect results every time."
)

DEFAULT_WORDPRESS_TITLES = {
    "hello world",
    "hello world!",
}

WORDS_PER_MINUTE = 220


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


class _HTMLTextExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.parts: List[str] = []

    def handle_data(self, data: str) -> None:
        if data.strip():
            self.parts.append(data.strip())


def _wordpress_site_url() -> str:
    return settings.WORDPRESS_SITE_URL.strip().rstrip("/")


def is_wordpress_enabled() -> bool:
    return bool(_wordpress_site_url())


def wordpress_admin_url() -> str:
    site_url = _wordpress_site_url()
    return f"{site_url}/wp-admin/" if site_url else ""


def _wordpress_site_host() -> str:
    site_url = _wordpress_site_url()

    if not site_url:
        return ""

    parsed = urlparse(site_url)
    return (parsed.netloc or parsed.path).strip("/")


def _wordpress_direct_posts_url() -> str:
    return f"{_wordpress_site_url()}/wp-json/wp/v2/posts"


def _wordpress_public_posts_url() -> str:
    site = quote(_wordpress_site_host(), safe="")
    return f"https://public-api.wordpress.com/wp/v2/sites/{site}/posts"


def _wordpress_posts_urls() -> List[str]:
    host = _wordpress_site_host()

    if not host:
        return []

    direct_url = _wordpress_direct_posts_url()
    public_url = _wordpress_public_posts_url()

    if host.endswith(".wordpress.com"):
        return [public_url, direct_url]

    return [direct_url, public_url]


def wordpress_api_url() -> str:
    urls = _wordpress_posts_urls()
    return urls[0] if urls else ""


def wordpress_source() -> Dict[str, str]:
    site_url = _wordpress_site_url()
    return {
        "source": "wordpress" if site_url else "local",
        "wordpress_site_url": site_url,
        "wordpress_api_url": wordpress_api_url(),
        "wordpress_admin_url": wordpress_admin_url(),
    }


def _wordpress_cache_key(*parts: Any) -> str:
    normalized = [
        str(part or "").strip().lower()
        for part in parts
    ]
    return "wordpress:blogs:" + ":".join(normalized)


def _strip_html(value: str) -> str:
    parser = _HTMLTextExtractor()
    parser.feed(value or "")
    parser.close()
    text = " ".join(parser.parts)
    return re.sub(r"\s+", " ", unescape(text)).strip()


def _shorten(value: str, max_length: int) -> str:
    value = re.sub(r"\s+", " ", value or "").strip()
    if len(value) <= max_length:
        return value

    return value[: max_length - 1].rsplit(" ", 1)[0].rstrip(".,;:") + "..."


def _normalized_title(value: str) -> str:
    return re.sub(r"\s+", " ", _strip_html(value).lower()).strip()


def _is_default_wordpress_post(post: Dict[str, Any]) -> bool:
    title = _normalized_title(_rendered(post, "title"))
    slug = str(post.get("slug") or "").strip().lower()
    return title in DEFAULT_WORDPRESS_TITLES or slug == "hello-world"


def _clean_summary(title: str, summary: str) -> str:
    if _normalized_title(title) == "prompt generator":
        return PROMPT_GENERATOR_SUMMARY

    return summary


def _estimate_read_time(*parts: str) -> int:
    text = " ".join(part or "" for part in parts)
    words = re.findall(r"\b[\w'-]+\b", _strip_html(text))
    return max(1, math.ceil(len(words) / WORDS_PER_MINUTE))


def _dedupe_tags(values: List[str], limit: int = 4) -> List[str]:
    tags: List[str] = []
    seen = set()

    for value in values:
        tag = _strip_html(str(value or "")).strip()
        key = tag.lower()

        if not tag or key in seen or key in {"uncategorized"}:
            continue

        seen.add(key)
        tags.append(tag)

        if len(tags) >= limit:
            break

    return tags


def _infer_tags(title: str, content: str = "") -> List[str]:
    haystack = f"{title} {content}".lower()
    tags: List[str] = []

    if "prompt" in haystack:
        tags.append("Prompt Engineering")

    if "ai" in haystack or "artificial intelligence" in haystack:
        tags.append("AI Tips")

    if "markdown" in haystack:
        tags.append("Markdown")

    if "workflow" in haystack or "template" in haystack:
        tags.append("Workflows")

    if "marketing" in haystack:
        tags.append("Marketing")

    return _dedupe_tags(tags or ["AI Tips", "Prompt Engineering"])


def _wordpress_terms(post: Dict[str, Any]) -> List[str]:
    embedded = post.get("_embedded") or {}
    term_groups = embedded.get("wp:term") or []
    terms: List[str] = []

    for group in term_groups:
        for term in group or []:
            taxonomy = str(term.get("taxonomy") or "")

            if taxonomy not in {"category", "post_tag"}:
                continue

            terms.append(str(term.get("name") or ""))

    return _dedupe_tags(terms)


def _parse_wordpress_date(value: str) -> datetime:
    if not value:
        return datetime.now(timezone.utc)

    normalized = value.replace("Z", "+00:00")

    try:
        parsed = datetime.fromisoformat(normalized)
    except ValueError:
        return datetime.now(timezone.utc)

    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)

    return parsed


def _rendered(post: Dict[str, Any], key: str) -> str:
    value = post.get(key) or {}

    if isinstance(value, dict):
        return str(value.get("rendered") or "")

    return str(value or "")


def _wordpress_featured_image(post: Dict[str, Any]) -> str:
    embedded = post.get("_embedded") or {}
    media_items = embedded.get("wp:featuredmedia") or []

    if not media_items:
        return ""

    media = media_items[0] or {}
    sizes = (media.get("media_details") or {}).get("sizes") or {}

    for size in ("large", "medium_large", "full", "medium"):
        source = (sizes.get(size) or {}).get("source_url")
        if source:
            return str(source)

    return str(media.get("source_url") or "")


def _wordpress_author(post: Dict[str, Any]) -> str:
    embedded = post.get("_embedded") or {}
    authors = embedded.get("author") or []

    if authors:
        name = _strip_html(str((authors[0] or {}).get("name") or ""))
        if name:
            return name

    return "WordPress"


def _wordpress_post_to_blog(post: Dict[str, Any]) -> Dict[str, Any]:
    title = _strip_html(_rendered(post, "title")) or "Untitled"
    content_html = _rendered(post, "content")
    content_text = _strip_html(content_html)
    excerpt = _strip_html(_rendered(post, "excerpt"))
    summary = _shorten(excerpt or content_text or title, 500)
    summary = _clean_summary(title, summary)

    if len(summary) < 10:
        summary = _shorten(f"{title} article from WordPress.", 500)

    content = content_text or summary
    if len(content) < 10:
        content = f"{title}\n\n{summary}"

    created_at = _parse_wordpress_date(str(post.get("date") or post.get("date_gmt") or ""))
    updated_at = _parse_wordpress_date(str(post.get("modified") or post.get("modified_gmt") or ""))

    return {
        "id": int(post.get("id") or 0),
        "title": title,
        "slug": str(post.get("slug") or post.get("id") or ""),
        "content": content,
        "content_html": content_html,
        "summary": summary,
        "image_url": _wordpress_featured_image(post),
        "author": _wordpress_author(post),
        "created_at": created_at,
        "updated_at": updated_at,
        "published": post.get("status") == "publish",
        "tags": _wordpress_terms(post) or _infer_tags(title, content_text),
        "read_time_minutes": _estimate_read_time(title, summary, content_text),
    }


async def _get_wordpress_posts_response(
    client: httpx.AsyncClient,
    params: Dict[str, Any],
) -> httpx.Response:
    last_error: Optional[httpx.HTTPStatusError] = None

    for url in _wordpress_posts_urls():
        response = await client.get(url, params=params)

        try:
            response.raise_for_status()
            return response
        except httpx.HTTPStatusError as exc:
            last_error = exc

            if exc.response.status_code not in {404, 410}:
                raise

    if last_error:
        raise last_error

    raise httpx.HTTPError("WordPress site URL is not configured")


async def list_wordpress_blogs(
    page: int = 1,
    page_size: int = 9,
    search: Optional[str] = None,
) -> Tuple[List[Dict[str, Any]], int, int]:
    safe_page = max(page, 1)
    safe_page_size = min(max(page_size, 1), 50)
    safe_search = (search or "").strip()
    cache_key = _wordpress_cache_key(
        _wordpress_site_host(),
        "list",
        safe_page,
        safe_page_size,
        safe_search,
    )
    cached = get_cache(cache_key)

    if cached:
        return cached

    params = {
        "page": safe_page,
        "per_page": safe_page_size,
        "status": "publish",
        "_embed": "1",
    }

    if safe_search:
        params["search"] = safe_search

    async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
        response = await _get_wordpress_posts_response(client, params)

    total = int(response.headers.get("X-WP-Total") or 0)
    posts = response.json()

    if not isinstance(posts, list):
        posts = []

    visible_posts = [
        post
        for post in posts
        if not _is_default_wordpress_post(post)
    ]
    skipped = len(posts) - len(visible_posts)
    items = [_wordpress_post_to_blog(post) for post in visible_posts]
    total = max(0, (total or len(items)) - skipped)
    pages = max(math.ceil(total / safe_page_size), 1)
    result = (items, total, pages)
    set_cache(cache_key, result)
    return result


async def get_wordpress_blog_by_slug(slug: str) -> Optional[Dict[str, Any]]:
    safe_slug = slug.strip()
    cache_key = _wordpress_cache_key(
        _wordpress_site_host(),
        "detail",
        safe_slug,
    )
    cached = get_cache(cache_key)

    if cached:
        return cached

    async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
        response = await _get_wordpress_posts_response(
            client,
            {
                "slug": safe_slug,
                "status": "publish",
                "_embed": "1",
            },
        )

    posts = response.json()

    if not isinstance(posts, list) or not posts:
        return None

    if _is_default_wordpress_post(posts[0]):
        return None

    result = _wordpress_post_to_blog(posts[0])
    set_cache(cache_key, result)
    return result


def blog_to_item(record: Blog) -> Dict[str, Any]:
    return {
        "id": record.id,
        "title": record.title,
        "slug": record.slug,
        "summary": _clean_summary(record.title, record.summary),
        "image_url": record.image_url,
        "author": record.author,
        "created_at": record.created_at,
        "updated_at": record.updated_at,
        "published": record.published,
        "tags": _infer_tags(record.title, record.content),
        "read_time_minutes": _estimate_read_time(record.title, record.summary, record.content),
    }


def blog_to_read(record: Blog) -> Dict[str, Any]:
    data = blog_to_item(record)
    data["content"] = record.content
    data["content_html"] = None
    return data


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
