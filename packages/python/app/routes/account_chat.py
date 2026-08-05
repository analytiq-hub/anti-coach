"""Account-scoped anti-coach chat (tool-free, fixed system prompt)."""

from __future__ import annotations

import asyncio
import json
import logging
from typing import Any

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

import analytiq_data as ad
from app.auth import get_current_user
from app.models import User
from app.account_org import resolve_private_org_id

logger = logging.getLogger(__name__)

account_chat_router = APIRouter(tags=["account/chat"])


class ChatMessage(BaseModel):
    role: str = Field(..., description="user or assistant")
    content: str | None = None


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(..., description="Conversation history")
    model: str = Field(default="claude-sonnet-4-6", description="LLM model")
    stream: bool = Field(default=True, description="Stream response (SSE)")
    thread_id: str | None = Field(default=None, description="Append turn to this thread")
    truncate_thread_to_message_count: int | None = Field(
        default=None,
        description="If set with thread_id, keep only this many messages before appending",
    )


class ThreadSummary(BaseModel):
    id: str
    title: str
    created_at: Any
    updated_at: Any


class ThreadDetail(BaseModel):
    id: str
    title: str
    messages: list[dict]
    extraction: dict
    created_at: Any
    updated_at: Any


class CreateThreadBody(BaseModel):
    title: str | None = None


class CreateThreadResponse(BaseModel):
    thread_id: str


async def _require_account_thread(
    analytiq_client,
    organization_id: str,
    thread_id: str,
    user_id: str,
) -> None:
    t = await ad.agent.agent_threads.get_thread_scoped(
        analytiq_client, thread_id, organization_id, user_id, account=True
    )
    if not t:
        raise HTTPException(status_code=404, detail="Thread not found")


async def _append_turn(
    analytiq_client,
    organization_id: str,
    request: ChatRequest,
    messages: list[dict],
    result: dict,
    current_user: User,
) -> None:
    user_msg = messages[-1]
    assistant_msg = {
        "role": "assistant",
        "content": result.get("text"),
        "thinking": result.get("thinking"),
    }
    await ad.agent.agent_threads.append_turn(
        analytiq_client,
        request.thread_id,
        organization_id,
        current_user.user_id,
        [user_msg, assistant_msg],
        truncate_to=request.truncate_thread_to_message_count,
    )


