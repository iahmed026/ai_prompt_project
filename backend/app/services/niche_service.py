from typing import Any, Dict

from app.utils.schema_loader import (
    add_option_to_niche,
    create_niche,
    get_niche,
    load_ui_schema,
)


def get_ui_schema() -> Dict[str, Any]:
    return load_ui_schema()


def get_niche_by_id(niche_id: str) -> Dict[str, Any]:
    return get_niche(load_ui_schema(), niche_id)


def create_custom_niche(label: str, description: str = "") -> Dict[str, Any]:
    return create_niche(label=label, description=description)


def add_custom_option(niche_id: str, field: str, option: str) -> Dict[str, Any]:
    return add_option_to_niche(niche_id, field, option)
