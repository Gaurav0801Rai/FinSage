"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Sparkles, AlertCircle, Trash2, ArrowRight } from "lucide-react";
import { askChatbot } from "@/app/actions/chatbot";

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

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      text: "Hello! I am your **FinSage AI Assistant**. I am connected directly to your active holdings, latest alerts, and news. How can I help you analyze your portfolio today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    setError(null);
    setIsLoading(true);
    setInput("");

    // Add user message to state
    const newMessages: Message[] = [...messages, { role: "user", text: textToSend }];
    setMessages(newMessages);

    try {
      // Map message state to Gemini API history format
      const historyPayload = messages.map((m) => ({
        role: m.role,
        parts: [{ text: m.text }],
      }));

      const res = await askChatbot(historyPayload, textToSend);

      if (res.success && res.response) {
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

  const handleClearChat = () => {
    setMessages([
      {
        role: "model",
        text: "Chat cleared. I am ready to answer any questions about your holdings or recent financial news. Ask away!",
      },
    ]);
    setError(null);
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
        parts.push(<strong key={match.index} className="text-amber-400 font-semibold">{match[1]}</strong>);
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

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-5xl mx-auto w-full relative">
      {/* Header details */}
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/[0.06]">
        <div>
          <h2 className="text-xl font-bold text-gradient-amber flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#FBBF24]" />
            FinSage AI Agent
          </h2>
          <p className="text-xs text-gray-500 font-mono">Powered by Gemini 2.5 Flash + Live Portfolio Context</p>
        </div>
        <button
          onClick={handleClearChat}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-400 border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 transition"
          title="Clear Conversation"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Clear Chat
        </button>
      </div>

      {/* Chat Messages viewport */}
      <div className="flex-1 overflow-y-auto mb-4 pr-2 space-y-4 scrollbar-thin">
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
                className={`flex-shrink-0 h-9 w-9 rounded-xl flex items-center justify-center border ${
                  message.role === "user"
                    ? "border-amber-500/20 bg-amber-500/5 text-amber-400"
                    : "border-white/[0.08] bg-white/[0.03] text-gray-400"
                }`}
              >
                {message.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>

              {/* Bubble */}
              <div
                className={`glass-card p-4 rounded-2xl ${
                  message.role === "user"
                    ? "rounded-tr-none border-amber-500/25 bg-amber-500/[0.03]"
                    : "rounded-tl-none border-white/[0.06] bg-white/[0.02]"
                }`}
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
            <div className="flex-shrink-0 h-9 w-9 rounded-xl flex items-center justify-center border border-white/[0.08] bg-white/[0.03] text-gray-400">
              <Bot className="h-4 w-4 animate-pulse text-amber-400" />
            </div>
            <div className="glass-card p-4 rounded-2xl rounded-tl-none border-white/[0.06] bg-white/[0.02] w-64">
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
                className="px-3 py-1.5 text-xs text-gray-400 border border-white/[0.06] bg-white/[0.01] rounded-xl hover:border-amber-500/30 hover:text-amber-400 hover:bg-amber-500/[0.02] transition duration-200 text-left"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input container */}
      <div className="relative border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl rounded-2xl flex items-center pr-2 focus-within:border-amber-500/30 transition-all duration-300">
        <textarea
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend(input);
            }
          }}
          placeholder="Ask about your holdings, news analysis, or macro events..."
          className="w-full bg-transparent text-sm py-3.5 px-4 outline-none resize-none placeholder-gray-600 max-h-24 scrollbar-none font-sans text-gray-200"
          disabled={isLoading}
        />
        <button
          onClick={() => handleSend(input)}
          disabled={isLoading || !input.trim()}
          className="flex-shrink-0 p-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 text-[#FBBF24] hover:bg-amber-500/10 hover:border-amber-500/40 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-amber-500/20 transition-all duration-300 cursor-pointer"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
