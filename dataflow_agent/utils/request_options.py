"""OpenAI-compatible request options shared by retained workflows."""

from __future__ import annotations

import os
from typing import Any, MutableMapping


_VALID_REASONING_EFFORTS = {"none", "low", "medium", "high", "xhigh", "max"}


def get_reasoning_effort(model_name: str | None, *, has_tools: bool = False) -> str | None:
    """Return the configured effort for reasoning-capable GPT-5 models.

    GPT-5.6 function tools on Chat Completions require effective reasoning
    ``none``. Tool-free calls keep the user configured effort.
    """
    model = (model_name or "").strip().lower()
    if not model.startswith("gpt-5"):
        return None

    raw = (
        os.getenv("SIMPLE_REASONING_EFFORT")
        or os.getenv("OPENAI_REASONING_EFFORT")
        or ""
    ).strip().lower()
    if raw not in _VALID_REASONING_EFFORTS:
        return None
    if has_tools and model.startswith("gpt-5.6") and raw != "none":
        return "none"
    return raw


def chat_model_options(
    model_name: str | None,
    *,
    temperature: float | None = None,
    has_tools: bool = False,
) -> dict[str, Any]:
    """Build Chat Completions options without unsupported sampling fields."""
    effort = get_reasoning_effort(model_name, has_tools=has_tools)
    options: dict[str, Any] = {}
    if effort:
        options["reasoning_effort"] = effort

    model = (model_name or "").strip().lower()
    # GPT-5 reasoning requests do not accept a non-default temperature.
    if temperature is not None and not (model.startswith("gpt-5") and effort not in {None, "none"}):
        options["temperature"] = temperature
    return options


def apply_chat_model_options(
    payload: MutableMapping[str, Any],
    model_name: str | None,
    *,
    has_tools: bool = False,
) -> MutableMapping[str, Any]:
    """Apply configured reasoning to an OpenAI-compatible JSON payload."""
    temperature = payload.pop("temperature", None)
    payload.update(
        chat_model_options(
            model_name,
            temperature=temperature,
            has_tools=has_tools,
        )
    )
    return payload
