"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import ChatInterface from "./chat-interface";
import { RobotIcon } from "@/components/brand/robot-icon";

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
                   bg-gradient-to-tr from-[#1A365D] to-[#090D12] text-[#FFC837]
                   shadow-[0_0_20px_rgba(255,200,55,0.35)] hover:shadow-[0_0_25px_rgba(255,200,55,0.5)]
                   transition-shadow duration-300 border-2 border-[#FFC837] cursor-pointer"
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
              <X className="h-6 w-6 text-[#FFC837]" />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative flex items-center justify-center"
            >
              <RobotIcon size={28} />
              {/* Small speech-bubble with ... typing indicator */}
              <span className="absolute -top-3.5 -left-3.5 bg-[#FFC837] text-[#090D12] text-[9px] font-bold px-1.5 py-0.5 rounded-full rounded-bl-none shadow-md animate-bounce">
                ...
              </span>
              {/* Little ambient pulse dot */}
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFC837] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FFC837]"></span>
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
                       border border-[#64748B]/20 rounded-[12px] shadow-2xl p-4
                       bg-[#121820] backdrop-blur-2xl flex flex-col overflow-hidden"
          >
            {/* Backdrop glow in the drawer itself */}
            <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#FFC837]/5 blur-3xl pointer-events-none rounded-full" />
            <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-[#1F4E79]/5 blur-3xl pointer-events-none rounded-full" />
            
            <div className="relative z-10 flex-1 flex flex-col min-h-0">
              {/* Header Title inside Floating chat */}
              <div className="flex justify-between items-center pb-2 border-b border-[#64748B]/20 mb-3">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-[#FFC837] animate-pulse" />
                  <span className="text-xs font-bold font-mono tracking-wider text-[#FFC837] uppercase">
                    FinSage ChatBot
                  </span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg text-[#64748B] hover:text-white hover:bg-white/[0.04] transition cursor-pointer"
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
