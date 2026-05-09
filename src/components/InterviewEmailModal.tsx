/**
 * InterviewEmailModal — Pre-interview email collection modal
 * Collects user's full name and email before starting the interview.
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, User, ArrowRight, Sparkles, X, AlertCircle } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, email: string) => void;
  defaultName?: string;
  defaultEmail?: string;
}

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export default function InterviewEmailModal({ isOpen, onClose, onSubmit, defaultName = "", defaultEmail = "" }: Props) {
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!name.trim()) e.name = "Full name is required";
    else if (name.trim().length < 2) e.name = "Name is too short";
    if (!email.trim()) e.email = "Email is required";
    else if (!emailRegex.test(email)) e.email = "Please enter a valid email";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onSubmit(name.trim(), email.trim());
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-md bg-surface/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="relative px-6 pt-6 pb-4 bg-gradient-to-b from-accent/10 to-transparent">
              <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/5 text-text-secondary hover:text-white transition-colors">
                <X size={18} />
              </button>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center shadow-lg">
                  <Sparkles className="text-white" size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Before We Begin</h3>
                  <p className="text-xs text-text-secondary">We'll send your AI analysis report here</p>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="px-6 pb-6 space-y-4">
              {/* Name Field */}
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                  <User size={12} /> Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setErrors(prev => ({ ...prev, name: undefined })); }}
                  placeholder="John Doe"
                  className={`input w-full ${errors.name ? 'border-danger/50 focus:border-danger' : ''}`}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                />
                {errors.name && (
                  <p className="flex items-center gap-1 text-xs text-danger mt-1.5">
                    <AlertCircle size={12} /> {errors.name}
                  </p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                  <Mail size={12} /> Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: undefined })); }}
                  placeholder="john@example.com"
                  className={`input w-full ${errors.email ? 'border-danger/50 focus:border-danger' : ''}`}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                />
                {errors.email && (
                  <p className="flex items-center gap-1 text-xs text-danger mt-1.5">
                    <AlertCircle size={12} /> {errors.email}
                  </p>
                )}
              </div>

              {/* Info */}
              <div className="flex items-start gap-2 p-3 rounded-lg bg-accent/5 border border-accent/10">
                <Mail size={14} className="text-accent mt-0.5 flex-shrink-0" />
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  After your interview, we'll analyze your performance with AI and send a detailed PDF report with scores, 
                  strengths, weaknesses, and improvement suggestions to your email.
                </p>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                className="btn-primary w-full py-3 text-sm font-semibold shadow-[0_0_20px_rgba(139,92,246,0.3)] flex items-center justify-center gap-2"
              >
                Start Interview <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
