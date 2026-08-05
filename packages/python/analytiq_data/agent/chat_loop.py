"""
Tool-free account chat turn for anti-coach.
Reuses LLM streaming + SPU metering from the document agent stack.
"""
from __future__ import annotations

import logging
from typing import Any, Awaitable, Callable, Optional

import analytiq_data as ad
import litellm

from .anti_coach_prompt import get_anti_coach_system_prompt
from .agent_loop import _record_spu_for_llm_call, _should_use_thinking_param

logger = logging.getLogger(__name__)


async def run_chat_turn(
    analytiq_client: Any,
    organization_id: str,
    messages: list[dict],
    model: str,
    stream_handler: Optional[Callable[[str, Any], Awaitable[None]]] = None,
) -> dict[str, Any]:
    """
    One user→assistant chat turn with no tools.
    messages: conversation history including the latest user message
              (role user/assistant only).
    """
    system_content = get_anti_coach_system_prompt()
    llm_messages: list[dict] = [{"role": "system", "content": system_content}]
    for m in messages:
        role = m.get("role")
        content = m.get("content")
        if role in ("user", "assistant") and content is not None:
            llm_messages.append({"role": role, "content": content})

    llm_provider = ad.llm.get_llm_model_provider(model)
    api_key = await ad.llm.get_llm_key(analytiq_client, llm_provider)
    if not api_key and llm_provider not in ("bedrock", "azure_ai"):
        return {"error": f"No API key for model {model}"}

    try:
        spu_check = await ad.payments.get_spu_cost(model)
        await ad.payments.check_spu_limits(organization_id, spu_check)
    except Exception as e:
        return {"error": str(e)}

    thinking_param = None
    if getattr(litellm, "supports_reasoning", None) and litellm.supports_reasoning(model=model):
        if _should_use_thinking_param(llm_messages):
            thinking_param = {"type": "enabled", "budget_tokens": 4096}

    if stream_handler:
        message = None
        usage_obj = None
        async for event_type, payload in ad.llm.agent_completion_stream(
            analytiq_client,
            model=model,
            messages=llm_messages,
            api_key=api_key,
            tools=None,
            thinking=thinking_param,
        ):
            if event_type == "content":
                await stream_handler("assistant_text_chunk", {"chunk": payload, "round_index": 0})
            elif event_type == "thinking":
                await stream_handler("thinking_chunk", {"chunk": payload, "round_index": 0})
            elif event_type == "message":
                message = payload
            elif event_type == "usage":
                usage_obj = payload

        fake_response = type("R", (), {"usage": usage_obj})()
        await _record_spu_for_llm_call(fake_response, organization_id, llm_provider, model)
        if message is None:
            return {"error": "Stream did not return a message"}

        text = (message.content or "").strip()
        thinking_text = ad.llm._extract_thinking_from_response(message)
        if thinking_text:
            await stream_handler("thinking_done", {"thinking": thinking_text, "round_index": 0})
        await stream_handler("assistant_text_done", {"full_text": text, "round_index": 0})
        result = {"text": text, "thinking": thinking_text}
        await stream_handler("done", result)
        return result

    response = await ad.llm.agent_completion(
        analytiq_client,
        model=model,
        messages=llm_messages,
        api_key=api_key,
        tools=None,
        thinking=thinking_param,
    )
    message = response.choices[0].message
    await _record_spu_for_llm_call(response, organization_id, llm_provider, model)
    text = (message.content or "").strip()
    thinking_text = ad.llm._extract_thinking_from_response(message)
    return {"text": text, "thinking": thinking_text}
