import { useLayoutEffect, useRef, type RefObject } from "react";
import { type ChatMsg, useChatSession } from "../chat/ChatSessionContext";
import { ChatMarkdown } from "../components/ChatMarkdown";
import { ShelfBarsLoader } from "../components/PageLoader";

function cn(...parts: Array<string | false | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M3.478 2.404a.75.75 0 0 0-.926.94l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.405Z" />
    </svg>
  );
}

type ComposerProps = {
  variant: "hero" | "chat";
  input: string;
  setInput: (v: string) => void;
  send: () => Promise<void>;
  streaming: boolean;
  textareaRef?: RefObject<HTMLTextAreaElement | null>;
  /** When false, textarea is excluded from tab order (inactive layer). */
  tabFocusable?: boolean;
};

function ChatComposer({
  variant,
  input,
  setInput,
  send,
  streaming,
  textareaRef,
  tabFocusable = true,
}: ComposerProps) {
  const isHero = variant === "hero";
  const canSend = input.trim().length > 0 && !streaming;
  return (
    <div
      className={cn(
        isHero
          ? "rounded-[1.75rem] border border-zinc-200/90 bg-white p-2 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.18)] dark:border-zinc-700/90 dark:bg-zinc-900/90 dark:shadow-black/50"
          : "border-t border-zinc-200 bg-white px-3 py-2.5 dark:border-zinc-800 dark:bg-black"
      )}
    >
      <div className="flex w-full items-center justify-between gap-3">
        <textarea
          ref={textareaRef}
          tabIndex={tabFocusable ? undefined : -1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          rows={isHero ? 3 : 2}
          disabled={streaming}
          placeholder="Escreva sua pergunta…"
          className={cn(
            "m-0 min-h-0 min-w-0 flex-1 resize-none self-center rounded-2xl border-0 bg-transparent text-zinc-900 outline-none placeholder:text-zinc-400 focus:ring-0 disabled:opacity-60 dark:text-cream dark:placeholder:text-cream/40",
            isHero
              ? "min-h-[4.5rem] px-3 py-2.5 text-base leading-snug sm:px-4"
              : "max-h-40 min-h-10 px-2 py-2 text-sm leading-5 sm:px-3"
          )}
        />
        <button
          type="button"
          disabled={!canSend}
          onClick={() => void send()}
          title="Enviar"
          aria-label="Enviar mensagem"
          className={cn(
            "inline-flex shrink-0 items-center justify-center rounded-full text-black shadow-sm transition-[transform,background-color,opacity] hover:scale-105 hover:bg-clinic-400 active:scale-95 disabled:scale-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:hover:bg-zinc-200 dark:disabled:hover:bg-zinc-800",
            canSend ? "bg-clinic-500" : "bg-zinc-200 dark:bg-zinc-700",
            isHero ? "h-10 w-10" : "h-9 w-9"
          )}
        >
          {streaming ? (
            <span className="text-lg font-bold leading-none text-zinc-600 dark:text-cream/80">…</span>
          ) : (
            <SendIcon className={isHero ? "h-4 w-4" : "h-3.5 w-3.5"} />
          )}
        </button>
      </div>
    </div>
  );
}

export function Chat() {
  const { messages, input, setInput, streaming, error, send } = useChatSession();
  const lastUserMsgRef = useRef<HTMLDivElement | null>(null);
  const chatTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const isChat = messages.length > 0;

  useLayoutEffect(() => {
    if (!isChat) return;
    if (messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last.role !== "user") return;
    lastUserMsgRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [messages, isChat]);

  useLayoutEffect(() => {
    if (!isChat) return;
    chatTextareaRef.current?.focus({ preventScroll: true });
  }, [isChat]);

  function roleLabel(role: ChatMsg["role"]): string {
    return role === "user" ? "Você" : "Prateleira";
  }

  const transition =
    "transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] motion-reduce:transition-none motion-reduce:duration-150";

  return (
    <div className="relative h-[calc(100svh-8rem)] min-h-0 overflow-hidden font-sans">
      {/* Hero: centered copy + composer */}
      <div
        className={cn(
          "absolute inset-0 flex flex-col items-center justify-center overflow-y-auto overflow-x-hidden px-4 py-8",
          transition,
          isChat ? "pointer-events-none scale-[0.98] opacity-0" : "scale-100 opacity-100"
        )}
        aria-hidden={isChat}
      >
        <div className="mb-10 w-full max-w-xl shrink-0 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-clinic-600 sm:text-4xl dark:text-clinic-400">
            Dúvidas sobre produtos
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-600 sm:text-base dark:text-cream/75">
            Pergunte informações sobre os produtos da sua prateleira. As respostas usam os dados
            cadastrados no sistema.
          </p>
          <p className="mt-6 text-sm text-zinc-500 dark:text-cream/55">
            Ex.: “Quais produtos ajudam no emagrecimento?” ou “Tem algum tratamento hormonal?”
          </p>
        </div>
        <div className="w-full max-w-2xl shrink-0">
          <ChatComposer
            variant="hero"
            input={input}
            setInput={setInput}
            send={send}
            streaming={streaming}
            tabFocusable={!isChat}
          />
        </div>
        {error && !isChat && (
          <p className="mt-4 max-w-2xl rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </p>
        )}
      </div>

      {/* Chat: transcript + composer */}
      <div
        className={cn(
          "absolute inset-0 flex flex-col",
          transition,
          isChat ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        )}
        aria-hidden={!isChat}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 text-sm">
            {messages.map((m, i) => (
              <div
                key={i}
                ref={i === messages.length - 1 && m.role === "user" ? lastUserMsgRef : undefined}
                className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
              >
                <div
                  className={cn(
                    "w-fit max-w-[min(100%,36rem)] rounded-lg px-3 py-2",
                    m.role === "user"
                      ? "bg-zinc-100 text-right text-zinc-900 dark:bg-zinc-800 dark:text-cream"
                      : "bg-zinc-50 text-zinc-800 dark:bg-zinc-950 dark:text-cream/90"
                  )}
                >
                  <div
                    className={
                      m.role === "user"
                        ? "mb-1 text-xs font-medium uppercase text-zinc-500 dark:text-cream/55"
                        : "mb-1 text-xs font-medium uppercase text-clinic-600 dark:text-clinic-500"
                    }
                  >
                    {roleLabel(m.role)}
                  </div>
                  {m.role === "assistant" ? (
                    <ChatMarkdown text={m.text} />
                  ) : (
                    <div className="whitespace-pre-wrap break-words">{m.text}</div>
                  )}
                </div>
              </div>
            ))}
            {streaming && (
              <div className="flex justify-start pl-0.5" aria-live="polite">
                <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50/90 px-3 py-2.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
                  <ShelfBarsLoader className="scale-[0.85] opacity-90" />
                  <span className="text-xs font-medium text-zinc-600 dark:text-cream/60">
                    Gerando resposta…
                  </span>
                </div>
              </div>
            )}
          </div>
          {error && (
            <div className="shrink-0 border-t border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </div>
          )}
          <ChatComposer
            variant="chat"
            input={input}
            setInput={setInput}
            send={send}
            streaming={streaming}
            textareaRef={chatTextareaRef}
            tabFocusable={isChat}
          />
        </div>
      </div>
    </div>
  );
}
