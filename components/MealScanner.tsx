"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera, Check, RotateCcw } from "lucide-react";
import { Haptics, Sounds } from "@/lib/soul";

interface MealAnalysis {
  onPlan: boolean;
  summary: string;
  foods: string[];
  reasoning: string;
}

interface MealScannerProps {
  onComplete?: () => void;
  onClose: () => void;
}

type ScanState = "capture" | "analyzing" | "result";

export function MealScanner({ onComplete, onClose }: MealScannerProps) {
  const [state, setState] = useState<ScanState>("capture");
  const [imageData, setImageData] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<MealAnalysis | null>(null);
  const [logged, setLogged] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCapture = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Haptics.light();

    // Convert to base64
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      // Extract base64 part (remove data:image/...;base64, prefix)
      const base64 = dataUrl.split(",")[1];
      setImageData(dataUrl);
      setState("analyzing");

      try {
        const res = await fetch("/api/v3/scan-meal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64 }),
        });

        if (!res.ok) throw new Error("Failed to analyze");

        const data = await res.json();
        setAnalysis(data.analysis);
        setLogged(data.logged);
        setState("result");

        if (data.analysis.onPlan) {
          Haptics.success();
          Sounds.playSuccess();
        } else {
          Haptics.medium();
        }
      } catch (err) {
        console.error("Scan error:", err);
        setError("Couldn't analyze the photo. Try again.");
        setState("capture");
        Haptics.error();
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const handleRetry = () => {
    setImageData(null);
    setAnalysis(null);
    setLogged(false);
    setError(null);
    setState("capture");
    // Reset file input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDone = () => {
    if (logged) {
      onComplete?.();
    }
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex flex-col"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.95)" }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors z-10"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <AnimatePresence mode="wait">
          {/* Capture State */}
          {state === "capture" && (
            <motion.div
              key="capture"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center gap-6"
            >
              <div className="w-40 h-40 rounded-3xl bg-white/5 border-2 border-dashed border-green-500/30 flex items-center justify-center">
                <Camera className="w-12 h-12 text-green-500/40" />
              </div>

              <div className="text-center">
                <h2 className="text-xl font-medium text-white mb-2">Scan your meal</h2>
                <p className="text-sm text-white/40 max-w-[250px]">
                  Take a photo of your plate. AI will tell you if it's on-plan.
                </p>
              </div>

              {error && (
                <p className="text-sm text-red-400">{error}</p>
              )}

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleCapture}
                className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center text-green-400 hover:bg-green-500/30 transition-colors"
              >
                <Camera className="w-7 h-7" />
              </motion.button>
            </motion.div>
          )}

          {/* Analyzing State */}
          {state === "analyzing" && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-6"
            >
              {imageData && (
                <div className="w-48 h-48 rounded-2xl overflow-hidden border border-white/10">
                  <img src={imageData} alt="Meal" className="w-full h-full object-cover" />
                </div>
              )}

              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
                <p className="text-sm text-white/50">Analyzing your meal...</p>
              </div>
            </motion.div>
          )}

          {/* Result State */}
          {state === "result" && analysis && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-6 w-full max-w-sm"
            >
              {/* Photo */}
              {imageData && (
                <div className="w-40 h-40 rounded-2xl overflow-hidden border border-white/10">
                  <img src={imageData} alt="Meal" className="w-full h-full object-cover" />
                </div>
              )}

              {/* Verdict */}
              <div
                className="w-full rounded-2xl p-5 border"
                style={{
                  backgroundColor: analysis.onPlan ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
                  borderColor: analysis.onPlan ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)",
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: analysis.onPlan ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)",
                    }}
                  >
                    {analysis.onPlan ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <X className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                  <div>
                    <span
                      className="text-sm font-medium"
                      style={{ color: analysis.onPlan ? "#4ade80" : "#f87171" }}
                    >
                      {analysis.onPlan ? "On-plan" : "Off-plan"}
                    </span>
                    <p className="text-xs text-white/50">{analysis.summary}</p>
                  </div>
                </div>

                {/* Foods */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {analysis.foods.map((food, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-full text-xs"
                      style={{
                        backgroundColor: analysis.onPlan ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)",
                        color: analysis.onPlan ? "rgba(34, 197, 94, 0.8)" : "rgba(239, 68, 68, 0.8)",
                      }}
                    >
                      {food}
                    </span>
                  ))}
                </div>

                <p className="text-xs text-white/40 leading-relaxed">{analysis.reasoning}</p>

                {logged && (
                  <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-xs text-green-400/80">Auto-logged as clean eating day</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 w-full">
                <button
                  onClick={handleRetry}
                  className="flex-1 py-3 rounded-xl text-sm text-white/50 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Retake
                </button>
                <button
                  onClick={handleDone}
                  className="flex-1 py-3 rounded-xl text-sm font-medium text-black bg-green-400 hover:bg-green-300 transition-colors"
                >
                  Done
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Subtle label */}
      {state === "capture" && (
        <div className="pb-10 text-center text-xs text-white/20 tracking-wider uppercase">
          meal scanner
        </div>
      )}
    </motion.div>
  );
}
