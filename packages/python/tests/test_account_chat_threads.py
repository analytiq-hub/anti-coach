"""Account-scoped chat thread helpers (anti-coach)."""

import pytest
from bson import ObjectId

import analytiq_data as ad
from tests.conftest_utils import TEST_USER_ID, TEST_ORG_ID


@pytest.mark.asyncio
async def test_account_thread_crud(test_db):
    """Create, list, get, append, delete account-scoped threads."""
    client = ad.common.get_analytiq_client()
    org_id = TEST_ORG_ID
    user_id = TEST_USER_ID

    thread_id = await ad.agent.agent_threads.create_thread(
        client, org_id, user_id, title="New chat", account=True
    )
    assert thread_id

    listed = await ad.agent.agent_threads.list_threads(
        client, org_id, user_id, account=True
    )
    assert any(t["id"] == thread_id for t in listed)

    detail = await ad.agent.agent_threads.get_thread_scoped(
        client, thread_id, org_id, user_id, account=True
    )
    assert detail is not None
    assert detail["title"] == "New chat"

    # Document scope must not see account threads
    missing = await ad.agent.agent_threads.get_thread_scoped(
        client, thread_id, org_id, user_id, document_id=str(ObjectId())
    )
    assert missing is None

    await ad.agent.agent_threads.append_turn(
        client,
        thread_id,
        org_id,
        user_id,
        [
            {"role": "user", "content": "Hello anti-coach"},
            {"role": "assistant", "content": "Sure."},
        ],
    )
    detail = await ad.agent.agent_threads.get_thread(
        client, thread_id, org_id, user_id
    )
    assert len(detail["messages"]) == 2
    assert detail["title"] == "Hello anti-coach"

    deleted = await ad.agent.agent_threads.delete_thread(
        client, thread_id, org_id, user_id, account=True
    )
    assert deleted
    assert (
        await ad.agent.agent_threads.get_thread_scoped(
            client, thread_id, org_id, user_id, account=True
        )
        is None
    )


def test_anti_coach_prompt_nonempty():
    from analytiq_data.agent.anti_coach_prompt import get_anti_coach_system_prompt

    prompt = get_anti_coach_system_prompt()
    assert "anti-coach" in prompt.lower()
    assert len(prompt) > 50
