# Anti-Coach — Product Pivot Plan

Turn the existing DocRouter stack into **anti-coach**: a single-user AI chatbot
with account signup, model selection, a fixed system prompt, and Stripe billing.
Keep Next.js, FastAPI, MongoDB, and Stripe. Strip most product surface area;
reuse the document chat agent as the starting point for a tool-free chat runtime.

**Status (v1 implementation):** Phases 0–2 landed. Account chat API
(`/v0/account/chat`), `/chat` UI, hidden 1:1 org, branding, billing at
`/settings/subscription`. DocRouter routes still exist in the backend/frontend
tree but are removed from primary nav (Phase 3 cleanup remaining).

---

## 1. Goals

1. Ship a general chatbot product named **anti-coach**.
2. Keep the existing stack: Next.js frontend, FastAPI backend, MongoDB, Stripe/SPU.
3. After signup / sign-in, the user lands in a private chat UI (no shared workspace).
4. Chat uses a **basic system prompt**, **user-selectable LLM** from the chat-agent
   allowlist, and **no tools** in v1.
5. Delete or stop exposing DocRouter feature areas that are not needed for chat.

### Non-goals (v1)

- Multi-user orgs, invitations, org switcher, team/enterprise sharing.
- Document upload / OCR / schemas / prompts / tags / forms / flows / knowledge bases.
- Agent tools (read or write), tool approval UI, document-scoped context.
- User-editable system prompts (admin/code-owned prompt only).
- Full re-key of Mongo from `organization_id` → `user_id` (see §4).
- Public marketing redesign beyond a minimal chat-first shell (can follow later).

---

## 2. Product shape

### 2.1 User journey

```
Sign up / sign in
       │
       ▼
Private account (1:1 hidden tenant)
       │
       ▼
Chat home ── threads sidebar ── message stream ── model picker ── composer
       │
       ▼
Settings: profile, subscription / credits
```

1. User creates an account (email/password or existing OAuth).
2. Backend ensures exactly one private tenant for that user (today’s individual org).
3. User is redirected to `/chat` (not `/orgs/{id}/docs/...`).
4. User starts or resumes a thread, picks a model, chats.
5. Usage meters via existing SPU / Stripe subscription on that private tenant.

### 2.2 Anti-coach persona

- Product name and UI branding: **anti-coach**.
- System prompt: a single, versioned string owned by the backend (e.g. witty,
  contrarian, or “anti-advice” coach — exact copy TBD in implementation).
- No tools, no document context, no @mentions.
- Conversations are account-scoped threads only.

### 2.3 What the UI looks like

A standard chatbot layout:

| Region | Behavior |
| ------ | -------- |
| Left (or drawer) | Thread list: new chat, rename/title, delete |
| Center | Message history + streaming assistant replies |
| Top / composer | Model drop-down from `chat_only` models |
| Header | Brand, user menu → profile / subscription / sign out |
| Absent | Org switcher, docs/schemas/flows nav, tool cards, PDF panel |

Reuse and slim `AgentTab` / `AgentChat` / `AgentMessage` / `ThreadDropdown` /
`useAgentChat` rather than rewriting chat UX from scratch. Remove tool approval,
dictation-optional, extraction panel, and document coupling.

---

## 3. Keep vs remove

### 3.1 Keep (adapt)

| Area | Why |
| ---- | --- |
| Next.js App Router + NextAuth | Auth and app shell |
| FastAPI + `analytiq_data` | API, LLM, payments, Mongo |
| MongoDB | Users, sessions, threads, payments, LLM provider config |
| Stripe + SPU metering | Monetization |
| Document chat agent core | Loop, streaming SSE, threads, model picker plumbing |
| LLM provider / chat-agent model allowlist | Model selection |
| Account settings: profile, subscription | Billing + identity |
| System admin LLM manager (optional) | Ops: enable models / API keys |

### 3.2 Remove or hide from product UI/API (v1)

