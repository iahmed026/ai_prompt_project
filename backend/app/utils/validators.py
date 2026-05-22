from typing import Iterable


ALLOWED_OPTION_FIELDS = {"tasks", "constraints", "output_formats"}


def clean_text(value: str, max_length: int = 4000) -> str:
    text = " ".join(str(value or "").split())
    return text[:max_length]


def ensure_allowed_field(field: str, allowed: Iterable[str] = ALLOWED_OPTION_FIELDS) -> str:
    if field not in set(allowed):
        raise ValueError("Unsupported option field")

    return field
