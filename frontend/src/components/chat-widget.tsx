"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, Plus, Send, Sparkles, X } from "lucide-react";

import {
  createChatSessionAction,
  generateTeamSummaryAction,
  getChatMessagesAction,
  listChatSessionsAction,
  sendChatMessageAction,
} from "@/lib/chat-actions";
import { mostRecentMonday, toISODate } from "@/lib/format";
import type { ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";

type Tab = "chat" | "summary";

/**
 * Manager-only AI assistant, mounted once in the authenticated layout and
 * gated there by `canManage` (it has no role check of its own). Two tabs
 * mirror the two backend capabilities: a persisted Q&A thread that lets the
 * model call read-only report/project tools (`POST
 * /chat/sessions/{id}/messages`, see backend `app/services/ai_tools.py`), and
 * a one-shot team-activity summary (`POST /chat/summary`).
 */
export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("chat");

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [initializing, setInitializing] = useState(false);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState("");
  const [chatError, setChatError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [dateFrom, setDateFrom] = useState(() => mostRecentMonday());
  const [dateTo, setDateTo] = useState(() => toISODate(new Date()));
  const [projectQuery, setProjectQuery] = useState("");
  const [summaryText, setSummaryText] = useState<string | null>(null);
  const [summaryPending, setSummaryPending] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // Lazily start (or resume) a conversation the first time the panel opens,
  // rather than on every mount — most managers will never click the button.
  useEffect(() => {
    if (!open || sessionId || initializing) return;
    setInitializing(true);
    (async () => {
      const list = await listChatSessionsAction();
      if (!list.ok) {
        setChatError(list.error ?? "Could not load the assistant.");
        setInitializing(false);
        return;
      }
      let active = list.sessions?.[0] ?? null;
      if (!active) {
        const created = await createChatSessionAction();
        if (!created.ok || !created.session) {
          setChatError(created.error ?? "Could not start a new chat.");
          setInitializing(false);
          return;
        }
        active = created.session;
      }
      setSessionId(active.id);
      const history = await getChatMessagesAction(active.id);
      if (history.ok) setMessages(history.messages ?? []);
      setInitializing(false);
    })();
  }, [open, sessionId, initializing]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function startNewChat() {
    setChatError(null);
    setInitializing(true);
    const created = await createChatSessionAction();
    if (!created.ok || !created.session) {
      setChatError(created.error ?? "Could not start a new chat.");
      setInitializing(false);
      return;
    }
    setSessionId(created.session.id);
    setMessages([]);
    setInitializing(false);
  }

  async function send() {
    const content = draft.trim();
    if (!content || !sessionId || sending) return;

    setDraft("");
    setChatError(null);
    // Optimistic: the backend only returns the assistant's reply, so show the
    // user's own turn immediately rather than waiting on the round trip.
    setMessages((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}`,
        role: "user",
        content,
        created_at: new Date().toISOString(),
      },
    ]);
    setSending(true);
    const res = await sendChatMessageAction(sessionId, content);
    setSending(false);
    if (!res.ok || !res.message) {
      setChatError(res.error ?? "The assistant could not reply just now.");
      return;
    }
    setMessages((prev) => [...prev, res.message as ChatMessage]);
  }

  async function generateSummary() {
    setSummaryError(null);
    setSummaryText(null);
    if (dateFrom > dateTo) {
      setSummaryError("The start date must be before the end date.");
      return;
    }
    setSummaryPending(true);
    const res = await generateTeamSummaryAction({
      projectNameOrId: projectQuery.trim() || null,
      dateFrom,
      dateTo,
    });
    setSummaryPending(false);
    if (!res.ok || !res.summary) {
      setSummaryError(res.error ?? "Could not generate the summary.");
      return;
    }
    setSummaryText(res.summary.summary);
  }

  return (
    <>
      <Button
        type="button"
        size="icon"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close AI assistant" : "Open AI assistant"}
        className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-lg"
      >
        {open ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </Button>

      {open ? (
        <div
          role="dialog"
          aria-label="AI assistant"
          className="fixed bottom-24 right-6 z-40 flex h-[32rem] max-h-[calc(100vh-8rem)] w-[23rem] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-lg border bg-card shadow-xl"
        >
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2 font-semibold text-primary">
              <Sparkles className="h-4 w-4" />
              AI assistant
            </div>
            <div className="flex gap-1 rounded-md bg-muted p-0.5 text-sm">
              <button
                type="button"
                onClick={() => setTab("chat")}
                className={cn(
                  "rounded px-2 py-1 font-medium transition-colors",
                  tab === "chat"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground"
                )}
              >
                Chat
              </button>
              <button
                type="button"
                onClick={() => setTab("summary")}
                className={cn(
                  "rounded px-2 py-1 font-medium transition-colors",
                  tab === "summary"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground"
                )}
              >
                Summary
              </button>
            </div>
          </div>

          {tab === "chat" ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex items-center justify-between gap-2 border-b px-4 py-2">
                <p className="text-xs text-muted-foreground">
                  Ask about your team&apos;s reports — e.g. &quot;what did the
                  design team work on last week?&quot;
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={startNewChat}
                  disabled={initializing}
                  className="shrink-0"
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  New
                </Button>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
                {initializing && messages.length === 0 ? (
                  <div className="flex justify-center py-8">
                    <Spinner size="sm" className="text-muted-foreground" />
                  </div>
                ) : messages.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Ask me anything about your team&apos;s weekly reports.
                  </p>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className={cn(
                        "flex",
                        m.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm",
                          m.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground"
                        )}
                      >
                        {m.content}
                      </div>
                    </div>
                  ))
                )}
                {sending ? (
                  <div className="flex justify-start">
                    <div className="rounded-lg bg-muted px-3 py-2">
                      <Spinner size="sm" className="text-muted-foreground" />
                    </div>
                  </div>
                ) : null}
                <div ref={bottomRef} />
              </div>

              {chatError ? (
                <Alert variant="destructive" className="mx-4 mb-2 py-2">
                  <AlertDescription className="text-xs">
                    {chatError}
                  </AlertDescription>
                </Alert>
              ) : null}

              <div className="flex items-end gap-2 border-t p-3">
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder="Ask a question…"
                  rows={1}
                  className="min-h-0 resize-none py-2"
                  disabled={!sessionId || sending}
                />
                <Button
                  type="button"
                  size="icon"
                  onClick={send}
                  disabled={!sessionId || sending || !draft.trim()}
                  aria-label="Send"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
              <p className="text-xs text-muted-foreground">
                Summarise completed work, recurring blockers, and workload
                imbalance for a date range.
              </p>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="chat-summary-from" className="text-xs">
                    From
                  </Label>
                  <Input
                    id="chat-summary-from"
                    type="date"
                    value={dateFrom}
                    max={dateTo}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="chat-summary-to" className="text-xs">
                    To
                  </Label>
                  <Input
                    id="chat-summary-to"
                    type="date"
                    value={dateTo}
                    min={dateFrom}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="chat-summary-project" className="text-xs">
                  Project (optional)
                </Label>
                <Input
                  id="chat-summary-project"
                  value={projectQuery}
                  onChange={(e) => setProjectQuery(e.target.value)}
                  placeholder="All projects"
                />
              </div>

              <Button
                type="button"
                onClick={generateSummary}
                disabled={summaryPending}
              >
                {summaryPending ? (
                  <Spinner size="sm" className="mr-2" />
                ) : null}
                {summaryPending ? "Generating…" : "Generate summary"}
              </Button>

              {summaryError ? (
                <Alert variant="destructive" className="py-2">
                  <AlertDescription className="text-xs">
                    {summaryError}
                  </AlertDescription>
                </Alert>
              ) : null}

              {summaryText ? (
                <div className="whitespace-pre-wrap rounded-md border bg-muted/50 p-3 text-sm">
                  {summaryText}
                </div>
              ) : null}
            </div>
          )}
        </div>
      ) : null}
    </>
  );
}
