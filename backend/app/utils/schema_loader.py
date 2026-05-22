import copy
import json
from pathlib import Path
import re
from typing import Any, Dict
import unicodedata

from app.core.config import settings
from app.utils.validators import ensure_allowed_field, clean_text


SCHEMA_PATH = Path(settings.DEFINITIONS_DIR) / "ui_schema.json"


DEFAULT_UI_SCHEMA: Dict[str, Any] = {
    "version": "1.0",
    "global": {
        "tones": [
            {"id": "professional", "label": "Professional"},
            {"id": "friendly", "label": "Friendly"},
            {"id": "direct", "label": "Direct"},
            {"id": "creative", "label": "Creative"},
        ],
        "lengths": [
            {"id": "short", "label": "Short"},
            {"id": "medium", "label": "Medium"},
            {"id": "detailed", "label": "Detailed"},
        ],
    },
    "niches": [],
}


def save_ui_schema(schema: Dict[str, Any]) -> None:
    SCHEMA_PATH.parent.mkdir(parents=True, exist_ok=True)
    SCHEMA_PATH.write_text(
        json.dumps(schema, indent=2, ensure_ascii=True) + "\n",
        encoding="utf-8",
    )


def load_ui_schema() -> Dict[str, Any]:
    if not SCHEMA_PATH.exists() or not SCHEMA_PATH.read_text(encoding="utf-8").strip():
        schema = copy.deepcopy(DEFAULT_UI_SCHEMA)
        save_ui_schema(schema)
        return schema

    try:
        schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        schema = copy.deepcopy(DEFAULT_UI_SCHEMA)
        save_ui_schema(schema)
        return schema

    schema.setdefault("version", "1.0")
    schema.setdefault("global", DEFAULT_UI_SCHEMA["global"])
    schema.setdefault("niches", [])
    return schema


def get_niche(schema: Dict[str, Any], niche_id: str) -> Dict[str, Any]:
    for niche in schema.get("niches", []):
        if niche.get("id") == niche_id:
            return niche

    raise KeyError("Niche not found")


def slugify_niche_id(label: str) -> str:
    normalized = unicodedata.normalize("NFKD", label)
    ascii_label = normalized.encode("ascii", "ignore").decode("ascii")
    niche_id = re.sub(r"[^a-zA-Z0-9]+", "-", ascii_label.lower()).strip("-")
    return niche_id or "custom-niche"


def create_niche(label: str, description: str = "") -> Dict[str, Any]:
    schema = load_ui_schema()
    label = clean_text(label, max_length=80)
    description = clean_text(description, max_length=300)

    if not label:
        raise ValueError("Niche label cannot be empty")

    existing_ids = {
        niche.get("id")
        for niche in schema.get("niches", [])
    }
    base_id = slugify_niche_id(label)
    niche_id = base_id
    suffix = 2

    while niche_id in existing_ids:
        niche_id = f"{base_id}-{suffix}"
        suffix += 1

    niche = {
        "id": niche_id,
        "label": label,
        "description": description,
        "tasks": [],
        "constraints": [],
        "output_formats": [],
        "best_practices": [],
    }

    schema.setdefault("niches", []).append(niche)
    save_ui_schema(schema)
    return niche


def add_option_to_niche(niche_id: str, field: str, option: str) -> Dict[str, Any]:
    schema = load_ui_schema()
    field = ensure_allowed_field(field)
    option = clean_text(option, max_length=160)

    if not option:
        raise ValueError("Option cannot be empty")

    niche = get_niche(schema, niche_id)
    values = niche.setdefault(field, [])

    if option not in values:
        values.append(option)
        save_ui_schema(schema)

    return niche
