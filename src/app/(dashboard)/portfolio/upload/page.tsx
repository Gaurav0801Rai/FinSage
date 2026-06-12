"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Sparkles,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Plus,
} from "lucide-react";
import { UploadDropzone } from "@/components/portfolio/upload-dropzone";
import { HoldingsReviewTable } from "@/components/portfolio/holdings-review-table";
import { AddHoldingForm } from "@/components/portfolio/add-holding-form";
import { extractHoldingsFromImage, saveHoldings } from "@/app/actions/portfolio";
import { ROUTES } from "@/lib/constants";
import type { ExtractedHolding } from "@/types/portfolio";

// The four steps of the upload flow
type UploadStep = "upload" | "extracting" | "review" | "saving";

export default function UploadPage() {
  const router = useRouter();

  // Which step of the flow we're on
  const [step, setStep] = useState<UploadStep>("upload");

  // The image the user selected
  const [selectedImage, setSelectedImage] = useState<{
    base64: string;
    mimeType: "image/jpeg" | "image/png" | "image/webp";
    previewUrl: string;
  } | null>(null);

  // Holdings extracted by Gemini (editable by user)
  const [holdings, setHoldings] = useState<ExtractedHolding[]>([]);

  // Whether the "Add holding manually" form is visible
  const [showAddForm, setShowAddForm] = useState(false);

  // Any error message to show the user
  const [error, setError] = useState<string | null>(null);

  // ── Step 1 → 2: User selected an image, now extract ──────────────────────
  const handleImageSelected = useCallback(
    async (
      base64: string,
      mimeType: "image/jpeg" | "image/png" | "image/webp",
      previewUrl: string
    ) => {
      setSelectedImage({ base64, mimeType, previewUrl });
      setError(null);
      setStep("extracting");

      // Call Gemini Vision via Server Action
      const result = await extractHoldingsFromImage(base64, mimeType);

      if (!result.success) {
        setError(result.error);
        setStep("upload"); // go back so user can try again
        return;
      }

      if (result.holdings.length === 0) {
        // Gemini found nothing — let user add manually
        setError(
          "No holdings were detected in the image. You can add them manually below."
        );
        setHoldings([]);
        setShowAddForm(true);
        setStep("review");
        return;
      }

      setHoldings(result.holdings);
      setStep("review");
    },
    []
  );

  // ── Review step: user edits a row ────────────────────────────────────────
  const handleHoldingChange = useCallback(
    (id: string, updated: Partial<ExtractedHolding>) => {
      setHoldings((prev) =>
        prev.map((h) => (h.id === id ? { ...h, ...updated } : h))
      );
    },
    []
  );

  // ── Review step: user deletes a row ──────────────────────────────────────
  const handleHoldingDelete = useCallback((id: string) => {
    setHoldings((prev) => prev.filter((h) => h.id !== id));
  }, []);

  // ── Review step: user adds a row manually ────────────────────────────────
  const handleHoldingAdd = useCallback((newHolding: ExtractedHolding) => {
    setHoldings((prev) => [...prev, newHolding]);
    setShowAddForm(false);
  }, []);

  // ── Step 4: User confirms, save to Firestore ─────────────────────────────
  const handleConfirmAndSave = async () => {
    if (holdings.length === 0) {
      setError("Please add at least one holding before saving.");
      return;
    }

    setError(null);
    setStep("saving");

    const source = selectedImage ? "ocr" : "manual";
    const result = await saveHoldings(holdings, source);

    if (!result.success) {
      setError(result.error ?? "Failed to save. Please try again.");
      setStep("review");
      return;
    }

    // Success — go to dashboard
    router.push(ROUTES.dashboard);
  };

  // ── Go back to upload screen ──────────────────────────────────────────────
  const handleStartOver = () => {
    setStep("upload");
    setSelectedImage(null);
    setHoldings([]);
    setError(null);
    setShowAddForm(false);
  };

  return (
    <div className="min-h-screen p-6 md:p-10">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          {step === "review" && (
            <button
              onClick={handleStartOver}
              className="p-2 rounded-lg glass-card glass-card-hover
                         text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <h1 className="text-2xl font-semibold tracking-tight">
            Upload Portfolio
          </h1>
        </div>
        <p className="text-white/60 text-sm">
          Upload a screenshot of your holdings. AI will extract the data
          automatically.
        </p>
      </div>

      {/* Error banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-6 flex items-start gap-3 p-4 rounded-xl
                       bg-loss/10 border border-loss/20 text-loss"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── STEP: UPLOAD ── */}
      <AnimatePresence mode="wait">
        {step === "upload" && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
          >
            <UploadDropzone onImageSelected={handleImageSelected} />

            {/* Manual entry option */}
            <div className="mt-6 text-center">
              <p className="text-sm text-white/40 mb-3">
                Don&apos;t have a screenshot?
              </p>
              <button
                onClick={() => {
                  setStep("review");
                  setShowAddForm(true);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5
                           glass-card glass-card-hover text-sm font-medium
                           text-white/80 hover:text-white transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add holdings manually
              </button>
            </div>
          </motion.div>
        )}

        {/* ── STEP: EXTRACTING (loading) ── */}
        {step === "extracting" && (
          <motion.div
            key="extracting"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center py-24"
          >
            {/* Animated amber pulse ring */}
            <div className="relative mb-8">
              <div className="w-20 h-20 rounded-full bg-accent-500/10
                              border border-accent-500/30 flex items-center
                              justify-center animate-pulse-glow">
                <Sparkles className="w-8 h-8 text-accent-400" />
              </div>
              {/* Rotating ring */}
              <div className="absolute inset-0 rounded-full border-2
                              border-transparent border-t-accent-400
                              animate-spin" />
            </div>

            <h2 className="text-xl font-semibold mb-2">
              Reading your portfolio...
            </h2>
            <p className="text-white/50 text-sm text-center max-w-xs">
              Gemini AI is analysing your screenshot and extracting holdings.
              This takes 3–5 seconds.
            </p>

            {/* Preview of the image being processed */}
            {selectedImage && (
              <div className="mt-8 w-48 h-32 rounded-xl overflow-hidden
                              glass-card opacity-60">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedImage.previewUrl}
                  alt="Processing"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </motion.div>
        )}

        {/* ── STEP: REVIEW ── */}
        {step === "review" && (
          <motion.div
            key="review"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
          >
            {/* Summary bar */}
            {holdings.length > 0 && (
              <div className="mb-6 flex items-center gap-3 p-4 rounded-xl
                              bg-gain/10 border border-gain/20">
                <CheckCircle className="w-5 h-5 text-gain shrink-0" />
                <p className="text-sm text-gain">
                  <span className="font-semibold">{holdings.length} holdings</span>
                  {" "}detected. Review and correct any mistakes below before saving.
                </p>
              </div>
            )}

            {/* The editable review table */}
            <HoldingsReviewTable
              holdings={holdings}
              onChange={handleHoldingChange}
              onDelete={handleHoldingDelete}
            />

            {/* Add holding form (toggle) */}
            <div className="mt-4">
              {showAddForm ? (
                <AddHoldingForm
                  onAdd={handleHoldingAdd}
                  onCancel={() => setShowAddForm(false)}
                  existingSymbols={holdings.map((h) => h.symbol)}
                />
              ) : (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="flex items-center gap-2 px-4 py-3 w-full
                             glass-card glass-card-hover rounded-xl
                             text-sm text-white/60 hover:text-white/90
                             transition-colors border-dashed"
                >
                  <Plus className="w-4 h-4" />
                  Add a holding manually
                </button>
              )}
            </div>

            {/* Confirm button */}
            <div className="mt-8 flex items-center justify-between">
              <p className="text-xs text-white/40">
                {holdings.length} holding{holdings.length !== 1 ? "s" : ""} ready to save
              </p>
              <button
                onClick={handleConfirmAndSave}
                disabled={holdings.length === 0}
                className="px-6 py-3 btn-glow rounded-xl font-medium
                           disabled:opacity-40 disabled:cursor-not-allowed
                           disabled:hover:shadow-none transition-all"
              >
                Confirm &amp; Save Holdings
              </button>
            </div>
          </motion.div>
        )}

        {/* ── STEP: SAVING ── */}
        {step === "saving" && (
          <motion.div
            key="saving"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-24"
          >
            <div className="relative mb-8">
              <div className="w-20 h-20 rounded-full bg-accent-500/10
                              border border-accent-500/30 flex items-center
                              justify-center">
                <Upload className="w-8 h-8 text-accent-400" />
              </div>
              <div className="absolute inset-0 rounded-full border-2
                              border-transparent border-t-accent-400
                              animate-spin" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Saving holdings...</h2>
            <p className="text-white/50 text-sm">
              Storing your portfolio securely.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}