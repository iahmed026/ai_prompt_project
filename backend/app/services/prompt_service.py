import hashlib
import json
import re
from typing import Any, Dict, Iterable, List

from sqlalchemy.orm import Session

from app.core.cache import get_cache, set_cache
from app.models.prompt import PromptHistory
from app.schemas.prompt import (
    PromptGenerateRequest,
    PromptGenerateResponse,
    PromptHistoryItem,
)
from app.services.ai_service import optimize_prompt
from app.services.niche_service import get_niche_by_id
from app.services.prompt_playbooks import get_prompt_playbook
from app.utils.validators import clean_text


SELECTION_LABELS = {
    "task": "Task",
    "target_audience": "Target Audience",
    "platform": "Platform",
    "goal_type": "Goal",
    "constraints": "Constraints",
    "output_format": "Output Format",
}

STRUCTURED_SELECTION_FIELDS = {
    "task",
    "target_audience",
    "platform",
    "goal_type",
    "constraints",
    "output_format",
    "tone",
    "length",
}

PROMPT_ENGINE_VERSION = "playbook-v3"
CLIENT_ID_PATTERN = re.compile(r"^[a-zA-Z0-9._:-]{8,120}$")


def normalize_client_id(client_id: str) -> str:
    value = clean_text(client_id, max_length=120)

    if not value or not CLIENT_ID_PATTERN.match(value):
        raise ValueError("A valid client history ID is required")

    return value


def _selection_values(value: Any) -> List[str]:
    if value in (None, "", [], {}):
        return []

    raw_values = value if isinstance(value, list) else [value]
    values: List[str] = []
    for item in raw_values:
        text = clean_text(str(item), max_length=160)
        if text:
            values.append(text)

    return values


def _selection_value(value: Any) -> str:
    return ", ".join(_selection_values(value))


def _pretty_value(value: Any) -> str:
    text = clean_text(str(value or ""), max_length=80).replace("_", " ").replace("-", " ")
    return text.title() if text else ""


def _selection_lines(
    selection: Dict[str, Any],
    excluded_fields: Iterable[str] = STRUCTURED_SELECTION_FIELDS,
) -> List[str]:
    lines: List[str] = []
    excluded = set(excluded_fields)

    for key, value in selection.items():
        if key in excluded:
            continue

        formatted = _selection_value(value)
        if not formatted:
            continue

        label = SELECTION_LABELS.get(key, key.replace("_", " ").title())
        lines.append(f"- {label}: {formatted}")

    return lines


def _extend_bullet_section(
    lines: List[str],
    title: str,
    values: Iterable[str],
    max_length: int = 260,
) -> None:
    cleaned_values = [
        clean_text(value, max_length=max_length)
        for value in values
        if clean_text(value, max_length=max_length)
    ]

    if not cleaned_values:
        return

    lines.extend(["", f"{title}:"])
    lines.extend(f"- {value}" for value in cleaned_values)


