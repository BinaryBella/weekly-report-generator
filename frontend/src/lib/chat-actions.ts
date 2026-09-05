"use server";

import { apiFetch, readErrorDetail } from "@/lib/api";
import { getAccessToken } from "@/lib/session";
import type { ChatMessage, ChatSession, TeamSummary } from "@/lib/types";

const EXPIRED = "Your session has expired. Sign in again.";

/**
 * Translate the two chat-specific failure modes (backend
 * `app/services/chat_service.py`) into copy a Manager can act on; every other
 * status keeps the backend's own detail message.
 */
function friendlyDetail(status: number, detail: string): string {
  if (status === 503) {
    return "The AI assistant isn't configured yet — ask an administrator to set an OpenAI API key.";
  }
  if (status === 502) {
    return "The AI assistant couldn't reach OpenAI just now. Please try again.";
  }
  return detail;
}

/** List the caller's chat threads, most recently active first. Backend: `GET /chat/sessions`. */
export async function listChatSessionsAction(): Promise<{
  ok: boolean;
  error?: string;
  sessions?: ChatSession[];
}> {
  const token = await getAccessToken();
  if (!token) return { ok: false, error: EXPIRED };

  const res = await apiFetch("/chat/sessions", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    return {
      ok: false,
      error: friendlyDetail(
        res.status,
        await readErrorDetail(res, "Could not load chat sessions.")
      ),
    };
  }
  const body = (await res.json()) as { items: ChatSession[] };
  return { ok: true, sessions: body.items };
}

/** Start a new chat thread. Backend: `POST /chat/sessions`. */
export async function createChatSessionAction(title?: string): Promise<{
  ok: boolean;
  error?: string;
  session?: ChatSession;
}> {
  const token = await getAccessToken();
  if (!token) return { ok: false, error: EXPIRED };

  const res = await apiFetch("/chat/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title: title || undefined }),
  });
  if (!res.ok) {
    return {
      ok: false,
      error: friendlyDetail(
        res.status,
        await readErrorDetail(res, "Could not start a new chat.")
      ),
    };
  }
  return { ok: true, session: (await res.json()) as ChatSession };
}

/** Load a thread's message history. Backend: `GET /chat/sessions/{id}/messages`. */
export async function getChatMessagesAction(sessionId: string): Promise<{
  ok: boolean;
  error?: string;
  messages?: ChatMessage[];
}> {
  const token = await getAccessToken();
  if (!token) return { ok: false, error: EXPIRED };

  const res = await apiFetch(`/chat/sessions/${sessionId}/messages`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    return {
      ok: false,
      error: friendlyDetail(
        res.status,
        await readErrorDetail(res, "Could not load the conversation.")
      ),
    };
  }
  const body = (await res.json()) as { items: ChatMessage[] };
  return { ok: true, messages: body.items };
}

/**
 * Ask the assistant a question in an existing thread. Backend:
 * `POST /chat/sessions/{id}/messages` — the model decides which read-only
 * data tools to call (see backend `app/services/ai_tools.py`) before replying.
 */
export async function sendChatMessageAction(
  sessionId: string,
  content: string
): Promise<{ ok: boolean; error?: string; message?: ChatMessage }> {
  const token = await getAccessToken();
  if (!token) return { ok: false, error: EXPIRED };

  const res = await apiFetch(`/chat/sessions/${sessionId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) {
    return {
      ok: false,
      error: friendlyDetail(
        res.status,
        await readErrorDetail(res, "The assistant could not reply just now.")
      ),
    };
  }
  return { ok: true, message: (await res.json()) as ChatMessage };
}

/**
 * Generate the one-shot AI team-activity summary for a date range. Backend:
 * `POST /chat/summary`.
 */
export async function generateTeamSummaryAction(input: {
  projectNameOrId?: string | null;
  dateFrom: string;
  dateTo: string;
}): Promise<{ ok: boolean; error?: string; summary?: TeamSummary }> {
  const token = await getAccessToken();
  if (!token) return { ok: false, error: EXPIRED };

  const res = await apiFetch("/chat/summary", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      project_name_or_id: input.projectNameOrId || undefined,
      date_from: input.dateFrom,
      date_to: input.dateTo,
    }),
  });
  if (!res.ok) {
    return {
      ok: false,
      error: friendlyDetail(
        res.status,
        await readErrorDetail(res, "Could not generate the summary.")
      ),
    };
  }
  return { ok: true, summary: (await res.json()) as TeamSummary };
}
