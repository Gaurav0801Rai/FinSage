"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Sparkles, AlertCircle, Trash2, ArrowRight } from "lucide-react";
import { askChatbot, getChatHistory, saveChatMessage, clearChatHistory } from "@/app/actions/chatbot";
import { cn } from "@/lib/utils";


interface Message {
  role: "user" | "model";
  text: string;
}

const SUGGESTED_PROMPTS = [
  "Summarize the latest news for my holdings",
  "Are there any macro/regulatory alerts I should know?",
  "Analyze the overall performance and risk of my portfolio",
  "Are there any geopolitical events impacting crypto/stocks today?",
];

export default function ChatInterface({ isFloating = false }: { isFloating?: boolean }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatViewportRef = useRef<HTMLDivElement>(null);

  // Load chat history on mount
  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await getChatHistory();
        if (res.success && res.history) {
          if (res.history.length > 0) {
            setMessages(res.history.map((m) => ({ role: m.role, text: m.text })));
          } else {
            // Default welcome message
            setMessages([
              {
                role: "model",
                text: "Hello! I am your **FinSage AI Assistant**. I am connected directly to your active holdings, latest alerts, and news. How can I help you analyze your portfolio today?",
              },
            ]);
          }
        }
      } catch (err) {
        console.error("Failed to load chat history:", err);
      } finally {
        setIsHistoryLoading(false);
      }
    }
    loadHistory();
  }, []);

  // Auto-scroll to latest message in the viewport (prevents parent window/container scroll)
  useEffect(() => {
    if (chatViewportRef.current) {
      const behavior = isHistoryLoading ? "auto" : "smooth";
      chatViewportRef.current.scrollTo({
        top: chatViewportRef.current.scrollHeight,
        behavior,
      });
    }
  }, [messages, isLoading, isHistoryLoading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    setError(null);
    setIsLoading(true);
    setInput("");

    // Add user message locally
    const newMessages: Message[] = [...messages, { role: "user", text: textToSend }];
    setMessages(newMessages);

    try {
      // 1. Save user message to Firestore
      await saveChatMessage("user", textToSend);

      // 2. Map message state to Gemini/Groq API history format
      const historyPayload = messages.map((m) => ({
        role: m.role,
        parts: [{ text: m.text }],
      }));

      // 3. Trigger AI completion Server Action
      const res = await askChatbot(historyPayload, textToSend);

      if (res.success && res.response) {
        // 4. Save model message to Firestore
        await saveChatMessage("model", res.response);
        
        // 5. Update local state
        setMessages((prev) => [...prev, { role: "model", text: res.response! }]);
      } else {
        setError(res.error || "Failed to retrieve response from FinSage AI.");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected connection error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = async () => {
    setIsLoading(true);
    try {
      await clearChatHistory();
      setMessages([
        {
          role: "model",
          text: "Chat cleared. I am ready to answer any questions about your holdings or recent financial news. Ask away!",
        },
      ]);
      setError(null);
    } catch (err) {
      console.error("Failed to clear chat history:", err);
      setError("Failed to clear chat history on server.");
    } finally {
      setIsLoading(false);
    }
  };

  // Basic markdown-like formatter for bullet points, bold text and code snippets
  const formatMessageText = (text: string) => {
    return text.split("\n").map((line, idx) => {
      let formatted = line;

      // Handle bullet points
      const isBullet = formatted.trim().startsWith("-") || formatted.trim().startsWith("*");
      if (isBullet) {
        formatted = formatted.replace(/^[\s*-]+/, "").trim();
      }

      // Handle bold formatting (**text**)
      const boldRegex = /\*\*([^*]+)\*\*/g;
      const parts = [];
      let lastIdx = 0;
      let match;

      while ((match = boldRegex.exec(formatted)) !== null) {
        if (match.index > lastIdx) {
          parts.push(formatted.substring(lastIdx, match.index));
        }
        parts.push(<strong key={match.index} className="text-[#E2B659] font-semibold">{match[1]}</strong>);
        lastIdx = boldRegex.lastIndex;
      }
      if (lastIdx < formatted.length) {
        parts.push(formatted.substring(lastIdx));
      }

      const content = parts.length > 0 ? parts : formatted;

      if (isBullet) {
        return (
          <li key={idx} className="ml-5 list-disc mb-1 leading-relaxed text-gray-300">
            {content}
          </li>
        );
      }

      return (
        <p key={idx} className="mb-2 leading-relaxed text-gray-300">
          {content}
        </p>
      );
    });
  };

  const heightClass = isFloating ? "h-full" : "h-[calc(100vh-140px)]";

  if (isHistoryLoading) {

    return (
      <div className={`flex flex-col ${heightClass} w-full relative justify-center items-center`}>
        <div className="space-y-4 w-full px-4">
          <div className="flex gap-3 max-w-[70%] mr-auto">
            <div className="h-9 w-9 rounded-xl bg-white/5 skeleton shrink-0" />
            <div className="glass-card p-4 rounded-2xl rounded-tl-none border-white/[0.06] bg-white/[0.02] w-full h-20 skeleton" />
          </div>
          <div className="flex gap-3 max-w-[70%] ml-auto flex-row-reverse">
            <div className="h-9 w-9 rounded-xl bg-white/5 skeleton shrink-0" />
            <div className="glass-card p-4 rounded-2xl rounded-tr-none border-amber-500/20 bg-amber-500/[0.02] w-full h-12 skeleton" />
          </div>
          <div className="flex gap-3 max-w-[75%] mr-auto">
            <div className="h-9 w-9 rounded-xl bg-white/5 skeleton shrink-0" />
            <div className="glass-card p-4 rounded-2xl rounded-tl-none border-white/[0.06] bg-white/[0.02] w-full h-24 skeleton" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${heightClass} w-full relative`}>

      {/* Header details */}
      <div className={`flex justify-between items-center mb-2 ${!isFloating ? "pb-2 border-b border-white/[0.06] mb-3" : ""}`}>
        <div />

        <button
          onClick={handleClearChat}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium text-rose-400 border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 transition cursor-pointer"
          title="Clear Conversation"
        >
          <Trash2 className="h-3 w-3" />
          Clear
        </button>
      </div>

      {/* Chat Messages viewport */}
      <div
        ref={chatViewportRef}
        className="flex-1 overflow-y-auto mb-4 pr-2 space-y-4 scrollbar-thin"
      >
        <AnimatePresence initial={false}>
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex gap-3 max-w-[85%] ${
                message.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
              }`}
            >
              {/* Avatar */}
              <div
                className={cn(
                  "flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center border shrink-0",
                  message.role === "user"
                    ? "border-[#1F4E79]/50 bg-[#1A365D] text-white"
                    : "border-accent-500/30 bg-accent-500/5 text-accent-500"
                )}
              >
                {message.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>

              {/* Bubble */}
              <div
                className={cn(
                  "p-4 rounded-2xl border font-sans",
                  message.role === "user"
                    ? "rounded-tr-none border-[#1F4E79]/40 bg-[#1A365D] text-white"
                    : "rounded-tl-none border-accent-500/15 bg-accent-500/[0.02] text-gray-200"
                )}
              >
                <div className="text-sm font-sans whitespace-pre-line">
                  {formatMessageText(message.text)}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading placeholder */}
        {isLoading && (
          <div className="flex gap-3 max-w-[85%] mr-auto">
            <div className="flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center border border-accent-500/30 bg-accent-500/5 text-accent-500">
              <Bot className="h-4 w-4 animate-pulse" />
            </div>
            <div className="p-4 rounded-2xl rounded-tl-none border border-accent-500/15 bg-accent-500/[0.02] w-64">
              <div className="space-y-2">
                <div className="h-4 bg-white/5 rounded w-full skeleton" />
                <div className="h-4 bg-white/5 rounded w-5/6 skeleton" />
                <div className="h-4 bg-white/5 rounded w-2/3 skeleton" />
              </div>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="flex gap-2 max-w-[80%] mx-auto items-center p-3 text-xs text-rose-400 border border-rose-500/20 bg-rose-500/5 rounded-xl">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested chips (renders only when chat contains initial greeting and not loading) */}
      {messages.length === 1 && !isLoading && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 font-mono mb-2">Suggested queries:</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt)}
                className="px-3 py-1.5 text-xs text-slate-400 border border-white/[0.06] bg-white/[0.01] rounded-xl hover:border-accent-500/30 hover:text-accent-500 hover:bg-accent-500/[0.02] transition duration-200 text-left cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input container - Rounded pill layout as in the reference mockup */}
      <div className="relative border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl rounded-full flex items-center pl-4 pr-2.5 py-1.5 focus-within:border-accent-500/30 transition-all duration-300">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSend(input);
            }
          }}
          placeholder="Type your finance question here..."
          className="w-full bg-transparent text-sm py-2 px-1 outline-none placeholder-slate-600 font-sans text-gray-200"
          disabled={isLoading}
        />
        <button
          onClick={() => handleSend(input)}
          disabled={isLoading || !input.trim()}
          className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full bg-accent-500 text-[#090D12] hover:bg-accent-400 disabled:opacity-30 disabled:hover:bg-accent-500 font-semibold text-xs transition-all duration-300 cursor-pointer"
        >
          <Send className="h-3.5 w-3.5" />
          <span>Send</span>
        </button>
      </div>
    </div>
  );
}
