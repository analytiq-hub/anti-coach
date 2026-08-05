'use client';

import { useState, useCallback, useRef } from 'react';
import { apiClient, getApiErrorMsg, getSessionToken } from '@/utils/api';

const API_BASE =
  typeof process !== 'undefined'
    ? process.env.NEXT_PUBLIC_FASTAPI_FRONTEND_URL || '/fastapi'
    : '/fastapi';

const CHAT_BASE = '/v0/account/chat';

export interface AccountChatMessage {
  role: 'user' | 'assistant';
  content: string | null;
  thinking?: string | null;
}

export interface AccountThreadSummary {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface AccountChatState {
  messages: AccountChatMessage[];
  loading: boolean;
  error: string | null;
  model: string;
  availableModels: string[];
  threadId: string | null;
  threads: AccountThreadSummary[];
  threadsLoading: boolean;
}

const DEFAULT_MODEL = 'claude-sonnet-4-6';

export function getMessagesBeforeTurn(
  messages: AccountChatMessage[],
  turnIndex: number
): AccountChatMessage[] {
  if (turnIndex <= 0) return [];
  let userCount = 0;
  for (let i = 0; i < messages.length; i++) {
    if (messages[i].role === 'user') {
      if (userCount === turnIndex) return messages.slice(0, i);
      userCount++;
    }
  }
  return messages.slice(0, messages.length);
}

function messageFromApi(m: {
  role: string;
  content?: string | null;
  thinking?: string | null;
}): AccountChatMessage {
  return {
    role: m.role as 'user' | 'assistant',
    content: m.content ?? null,
    thinking: m.thinking ?? undefined,
  };
}

export function useAccountChat() {
  const [messages, setMessages] = useState<AccountChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [threads, setThreads] = useState<AccountThreadSummary[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const cancelRequest = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setLoading(false);
    setError(null);
    setMessages((prev) => {
      let trimmed = prev;
      if (
        trimmed.length > 0 &&
        trimmed[trimmed.length - 1].role === 'assistant' &&
        !trimmed[trimmed.length - 1].content?.trim() &&
        !trimmed[trimmed.length - 1].thinking?.trim()
      ) {
        trimmed = trimmed.slice(0, -1);
      }
      if (trimmed.length > 0 && trimmed[trimmed.length - 1].role === 'user') {
        trimmed = trimmed.slice(0, -1);
      }
      return trimmed !== prev ? trimmed : prev;
    });
  }, []);

  const loadThreads = useCallback(async () => {
    setThreadsLoading(true);
    try {
      const { data } = await apiClient.get<AccountThreadSummary[]>(`${CHAT_BASE}/threads`);
      setThreads(Array.isArray(data) ? data : []);
    } catch {
      setThreads([]);
    } finally {
      setThreadsLoading(false);
    }
  }, []);