| Area | Notes |
| ---- | ----- |
| Documents, OCR, PDF viewer | Entire `/docs` product surface |
| Schemas, prompts, tags, forms | Extraction config |
| Flows + flow chat trigger | Workflow editor |
| Knowledge bases + KB chat | Separate chat runtime |
| Org members, invitations, org switcher | Multi-tenant sharing |
| Team / enterprise org types (UX) | Personal accounts only |
| Agent tools + approve endpoint | No tools in v1 |
| Document-tied system prompt / mentions | Replace with fixed anti-coach prompt |
| SDK examples / connectors aimed at DocRouter | Out of product scope for now |
| Worker queues for OCR/extraction/flows | Not needed for chat-only; can keep process idle or trim later |

Prefer **delete unused routes/components** where cheap; otherwise gate behind
feature flags / remove from nav and stop registering routers. Do not leave dead
nav links.

---

## 4. Account model (no workspace)

### 4.1 Decision: hidden 1:1 tenant

**Keep** an internal `organizations` document per user (`type: individual`,
single member). Do **not** expose org IDs, switchers, or membership in the UI.

Rationale: Stripe customers, SPU usage, LLM config, and most collections are
already keyed by `organization_id`. A full user-id re-key is a large migration
and is out of scope for v1.

### 4.2 Rules

- On signup / OAuth / email verify: create exactly one individual org if missing
  (already largely true).
- Block creating additional orgs; block inviting members; block upgrading to
  team/enterprise in product UI (Stripe tiers can stay as personal plans).
- Frontend never shows `organizationId` in URLs; API clients resolve the user’s
  sole org server-side or via a thin account-scoped facade.
- Auth: keep NextAuth + FastAPI token exchange; drop invitation accept flow from
  primary UX.

### 4.3 Later (optional)

Re-key payments and chat threads to `user_id` and collapse the org abstraction.
Not required to launch anti-coach.

---

## 5. Chat architecture

### 5.1 Target API (account-scoped)

Replace document-scoped agent routes with chat routes that do not require a
document:

| Method | Path (proposed) | Purpose |
| ------ | --------------- | ------- |
| `POST` | `/v0/account/chat` | Send turn (`stream` SSE or JSON) |
| `GET` | `/v0/account/chat/threads` | List threads |
| `POST` | `/v0/account/chat/threads` | Create thread |
| `GET` | `/v0/account/chat/threads/{id}` | Load thread |
| `DELETE` | `/v0/account/chat/threads/{id}` | Delete thread |
| `GET` | `/v0/account/llm/models?chat_agent_only=true` | Model picker |

Auth: logged-in user only; resolve private `organization_id` inside the route
for billing and any lingering org-scoped LLM keys.

Request body (minimal):

```json
{
  "thread_id": "...",
  "message": "user text",
  "model": "claude-sonnet-4-6",
  "stream": true
}
```

No `document_id`, `mentions`, `auto_approve_tools`, or approve round-trip.

### 5.2 Runtime

Reuse `analytiq_data.agent.agent_loop` with tools disabled:

1. Load thread messages (cap unchanged or raised slightly; still trim).
2. Build system message from **anti-coach prompt** (static; no OCR / extraction).
3. Call LiteLLM chat completion (streaming) via existing LLM stack.
4. Append assistant message; charge SPU as today.
5. Persist to `chat_threads`.

Implementation options (pick one in implementation):

- **A (preferred):** Add a `tools_enabled=False` path in `run_agent_turn` / a thin
  `run_chat_turn` that skips `tool_registry` and approval session state.
- **B:** Call `ad.llm.run_llm_chat` directly from the new route and only reuse
  thread CRUD + SSE shaping from the agent package.

Prefer **A** if streaming / thinking / SPU hooks already match the agent loop;
prefer **B** if the agent loop is too document-coupled.

### 5.3 System prompt

New module (e.g. `analytiq_data/agent/anti_coach_prompt.py`) exporting a constant
or small builder:

