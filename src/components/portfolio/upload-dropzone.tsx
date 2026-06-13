"use client";

import { useCallback, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, ImagePlus, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadDropzoneProps {
  onImageSelected: (
    base64: string,
    mimeType: "image/jpeg" | "image/png" | "image/webp",
    previewUrl: string
  ) => void;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

type AcceptedMimeType = (typeof ACCEPTED_TYPES)[number];

function isAcceptedType(type: string): type is AcceptedMimeType {
  return ACCEPTED_TYPES.includes(type as AcceptedMimeType);
}

export function UploadDropzone({ onImageSelected }: UploadDropzoneProps) {
  const [isDragOver, setIsDragOver]   = useState(false);
  const [preview, setPreview]         = useState<string | null>(null);
  const [fileName, setFileName]       = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Convert file to base64 and pass up ───────────────────────────────────
  const processFile = useCallback(
    (file: File) => {
      setValidationError(null);

      // File type check
      if (!isAcceptedType(file.type)) {
        setValidationError("Please upload a JPG, PNG, or WebP image.");
        return;
      }

      // File size check
      if (file.size > MAX_SIZE_BYTES) {
        setValidationError(
          `Image is too large. Maximum size is ${MAX_SIZE_MB}MB.`
        );
        return;
      }

      const reader = new FileReader();

      reader.onload = (e) => {
        const result = e.target?.result as string;

        // result looks like: "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
        // We need just the base64 part after the comma
        const base64 = result.split(",")[1];
        const previewUrl = result; // keep the full data URL for the <img> tag

        setPreview(previewUrl);
        setFileName(file.name);

        // Pass up to the upload page
        onImageSelected(base64, file.type as AcceptedMimeType, previewUrl);
      };

      reader.readAsDataURL(file);
    },
    [onImageSelected]
  );

  // ── Drag events ───────────────────────────────────────────────────────────
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const file = e.dataTransfer.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  // ── Click to browse ───────────────────────────────────────────────────────
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  // ── Clear selection ───────────────────────────────────────────────────────
  const handleClear = useCallback(() => {
    setPreview(null);
    setFileName(null);
    setValidationError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  return (
    <div className="w-full">
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleInputChange}
      />

      <AnimatePresence mode="wait">
        {/* ── No image selected yet — show dropzone ── */}
        {!preview ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            onClick={() => inputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "relative flex flex-col items-center justify-center",
              "w-full min-h-[320px] rounded-[12px] cursor-pointer",
              "border-2 border-dashed transition-all duration-300",
              "glass-card",
              isDragOver
                ? "border-accent-400 bg-accent-500/10 scale-[1.01]"
                : "border-white/10 hover:border-white/20 hover:bg-white/[0.02]"
            )}
          >
            {/* Glow when dragging */}
            <AnimatePresence>
              {isDragOver && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 rounded-[12px] pointer-events-none"
                  style={{
                    boxShadow: "inset 0 0 60px rgba(251, 191, 36, 0.08)",
                  }}
                />
              )}
            </AnimatePresence>

            {/* Icon */}
            <div
              className={cn(
                "w-16 h-16 rounded-[12px] flex items-center justify-center mb-5",
                "border transition-colors duration-300",
                isDragOver
                  ? "bg-accent-500/20 border-accent-500/40"
                  : "bg-white/[0.03] border-white/[0.08]"
              )}
            >
              {isDragOver ? (
                <ImagePlus className="w-7 h-7 text-accent-400" />
              ) : (
                <Upload className="w-7 h-7 text-white/40" />
              )}
            </div>

            {/* Text */}
            <p className="text-base font-medium text-white/80 mb-1">
              {isDragOver
                ? "Drop it here"
                : "Drag your portfolio screenshot here"}
            </p>
            <p className="text-sm text-white/40 mb-6">
              or click anywhere to browse
            </p>

            {/* Supported formats */}
            <div className="flex items-center gap-2">
              {["JPG", "PNG", "WebP"].map((fmt) => (
                <span
                  key={fmt}
                  className="px-2.5 py-1 rounded-md text-xs font-mono
                             bg-white/[0.04] border border-white/[0.08]
                             text-white/50"
                >
                  {fmt}
                </span>
              ))}
              <span className="text-xs text-white/30">· Max {MAX_SIZE_MB}MB</span>
            </div>

            {/* Tips */}
            <div className="absolute bottom-5 left-0 right-0 px-6">
              <p className="text-xs text-white/30 text-center">
                Works with Zerodha, Groww, Upstox, Angel One, or any broker app screenshot
              </p>
            </div>
          </motion.div>
        ) : (
          /* ── Image selected — show preview ── */
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className="relative w-full rounded-[12px] overflow-hidden glass-card"
          >
            {/* Preview image */}
            <div className="relative w-full max-h-[400px] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Portfolio screenshot preview"
                className="w-full object-contain"
              />
              {/* Gradient overlay at bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-20
                              bg-gradient-to-t from-canvas to-transparent" />
            </div>

            {/* File info bar */}
            <div className="flex items-center justify-between p-4
                            border-t border-glass-border">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent-500/10
                                border border-accent-500/20
                                flex items-center justify-center">
                  <ImagePlus className="w-4 h-4 text-accent-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/90 truncate
                                max-w-[200px]">
                    {fileName}
                  </p>
                  <p className="text-xs text-white/40">
                    Ready to extract holdings
                  </p>
                </div>
              </div>

              {/* Clear button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                className="p-2 rounded-lg glass-card glass-card-hover
                           text-white/50 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Validation error */}
      <AnimatePresence>
        {validationError && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3 flex items-center gap-2 text-loss text-sm"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            {validationError}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}