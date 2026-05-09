/**
 * InterviewReportSuccess — Post-interview success screen
 * Shown after the AI analysis is complete. Adapts to show email delivery status.
 */

"use client";

import { motion } from "framer-motion";
import { CheckCircle, Mail, FileText, Video, ArrowRight, Sparkles, AlertCircle } from "lucide-react";

interface Props {
  candidateName: string;
  email: string;
  overallScore: number;
  emailSent?: boolean;
  onGoToDashboard: () => void;
  onRunAgain: () => void;
}

export default function InterviewReportSuccess({ candidateName, email, overallScore, emailSent = true, onGoToDashboard, onRunAgain }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-lg mx-auto text-center space-y-6"
    >
      {/* Success Icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
        className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-success/20 to-emerald-500/10 border border-success/30 flex items-center justify-center shadow-[0_0_40px_rgba(34,197,94,0.2)]"
      >
        <CheckCircle className="text-success" size={48} />
      </motion.div>

      {/* Title */}
      <div>
        <h2 className="text-2xl font-black text-white mb-2">
          {emailSent ? 'Report Sent Successfully!' : 'Analysis Complete!'}
        </h2>
        <p className="text-text-secondary">
          {emailSent ? (
            <>Your AI interview analysis report has been delivered to{" "}
            <span className="text-accent font-medium">{email}</span></>
          ) : (
            <>Your AI interview analysis is ready! Review your detailed scores above.</>
          )}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-4 bg-surface/80 border border-white/10"
        >
          <FileText className="text-accent mx-auto mb-2" size={20} />
          <p className="text-xs text-text-secondary">PDF Report</p>
          <p className={`text-sm font-bold ${emailSent ? 'text-success' : 'text-text-secondary'}`}>
            {emailSent ? 'Attached' : 'Available'}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card p-4 bg-surface/80 border border-white/10"
        >
          <Video className="text-accent mx-auto mb-2" size={20} />
          <p className="text-xs text-text-secondary">Recording</p>
          <p className="text-sm font-bold text-success">Saved</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card p-4 bg-surface/80 border border-white/10"
        >
          <Sparkles className="text-accent mx-auto mb-2" size={20} />
          <p className="text-xs text-text-secondary">Score</p>
          <p className={`text-lg font-black ${overallScore >= 80 ? 'text-success' : overallScore >= 60 ? 'text-warning' : 'text-danger'}`}>
            {overallScore}%
          </p>
        </motion.div>
      </div>

      {/* Email Status */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className={`p-4 rounded-xl text-left ${emailSent ? 'bg-accent/5 border border-accent/10' : 'bg-warning/5 border border-warning/10'}`}
      >
        <div className="flex items-center gap-2 mb-2">
          {emailSent ? (
            <><Mail className="text-accent" size={14} /><span className="text-xs font-bold text-accent uppercase tracking-wider">Email Sent To</span></>
          ) : (
            <><AlertCircle className="text-warning" size={14} /><span className="text-xs font-bold text-warning uppercase tracking-wider">Email Delivery Skipped</span></>
          )}
        </div>
        {emailSent ? (
          <>
            <p className="text-sm text-text-primary font-medium">{candidateName}</p>
            <p className="text-xs text-text-secondary">{email}</p>
            <p className="text-[10px] text-text-secondary/60 mt-2">
              Check your inbox (and spam folder). The report includes a secure link to your interview recording that expires in 24 hours.
            </p>
          </>
        ) : (
          <>
            <p className="text-sm text-text-primary font-medium">{candidateName}</p>
            <p className="text-xs text-text-secondary mt-1">
              Email delivery requires a <span className="text-accent font-medium">verified domain</span> on{" "}
              <a href="https://resend.com/domains" target="_blank" rel="noopener noreferrer" className="text-accent font-medium underline hover:text-accent/80">resend.com/domains</a>.
              {" "}On the free tier, emails can only be sent to your Resend account email.
            </p>
            <p className="text-[10px] text-text-secondary/60 mt-2">
              Your full analysis results are displayed above with question-by-question breakdown, AI scores, and improvement suggestions.
            </p>
          </>
        )}
      </motion.div>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={onGoToDashboard} className="btn-outline flex-1 py-3">
          View Analytics
        </button>
        <button onClick={onRunAgain} className="btn-primary flex-1 py-3 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(139,92,246,0.3)]">
          Run Again <ArrowRight size={16} />
        </button>
      </div>
    </motion.div>
  );
}

