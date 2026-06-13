"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, User, AlertCircle, Trash2 } from "lucide-react";
import { askChatbot, getChatHistory, saveChatMessage, clearChatHistory } from "@/app/actions/chatbot";
import { cn } from "@/lib/utils";
import { RobotIcon } from "@/components/brand/robot-icon";

interface Message {
  role: "user" | "model";
  text: string;
  createdAt?: number;
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

  // Time formatter helper
  const formatTime = (timeMs?: number) => {
    if (!timeMs) return "";
    const date = new Date(timeMs);
    return date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
  };

  // Load chat history on mount
  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await getChatHistory();
        if (res.success && res.history) {
          if (res.history.length > 0) {
            setMessages(res.history.map((m) => ({ 
              role: m.role, 
              text: m.text, 
              createdAt: m.createdAt 
            })));
          } else {
            // Default welcome message
            setMessages([
              {
                role: "model",
                text: "Hello! I am your **FinSage AI Assistant**. I am connected directly to your active holdings, latest alerts, and news. How can I help you analyze your portfolio today?",
                createdAt: Date.now(),
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

  // Auto-scroll to latest message in the viewport
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
    const userTime = Date.now();
    const newMessages: Message[] = [...messages, { role: "user", text: textToSend, createdAt: userTime }];
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
        const assistantTime = Date.now();
        // 4. Save model message to Firestore
        await saveChatMessage("model", res.response);
        
        // 5. Update local state
        setMessages((prev) => [...prev, { role: "model", text: res.response!, createdAt: assistantTime }]);
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
          createdAt: Date.now(),
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
        parts.push(<strong key={match.index} className="text-[#FFC837] font-semibold">{match[1]}</strong>);
        lastIdx = boldRegex.lastIndex;
      }
      if (lastIdx < formatted.length) {
        parts.push(formatted.substring(lastIdx));
      }

      const content = parts.length > 0 ? parts : formatted;

      if (isBullet) {
        return (
          <li key={idx} className="ml-5 list-disc mb-1 leading-relaxed text-[#FFFFFF] text-[13px] md:text-[13.5px]">
            {content}
          </li>
        );
      }

      return (
        <p key={idx} className="mb-2 leading-relaxed text-[#FFFFFF] text-[13px] md:text-[13.5px]">
          {content}
        </p>
      );
    });
  };

  const containerClass = cn(
    "flex flex-col w-full relative min-h-0 flex-1",
    isFloating 
      ? "h-full" 
      : "h-[calc(100vh-230px)] bg-[#121820] border border-[#64748B]/20 rounded-[12px] p-6 shadow-xl"
  );

  if (isHistoryLoading) {
    return (
      <div className={containerClass}>
        <div className="space-y-4 w-full px-4 flex-1 flex flex-col justify-center">
          <div className="flex gap-3 max-w-[70%] mr-auto">
            <div className="h-10 w-10 rounded-full bg-[#FFC837]/10 border border-[#FFC837]/20 skeleton shrink-0 flex items-center justify-center">
              <RobotIcon size={22} className="opacity-50" />
            </div>
            <div className="p-4 rounded-[12px] rounded-tl-none border border-[#FFC837]/15 bg-white/[0.02] w-full h-20 skeleton" />
          </div>
          <div className="flex gap-3 max-w-[70%] ml-auto flex-row-reverse">
            <div className="h-10 w-10 rounded-full bg-[#1F4E79]/10 border border-[#1F4E79]/20 skeleton shrink-0 flex items-center justify-center">
              <User className="h-5 w-5 opacity-50 text-white" />
            </div>
            <div className="p-4 rounded-[12px] rounded-tr-none border-[#1F4E79]/30 bg-[#1F4E79]/10 w-full h-12 skeleton" />
          </div>
          <div className="flex gap-3 max-w-[75%] mr-auto">
            <div className="h-10 w-10 rounded-full bg-[#FFC837]/10 border border-[#FFC837]/20 skeleton shrink-0 flex items-center justify-center">
              <RobotIcon size={22} className="opacity-50" />
            </div>
            <div className="p-4 rounded-[12px] rounded-tl-none border border-[#FFC837]/15 bg-white/[0.02] w-full h-24 skeleton" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClass}>

      {/* Conversation Header */}
      {!isFloating ? (
        <div className="flex justify-between items-center pb-4 mb-4 border-b border-[#64748B]/20">
          <div className="flex items-center gap-3">
            {/* Circular avatar with robot icon */}
            <div className="h-10 w-10 rounded-full border border-[#FFC837]/30 bg-[#FFC837]/5 flex items-center justify-center">
              <RobotIcon size={24} />
            </div>
            <div>
              <h4 className="text-[14px] font-semibold text-[#FFFFFF] leading-tight">
                FinSage AI Assistant
              </h4>
              <p className="text-[12px] text-[#64748B] mt-0.5 font-sans">
                Active | 24/7 Support
              </p>
            </div>
          </div>

          <button
            onClick={handleClearChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#64748B] border border-[#64748B]/30 hover:border-rose-500/30 hover:text-rose-400 bg-transparent transition cursor-pointer"
            title="Clear Conversation"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear</span>
          </button>
        </div>
      ) : (
        /* Compact Header for Floating Mode */
        <div className="flex justify-between items-center mb-2">
          <div />
          <button
            onClick={handleClearChat}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium text-[#64748B] border border-[#64748B]/20 hover:border-rose-500/20 hover:text-[#F43F5E] bg-transparent transition cursor-pointer"
            title="Clear Conversation"
          >
            <Trash2 className="h-3 w-3" />
            Clear
          </button>
        </div>
      )}

      {/* Chat Messages viewport */}
      <div
        ref={chatViewportRef}
        className="flex-1 overflow-y-auto mb-4 pr-2 space-y-4 scrollbar-thin min-h-0"
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
              {/* Avatar (increased to h-10 w-10) */}
              <div
                className={cn(
                  "flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center border shrink-0",
                  message.role === "user"
                    ? "border-[#1F4E79]/50 bg-[#1A365D] text-white"
                    : "border-[#FFC837]/30 bg-[#FFC837]/5"
                )}
              >
                {message.role === "user" ? <User className="h-5 w-5" /> : <RobotIcon size={24} />}
              </div>

              {/* Message Block: Bubble + Timestamp */}
              <div className="flex flex-col">
                {/* Bubble */}
                <div
                  className={cn(
                    "p-4 rounded-[12px] border font-sans flex flex-col gap-1",
                    message.role === "user"
                      ? "rounded-tr-none border-[#1F4E79]/30 bg-[#1F4E79]"
                      : "rounded-tl-none border-[#FFC837]/15"
                  )}
                  style={
                    message.role === "model" 
                      ? { backgroundColor: "rgba(255, 200, 55, 0.04)" } 
                      : undefined
                  }
                >
                  {/* Identity flag */}
                  <span
                    className={cn(
                      "text-[12px] font-bold font-sans uppercase tracking-wider mb-0.5",
                      message.role === "user" ? "text-blue-300" : "text-[#FFC837]"
                    )}
                  >
                    {message.role === "user" ? "User" : "Assistant"}
                  </span>

                  <div className="text-[13px] leading-relaxed font-sans whitespace-pre-line text-[#FFFFFF]">
                    {formatMessageText(message.text)}
                  </div>
                </div>

                {/* Timestamp */}
                {message.createdAt && (
                  <span
                    className={cn(
                      "text-[10px] text-[#64748B] mt-1 px-1",
                      message.role === "user" ? "text-right" : "text-left"
                    )}
                  >
                    {formatTime(message.createdAt)}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading placeholder */}
        {isLoading && (
          <div className="flex gap-3 max-w-[85%] mr-auto">
            <div className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center border border-[#FFC837]/30 bg-[#FFC837]/5">
              <RobotIcon size={24} className="animate-pulse" />
            </div>
            <div 
              className="p-4 rounded-[12px] rounded-tl-none border border-[#FFC837]/15 w-64"
              style={{ backgroundColor: "rgba(255, 200, 55, 0.04)" }}
            >
              <span className="text-[12px] font-bold text-[#FFC837] uppercase tracking-wider block mb-2">
                Assistant
              </span>
              <div className="space-y-2">
                <div className="h-3 bg-white/5 rounded w-full skeleton" />
                <div className="h-3 bg-white/5 rounded w-5/6 skeleton" />
                <div className="h-3 bg-white/5 rounded w-2/3 skeleton" />
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
          <p className="text-[11px] text-[#64748B] font-mono mb-2 uppercase tracking-wide">Suggested queries:</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt)}
                className="px-3 py-1.5 text-xs text-[#64748B] border border-[#FFC837]/20 bg-transparent rounded-xl hover:border-[#FFC837]/40 hover:text-[#FFC837] hover:bg-[#FFC837]/5 transition duration-200 text-left cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input container - Rounded pill layout as in the reference mockup */}
      <div className="relative border border-[#64748B]/30 bg-[#121820] rounded-full flex items-center pl-5 pr-2.5 py-1.5 focus-within:border-[#FFC837]/45 transition-all duration-300">
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
          className="w-full bg-transparent text-sm py-2 px-1 outline-none placeholder-[#64748B] font-sans text-[#FFFFFF]"
          disabled={isLoading}
        />
        <button
          onClick={() => handleSend(input)}
          disabled={isLoading || !input.trim()}
          className="flex-shrink-0 flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#FFC837] text-[#090D12] hover:bg-[#FFD700] disabled:opacity-35 disabled:hover:bg-[#FFC837] font-semibold text-xs transition-all duration-300 cursor-pointer"
        >
          <Send className="h-3.5 w-3.5" />
          <span>Send</span>
        </button>
      </div>
    </div>
  );
}