- Product identity and tone.
- Safety / honesty boundaries as needed.
- No tool instructions, no DocRouter vocabulary.

Version the prompt in code (git history); no per-user override in v1.

### 5.4 Threads storage

Reuse collection `chat_threads` with a new ownership shape:

| Field | v1 value |
| ----- | -------- |
| `organization_id` | User’s private org (billing / isolation) |
| `created_by` | User id |
| `document_id` / `kb_id` | **Absent** (account chat) |
| `title` | Auto from first user message |
| `messages` | `user` / `assistant` only (no tool_calls) |

Indexes: add an account/org list index that does not require `document_id`
(extend or replace `chat_threads_doc_list_idx` usage). Filter list queries to
threads with neither `document_id` nor `kb_id`, or introduce `scope: "account"`.

Delete document/KB chat thread APIs from the public surface once unused.

### 5.5 Models

- Frontend loads models with `chat_agent_only` / `chat_only` (existing allowlist
  `litellm_models_chat_agent`).
- Default model: keep current default (`claude-sonnet-4-6`) or first allowlisted
  chat model.
- Reject embedding / non-chat models on POST (already partially enforced).

### 5.6 What to delete from agent code (after chat works)

- Tool registry + `tools/*` (or leave unregistered).
- `/chat/approve`, `/chat/tools`.
- Document `system_prompt.py` builder (OCR, mentions, extraction).
- Frontend `ToolCallCard`, auto-approve localStorage, extraction panel.

---

## 6. Frontend plan

### 6.1 Routes

| Route | Role |
| ----- | ---- |
| `/` | Landing or redirect to `/chat` if signed in |
| `/auth/signin`, register, verify-email | Keep; drop accept-invitation from primary flows |
| `/chat` | Main chatbot (default post-login) |
| `/chat?thread=…` | Optional deep link |
| `/settings/profile` | Account profile |
| `/settings/subscription` | Stripe plans / credits / usage (no org id in path) |
| `/settings/…` admin | Keep LLM manager for system admins only |

Remove or stop linking `/orgs/[organizationId]/{docs,tags,schemas,prompts,forms,flows,knowledge-bases,dashboard}`.

### 6.2 Components to adapt

| Source | Action |
| ------ | ------ |
| `components/agent/AgentTab.tsx` | Become chat page shell (threads + composer + model) |
| `useAgentChat.ts` | Point at `/v0/account/chat*`; drop tools/approve/doc id |
| `AgentChat.tsx` / `AgentMessage.tsx` | Keep; strip tool-call rendering |
| `ThreadDropdown.tsx` | Prefer persistent sidebar list for chatbot feel |
| `Layout.tsx` | Chat-only nav: Chat, Settings; remove DocRouter nav |
| `OrganizationSwitcher.tsx` | Remove from header |
| Org invitation / member UI | Remove |

### 6.3 Branding

- App title, metadata, logos, empty states → **anti-coach**.
- Chat empty state: short product line + example prompts (optional).
- Keep visual language compatible with existing MUI/Tailwind unless a redesign
  is scheduled separately.

---

## 7. Billing

- Keep Stripe webhook, checkout, portal, SPU credits, usage charts.
- Billing owner remains the user’s private org; UI copy says “your account”,
  never “organization”.
- Chat turns continue to deduct SPUs through existing LLM usage recording in the
  agent / LLM path.
- Subscription settings move under `/settings/subscription` and resolve the
  user’s sole org server-side.
- Plan catalog can stay individual-tier prices; hide team/enterprise upsells.

---

## 8. Backend cleanup map

### 8.1 New / keep

- `app/routes/` — new account chat router; keep `payments`, `users`, auth/oauth,
  `llm` (account models), email verify.
- `analytiq_data/agent/` — slim to chat turn + threads + anti-coach prompt.
- `analytiq_data/llm/` — keep.
- `analytiq_data/payments/` — keep.

### 8.2 Stop registering / delete when safe

