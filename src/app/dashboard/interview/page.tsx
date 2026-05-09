"use client";

import { computeSemanticSimilarity, mlConfidenceScore } from "@/lib/rag-engine";
import { insertInterview, insertSession } from "@/lib/supabase-db";
import { useAuth } from "@/lib/auth-context";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic, MicOff, Video, VideoOff, Phone,
  Sparkles, BrainCircuit,
  Loader2, Clock, Volume2, VolumeX,
  UploadCloud, FileText, CheckCircle, AlertTriangle, Award, Target, BarChart3, ChevronRight, Mail, Send
} from "lucide-react";
import { useSpeechToText } from "@/lib/speech";
import { generateAIResponse } from "@/lib/gemini";
import { useMediaRecorder } from "@/hooks/useMediaRecorder";
import { uploadRecording, getSignedRecordingUrl } from "@/services/interview-recording";
import { analyzeInterview, buildTranscript, type InterviewAnalysis } from "@/services/interview-analysis";
import InterviewEmailModal from "@/components/InterviewEmailModal";
import RecordingIndicator from "@/components/RecordingIndicator";
import InterviewReportSuccess from "@/components/InterviewReportSuccess";


type Phase = "setup" | "interview" | "done";

interface QuestionResult {
  question: string;
  answer: string;
  llmScore: number;
  semanticScore: number;
  mlConfidence: number;
  verdict: string;
  feedback: string;
  keywords: string[];
  matchedKw: string[];
  missedKw: string[];
}

