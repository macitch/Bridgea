import { useState, useRef, useEffect, useCallback } from "react";
import axios, { AxiosError } from "axios";
import { cn } from "@/utils/twMerge";
import { User } from "firebase/auth";
import { useAuth } from "@/context/AuthProvider";
import debounce from "lodash/debounce";

interface ChatMessage {
  role: "user" | "ai";
  text: string;
  timestamp: Date;
}

interface LinkData {
  title: string;
  url: string;
  description?: string;
  image?: string;
  tags?: string[];
  category?: string;
  isFavorite?: boolean;
  dateAdded?: string;
}

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  initialMessage?: string;
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  isOpen,
  onClose,
  user,
  initialMessage,
}) => {
  const { loading } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>(initialMessage || "");
  const [loadingState, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [relevantLinks, setRelevantLinks] = useState<LinkData[]>([]);
  const [offset, setOffset] = useState<number>(0);
  const [totalLinks, setTotalLinks] = useState<number>(0);
  const limit = 20; // Match k=20

  const chatWindowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages, loadingState, relevantLinks]);

  useEffect(() => {
    if (isOpen && initialMessage && messages.length === 0) {
      handleSendMessage(initialMessage);
    }
  }, [isOpen, initialMessage, messages.length]);

  // Always call hooks before conditional rendering.
  // Instead of returning early, we'll conditionally render the UI.

  const handleSendMessage = useCallback(
    debounce(async (msg?: string) => {
      const messageToSend = msg || input.trim();
      if (!messageToSend) return;
      const sessionId = user!.uid; // user is guaranteed here if we render full UI

      const userMessage: ChatMessage = {
        role: "user",
        text: messageToSend,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setLoading(true);
      setError("");
      setRelevantLinks([]);
      setOffset(0);

      try {
        const response = await axios.post(
          "/api/chat",
          { message: userMessage.text, sessionId, k: 20, offset, limit },
          { headers: { "Content-Type": "application/json" } }
        );
        const aiMessage: ChatMessage = {
          role: "ai",
          text: response.data.answer,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
        setRelevantLinks(response.data.links || []);
        setTotalLinks(response.data.total || 0);
        console.log("ChatPanel results:", response.data.links, "Total:", response.data.total);
      } catch (err: unknown) {
        const axiosError = err as AxiosError<{ error: string; details?: string }>;
        const errorMessage =
          axiosError.response?.data?.details ||
          axiosError.message ||
          "Unknown error occurred";
        setError(`Failed to get a response: ${errorMessage}. Retry or adjust your query.`);
      } finally {
        setLoading(false);
      }
    }, 300),
    [input, user, offset]
  );

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setRelevantLinks([]);
    setError("");
    setInput("");
    setOffset(0);
    setTotalLinks(0);
  };

  return (
    <div className="p-4">
      {loading ? (
        <div>Loading authentication...</div>
      ) : !user || !user.uid ? (
        <div>User not authenticated. Please log in.</div>
      ) : (
        <div
          className={cn(
            "fixed bottom-0 right-0 md:top-0 md:bottom-auto md:h-full md:w-[400px] w-full h-[70vh] flex flex-col transition-transform duration-300 z-40",
            "bg-[var(--white)] border border-gray-200 shadow-lg",
            "font-[var(--font-family)]",
            isOpen ? "translate-y-0 md:translate-x-0" : "translate-y-full md:translate-x-full"
          )}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <span className="text-sm text-[var(--black)] font-bold">TIA</span>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleClearChat}
                className="text-[var(--black)] text-xs hover:text-[var(--orange)]"
              >
                Clear
              </button>
              <button
                onClick={onClose}
                className="text-[var(--black)] hover:text-[var(--orange)]"
              >
                ✕
              </button>
            </div>
          </div>

          <div
            ref={chatWindowRef}
            className="flex-grow px-4 py-4 overflow-y-auto space-y-4"
            role="log"
            aria-live="polite"
          >
            {messages.length === 0 && !loadingState && (
              <div className="text-center text-gray-500 mt-6">
                <p className="mb-2">👋 Hi there! I am TIA...</p>
                <p>Ask me anything to get started.</p>
              </div>
            )}

            {messages.map((msg, index) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={index}
                  className={cn(
                    "flex flex-col max-w-[75%]",
                    isUser ? "self-end items-end" : "self-start items-start"
                  )}
                >
                  <div
                    className={cn(
                      "rounded-xl px-4 py-2",
                      isUser
                        ? "bg-[var(--black)] text-[var(--white)]"
                        : "bg-[var(--grey)] text-[var(--black)]"
                    )}
                  >
                    {msg.text}
                  </div>
                  <div className="mt-1 text-xs text-gray-400">
                    {msg.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              );
            })}

            {loadingState && (
              <div className="flex flex-col max-w-[75%] self-start items-start">
                <div className="rounded-xl px-4 py-2 bg-[var(--grey)] text-[var(--black)]">
                  <div className="flex space-x-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-[var(--orange)] animate-bounce" />
                    <span
                      className="inline-block w-2 h-2 rounded-full bg-[var(--orange)] animate-bounce"
                      style={{ animationDelay: "200ms" }}
                    />
                    <span
                      className="inline-block w-2 h-2 rounded-full bg-[var(--orange)] animate-bounce"
                      style={{ animationDelay: "400ms" }}
                    />
                  </div>
                </div>
              </div>
            )}

            {relevantLinks.length > 0 && (
              <div className="flex flex-col max-w-[75%] self-start items-start space-y-2 pt-4">
                {relevantLinks.map((link, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl px-4 py-2 bg-[var(--grey)] text-[var(--black)] shadow-sm hover:shadow-md transition-shadow w-full"
                  >
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-sm text-blue-600 hover:underline"
                    >
                      {link.title || "Untitled"}
                    </a>
                    <p className="text-xs text-gray-600 mt-1">
                      Category: {link.category || "None"}
                    </p>
                    <p className="text-xs text-gray-600">
                      Tags: {link.tags?.join(", ") || "None"}
                    </p>
                    {link.description && (
                      <p className="text-xs text-gray-600 mt-1 truncate">{link.description}</p>
                    )}
                    <p className="text-xs text-gray-600 mt-1">
                      Added:{" "}
                      {link.dateAdded
                        ? new Date(link.dateAdded).toLocaleString("en-US", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        : "Unknown"}
                    </p>
                    {link.isFavorite && (
                      <span className="text-xs text-yellow-500 mt-1 inline-block">
                        ★ Favorite
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {relevantLinks.length > 0 && totalLinks > limit && (
              <div className="flex justify-between w-full px-4 py-2">
                <button
                  onClick={() => setOffset((prev) => Math.max(0, prev - limit))}
                  disabled={offset === 0}
                  className="text-sm text-blue-600 disabled:text-gray-400"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  {offset + 1}-{Math.min(offset + limit, totalLinks)} of {totalLinks}
                </span>
                <button
                  onClick={() => setOffset((prev) => prev + limit)}
                  disabled={offset + limit >= totalLinks}
                  className="text-sm text-blue-600 disabled:text-gray-400"
                >
                  Next
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="px-4 py-2 text-sm text-red-600 bg-red-50 flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={() => handleSendMessage(messages[messages.length - 1]?.text)}
                className="text-blue-600 hover:underline text-xs"
              >
                Retry
              </button>
            </div>
          )}

          <div className="p-4 border-t border-gray-200 flex items-center space-x-2">
            <input
              className="flex-grow border border-gray-300 rounded-full px-4 py-2 text-[var(--black)] focus:outline-none focus:ring-1 focus:ring-[var(--orange)] bg-white text-sm"
              placeholder="Type here..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              aria-label="Chat input"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={loadingState || !input.trim()}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                loadingState || !input.trim()
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-[var(--black)] text-[var(--white)] hover:bg-[var(--orange)] hover:text-[var(--black)]"
              )}
              aria-label="Send message"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPanel;