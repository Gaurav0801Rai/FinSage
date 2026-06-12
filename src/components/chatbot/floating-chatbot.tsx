"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Sparkles } from "lucide-react";
import ChatInterface from "./chat-interface";

export default function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full flex items-center justify-center
                   bg-gradient-to-tr from-[#F59E0B] to-[#FBBF24] text-[#0A0A0B]
                   shadow-[0_0_20px_rgba(251,191,36,0.4)] hover:shadow-[0_0_25px_rgba(251,191,36,0.6)]
                   transition-shadow duration-300 border border-[#F59E0B]/20 cursor-pointer"
        title="Chat with FinSage AI"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="h-6 w-6" />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative"
            >
              <MessageSquare className="h-6 w-6" />
              {/* Little ambient pulse dot */}
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Floating Chat Drawer Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-24 right-6 w-[420px] max-w-[calc(100vw-32px)] h-[540px] z-50
                       glass-card border border-white/[0.08] rounded-2xl shadow-2xl p-4
                       bg-canvas-elevated backdrop-blur-2xl flex flex-col overflow-hidden"
          >
            {/* Backdrop glow in the drawer itself */}
            <div className="absolute -top-20 -right-20 w-48 h-48 bg-amber-500/5 blur-3xl pointer-events-none rounded-full" />
            <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-amber-500/5 blur-3xl pointer-events-none rounded-full" />
            
            <div className="relative z-10 flex-1 flex flex-col min-h-0">
              {/* Header Title inside Floating chat */}
              <div className="flex justify-between items-center pb-2 border-b border-white/[0.06] mb-3">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-[#FBBF24] animate-pulse" />
                  <span className="text-xs font-bold font-mono tracking-wider text-gradient-amber uppercase">
                    FinSage ChatBot
                  </span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.04] transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Chat Viewport */}
              <div className="flex-1 min-h-0 flex flex-col">
                <ChatInterface isFloating={true} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
