"""Resolve the signed-in user's private (individual) organization for billing and chat."""

from __future__ import annotations

from fastapi import HTTPException

import analytiq_data as ad


async def resolve_private_org_id(user_id: str) -> str:
    """
    Return the user's sole individual organization id.
    Prefer type=individual; fall back to any membership if needed.
    """
    db = ad.common.get_async_db()
    org = await db.organizations.find_one(
        {"members.user_id": user_id, "type": "individual"},
        projection={"_id": 1},
    )
    if not org:
        org = await db.organizations.find_one(
            {"members.user_id": user_id},
            projection={"_id": 1},
        )
    if not org:
        raise HTTPException(
            status_code=404,
            detail="No account found. Please sign out and sign in again.",
        )
    return str(org["_id"])