  const loadThread = useCallback(async (id: string) => {
    setThreadsLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get<{
        id: string;
        title: string;
        messages: Array<{ role: string; content?: string | null; thinking?: string | null }>;
      }>(`${CHAT_BASE}/threads/${id}`);
      setThreadId(data.id);
      setMessages((data.messages ?? []).map(messageFromApi));
    } catch (err) {
      setError(getApiErrorMsg(err) ?? 'Failed to load conversation');
    } finally {
      setThreadsLoading(false);
    }
  }, []);

  const createThread = useCallback(async (): Promise<string | null> => {
    try {
      const { data } = await apiClient.post<{ thread_id: string }>(`${CHAT_BASE}/threads`, {});
      const id = data.thread_id;
      setThreads((prev) => [
        {
          id,
          title: 'New chat',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        ...prev,
      ]);
      return id;
    } catch {
      return null;
    }
  }, []);

  const deleteThread = useCallback(
    async (id: string) => {
      try {
        await apiClient.delete(`${CHAT_BASE}/threads/${id}`);
        setThreads((prev) => prev.filter((t) => t.id !== id));
        if (threadId === id) {
          setThreadId(null);
          setMessages([]);
        }
      } catch (err) {
        setError(getApiErrorMsg(err) ?? 'Failed to delete conversation');
      }
    },
    [threadId]
  );

  const startNewChat = useCallback(() => {
    setThreadId(null);
    setMessages([]);
    setError(null);
  }, []);

  const loadModels = useCallback(async () => {
    try {
      const { data } = await apiClient.get<{
        chat_models?: Array<{ litellm_model?: string }>;
      }>('/v0/account/llm/models?chat_agent_only=true');
      const names = (data?.chat_models ?? [])
        .map((m) => m.litellm_model ?? '')
        .filter(Boolean);
      setAvailableModels(names);
      if (names.length > 0 && !names.includes(model)) {
        setModel(names[0]);
      }
    } catch {
      setAvailableModels([]);
    }
  }, [model]);

  const runStreamingChat = useCallback(
    async (
      body: Record<string, unknown>,
      controller: AbortController,
      onErrorRollback?: () => void
    ): Promise<void> => {
      const placeholder: AccountChatMessage = {
        role: 'assistant',
        content: '',
        thinking: undefined,
      };
      setMessages((prev) => [...prev, placeholder]);
      let hadError = false;
      try {
        const token = await getSessionToken();
        const url = `${API_BASE}${CHAT_BASE}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            Accept: 'text/event-stream',
            'Cache-Control': 'no-cache',
          },
          body: JSON.stringify(body),
          signal: controller.signal,
          credentials: 'include',
        });
        if (!res.ok) {
          const errBody = await res.text();
          let msg = `HTTP ${res.status}`;
          try {
            const j = JSON.parse(errBody);
            if (j.detail) msg = typeof j.detail === 'string' ? j.detail : JSON.stringify(j.detail);
          } catch {
            if (errBody) msg = errBody.slice(0, 200);
          }
          throw new Error(msg);
        }
        const reader = res.body?.getReader();
        if (!reader) throw new Error('No response body');
        const decoder = new TextDecoder();
        let buffer = '';
        let streamDone = false;
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';
            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              try {
                const data = JSON.parse(line.slice(6)) as {
                  type?: string;
                  error?: string;
                  thinking?: string;
                  chunk?: string;
                  full_text?: string;
                  result?: { text?: string; thinking?: string };
                };
                if (data.type === 'error') {
                  setError(data.error ?? 'Request failed');
                  setMessages((prev) => prev.slice(0, -1));
                  hadError = true;
                  streamDone = true;
                  break;
                }
                if (data.type === 'assistant_text_chunk' || data.type === 'text_chunk') {
                  const chunk = data.chunk ?? '';
                  setMessages((prev) => {
                    const next = [...prev];
                    const last = next[next.length - 1];
                    if (last?.role === 'assistant')
                      next[next.length - 1] = { ...last, content: (last.content ?? '') + chunk };
                    return next;
                  });
                }
                if (data.type === 'thinking_chunk') {
                  const chunk = data.chunk ?? '';
                  setMessages((prev) => {
                    const next = [...prev];
                    const last = next[next.length - 1];
                    if (last?.role === 'assistant')
                      next[next.length - 1] = { ...last, thinking: (last.thinking ?? '') + chunk };
                    return next;
                  });
                }
                if (data.type === 'assistant_text_done' && data.full_text !== undefined) {
                  setMessages((prev) => {
                    const next = [...prev];
                    const last = next[next.length - 1];
                    if (last?.role === 'assistant')
                      next[next.length - 1] = {
                        ...last,
                        content: data.full_text ?? last.content ?? '',
                      };
                    return next;
                  });
                }
                if (data.type === 'thinking_done' || data.type === 'thinking') {
                  const thinking = data.thinking ?? null;
                  setMessages((prev) => {
                    const next = [...prev];
                    const last = next[next.length - 1];
                    if (last?.role === 'assistant')
                      next[next.length - 1] = {
                        ...last,
                        thinking: thinking ?? last.thinking ?? null,
                      };
                    return next;
                  });
                }
                if (data.type === 'done' && data.result) {
                  const r = data.result;
                  setMessages((prev) => {
                    const next = [...prev];
                    const last = next[next.length - 1];
                    if (last?.role === 'assistant') {
                      const backendText = r.text != null && r.text !== '' ? r.text : null;
                      const streamedContent = last.content ?? null;
                      const finalContent =
                        streamedContent &&
                        (!backendText || streamedContent.length >= backendText.length)
                          ? streamedContent
                          : (backendText ?? streamedContent);
                      next[next.length - 1] = {
                        ...last,
                        content: finalContent,
                        thinking: r.thinking ?? last.thinking ?? undefined,
                      };
                    }
                    return next;
                  });
                  streamDone = true;
                  break;
                }
              } catch {
                // ignore malformed SSE line
              }
            }
            if (streamDone) break;
          }
        } finally {
          reader.releaseLock();
        }
        if (!hadError) await loadThreads();
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(getApiErrorMsg(err) ?? 'Failed to send message');
        if (onErrorRollback) onErrorRollback();
        else setMessages((prev) => prev.slice(0, -1));
      }
    },
    [loadThreads]
  );

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || loading) return;

      let currentThreadId = threadId;
      if (!currentThreadId) {
        const newId = await createThread();
        if (!newId) {
          setError('Failed to create conversation');
          return;
        }
        currentThreadId = newId;
        setThreadId(newId);
      }

      const userMsg: AccountChatMessage = { role: 'user', content: content.trim() };
      setMessages((prev) => [...prev, userMsg]);
      setError(null);
      setLoading(true);
      const controller = new AbortController();
      abortRef.current = controller;

      const messageListForApi = [
        ...messages.map((m) => ({ role: m.role, content: m.content ?? '' })),
        { role: 'user' as const, content: content.trim() },
      ];

      try {
        await runStreamingChat(
          {
            messages: messageListForApi,
            model,
            stream: true,
            thread_id: currentThreadId,
          },
          controller
        );
      } finally {
        abortRef.current = null;
        setLoading(false);
      }
    },
    [messages, model, loading, threadId, createThread, runStreamingChat]
  );

  const sendMessageWithHistory = useCallback(
    async (history: AccountChatMessage[], content: string) => {
      if (!content.trim() || loading) return;

      const trimmed = content.trim();
      let currentThreadId = threadId;
      if (!currentThreadId) {
        const newId = await createThread();
        if (!newId) {
          setError('Failed to create conversation');
          return;
        }
        currentThreadId = newId;
        setThreadId(newId);
      }

      const userMsg: AccountChatMessage = { role: 'user', content: trimmed };
      setMessages([...history, userMsg]);
      setError(null);
      setLoading(true);
      const controller = new AbortController();
      abortRef.current = controller;

      const messageListForApi = [
        ...history.map((m) => ({ role: m.role, content: m.content ?? '' })),
        { role: 'user' as const, content: trimmed },
      ];

      try {
        await runStreamingChat(
          {
            messages: messageListForApi,
            model,
            stream: true,
            thread_id: currentThreadId,
            truncate_thread_to_message_count: history.length,
          },
          controller,
          () => setMessages([...history])
        );
      } finally {
        abortRef.current = null;
        setLoading(false);
      }
    },
    [model, loading, threadId, createThread, runStreamingChat]
  );

  const state: AccountChatState = {
    messages,
    loading,
    error,
    model,
    availableModels,
    threadId,
    threads,
    threadsLoading,
  };

  return {
    state,
    sendMessage,
    sendMessageWithHistory,
    cancelRequest,
    setModel,
    loadModels,
    loadThreads,
    loadThread,
    deleteThread,
    startNewChat,
  };
}
