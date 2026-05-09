"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, Bot, ChevronDown, User, StopCircle, Loader2, FileText, UploadCloud, CheckCircle } from "lucide-react";
import { DEMO_CHAT_HISTORY } from "@/lib/demo-data";
import { generateAIResponse } from "@/lib/gemini";
import { parseResumeText, buildRAGContext, type ResumeData } from "@/lib/rag-engine";
import { insertChatMessage } from "@/lib/supabase-db";
import { useAuth } from "@/lib/auth-context";

const suggestions = [
  { icon: "🎯", text: "Ask me a DSA interview question" },
  { icon: "📊", text: "What are my weak areas?" },
  { icon: "🗺️", text: "Help me plan my study schedule" },
  { icon: "💡", text: "Give me tips for HR interviews" },
  { icon: "🧠", text: "Ask me a Machine Learning question" },
  { icon: "🤖", text: "Ask me a Deep Learning question" },
  { icon: "🐍", text: "Ask me a Python question" },
  { icon: "☕", text: "Ask me a Java question" },
];

interface ChatMsg {
  role: "user" | "assistant";
  message: string;
  timestamp: string;
}

const SYSTEM_CONTEXT = `You are "Sage", PrepIQ's AI career coach. You help students prepare for technical and HR interviews.
The student is John Doe, a 3rd year CS student at XYZ University targeting a Software Engineer role at an MNC.
Current skills: Python, JavaScript, React, HTML/CSS, Git, SQL, Data Structures.
Skills to improve: System Design, Docker, AWS, CI/CD, TypeScript, Testing.
They are in Phase 1 of their roadmap (Foundation) at 60% progress.
Be encouraging, practical, and concise. Use emojis sparingly. Format answers with markdown bold (**text**) for emphasis.
If asked to give an interview question, give exactly ONE question and explain what a good answer should cover.
If asked to evaluate an answer, give a score out of 100 and specific actionable feedback.`;

