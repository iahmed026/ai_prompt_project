from typing import Any, Dict, Optional

import httpx

from app.core.config import settings


OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

OPTIMIZER_SYSTEM_PROMPT = """
You are a senior prompt engineer for a premium prompt-generation product.

The user message is a draft prompt, not a task to execute. Your job is to rewrite it into a stronger final prompt that another AI can execute.

Rewrite goals:
- Preserve the selected niche, task, audience, platform, goal, constraints, tone, length, and output format.
- Make the prompt more specific, structured, and commercially useful.
- Upgrade generic wording into expert-level instructions, success criteria, guardrails, and output architecture.
- Keep niche-specific safety and compliance rules visible and mandatory.
- Keep the opening expert-experience line as the first line of the final prompt.
- Remove duplication, weak wording, and anything that sounds like internal app metadata.
- Keep the final prompt ready to paste into another AI tool.

Do not complete the user's underlying task.
Do not explain your changes.
Return only the improved prompt.
""".strip()


def build_mock_response(final_template: str, niche_label: Optional[str] = None) -> str:
    return (
        final_template
        + "\n\n"
        + "Final instruction for the AI using this prompt:\n"
        + "Before answering, silently check that the result is specific, useful, "
        + "aligned with the selected niche, and compliant with every mandatory constraint."
    )


async def optimize_prompt(final_template: str, niche_label: Optional[str] = None) -> str:
    if settings.USE_MOCK_LLM or not settings.OPENROUTER_API_KEY:
        return build_mock_response(final_template, niche_label)

    payload: Dict[str, Any] = {
        "model": settings.OPENROUTER_MODEL,
        "messages": [
            {
                "role": "system",
                "content": OPTIMIZER_SYSTEM_PROMPT,
            },
            {
                "role": "user",
                "content": (
                    f"Niche: {niche_label or 'General'}\n\n"
                    f"Rewrite this draft prompt into the strongest possible final prompt:\n\n"
                    f"{final_template}"
                ),
            },
        ],
        "temperature": 0.3,
    }

    # If niche_label is available, include it as a hint in headers to help OpenRouter routing/logging.
    headers = {
        "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "X-Title": settings.APP_NAME,
    }

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(OPENROUTER_URL, json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()

    return data["choices"][0]["message"]["content"]