@account_chat_router.post("/v0/account/chat")
async def post_chat(
    request: ChatRequest = Body(...),
    current_user: User = Depends(get_current_user),
):
    """Start or continue an anti-coach chat turn (no tools)."""
    if ad.llm.is_embedding_model(request.model):
        raise HTTPException(
            status_code=400,
            detail="Embedding models are not allowed for chat. Please select a chat model.",
        )
    if not request.messages:
        raise HTTPException(status_code=400, detail="messages required")

    organization_id = await resolve_private_org_id(current_user.user_id)
    analytiq_client = ad.common.get_analytiq_client()
    if request.thread_id:
        await _require_account_thread(
            analytiq_client, organization_id, request.thread_id, current_user.user_id
        )

    messages = [m.model_dump() for m in request.messages]

    if request.stream:
        queue: asyncio.Queue[tuple[str, Any]] = asyncio.Queue()
        streamed_done: list[bool] = [False]

        async def stream_handler(event_type: str, payload: Any) -> None:
            if event_type == "done":
                streamed_done[0] = True
            await queue.put((event_type, payload))

        async def run_turn() -> None:
            try:
                result = await ad.agent.run_chat_turn(
                    analytiq_client=analytiq_client,
                    organization_id=organization_id,
                    messages=messages,
                    model=request.model,
                    stream_handler=stream_handler,
                )
                if "error" in result:
                    await queue.put(("error", result["error"]))
                elif not streamed_done[0]:
                    await queue.put(("done", result))
            except Exception as e:
                logger.exception("Account chat turn failed during streaming")
                await queue.put(("error", str(e)))

        async def generate_sse():
            task = asyncio.create_task(run_turn())
            try:
                while True:
                    event_type, payload = await queue.get()
                    if event_type == "error":
                        yield f"data: {json.dumps({'type': 'error', 'error': payload})}\n\n"
                        break
                    if event_type == "assistant_text_chunk":
                        p = payload if isinstance(payload, dict) else {"chunk": payload}
                        yield f"data: {json.dumps({'type': 'assistant_text_chunk', 'chunk': p.get('chunk', ''), 'round_index': p.get('round_index', 0)})}\n\n"
                    elif event_type == "thinking_chunk":
                        p = payload if isinstance(payload, dict) else {"chunk": payload}
                        yield f"data: {json.dumps({'type': 'thinking_chunk', 'chunk': p.get('chunk', ''), 'round_index': p.get('round_index', 0)})}\n\n"
                    elif event_type == "assistant_text_done":
                        p = payload if isinstance(payload, dict) else {"full_text": payload}
                        yield f"data: {json.dumps({'type': 'assistant_text_done', 'full_text': p.get('full_text', ''), 'round_index': p.get('round_index', 0)})}\n\n"
                    elif event_type == "thinking_done":
                        p = payload if isinstance(payload, dict) else {"thinking": payload}
                        yield f"data: {json.dumps({'type': 'thinking_done', 'thinking': p.get('thinking', ''), 'round_index': p.get('round_index', 0)})}\n\n"
                    elif event_type == "done":
                        if request.thread_id and messages:
                            await _append_turn(
                                analytiq_client, organization_id, request, messages, payload, current_user
                            )
                        yield f"data: {json.dumps({'type': 'done', 'result': payload})}\n\n"
                        break
            finally:
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass

        return StreamingResponse(
            generate_sse(),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )

    result = await ad.agent.run_chat_turn(
        analytiq_client=analytiq_client,
        organization_id=organization_id,
        messages=messages,
        model=request.model,
    )
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    if request.thread_id and messages:
        await _append_turn(
            analytiq_client, organization_id, request, messages, result, current_user
        )
    return result


@account_chat_router.get("/v0/account/chat/threads", response_model=list[ThreadSummary])
async def list_threads(
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
):
    organization_id = await resolve_private_org_id(current_user.user_id)
    items = await ad.agent.agent_threads.list_threads(
        ad.common.get_analytiq_client(),
        organization_id,
        current_user.user_id,
        limit=limit,
        account=True,
    )
    return [ThreadSummary(**x) for x in items]


@account_chat_router.post("/v0/account/chat/threads", response_model=CreateThreadResponse)
async def create_thread(
    body: CreateThreadBody | None = Body(None),
    current_user: User = Depends(get_current_user),
):
    organization_id = await resolve_private_org_id(current_user.user_id)
    title = body.title if body else None
    thread_id = await ad.agent.agent_threads.create_thread(
        ad.common.get_analytiq_client(),
        organization_id,
        current_user.user_id,
        title=title,
        account=True,
    )
    return CreateThreadResponse(thread_id=thread_id)


@account_chat_router.get("/v0/account/chat/threads/{thread_id}", response_model=ThreadDetail)
async def get_thread(
    thread_id: str,
    current_user: User = Depends(get_current_user),
):
    organization_id = await resolve_private_org_id(current_user.user_id)
    thread_doc = await ad.agent.agent_threads.get_thread_scoped(
        ad.common.get_analytiq_client(),
        thread_id,
        organization_id,
        current_user.user_id,
        account=True,
    )
    if not thread_doc:
        raise HTTPException(status_code=404, detail="Thread not found")
    return ThreadDetail(**thread_doc)


@account_chat_router.delete("/v0/account/chat/threads/{thread_id}")
async def delete_thread(
    thread_id: str,
    current_user: User = Depends(get_current_user),
):
    organization_id = await resolve_private_org_id(current_user.user_id)
    deleted = await ad.agent.agent_threads.delete_thread(
        ad.common.get_analytiq_client(),
        thread_id,
        organization_id,
        current_user.user_id,
        account=True,
    )
    if not deleted:
        raise HTTPException(status_code=404, detail="Thread not found")
    return {"ok": True}