def build_final_template(payload: PromptGenerateRequest, niche: Dict[str, Any]) -> str:
    context = clean_text(payload.context)
    selection = payload.selection or {}
    playbook = get_prompt_playbook(payload.niche_id)
    niche_label = clean_text(niche.get("label") or payload.niche_id, max_length=80)
    niche_description = clean_text(niche.get("description", ""), max_length=300)
    task = _selection_value(selection.get("task"))
    target_audience = _selection_value(selection.get("target_audience"))
    platform = _selection_value(selection.get("platform"))
    goal_type = _selection_value(selection.get("goal_type"))
    output_format = _selection_value(selection.get("output_format"))
    constraints = _selection_values(selection.get("constraints"))
    tone = _pretty_value(payload.tone)
    length = _pretty_value(payload.length)

    lines = [
        f"You are an expert in {niche_label} with 10+ years of experience.",
        playbook.positioning,
    ]

    if niche_description:
        lines.append(f"Domain focus: {niche_description}")

    lines.extend([
        "",
        "Operating Mode:",
        "- Treat the user's input as a rough brief that needs expert interpretation.",
        "- Improve weak or generic inputs by adding structure, specificity, and decision criteria.",
        "- Do not merely restate the request; turn it into a high-quality, niche-specific deliverable.",
        "- If critical information is missing, ask one concise clarifying question. Otherwise, proceed with sensible assumptions.",
        "",
        "Task:",
        f"- {task or 'Use the user context to identify and complete the most useful task.'}",
        "",
        "Context:",
    ])

    if context:
        lines.append(f"- {context}")
    else:
        lines.append(
            "- Use the selected options as the brief. Add reasonable assumptions only when they are low-risk and useful."
        )

    audience_goal_lines = []
    if target_audience:
        audience_goal_lines.append(f"- Target audience: {target_audience}")
    if platform:
        audience_goal_lines.append(f"- Platform or channel: {platform}")
    if goal_type:
        audience_goal_lines.append(f"- Primary goal: {goal_type}")

    if audience_goal_lines:
        lines.extend(["", "Audience and Goal:"])
        lines.extend(audience_goal_lines)

    style_lines = []
    if tone:
        style_lines.append(f"- Tone: {tone}")
    if length:
        style_lines.append(f"- Target length: {length}")

    if style_lines:
        lines.extend(["", "Style:"])
        lines.extend(style_lines)

    _extend_bullet_section(lines, "Niche Strategy Playbook", playbook.strategy_rules)

    lines.extend([
        "",
        "Prompt Execution Requirements:",
        "- Make the answer specific, practical, and ready to use.",
        "- Use clear structure with headings or bullets when helpful.",
        "- Prefer concrete examples, steps, or copy the user can act on immediately.",
        "- Stay aligned with the selected niche and avoid generic filler.",
        "- Include placeholders only when the user truly needs to supply missing facts.",
        "- When the user gives a generic request, infer a stronger version based on the niche, audience, platform, and goal.",
    ])

    extra_selection_lines = _selection_lines(selection)
    if extra_selection_lines:
        lines.extend(["", "Additional Selected Details:"])
        lines.extend(extra_selection_lines)

    if constraints:
        lines.extend(["", "Mandatory Constraints:"])
        lines.extend(f"- {item}" for item in constraints)

    _extend_bullet_section(lines, "Niche Guardrails", playbook.guardrails)

    lines.extend([
        "",
        "Output Format:",
        f"- {output_format or 'Choose the clearest format for the task.'}",
    ])

    _extend_bullet_section(lines, "Recommended Output Architecture", playbook.prompt_sections)

    best_practices = _selection_values(niche.get("best_practices") or [])
    if best_practices:
        lines.extend(["", "Niche Best Practices:"])
        lines.extend(f"- {item}" for item in best_practices)

    _extend_bullet_section(lines, "Premium Quality Rules", playbook.quality_rules)

    lines.extend([
        "",
        "Quality Checklist:",
        "- The answer directly satisfies the task.",
        "- The output matches the requested format.",
        "- Claims are accurate and appropriately qualified.",
        "- The result feels tailored to the selected niche, not copied from a generic template.",
        "- The result includes enough detail that a user can act on it immediately.",
        "- The final result is useful without extra back-and-forth unless key details are missing.",
        "",
        "Return only the final deliverable. Do not include hidden reasoning.",
    ])

    return "\n".join(lines)


def _cache_key(payload: PromptGenerateRequest, final_template: str) -> str:
    raw = json.dumps(
        {
            "prompt_engine_version": PROMPT_ENGINE_VERSION,
            "niche_id": payload.niche_id,
            "selection": payload.selection,
            "context": payload.context,
            "tone": payload.tone,
            "length": payload.length,
            "final_template": final_template,
        },
        sort_keys=True,
        default=str,
    )
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def _history_item(record: PromptHistory) -> PromptHistoryItem:
    try:
        selection = json.loads(record.selection_json or "{}")
    except json.JSONDecodeError:
        selection = {}

    return PromptHistoryItem(
        id=record.id,
        niche_id=record.niche_id,
        context=record.context,
        selection=selection,
        final_template=record.final_template,
        optimized_prompt=record.optimized_prompt,
        cached=record.cached,
        created_at=record.created_at,
    )


def save_history(
    db: Session,
    payload: PromptGenerateRequest,
    final_template: str,
    optimized_prompt: str,
    cached: bool,
    client_id: str,
) -> PromptHistory:
    record = PromptHistory(
        client_id=client_id,
        niche_id=payload.niche_id,
        context=clean_text(payload.context),
        selection_json=json.dumps(payload.selection, sort_keys=True, default=str),
        final_template=final_template,
        optimized_prompt=optimized_prompt,
        cached=cached,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


async def generate_prompt(
    db: Session,
    payload: PromptGenerateRequest,
    client_id: str,
) -> PromptGenerateResponse:
    client_id = normalize_client_id(client_id)
    niche = get_niche_by_id(payload.niche_id)
    final_template = build_final_template(payload, niche)
    cache_key = _cache_key(payload, final_template)

    optimized_prompt = get_cache(cache_key)
    cached = optimized_prompt is not None

    if not cached:
        niche_label = niche.get("label") if isinstance(niche, dict) else None
        optimized_prompt = await optimize_prompt(final_template, niche_label)
        set_cache(cache_key, optimized_prompt)

    save_history(db, payload, final_template, optimized_prompt, cached, client_id)
    return PromptGenerateResponse(
        optimized_prompt=optimized_prompt,
        final_template=final_template,
        cached=cached,
    )


def list_history(
    db: Session,
    client_id: str,
    limit: int = 20,
) -> List[PromptHistoryItem]:
    client_id = normalize_client_id(client_id)
    safe_limit = min(max(limit, 1), 50)
    records = (
        db.query(PromptHistory)
        .filter(PromptHistory.client_id == client_id)
        .order_by(PromptHistory.created_at.desc(), PromptHistory.id.desc())
        .limit(safe_limit)
        .all()
    )
    return [_history_item(record) for record in records]