Routers and packages for documents, OCR, schemas, prompts, tags, forms, flows,
knowledge bases, document agent tools, org invitations, multi-org CRUD beyond
the hidden 1:1 bootstrap.

Workers that only serve OCR/extraction/flows can be omitted from `make dev` for
anti-coach local runs once chat no longer depends on them.

### 8.3 Tests

- Port/adapt `test_chat_threads.py` and agent loop tests to tool-free account chat.
- Drop or skip document-tool / flows / KB suites from the default anti-coach CI
  path once those routers are gone.
- Add: signup → sole org → create thread → stream chat → SPU recorded.

---

## 9. Implementation phases

### Phase 0 — Spike (1–2 days)

- Account chat route that streams a reply with fixed system prompt and no tools.
- Persist to `chat_threads` without `document_id`.
- Minimal `/chat` page wired to it (can still sit under org URL temporarily).

### Phase 1 — Chat product shell

- Dedicated `/chat` UI (sidebar threads, model picker, streaming).
- Hide DocRouter nav; post-login redirect to `/chat`.
- Account-scoped thread APIs; remove tool UI.

### Phase 2 — Single-user account hardening

- Enforce one individual org; remove invitations / switcher / member admin from UX.
- Subscription page without org id in the URL.
- Copy/branding → anti-coach; system prompt finalized.

### Phase 3 — Delete dead weight

- Unregister/delete unused FastAPI routers and frontend app routes.
- Remove agent tools, document system prompt, KB/flow chat if unused.
- Trim tests and `make dev` services to chat + auth + payments + Mongo (+ LLM).

### Phase 4 — Polish (optional follow-ups)

- Landing page for anti-coach.
- Prompt versioning / A-B.
- Attachments, memory, or tools (reintroduce selectively).
- True `user_id` data model without org facade.

---

## 10. Risks and open decisions

| Topic | Recommendation |
| ----- | -------------- |
| Exact anti-coach system prompt / tone | Decide before Phase 2 branding freeze |
| Keep `organization_id` internally? | Yes for v1 |
| Reuse agent loop vs `run_llm_chat` | Spike in Phase 0; prefer simplest streaming + SPU path |
| Thinking / reasoning blocks in UI | Keep if models emit them; no special product requirement |
| Dictation | Optional; can drop for v1 |
| Rename packages / repo from DocRouter | Cosmetic; do later to avoid churn |
| On-prem / license docs | Out of scope; leave `docs/` historical files as-is unless conflicting |

---

## 11. Success criteria (v1)

1. New user can register, land on `/chat`, and complete a multi-turn streamed
   conversation with the anti-coach system prompt.
2. User can select among configured chat models.
3. Threads persist across sessions; no other user can see them.
4. No UI path to documents, flows, schemas, orgs, or invitations.
5. Stripe subscription / credits still work for that user’s private tenant.
6. Chat requests never register or invoke tools.

---

## 12. Key existing files (starting points)

**Frontend chat**

- `packages/typescript/frontend/src/components/agent/AgentTab.tsx`
- `packages/typescript/frontend/src/components/agent/useAgentChat.ts`
- `packages/typescript/frontend/src/components/agent/AgentChat.tsx`
- `packages/typescript/frontend/src/components/Layout.tsx`

**Backend agent / LLM / billing**

- `packages/python/app/routes/agent.py`
- `packages/python/analytiq_data/agent/agent_loop.py`
- `packages/python/analytiq_data/agent/system_prompt.py`
- `packages/python/analytiq_data/agent/threads.py`
- `packages/python/app/routes/llm.py`
- `packages/python/app/routes/payments.py`
- `packages/python/app/routes/orgs.py`
- `packages/typescript/frontend/src/auth.ts`

---

## 13. Summary

Anti-coach is DocRouter reduced to **auth + private account + Stripe + LLM chat**.
Keep the stack and the chat agent’s streaming/thread/model machinery; drop tools
and nearly all document-platform features; hide the org tenant behind a
personal account. Ship chat first (Phases 0–2), then delete the rest (Phase 3).
