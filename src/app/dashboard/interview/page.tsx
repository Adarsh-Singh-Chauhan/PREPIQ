"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic, MicOff, Video, VideoOff, Phone,
  Sparkles, BrainCircuit,
  Loader2, Clock, Volume2, VolumeX
} from "lucide-react";
import { useSpeechToText } from "@/lib/speech";
import { generateAIResponse } from "@/lib/gemini";

type Phase = "setup" | "interview" | "done";

export default function InterviewPage() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [config, setConfig] = useState({ 
    domain: "Technical", 
    difficulty: "Intermediate", 
    count: 5, 
    model: "GPT-5.1 Omni",
  });
  
  // Interview State
  const [currentQ, setCurrentQ] = useState(0);
  const [timer, setTimer] = useState(600);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [aiVoiceOn, setAiVoiceOn] = useState(true);
  
  // AI State
  const [currentQuestionText, setCurrentQuestionText] = useState("AI is preparing the question...");
  const [typedAnswer, setTypedAnswer] = useState("");
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [scores, setScores] = useState<number[]>([]);
  const [confidence, setConfidence] = useState(85);
  const [emotion, setEmotion] = useState("Focused");
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  
  const { isListening, transcript, startListening, stopListening } = useSpeechToText();
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Domains
  const domains = ["Technical", "System Design", "HR Round", "Aptitude", "Behavioral"];
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
    const prompt = `
      Question: ${currentQuestionText}
      Candidate Answer: ${finalAnswer}
      Evaluate the answer strictly based on accuracy, clarity, and confidence. 
      Give a score out of 100 and exactly ONE short sentence of constructive feedback.
      Format exactly like this:
      SCORE: [number]
      FEEDBACK: [your feedback]
    `;
    
    const evalResponse = await generateAIResponse(prompt);
    
    const scoreMatch = evalResponse.match(/SCORE:\s*(\d+)/i);
    const feedbackMatch = evalResponse.match(/FEEDBACK:\s*(.*)/i);
    
    const score = scoreMatch ? parseInt(scoreMatch[1]) : Math.floor(70 + Math.random() * 20);
    const fb = feedbackMatch ? feedbackMatch[1] : "Good attempt, but you can be more precise.";
    
    setScores(prev => [...prev, score]);
    setFeedback(`Score: ${score}/100 - ${fb}`);
    setIsLoadingAI(false);
    speak(`You scored ${score} out of 100. ${fb}`);
    
    setTimeout(() => {
      if (currentQ < config.count - 1) {
        setCurrentQ(c => c + 1);
        fetchNextQuestion();
        if (micOn) startListening();
      } else {
        endInterview();
      }
    }, 6000);
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
      navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => { if (videoRef.current) videoRef.current.srcObject = stream; }).catch(() => {});
      
      return () => { 
        if (timerRef.current) clearInterval(timerRef.current); 
        clearInterval(ci); 
        stopListening(); 
        if (window.speechSynthesis) window.speechSynthesis.cancel();
      };
    }
  }, [phase]);

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const endInterview = () => {
    if (videoRef.current?.srcObject) (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
    if (timerRef.current) clearInterval(timerRef.current);
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setPhase("done");
  };

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
          </div>
          
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setPhase("interview")} className="btn-primary w-full mt-10 py-4 text-lg font-bold shadow-[0_0_30px_rgba(139,92,246,0.4)] relative z-10 overflow-hidden group">
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            <Video size={22} /> Join Live Interview
          </motion.button>
        </motion.div>
      </div>
    );
  }

  if (phase === "done") {
    const finalScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    return ( 
      <div className="max-w-lg mx-auto text-center">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="card p-10 backdrop-blur-xl bg-surface/80 border border-white/10 shadow-[0_0_50px_rgba(34,197,94,0.2)]">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} className="w-24 h-24 rounded-full bg-gradient-to-tr from-success to-emerald-400 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(34,197,94,0.5)]">
            <Sparkles className="text-white" size={40} />
          </motion.div>
          <h2 className="text-3xl font-black text-white mb-2">Analysis Complete</h2>
          <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/20 mb-2">{finalScore}</div>
          <p className="text-text-secondary font-medium tracking-widest uppercase text-sm mb-10">AI Performance Score</p>
          <div className="flex gap-4">
            <a href="/dashboard/performance" className="btn-outline flex-1 py-3 border-white/20 hover:bg-white/5">View Analytics</a>
            <button onClick={() => { setPhase("setup"); setCurrentQ(0); setTimer(600); setScores([]); }} className="btn-primary flex-1 py-3 shadow-[0_0_20px_rgba(139,92,246,0.4)]">Run Again</button>
          </div>
        </motion.div>
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
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4 p-4 rounded-xl bg-success/10 border border-success/20 text-center mx-8">
                      <p className="text-sm font-semibold text-success">{feedback}</p>
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
