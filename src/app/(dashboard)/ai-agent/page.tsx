"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  isStub?: boolean;
}

interface ExcelContext {
  summary:    { totalFiles: number; totalSheets: number; totalRows: number };
  workbooks:  { name: string; description: string; sheets: { name: string; rows: number; columns: number; headers: string[] }[] }[];
}

const EXAMPLE_QUESTIONS = [
  "Berapa total shipment aktif saat ini?",
  "Siapa buyer terbesar berdasarkan volume?",
  "Tampilkan breakdown status shipment",
  "Berapa total BL di delivery log?",
  "Forecast project apa yang sedang waiting approval?",
];

export default function AIAgentPage() {
  const [messages, setMessages]   = useState<ChatMessage[]>([
    { role: "assistant", content: "Halo! Saya CoalTrade AI Agent. Tanyakan apapun tentang data shipment, delivery, atau forecast sales.\n\n> ⚠️ Mode stub aktif — Groq AI integration pending." },
  ]);
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(false);
  const bottomRef                 = useRef<HTMLDivElement>(null);

  const { data: ctxData } = useQuery({
    queryKey: ["ai-agent", "context"],
    queryFn: () => api.get<{ data: ExcelContext }>("/api/ai-agent/excel-context"),
    staleTime: 5 * 60 * 1000,
  });
  const ctx = ctxData?.data;

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(question: string) {
    if (!question.trim() || loading) return;

    const userMsg: ChatMessage = { role: "user", content: question };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const history = messages.slice(-6); // last 6 messages for context
      const res = await api.post<{ data: { answer: string; isStub: boolean } }>(
        "/api/ai-agent/excel-context",
        { question, history }
      );
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.data.answer, isStub: res.data.isStub },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ Error: Failed to get response. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  function renderMarkdown(text: string) {
    // Simple markdown: **bold**, *italic*, newlines, numbered/bulleted lists
    return text
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g,     "<em>$1</em>")
      .replace(/^> (.+)$/gm,     "<blockquote class='border-l-2 border-amber-400 pl-3 text-amber-600 dark:text-amber-400 text-xs italic my-1'>$1</blockquote>")
      .replace(/^#{1,3} (.+)$/gm,"<p class='font-semibold mt-2'>$1</p>")
      .replace(/\n/g,            "<br/>");
  }

  return (
    <div className="flex flex-col gap-0 pb-8 h-[calc(100vh-12rem)]">
      <div className="page__header mb-4">
        <h1 className="page__title text-2xl font-semibold">
          AI Excel Agent <span className="text-muted-foreground font-normal text-base">— Context-Aware Q&A</span>
        </h1>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 flex-1 min-h-0">
        {/* Left: Context index */}
        <aside className="xl:col-span-1 flex flex-col gap-4">
          {/* Summary cards */}
          {ctx && (
            <div className="grid grid-cols-3 xl:grid-cols-1 gap-3">
              {[
                { label: "Data Sources", value: ctx.summary.totalFiles,  color: "text-blue-500"    },
                { label: "Tables",       value: ctx.summary.totalSheets, color: "text-violet-500"  },
                { label: "Total Rows",   value: ctx.summary.totalRows.toLocaleString(),   color: "text-emerald-500" },
              ].map((c) => (
                <div key={c.label} className="card card--stat">
                  <div className="card__body">
                    <p className="text-eyebrow">{c.label}</p>
                    <p className={`text-xl font-light ${c.color}`}>{c.value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Workbook index */}
          <div className="card flex-1 overflow-y-auto">
            <div className="card__body gap-3">
              <p className="text-eyebrow">Data Context</p>
              {ctx?.workbooks?.map((wb) => (
                <div key={wb.name}>
                  <p className="text-sm font-medium">{wb.name}</p>
                  <p className="text-xs text-muted-foreground mb-1">{wb.description}</p>
                  {wb.sheets.map((sh) => (
                    <div key={sh.name} className="ml-2 mb-1 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{sh.name}</span>
                      {" "}· {sh.rows.toLocaleString()} rows · {sh.columns} cols
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Example questions */}
          <div className="card">
            <div className="card__body gap-2">
              <p className="text-eyebrow">Example Questions</p>
              {EXAMPLE_QUESTIONS.map((q) => (
                <button key={q} type="button"
                  className="text-left text-xs text-primary hover:underline"
                  onClick={() => sendMessage(q)}>
                  → {q}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Right: Chat */}
        <div className="xl:col-span-3 flex flex-col gap-0 min-h-0">
          <div className="card flex flex-col flex-1 min-h-0">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              {messages.map((msg, i) => (
                <div key={i}
                  className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                  {/* Avatar */}
                  <div className={`flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                    msg.role === "user"
                      ? "bg-primary text-white"
                      : "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300"
                  }`}>
                    {msg.role === "user" ? "U" : "AI"}
                  </div>

                  {/* Bubble */}
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-white rounded-tr-sm"
                      : "bg-surface border border-border rounded-tl-sm"
                  }`}>
                    {msg.role === "assistant"
                      ? <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                      : <p>{msg.content}</p>
                    }
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 h-7 w-7 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300 flex items-center justify-center text-xs font-semibold">AI</div>
                  <div className="bg-surface border border-border rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex gap-1 items-center h-4" aria-label="AI is thinking">
                      {[0, 1, 2].map((i) => (
                        <span key={i}
                          className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="border-t border-border p-3">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="text"
                  className="input flex-1"
                  placeholder="Ask anything about your shipment data…"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={loading}
                  aria-label="Chat input"
                />
                <button type="submit"
                  className="button button--primary"
                  disabled={loading || !input.trim()}
                  aria-busy={loading}
                  aria-label="Send message">
                  {loading
                    ? <span className="spinner spinner--sm" aria-hidden="true" />
                    : <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M4.4 19.425a.85.85 0 0 1-1.225-.975l2.175-7.2H9.5a.75.75 0 0 0 0-1.5H5.35L3.175 2.55a.85.85 0 0 1 1.225-.975l17 8.5a.85.85 0 0 1 0 1.85z"/>
                      </svg>
                  }
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
