/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { chatStream } from "../api";
import { useAuth } from "../auth/AuthContext";

export type ChatMsg = { role: "user" | "assistant"; text: string };

type ChatSessionContextValue = {
  messages: ChatMsg[];
  input: string;
  setInput: (v: string) => void;
  streaming: boolean;
  error: string | null;
  send: () => Promise<void>;
};

const ChatSessionContext = createContext<ChatSessionContextValue | null>(null);

export function ChatSessionProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const assistantBuffer = useRef("");

  const appendAssistantChunk = useCallback((chunk: string) => {
    assistantBuffer.current += chunk;
    setMessages((prev) => {
      const next = [...prev];
      const last = next[next.length - 1];
      if (last?.role === "assistant") {
        next[next.length - 1] = { role: "assistant", text: assistantBuffer.current };
      } else {
        next.push({ role: "assistant", text: assistantBuffer.current });
      }
      return next;
    });
  }, []);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || !token || streaming) return;
    setInput("");
    setError(null);
    assistantBuffer.current = "";
    const apiMessages = [
      ...messages.map((m) => ({ role: m.role, content: m.text })),
      { role: "user" as const, content: text },
    ];
    setMessages((m) => [...m, { role: "user", text }]);
    setStreaming(true);
    try {
      await chatStream(
        token,
        apiMessages,
        (delta) => appendAssistantChunk(delta),
        () => {},
        (msg) => setError(msg)
      );
    } finally {
      setStreaming(false);
    }
  }, [token, input, streaming, messages, appendAssistantChunk]);

  const value = useMemo(
    () => ({
      messages: token ? messages : [],
      input: token ? input : "",
      setInput,
      streaming: token ? streaming : false,
      error: token ? error : null,
      send,
    }),
    [messages, input, streaming, error, send, token]
  );

  return (
    <ChatSessionContext.Provider value={value}>{children}</ChatSessionContext.Provider>
  );
}

export function useChatSession(): ChatSessionContextValue {
  const ctx = useContext(ChatSessionContext);
  if (!ctx) {
    throw new Error("useChatSession must be used within ChatSessionProvider");
  }
  return ctx;
}