export default function ChatbotPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMsg[]>(DEMO_CHAT_HISTORY);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedModel, setSelectedModel] = useState("ChatGPT 5.1 Omni");
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const resumeRef = useRef<HTMLInputElement>(null);

  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setResumeFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string || '';
        setResumeData(parseResumeText(text));
      };
      reader.readAsText(file);
    }
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;
    const now = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    
    setMessages((prev) => [...prev, { role: "user", message: text, timestamp: now }]);
    setInput("");
    setIsTyping(true);

    // Save user message to Supabase
    const userName = user?.name || 'Guest';
    insertChatMessage({ user_name: userName, role: 'user', message: text });

    try {
      // Build context from recent messages
      const recentMessages = messages.slice(-6).map(m => 
        `${m.role === 'user' ? 'Student' : 'Sage'}: ${m.message}`
      ).join('\n');

      const prompt = `${SYSTEM_CONTEXT}\n\nCurrent Model Personality: ${selectedModel}\n\nRecent conversation:\n${recentMessages}\n\nStudent: ${text}\n\nSage:`;
      
      const ragCtx = resumeData ? buildRAGContext(resumeData, 'general') : '';
      const reply = await generateAIResponse(prompt, { resumeContext: ragCtx });
      
      setIsTyping(false);
      setMessages((prev) => [...prev, { role: "assistant", message: reply, timestamp: now }]);
      // Save AI response to Supabase
      insertChatMessage({ user_name: userName, role: 'assistant', message: reply });
    } catch (error) {
      setIsTyping(false);
      setMessages((prev) => [...prev, { 
        role: "assistant", 
        message: "Sorry, I encountered an error. Please try again! 🔄", 
        timestamp: now 
      }]);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] relative rounded-2xl overflow-hidden bg-background/50 border border-border backdrop-blur-xl">
      {/* ChatGPT Style Model Selector Header */}
      <div className="absolute top-0 w-full z-20 flex justify-center pt-4 pointer-events-none">
        <div className="pointer-events-auto relative">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface/80 backdrop-blur-md border border-border shadow-lg text-sm font-medium text-text-primary hover:border-accent/50 transition-all"
          >
            <Sparkles size={16} className="text-accent" />
            {selectedModel}
            <ChevronDown size={14} className="text-text-secondary" />
          </motion.button>
          
          <AnimatePresence>
            {isModelDropdownOpen && (
              <motion.div 
                initial={{ opacity: 0, y: -10, rotateX: 20 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                exit={{ opacity: 0, y: -10, rotateX: 20 }}
                className="absolute top-full mt-2 w-48 rounded-xl bg-surface border border-border shadow-2xl overflow-hidden origin-top perspective-1000"
              >
                {["ChatGPT 5.1 Omni", "ChatGPT 4o", "Gemini 1.5 Pro", "Sage Custom"].map((model) => (
                  <button 
                    key={model}
                    onClick={() => { setSelectedModel(model); setIsModelDropdownOpen(false); }}
                    className={`w-full text-left px-4 py-3 text-sm hover:bg-white/5 transition-colors ${selectedModel === model ? "text-accent" : "text-text-primary"}`}
                  >
                    {model}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-8 pt-20 pb-4 space-y-8 scroll-smooth perspective-1000">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20, rotateX: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className={`flex w-full max-w-4xl mx-auto gap-4 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            {/* Avatar */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ${msg.role === "user" ? "bg-gradient-to-br from-accent to-purple-600" : "bg-surface border border-border"}`}>
              {msg.role === "user" ? <User size={18} className="text-white" /> : <Bot size={20} className="text-accent" />}
            </div>
            
            {/* Message Bubble */}
            <div className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"} max-w-[80%]`}>
              <div className={`px-6 py-4 rounded-2xl shadow-sm text-[15px] leading-relaxed ${
                msg.role === "user" 
                  ? "bg-surface text-text-primary rounded-tr-sm border border-white/5" 
                  : "bg-transparent text-text-primary"
              }`}>
                <p className="whitespace-pre-line">
                  {msg.message.split(/(\*\*.*?\*\*)/g).map((part, idx) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                      return <strong key={idx} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
                    }
                    return <span key={idx}>{part}</span>;
                  })}
                </p>
              </div>
              <p className="text-[11px] text-text-secondary mt-2 px-2 opacity-50">
                {msg.timestamp}
              </p>
            </div>
          </motion.div>
        ))}

        {/* Typing indicator */}
        <AnimatePresence>
          {isTyping && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.9 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.9 }} 
              className="flex w-full max-w-4xl mx-auto gap-4"
            >
              <div className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center shadow-lg">
                <Bot size={20} className="text-accent" />
              </div>
              <div className="px-6 py-4 rounded-2xl flex items-center gap-2">
                <Loader2 className="animate-spin text-accent" size={16} />
                <span className="text-sm text-text-secondary">Sage is thinking...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Invisible spacer to prevent overlap with floating input */}
        <div className="h-48 flex-shrink-0" />
      </div>

      {/* Floating Input Area */}
      <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-background via-background to-transparent pt-16 pb-6 px-4 md:px-8">
        <div className="max-w-4xl mx-auto flex flex-col gap-4">
          
          {/* Suggestions */}
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {suggestions.map((s, idx) => (
              <motion.button 
                key={idx}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => sendMessage(s.text)}
                disabled={isTyping}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-surface/80 border border-white/5 shadow-sm hover:border-accent/50 hover:bg-surface text-sm text-text-primary whitespace-nowrap transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{s.icon}</span>
                {s.text}
              </motion.button>
            ))}
          </div>

          {/* Glowing Input Box */}
          <motion.div 
            className="relative flex items-end gap-2 p-2 rounded-3xl bg-surface/80 backdrop-blur-xl border border-white/10 shadow-[0_0_30px_rgba(139,92,246,0.1)] focus-within:shadow-[0_0_40px_rgba(139,92,246,0.2)] focus-within:border-accent/50 transition-all"
          >
            <input type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" ref={resumeRef} onChange={handleResumeUpload} />
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => resumeRef.current?.click()}
              className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${resumeFile ? 'bg-success/20 text-success' : 'bg-white/5 text-text-secondary hover:text-accent'}`}
              title={resumeFile ? `Resume loaded: ${resumeFile.name}` : 'Upload resume for RAG context'}
            >
              {resumeFile ? <CheckCircle size={18} /> : <UploadCloud size={18} />}
            </motion.button>
            
            <div className="flex-1 min-h-[56px] flex items-center px-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
                placeholder={resumeData ? "Ask Sage (RAG-enhanced with your resume)..." : "Ask Sage anything..."}
                disabled={isTyping}
                className="w-full bg-transparent border-none outline-none text-text-primary placeholder:text-text-secondary/50 disabled:opacity-50"
              />
            </div>
            
            <motion.button 
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => sendMessage(input)} 
              disabled={!input.trim() || isTyping} 
              className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                input.trim() && !isTyping ? "bg-accent text-white shadow-[0_0_20px_rgba(139,92,246,0.5)]" : "bg-white/5 text-text-secondary"
              }`}
            >
              {isTyping ? <StopCircle size={20} /> : <Send size={18} className={input.trim() ? "ml-1" : ""} />}
            </motion.button>
          </motion.div>
          
          <div className="text-center text-[11px] text-text-secondary/50">
            {resumeData ? `🧠 RAG Active — ${resumeData.skills.length} skills from resume • ` : ''}PrepIQ AI is powered by LLM + RAG. It can make mistakes — verify critical information.
          </div>
        </div>
      </div>
    </div>
  );
}
