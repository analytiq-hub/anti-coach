'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import ArrowCircleUpIcon from '@mui/icons-material/ArrowCircleUp';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  useAccountChat,
  getMessagesBeforeTurn,
  type AccountChatMessage,
  type AccountThreadSummary,
} from './useAccountChat';
import ThinkingBlock from '@/components/agent/ThinkingBlock';

function relativeTime(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const sec = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (sec < 60) return 'now';
    if (sec < 3600) return `${Math.floor(sec / 60)}m`;
    if (sec < 86400) return `${Math.floor(sec / 3600)}h`;
    if (sec < 604800) return `${Math.floor(sec / 86400)}d`;
    return `${Math.floor(sec / 604800)}w`;
  } catch {
    return '';
  }
}

function MessageBubble({
  message,
  isLastAssistant,
  loading,
}: {
  message: AccountChatMessage;
  isLastAssistant: boolean;
  loading: boolean;
}) {
  const isUser = message.role === 'user';
  const showLiveThinking =
    !isUser && isLastAssistant && loading && !!message.thinking && !message.content?.trim();

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
        }`}
      >
        {!isUser && message.thinking && (
          <ThinkingBlock
            content={message.thinking}
            live={showLiveThinking}
            defaultExpanded={showLiveThinking}
          />
        )}
        {isUser ? (
          <div className="whitespace-pre-wrap">{message.content}</div>
        ) : (
          <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content || (loading && isLastAssistant ? '' : '')}
            </ReactMarkdown>
            {loading && isLastAssistant && !message.content?.trim() && !message.thinking?.trim() && (
              <span className="inline-block w-2 h-4 bg-gray-400 animate-pulse rounded-sm" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChatPage() {
  const {
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
  } = useAccountChat();

  const [input, setInput] = useState('');
  const [showModelDropUp, setShowModelDropUp] = useState(false);
  const modelDropRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [editingTurn, setEditingTurn] = useState<number | null>(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    loadThreads();
    loadModels();
  }, [loadThreads, loadModels]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages, state.loading]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modelDropRef.current && !modelDropRef.current.contains(e.target as Node)) {
        setShowModelDropUp(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSend = () => {
    const text = input.trim();
    if (!text || state.loading) return;
    setInput('');
    sendMessage(text);
  };

  const handleSelectThread = useCallback(
    (t: AccountThreadSummary) => {
      if (t.id === state.threadId) return;
      loadThread(t.id);
    },
    [state.threadId, loadThread]
  );

  const handleEditAndResubmit = (newContent: string, turnIndex: number) => {
    const history = getMessagesBeforeTurn(state.messages, turnIndex);
    setEditingTurn(null);
    sendMessageWithHistory(history, newContent);
  };

  // Build turns for edit UX
  const turns: Array<{ user: AccountChatMessage; assistants: AccountChatMessage[]; turnIndex: number }> = [];
  {
    let turnIndex = 0;
    let current: (typeof turns)[0] | null = null;
    for (const m of state.messages) {
      if (m.role === 'user') {
        current = { user: m, assistants: [], turnIndex };
        turns.push(current);
        turnIndex++;
      } else if (current) {
        current.assistants.push(m);
      }
    }
  }

  const lastAssistantIndex = (() => {
    for (let i = state.messages.length - 1; i >= 0; i--) {
      if (state.messages[i].role === 'assistant') return i;
    }
    return -1;
  })();

  return (
    <div className="flex h-full min-h-0 w-full bg-white">
      {/* Thread sidebar */}
      <aside className="hidden sm:flex w-64 flex-col border-r border-gray-200 bg-gray-50 shrink-0">
        <div className="p-3 border-b border-gray-200">
          <button
            type="button"
            onClick={startNewChat}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <AddIcon sx={{ fontSize: 18 }} />
            New chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {state.threadsLoading && state.threads.length === 0 ? (
            <div className="px-3 py-2 text-xs text-gray-500">Loading…</div>
          ) : state.threads.length === 0 ? (
            <div className="px-3 py-2 text-xs text-gray-500">No conversations yet</div>
          ) : (
            state.threads.map((t) => (
              <div
                key={t.id}
                className={`group flex items-center gap-1 mx-2 mb-0.5 rounded-md ${
                  t.id === state.threadId ? 'bg-blue-100' : 'hover:bg-gray-100'
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleSelectThread(t)}
                  className="flex-1 min-w-0 text-left px-2.5 py-2"
                >
                  <div className="text-sm text-gray-800 truncate">{t.title || 'New chat'}</div>
                  <div className="text-[10px] text-gray-400">{relativeTime(t.updated_at)}</div>
                </button>
                <button
                  type="button"
                  onClick={() => deleteThread(t.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-600 shrink-0"
                  title="Delete"
                >
                  <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                </button>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Main chat */}
      <div className="flex flex-1 flex-col min-w-0 min-h-0">
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6">
          <div className="mx-auto max-w-2xl">
            {state.messages.length === 0 && !state.loading ? (
              <div className="flex flex-col items-center justify-center pt-24 text-center">
                <h1 className="text-3xl font-semibold tracking-tight text-gray-900 mb-2">
                  anti-coach
                </h1>
                <p className="text-gray-500 text-sm max-w-sm mb-8">
                  A contrarian chat partner. Ask anything — expect pushback, not pep talks.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {[
                    'Talk me out of quitting my job',
                    'Is this a good idea or am I rationalizing?',
                    'What am I not seeing here?',
                  ].map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => sendMessage(prompt)}
                      className="rounded-full border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              turns.map((turn) => (
                <div key={turn.turnIndex} className="mb-2">
                  {editingTurn === turn.turnIndex ? (
                    <div className="mb-4">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        rows={3}
                        className="w-full rounded-lg border border-blue-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                      <div className="flex gap-2 mt-2 justify-end">
                        <button
                          type="button"
                          onClick={() => setEditingTurn(null)}
                          className="text-xs text-gray-500 px-2 py-1"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEditAndResubmit(editText, turn.turnIndex)}
                          disabled={!editText.trim() || state.loading}
                          className="text-xs bg-blue-600 text-white rounded px-3 py-1 disabled:opacity-50"
                        >
                          Resubmit
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="group relative"
                      onDoubleClick={() => {
                        setEditingTurn(turn.turnIndex);
                        setEditText(turn.user.content ?? '');
                      }}
                    >
                      <MessageBubble message={turn.user} isLastAssistant={false} loading={false} />
                    </div>
                  )}
                  {turn.assistants.map((a, i) => {
                    const msgIndex = state.messages.indexOf(a);
                    return (
                      <MessageBubble
                        key={`${turn.turnIndex}-a-${i}`}
                        message={a}
                        isLastAssistant={msgIndex === lastAssistantIndex}
                        loading={state.loading}
                      />
                    );
                  })}
                </div>
              ))
            )}
            {state.error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700 mb-4">
                {state.error}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Composer */}
        <div className="shrink-0 border-t border-gray-200 bg-white">
          <div className="mx-auto max-w-2xl px-4 pt-3 pb-2">
            <div className="rounded-xl border border-gray-300 bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Message anti-coach…"
                rows={2}
                className="w-full min-h-[3rem] max-h-[10rem] py-2.5 px-3 text-sm resize-y border-0 focus:outline-none focus:ring-0 bg-transparent"
                disabled={state.loading}
              />
            </div>
            <div className="flex items-center justify-between pt-2 pb-3 gap-2">
              <div className="relative" ref={modelDropRef}>
                <button
                  type="button"
                  onClick={() => {
                    setShowModelDropUp((v) => !v);
                    if (!showModelDropUp) loadModels();
                  }}
                  className="flex items-center gap-0.5 text-[11px] text-gray-500 hover:text-gray-700 py-0.5"
                  title="Model"
                >
                  <KeyboardArrowUpIcon
                    sx={{ fontSize: 14 }}
                    className={showModelDropUp ? '' : 'rotate-180'}
                  />
                  <span className="max-w-[160px] truncate">{state.model}</span>
                </button>
                {showModelDropUp && (
                  <div className="absolute left-0 bottom-full mb-1 z-50 rounded-md border border-gray-200 bg-white shadow-lg py-1 min-w-[200px] max-h-[50vh] overflow-y-auto">
                    {state.availableModels.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-gray-500">Loading models…</div>
                    ) : (
                      state.availableModels.map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => {
                            setModel(m);
                            setShowModelDropUp(false);
                          }}
                          className={`block w-full text-left px-3 py-1.5 text-xs ${
                            m === state.model
                              ? 'bg-blue-50 text-blue-700 font-medium'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {m}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              {state.loading ? (
                <button
                  type="button"
                  onClick={cancelRequest}
                  className="text-gray-500 hover:text-red-600"
                  title="Stop"
                >
                  <StopCircleIcon />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="text-blue-600 disabled:text-gray-300"
                  title="Send"
                >
                  <ArrowCircleUpIcon />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
