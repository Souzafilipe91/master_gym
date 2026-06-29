import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Send, Bot, User, Dumbbell, Salad, RotateCcw } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const STORAGE_KEY = "coach-chat-history";
const MAX_HISTORY = 40;

const SUGGESTIONS = [
  "Qual a melhor proteína para ganho de massa?",
  "Como montar uma dieta para secar mantendo músculo?",
  "Quanto tempo descansar entre as séries para hipertrofia?",
  "Posso treinar com dor muscular (DOMS)?",
  "Qual suplemento realmente vale a pena?",
  "Como progredir quando travar no agachamento?",
];

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Persistir histórico no localStorage
  useEffect(() => {
    const trimmed = messages.slice(-MAX_HISTORY);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  }, [messages]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  const handleSend = useCallback(async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || streaming) return;

    const userMessage: Message = { role: "user", content };
    const updatedMessages: Message[] = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setStreaming(true);

    // Adiciona placeholder da resposta
    setMessages(prev => [...prev, { role: "assistant", content: "" }]);

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ messages: updatedMessages }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        throw new Error("Erro na requisição");
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let reply = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (!json) continue;
          try {
            const data = JSON.parse(json);
            if (data.text) {
              reply += data.text;
              setMessages(prev => {
                const next = [...prev];
                next[next.length - 1] = { role: "assistant", content: reply };
                return next;
              });
            }
            if (data.done || data.error) break;
          } catch { /* ignora chunk mal formado */ }
        }
      }
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      toast.error("Erro ao conectar com o Coach. Tente novamente.");
      setMessages(prev => prev.slice(0, -1)); // remove placeholder
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }, [input, messages, streaming]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReset = () => {
    if (streaming) abortRef.current?.abort();
    setMessages([]);
    setInput("");
    localStorage.removeItem(STORAGE_KEY);
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-bold text-base">Coach GymMaster</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Dumbbell className="w-3 h-3" /> Personal Trainer
              <span className="mx-1">·</span>
              <Salad className="w-3 h-3" /> Nutricionista
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={handleReset} title="Nova conversa">
            <RotateCcw className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center gap-6">
            <div className="space-y-2">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Bot className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold">Olá! Sou seu Coach GymMaster</h2>
              <p className="text-muted-foreground text-sm max-w-sm">
                Seu personal trainer e nutricionista pessoal. Pergunte sobre treino,
                nutrição, suplementação ou qualquer dúvida sobre sua evolução.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  disabled={streaming}
                  className="text-left text-sm p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                )}
                <Card
                  className={`max-w-[80%] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border"
                  }`}
                >
                  {msg.content || (
                    <span className="flex gap-1 items-center h-5">
                      <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:0ms]" />
                      <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:150ms]" />
                      <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:300ms]" />
                    </span>
                  )}
                </Card>
                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pergunte sobre treino ou nutrição... (Enter para enviar)"
            rows={1}
            className="flex-1 resize-none bg-muted rounded-lg px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-primary border border-border min-h-[44px] max-h-[120px] leading-relaxed"
            onInput={e => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = Math.min(el.scrollHeight, 120) + "px";
            }}
            disabled={streaming}
          />
          <Button
            size="icon"
            className="h-11 w-11 shrink-0"
            onClick={() => handleSend()}
            disabled={!input.trim() || streaming}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1 text-center">
          Shift+Enter para nova linha · Enter para enviar
        </p>
      </div>
    </div>
  );
}
