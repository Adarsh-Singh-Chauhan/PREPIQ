/**
 * RecordingIndicator — Live recording status badge
 * Shows a pulsing red dot with recording duration.
 */

"use client";

import { motion } from "framer-motion";
import { Video } from "lucide-react";

interface Props {
  isRecording: boolean;
  duration: number;
  isPaused?: boolean;
}

export default function RecordingIndicator({ isRecording, duration, isPaused }: Props) {
  if (!isRecording) return null;

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-danger/20 border border-danger/30 backdrop-blur-sm"
    >
      <motion.div
        animate={{ scale: isPaused ? 1 : [1, 1.3, 1], opacity: isPaused ? 0.5 : [1, 0.6, 1] }}
        transition={{ repeat: Infinity, duration: 1.2 }}
        className="w-2.5 h-2.5 rounded-full bg-danger"
      />
      <Video size={12} className="text-danger" />
      <span className="text-xs font-mono font-bold text-danger">
        {isPaused ? "PAUSED" : "REC"} {formatDuration(duration)}
      </span>
    </motion.div>
  );
}