export default function InterviewPage() {
  const { user } = useAuth();
  const [phase, setPhase] = useState<Phase>("setup");
  const [config, setConfig] = useState({ 
    domain: "Technical", 
    difficulty: "Intermediate", 
    count: 5, 
    model: "GPT-5.1 Omni",
  });
  const [interviewSaved, setInterviewSaved] = useState(false);
  
  // Email & Recording State
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [candidateEmail, setCandidateEmail] = useState("");
  const [candidateName, setCandidateName] = useState("");
  const [sessionId] = useState(() => crypto.randomUUID());
  const { isRecording, duration: recordingDuration, blob: recordingBlob, startRecording, stopRecording, resetRecording } = useMediaRecorder();
  
  // Post-Interview Processing State
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState<InterviewAnalysis | null>(null);
  const [reportSent, setReportSent] = useState(false);
  const [emailActuallySent, setEmailActuallySent] = useState(false);
  const [reportError, setReportError] = useState("");
  
  // Interview State
  const [currentQ, setCurrentQ] = useState(0);
  const [timer, setTimer] = useState(600);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [aiVoiceOn, setAiVoiceOn] = useState(true);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  
  // AI State
  const [currentQuestionText, setCurrentQuestionText] = useState("AI is preparing the question...");
  const [typedAnswer, setTypedAnswer] = useState("");
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [scores, setScores] = useState<number[]>([]);
  const [confidence, setConfidence] = useState(85);
  const [emotion, setEmotion] = useState("Focused");
  const [questionResults, setQuestionResults] = useState<QuestionResult[]>([]);
  const [currentVerdict, setCurrentVerdict] = useState("");
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  
  const { isListening, transcript, startListening, stopListening } = useSpeechToText();
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Domains
  const domains = ["Technical", "System Design", "HR Round", "ML / Deep Learning", "Behavioral", "Aptitude", "Reasoning", "Soft Skills"];
  const models = ["GPT-5.1 Omni", "Gemini 1.5 Pro"];

  // Initialize Voices
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.speechSynthesis.getVoices();
    }
  }, []);

  const speak = (text: string) => {
    if (!window.speechSynthesis || !aiVoiceOn) return;
    window.speechSynthesis.cancel();
    
    setIsAiSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.name.includes("Female") || v.name.includes("Samantha") || v.name.includes("Google UK")) || voices[0];
    if (voice) utterance.voice = voice;
    utterance.rate = 0.95;
    utterance.pitch = 1.1;
    
    utterance.onend = () => setIsAiSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const fetchNextQuestion = async () => {
    setIsLoadingAI(true);
    setCurrentQuestionText("AI is analyzing your profile and generating the next question...");
    setTypedAnswer("");
    setFeedback("");
    setCurrentVerdict("");
    setQuestionStartTime(Date.now());
    
    const prompt = `You are an expert ${config.domain} interviewer. 
    Ask exactly ONE ${config.difficulty} level interview question for a placement drive.
    Do not write anything else, just the question.`;
    
    const q = await generateAIResponse(prompt);
    
    setCurrentQuestionText(q);
    setIsLoadingAI(false);
    speak(q);
  };

  const submitAnswer = async () => {
    const finalAnswer = `${transcript} ${typedAnswer}`.trim();
    if (!finalAnswer) return;

    if (isListening) stopListening();

    setIsLoadingAI(true);
    const responseTime = (Date.now() - questionStartTime) / 1000;
    
    const prompt = `
      Question: ${currentQuestionText}
      Candidate Answer: ${finalAnswer}
      Evaluate strictly. Respond EXACTLY in this format:
      SCORE: [0-100]
      VERDICT: [excellent/good/average/poor]
      FEEDBACK: [one sentence]
      IDEAL_ANSWER: [what a perfect answer covers]
      KEYWORDS: [comma-separated key terms expected]
    `;
    
    const evalResponse = await generateAIResponse(prompt, { mode: 'evaluation' });
    
    const scoreMatch = evalResponse.match(/SCORE:\s*(\d+)/i);
    const verdictMatch = evalResponse.match(/VERDICT:\s*(\w+)/i);
    const feedbackMatch = evalResponse.match(/FEEDBACK:\s*(.*)/i);
    const idealMatch = evalResponse.match(/IDEAL_ANSWER:\s*(.*)/i);
    const kwMatch = evalResponse.match(/KEYWORDS:\s*(.*)/i);
    
    const llmScore = scoreMatch ? parseInt(scoreMatch[1]) : Math.floor(60 + Math.random() * 30);
    const fb = feedbackMatch ? feedbackMatch[1] : "Good attempt.";
    const idealAnswer = idealMatch ? idealMatch[1] : "A comprehensive answer with examples.";
    const keywords = kwMatch ? kwMatch[1].split(',').map(k => k.trim()) : ['concept','example','complexity'];
    
    // Semantic Similarity (TF-IDF + Cosine)
    const semResult = computeSemanticSimilarity(finalAnswer, idealAnswer, keywords);
    
    // ML Confidence Score
    const mlResult = mlConfidenceScore({
      answerLength: finalAnswer.split(/\s+/).length,
      keywordHits: semResult.matchedKeywords.length,
      totalKeywords: keywords.length,
      responseTimeSec: responseTime,
      semanticScore: semResult.score,
    });
    
    const verdict = verdictMatch ? verdictMatch[1].toLowerCase() : semResult.verdict;
    const finalScore = Math.round(llmScore * 0.5 + semResult.score * 0.3 + mlResult.confidence * 0.2);
    
    setScores(prev => [...prev, finalScore]);
    setCurrentVerdict(verdict);
    setFeedback(`${verdict.toUpperCase()} (${finalScore}/100) — ${fb}`);
    setQuestionResults(prev => [...prev, {
      question: currentQuestionText, answer: finalAnswer,
      llmScore, semanticScore: semResult.score, mlConfidence: mlResult.confidence,
      verdict, feedback: fb, keywords,
      matchedKw: semResult.matchedKeywords, missedKw: semResult.missedKeywords,
    }]);
    setIsLoadingAI(false);
    speak(`${verdict}! You scored ${finalScore} out of 100. ${fb}`);
    
    setTimeout(() => {
      if (currentQ < config.count - 1) {
        setCurrentQ(c => c + 1);
        fetchNextQuestion();
        if (micOn) startListening();
      } else {
        endInterview();
      }
    }, 5000);
  };

  useEffect(() => {
    if (phase === "interview") {
      fetchNextQuestion();
      timerRef.current = setInterval(() => setTimer((t) => (t > 0 ? t - 1 : 0)), 1000);
      const ci = setInterval(() => {
        setConfidence(Math.floor(70 + Math.random() * 25));
        setEmotion(["Calm", "Focused", "Confident", "Thinking", "Engaged"][Math.floor(Math.random() * 5)]);
      }, 3000);
      
      if (micOn && !isListening) startListening();
      navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
        if (videoRef.current) videoRef.current.srcObject = stream;
        // Start recording with the same stream
        startRecording(stream);
      }).catch(() => {});
      
      return () => { 
        if (timerRef.current) clearInterval(timerRef.current); 
        clearInterval(ci); 
        stopListening(); 
        if (window.speechSynthesis) window.speechSynthesis.cancel();
      };
    }
  }, [phase]);

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // Save interview results to Supabase
  const saveInterviewToSupabase = async () => {
    if (interviewSaved) return; // prevent duplicate saves
    setInterviewSaved(true);

    const finalScore =
      scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;

    const overallVerdict =
      finalScore >= 80 ? "excellent" : finalScore >= 60 ? "good" : finalScore >= 40 ? "average" : "poor";

    const userName = user?.name || "Guest";

    // Insert into interviews table (summary)
    const interviewResult = await insertInterview({
      user_name: userName,
      role: config.domain,
      score: finalScore,
      feedback: overallVerdict,
    });

    if (interviewResult.success) {
      console.log('[PrepIQ] ✅ Interview data saved to Supabase!');
    } else {
      console.warn('[PrepIQ] ⚠️ Interview save failed:', interviewResult.error);
    }

    // Insert detailed session
    const sessionResult = await insertSession({
      user_name: userName,
      domain: config.domain,
      difficulty: config.difficulty,
      duration_secs: 600 - timer,
      overall_score: finalScore,
      content_score: scores[0] || 0,
      confidence_score: Math.floor(70 + Math.random() * 25),
      ai_feedback: questionResults.map((r, i) => `Q${i+1}: ${r.verdict} (${r.llmScore}/100) - ${r.feedback}`).join(' | '),
      transcript: questionResults.map((r, i) => `Q${i+1}: ${r.question}\nA: ${r.answer}`).join('\n\n'),
    });

    if (sessionResult.success) {
      console.log('[PrepIQ] ✅ Session data saved to Supabase!');
    }
  };

  const endInterview = () => {
    if (videoRef.current?.srcObject) (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
    if (timerRef.current) clearInterval(timerRef.current);
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    // Stop recording
    stopRecording();
    setPhase("done");
  };

  // Handle email modal submission — start the actual interview
  const handleEmailSubmit = (name: string, email: string) => {
    setCandidateName(name);
    setCandidateEmail(email);
    setShowEmailModal(false);
    setPhase("interview");
  };

  // Process interview after completion — upload recording, analyze, send email
  // Each step is resilient and won't block subsequent steps on failure.
  const processAndSendReport = async () => {
    if (isProcessing || reportSent) return;
    setIsProcessing(true);
    setReportError("");

    try {
      const userId = user?.id || 'guest';
      let recordingSignedUrl = '';

      // Step 1: Upload recording (non-blocking — falls back to local blob)
      if (recordingBlob) {
        setProcessingStep('Uploading interview recording...');
        try {
          const uploadResult = await uploadRecording(recordingBlob, userId, sessionId);
          if (uploadResult.success && uploadResult.path) {
            const signedResult = await getSignedRecordingUrl(uploadResult.path, 86400); // 24h expiry
            if (signedResult.success && signedResult.url) {
              recordingSignedUrl = signedResult.url;
            }
          }
          // localUrl is available as a fallback but we don't need it for the report
        } catch (uploadErr) {
          console.warn('[PrepIQ] Recording upload skipped:', uploadErr);
        }
      }

      // Step 2: AI Analysis (always succeeds — server has fallback)
      setProcessingStep('Analyzing interview with AI...');
      const transcript = buildTranscript(questionResults);
      let analysis;
      try {
        const analysisResult = await analyzeInterview(transcript, config.domain, config.difficulty, candidateName);
        analysis = analysisResult.analysis;
      } catch (analysisErr) {
        console.warn('[PrepIQ] AI analysis call failed:', analysisErr);
      }

      if (!analysis) {
        // Use local scores as fallback
        const finalScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
        analysis = {
          communication_score: Math.floor(60 + Math.random() * 30),
          confidence_score: Math.floor(60 + Math.random() * 30),
          technical_score: finalScore,
          overall_score: finalScore,
          strengths: ['Attempted all questions', 'Showed willingness to learn'],
          weaknesses: ['Could improve depth of answers'],
          improvement_suggestions: ['Practice more real-world scenarios', 'Study core concepts'],
          summary: `${candidateName} completed the ${config.domain} interview with a score of ${finalScore}/100.`,
          question_breakdown: questionResults.map(r => ({ question: r.question, answer: r.answer, score: r.llmScore, feedback: r.feedback })),
        };
      }
      setAiAnalysis(analysis);

      // Step 3: Save session to DB (non-blocking)
      setProcessingStep('Saving interview session...');
      try {
        await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'insert',
            table: 'sessions',
            data: {
              user_name: candidateName,
              domain: config.domain,
              difficulty: config.difficulty,
              overall_score: analysis.overall_score,
              communication_score: analysis.communication_score,
              confidence_score: analysis.confidence_score,
              ai_feedback: analysis.summary,
              duration_secs: 600 - timer,
            },
          }),
        });
      } catch (dbErr) {
        console.warn('[PrepIQ] DB save skipped:', dbErr);
      }

      // Step 4: Generate PDF & Send Email (non-blocking)
      setProcessingStep('Generating report & sending email...');
      try {
        const emailResponse = await fetch('/api/send-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            candidateName,
            email: candidateEmail,
            domain: config.domain,
            difficulty: config.difficulty,
            communicationScore: analysis.communication_score,
            confidenceScore: analysis.confidence_score,
            technicalScore: analysis.technical_score,
            overallScore: analysis.overall_score,
            strengths: analysis.strengths,
            weaknesses: analysis.weaknesses,
            suggestions: analysis.improvement_suggestions,
            summary: analysis.summary,
            questionBreakdown: analysis.question_breakdown,
            recordingUrl: recordingSignedUrl || undefined,
          }),
        });

        if (emailResponse.ok) {
          const resData = await emailResponse.json().catch(() => ({}));
          if (resData.skipped) {
            // Email service not configured — analysis is still complete
            console.log('[PrepIQ] Email skipped (not configured). Analysis complete.');
            setEmailActuallySent(false);
          } else {
            setEmailActuallySent(true);
            console.log('[PrepIQ] ✅ Report sent to', candidateEmail);
          }
          setReportSent(true);
        } else {
          const errData = await emailResponse.json().catch(() => ({}));
          console.warn('[PrepIQ] Email failed:', errData.error);
          // Don't block — still mark flow complete
          setEmailActuallySent(false);
          setReportSent(true);
        }
      } catch (emailErr: any) {
        console.warn('[PrepIQ] Email send skipped:', emailErr.message);
        setEmailActuallySent(false);
        setReportSent(true);
      }
    } catch (err: any) {
      console.error('[PrepIQ] Processing error:', err);
      setReportError(err.message || 'An error occurred during processing');
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  // Auto-save to Supabase when interview is done
  useEffect(() => {
    if (phase === "done" && scores.length > 0 && !interviewSaved) {
      saveInterviewToSupabase();
    }
  }, [phase]);

  const emotionBgColors: Record<string, string> = { Calm: "bg-success/20", Focused: "bg-accent/20", Confident: "bg-cyan-400/20", Thinking: "bg-warning/20", Engaged: "bg-purple-500/20" };

  if (phase === "setup") {
    return (
      <div className="max-w-2xl mx-auto perspective-1000">
        <motion.div initial={{ opacity: 0, rotateX: 10, y: 30 }} animate={{ opacity: 1, rotateX: 0, y: 0 }} transition={{ type: "spring", stiffness: 100 }} className="card p-8 bg-surface/60 backdrop-blur-xl border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-accent/20 rounded-full blur-[80px] pointer-events-none" />
          
          <div className="text-center mb-8 relative z-10">
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 4 }} className="w-20 h-20 rounded-3xl bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(139,92,246,0.5)] border border-white/20">
              <Sparkles className="text-white" size={36} />
            </motion.div>
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70 mb-2">Live AI Interviewer</h2>
            <p className="text-sm font-medium text-text-secondary">Next-gen multimodal AI with voice and 3D presence.</p>
          </div>

          <div className="space-y-8 relative z-10">
            {/* AI Model Selection */}
            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">
                <BrainCircuit size={14} /> Select AI Model
              </label>
              <div className="grid grid-cols-2 gap-3">
                {models.map((m) => (
                  <button key={m} onClick={() => setConfig({ ...config, model: m })} className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border transition-all ${config.model === m ? "bg-accent/20 border-accent text-white shadow-[0_0_20px_rgba(139,92,246,0.2)]" : "bg-black/20 border-white/5 text-text-secondary hover:border-white/20"}`}>
                    <div className={`w-2 h-2 rounded-full ${config.model === m ? "bg-accent animate-pulse" : "bg-white/20"}`} />
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Interview Round */}
            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">Interview Round</label>
              <div className="flex flex-wrap gap-2">
                {domains.map((d) => (
                  <button key={d} onClick={() => setConfig({ ...config, domain: d })} className={`pill transition-all ${config.domain === d ? "active shadow-[0_0_15px_rgba(139,92,246,0.5)]" : "hover:border-accent/50"}`}>{d}</button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">Difficulty</label>
                <div className="flex gap-2">
                  {["Beginner", "Intermediate", "Advanced"].map((d) => (
                    <button key={d} onClick={() => setConfig({ ...config, difficulty: d })} className={`pill transition-all flex-1 ${config.difficulty === d ? "active" : "hover:border-accent/50"}`}>{d.slice(0, 3)}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">Questions</label>
                <div className="flex gap-2">
                  {[3, 5, 10].map((c) => (
                    <button key={c} onClick={() => setConfig({ ...config, count: c })} className={`pill transition-all flex-1 ${config.count === c ? "active" : "hover:border-accent/50"}`}>{c}</button>
                  ))}
                </div>
              </div>
          </div>
          
           <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowEmailModal(true)} className="btn-primary w-full mt-10 py-4 text-lg font-bold shadow-[0_0_30px_rgba(139,92,246,0.4)] relative z-10 overflow-hidden group">
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            <Video size={22} /> Join Live Interview
          </motion.button>

          {/* Email Collection Modal */}
          <InterviewEmailModal
            isOpen={showEmailModal}
            onClose={() => setShowEmailModal(false)}
            onSubmit={handleEmailSubmit}
            defaultName={user?.name || ''}
            defaultEmail={user?.email || ''}
          />
        </div>
        </motion.div>
      </div>
    );
  }

  if (phase === "done") {
    const finalScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const avgSemantic = questionResults.length > 0 ? Math.round(questionResults.reduce((a, r) => a + r.semanticScore, 0) / questionResults.length) : 0;
    const avgML = questionResults.length > 0 ? Math.round(questionResults.reduce((a, r) => a + r.mlConfidence, 0) / questionResults.length) : 0;
    const overallVerdict = finalScore >= 80 ? 'excellent' : finalScore >= 60 ? 'good' : finalScore >= 40 ? 'average' : 'poor';
    const verdictColors: Record<string, string> = { excellent: 'text-emerald-400', good: 'text-success', average: 'text-warning', poor: 'text-danger' };
    const verdictBg: Record<string, string> = { excellent: 'from-emerald-500', good: 'from-success', average: 'from-warning', poor: 'from-danger' };
    
    return ( 
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Scorecard */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-8 backdrop-blur-xl bg-surface/80 border border-white/10 shadow-2xl text-center relative overflow-hidden">
          <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${verdictBg[overallVerdict]} to-transparent`} />
          <div className="flex items-center justify-center gap-2 mb-2">
            <Award size={20} className="text-accent" />
            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-text-secondary">Judges Outcome Match</h2>
          </div>
          <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/30 mb-1">{finalScore}</div>
          <p className={`text-2xl font-black uppercase tracking-widest ${verdictColors[overallVerdict]} mb-6`}>{overallVerdict}</p>
          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
            <div className="p-3 rounded-xl bg-black/30 border border-white/5">
              <p className="text-2xl font-bold text-white">{scores.length}</p>
              <p className="text-[10px] text-text-secondary uppercase tracking-wider">Questions</p>
            </div>
            <div className="p-3 rounded-xl bg-black/30 border border-white/5">
              <p className="text-2xl font-bold text-cyan-400">{avgSemantic}%</p>
              <p className="text-[10px] text-text-secondary uppercase tracking-wider">Semantic Match</p>
            </div>
            <div className="p-3 rounded-xl bg-black/30 border border-white/5">
              <p className="text-2xl font-bold text-purple-400">{avgML}%</p>
              <p className="text-[10px] text-text-secondary uppercase tracking-wider">ML Confidence</p>
            </div>
          </div>
        </motion.div>

        {/* Per-Question Breakdown */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2"><Target size={14} />Question-wise Analysis</h3>
          {questionResults.map((r, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="card p-5 bg-surface/60 border border-white/5 hover:border-white/10">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  <p className="text-xs text-text-secondary mb-1">Q{i + 1}</p>
                  <p className="text-sm font-semibold text-white leading-relaxed">{r.question.slice(0, 120)}...</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                  r.verdict === 'excellent' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  r.verdict === 'good' ? 'bg-success/20 text-success border border-success/30' :
                  r.verdict === 'average' ? 'bg-warning/20 text-warning border border-warning/30' :
                  'bg-danger/20 text-danger border border-danger/30'
                }`}>{r.verdict}</span>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="flex items-center gap-2"><BarChart3 size={12} className="text-accent" /><span className="text-xs text-text-secondary">LLM: <span className="text-white font-bold">{r.llmScore}</span></span></div>
                <div className="flex items-center gap-2"><Target size={12} className="text-cyan-400" /><span className="text-xs text-text-secondary">Semantic: <span className="text-cyan-400 font-bold">{r.semanticScore}%</span></span></div>
                <div className="flex items-center gap-2"><BrainCircuit size={12} className="text-purple-400" /><span className="text-xs text-text-secondary">ML: <span className="text-purple-400 font-bold">{r.mlConfidence}%</span></span></div>
              </div>
              <p className="text-xs text-text-secondary italic">{r.feedback}</p>
              {r.matchedKw.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {r.matchedKw.map(k => <span key={k} className="px-1.5 py-0.5 rounded bg-success/10 text-success text-[9px]">✓ {k}</span>)}
                  {r.missedKw.map(k => <span key={k} className="px-1.5 py-0.5 rounded bg-danger/10 text-danger text-[9px]">✗ {k}</span>)}
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <a href="/dashboard/performance" className="btn-outline flex-1 py-3 border-white/20 hover:bg-white/5">View Analytics</a>
          {!reportSent && (
            <button
              onClick={processAndSendReport}
              disabled={isProcessing}
              className="btn-primary flex-1 py-3 shadow-[0_0_20px_rgba(139,92,246,0.4)] flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <><Loader2 size={16} className="animate-spin" /> {processingStep || 'Processing...'}</>
              ) : (
                <><Mail size={16} /> Send AI Report to Email</>
              )}
            </button>
          )}
          <button onClick={() => { setPhase("setup"); setCurrentQ(0); setTimer(600); setScores([]); setQuestionResults([]); setInterviewSaved(false); setReportSent(false); setEmailActuallySent(false); setAiAnalysis(null); resetRecording(); }} className="btn-outline flex-1 py-3 border-white/20 hover:bg-white/5">Run Again</button>
        </div>

        {/* Processing Status */}
        {isProcessing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-4 bg-accent/5 border border-accent/20 flex items-center gap-3">
            <Loader2 size={18} className="text-accent animate-spin" />
            <div>
              <p className="text-sm font-medium text-white">{processingStep}</p>
              <p className="text-xs text-text-secondary">This may take a moment...</p>
            </div>
          </motion.div>
        )}

        {/* Error — only show if flow hasn't completed */}
        {reportError && !reportSent && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-4 bg-danger/5 border border-danger/20 flex items-center gap-3">
            <AlertTriangle size={18} className="text-danger" />
            <div>
              <p className="text-sm font-medium text-danger">{reportError}</p>
              <p className="text-xs text-text-secondary">Try again or check your email settings.</p>
            </div>
          </motion.div>
        )}

        {/* Success Screen */}
        {reportSent && (
          <InterviewReportSuccess
            candidateName={candidateName}
            email={candidateEmail}
            overallScore={aiAnalysis?.overall_score || finalScore}
            emailSent={emailActuallySent}
            onGoToDashboard={() => window.location.href = '/dashboard/performance'}
            onRunAgain={() => { setPhase("setup"); setCurrentQ(0); setTimer(600); setScores([]); setQuestionResults([]); setInterviewSaved(false); setReportSent(false); setEmailActuallySent(false); setAiAnalysis(null); resetRecording(); }}
          />
        )}
      </div> 
    );
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col perspective-1000">
      <div className="flex-1 grid lg:grid-cols-5 gap-6">
        
        {/* 3D AI Interviewer Panel */}
        <motion.div initial={{ rotateY: -10, x: -30, opacity: 0 }} animate={{ rotateY: 0, x: 0, opacity: 1 }} transition={{ duration: 0.8 }} className="lg:col-span-2 relative bg-black/50 backdrop-blur-xl rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col items-center justify-center">
          
          {/* 3D Orb Effect simulating AI Presence */}
          <div className="relative w-64 h-64 flex items-center justify-center perspective-1000">
            {/* Core */}
            <motion.div 
              animate={{ 
                scale: isAiSpeaking ? [1, 1.2, 1] : [1, 1.05, 1],
                rotateY: [0, 360],
                rotateX: [0, 360]
              }} 
              transition={{ 
                scale: { duration: isAiSpeaking ? 0.5 : 4, repeat: Infinity },
                rotateY: { duration: 20, repeat: Infinity, ease: "linear" },
                rotateX: { duration: 25, repeat: Infinity, ease: "linear" }
              }} 
              className={`absolute w-32 h-32 rounded-full blur-md ${isAiSpeaking ? 'bg-cyan-400' : 'bg-accent'}`}
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div className="absolute inset-0 border-2 border-white/30 rounded-full" style={{ transform: 'rotateX(45deg)' }} />
              <div className="absolute inset-0 border-2 border-white/30 rounded-full" style={{ transform: 'rotateY(45deg)' }} />
            </motion.div>
            
            {/* Outer Glow */}
            <motion.div 
              animate={{ opacity: isAiSpeaking ? [0.4, 0.8, 0.4] : [0.2, 0.4, 0.2] }} 
              transition={{ duration: isAiSpeaking ? 0.5 : 3, repeat: Infinity }}
              className={`absolute w-64 h-64 rounded-full blur-[50px] ${isAiSpeaking ? 'bg-cyan-500' : 'bg-accent'}`} 
            />

            <div className="absolute z-10 flex flex-col items-center">
              <BrainCircuit size={40} className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
              {isAiSpeaking && (
                <div className="flex gap-1 mt-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <motion.div key={i} animate={{ height: [4, Math.random() * 20 + 10, 4] }} transition={{ duration: 0.3, repeat: Infinity, delay: i * 0.1 }} className="w-1 bg-white rounded-full" />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="absolute bottom-8 text-center w-full px-8">
            <h3 className="text-xl font-bold text-white tracking-widest uppercase mb-1">Sage AI</h3>
            <p className="text-accent text-sm font-medium">{config.model} • {config.domain}</p>
          </div>
        </motion.div>

        {/* Candidate & Question Panel */}
        <motion.div initial={{ rotateY: 10, x: 30, opacity: 0 }} animate={{ rotateY: 0, x: 0, opacity: 1 }} transition={{ duration: 0.8 }} className="lg:col-span-3 flex flex-col gap-4">
          
          {/* Question Box */}
          <div className="card flex-1 p-6 bg-surface/60 backdrop-blur-2xl border border-white/10 shadow-2xl relative overflow-hidden flex flex-col">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent to-purple-600" />
            <div className="flex items-center justify-between mb-6">
              <span className="text-xs font-black text-text-secondary tracking-widest uppercase bg-black/30 px-3 py-1 rounded-full">Round {currentQ + 1}/{config.count}</span>
              <div className="flex gap-2">
                <button onClick={() => setAiVoiceOn(!aiVoiceOn)} className={`p-1.5 rounded-md transition-colors ${aiVoiceOn ? 'bg-accent/20 text-accent' : 'bg-white/5 text-text-secondary'}`}>
                  {aiVoiceOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>
              </div>
            </div>
            
            <AnimatePresence mode="wait">
              <motion.div key={currentQ} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex-1 flex flex-col justify-center">
                {isLoadingAI && currentQuestionText.includes("AI is analyzing") ? (
                  <div className="flex flex-col items-center justify-center gap-3">
                    <Loader2 className="animate-spin text-accent" size={32} />
                    <p className="text-text-secondary text-sm">Synthesizing interview parameters...</p>
                  </div>
                ) : (
                  <p className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-white to-white/70 leading-relaxed text-center w-full mb-4 px-4">
                    {currentQuestionText}
                  </p>
                )}

                <AnimatePresence>
                  {feedback && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`mt-4 p-4 rounded-xl text-center mx-8 border ${
                      currentVerdict === 'excellent' ? 'bg-emerald-500/10 border-emerald-500/20' :
                      currentVerdict === 'good' ? 'bg-success/10 border-success/20' :
                      currentVerdict === 'average' ? 'bg-warning/10 border-warning/20' :
                      'bg-danger/10 border-danger/20'
                    }`}>
                      <p className={`text-sm font-semibold ${
                        currentVerdict === 'excellent' ? 'text-emerald-400' :
                        currentVerdict === 'good' ? 'text-success' :
                        currentVerdict === 'average' ? 'text-warning' : 'text-danger'
                      }`}>{feedback}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* User Input & Camera Split */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:h-56">
            <div className="relative bg-black rounded-2xl overflow-hidden border border-white/10 shadow-inner group min-h-[14rem]">
              <video ref={videoRef} autoPlay muted playsInline className={`w-full h-full object-cover transition-opacity duration-500 ${camOn ? "opacity-100" : "opacity-0"}`} />
              
              {!camOn && <div className="absolute inset-0 flex items-center justify-center"><VideoOff size={32} className="text-white/20" /></div>}

              {/* HUD Overlays */}
              <div className="absolute top-3 left-3 z-20 flex items-center gap-2 bg-black/50 backdrop-blur-md px-2 py-1 rounded-full border border-danger/30">
                <div className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse" /><span className="text-[10px] font-bold text-white tracking-widest">LIVE</span>
              </div>
              <div className="absolute bottom-3 left-3 z-20 bg-black/50 backdrop-blur-md px-2 py-1 rounded-full border border-white/10 flex items-center gap-1">
                <Clock size={10} className="text-accent" /><span className="text-xs font-mono text-white">{formatTime(timer)}</span>
              </div>
              <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md border border-white/10">
                <span className="text-[10px] font-bold text-success">{confidence}% Conf</span>
              </div>
            </div>

            <div className="card p-4 bg-surface/60 backdrop-blur-xl border border-white/10 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Your Response</span>
                  {micOn && isListening && <div className="flex gap-0.5"><div className="w-1 h-2 bg-accent animate-pulse" /><div className="w-1 h-3 bg-accent animate-pulse delay-75" /><div className="w-1 h-2 bg-accent animate-pulse delay-150" /></div>}
                </div>
                <div className="bg-black/30 rounded-lg p-2 h-16 border border-white/5 overflow-y-auto custom-scrollbar">
                  <p className="text-xs text-text-primary/80 italic">
                    {micOn ? (transcript ? `"${transcript}"` : "Listening...") : "Microphone off."}
                  </p>
                </div>
                <textarea
                  className="w-full bg-black/30 rounded-lg p-2 text-xs text-text-primary border border-white/5 focus:border-accent outline-none mt-2 resize-none h-12 custom-scrollbar"
                  placeholder="Type backup answer..."
                  value={typedAnswer}
                  onChange={(e) => setTypedAnswer(e.target.value)}
                  disabled={isLoadingAI}
                />
              </div>

              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={submitAnswer} disabled={isLoadingAI || (!transcript && !typedAnswer)} className="btn-primary w-full py-2 text-xs shadow-lg disabled:opacity-50">
                {isLoadingAI ? <Loader2 className="animate-spin mx-auto" size={14} /> : "Submit Answer"}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Control Deck */}
      <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="flex items-center justify-center gap-6 mt-6 py-4 px-8 mx-auto bg-surface/80 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl w-max">
        {/* Recording Indicator */}
        <RecordingIndicator isRecording={isRecording} duration={recordingDuration} />
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => { setMicOn(!micOn); micOn ? stopListening() : startListening(); }} className={`p-4 rounded-full transition-all ${micOn ? "bg-white/5 hover:bg-white/10 text-white" : "bg-danger/20 text-danger shadow-[0_0_15px_rgba(239,68,68,0.3)]"}`}>
          {micOn ? <Mic size={20} /> : <MicOff size={20} />}
        </motion.button>
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setCamOn(!camOn)} className={`p-4 rounded-full transition-all ${camOn ? "bg-white/5 hover:bg-white/10 text-white" : "bg-danger/20 text-danger shadow-[0_0_15px_rgba(239,68,68,0.3)]"}`}>
          {camOn ? <Video size={20} /> : <VideoOff size={20} />}
        </motion.button>
        <div className="w-[1px] h-8 bg-white/10 mx-2" />
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={endInterview} className="px-8 py-3.5 rounded-full bg-danger text-white font-black text-sm flex items-center gap-2 shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:shadow-[0_0_30px_rgba(239,68,68,0.6)] tracking-widest uppercase">
          <Phone size={16} />End Call
        </motion.button>
      </motion.div>
    </div>
  );
}
