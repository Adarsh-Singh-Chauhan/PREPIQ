"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, UploadCloud, CheckCircle, AlertCircle, FileUp, Sparkles, Target, Zap, ChevronRight, BarChart } from "lucide-react";

export default function ResumeCheckerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [results, setResults] = useState<any | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      simulateScan(e.target.files[0]);
    }
  };

  const simulateScan = (file: File) => {
    setIsScanning(true);
    setScanProgress(0);
    setResults(null);

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTimeout(() => {
          setIsScanning(false);
          // Simulate dynamic AI analysis results
          const randomScore = Math.floor(Math.random() * 25) + 65; // Score between 65 and 90
          const kwScore = Math.floor(Math.random() * 40) + 50;
          
          const possibleKeywords = ["AWS", "Docker", "Agile", "System Architecture", "GraphQL", "Kubernetes", "Redis", "TypeScript", "CI/CD"];
          const missingKw = possibleKeywords.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 3) + 3);

          const possibleSuggestions = [
            "Add a professional summary tailored to the target role.",
            "Change generic descriptions to impact-driven statements using the STAR method.",
            "Ensure all bullet points start with strong action verbs.",
            "Your font size in the skills section is slightly too small for some ATS parsers.",
            "Quantify your achievements! e.g., 'Increased efficiency by 20%'.",
            "Remove the graphic elements (like progress bars) as they confuse ATS bots."
          ];
          const randomSuggestions = possibleSuggestions.sort(() => 0.5 - Math.random()).slice(0, 3);

          setResults({
            score: randomScore,
            status: randomScore > 80 ? "Great" : "Good",
            sections: [
              { name: "Formatting & ATS Parseability", score: Math.floor(Math.random() * 15) + 80, icon: FileText, good: true, text: "Resume is easily readable by standard ATS bots." },
              { name: "Keywords Match", score: kwScore, icon: Target, good: kwScore > 75, text: kwScore > 75 ? "Good alignment with job description keywords." : `Missing key industry skills like ${missingKw[0]}.` },
              { name: "Impact Metrics", score: Math.floor(Math.random() * 30) + 60, icon: BarChart, good: false, text: "Use more numbers to quantify your achievements and scale." },
            ],
            missingKeywords: missingKw,
            suggestions: randomSuggestions
          });
        }, 500);
      }
      setScanProgress(progress);
    }, 300);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white mb-2 tracking-tight">ATS Resume Checker</h1>
        <p className="text-text-secondary">Scan your resume against industry standards using our AI parser.</p>
      </div>

      {!results && !isScanning && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="card p-12 bg-surface/60 backdrop-blur-xl border border-white/10 shadow-2xl flex flex-col items-center justify-center border-dashed text-center cursor-pointer hover:border-accent/50 transition-colors group"
          onClick={() => fileInputRef.current?.click()}
        >
          <input type="file" accept=".pdf,.doc,.docx" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
          
          <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform group-hover:bg-accent/20">
            <UploadCloud size={32} className="text-accent" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Upload your resume</h3>
          <p className="text-text-secondary mb-6 max-w-md">Supported formats: PDF, DOCX (Max 5MB). PDF is recommended for best ATS accuracy.</p>
          <button className="btn-primary py-3 px-8 shadow-[0_0_20px_rgba(139,92,246,0.3)]">Browse Files</button>
        </motion.div>
      )}

      {isScanning && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="card p-10 bg-surface/80 border border-white/10 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 h-1 bg-accent transition-all duration-300" style={{ width: `${scanProgress}%` }} />
          
          <div className="relative w-32 h-32 mx-auto mb-8">
            <div className="absolute inset-0 border-4 border-white/5 rounded-full" />
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="absolute inset-0 border-4 border-transparent border-t-accent rounded-full" />
            <div className="absolute inset-0 flex items-center justify-center">
              <FileUp size={32} className="text-white" />
            </div>
          </div>
          
          <h3 className="text-2xl font-bold text-white mb-2">Scanning Document...</h3>
          <p className="text-accent font-mono">{Math.round(scanProgress)}%</p>
          
          <div className="mt-8 flex justify-center gap-8 text-sm text-text-secondary">
            <span className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${scanProgress > 30 ? 'bg-success' : 'bg-white/20'}`} /> Text Extraction</span>
            <span className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${scanProgress > 60 ? 'bg-success' : 'bg-white/20'}`} /> Keyword Analysis</span>
            <span className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${scanProgress > 90 ? 'bg-success' : 'bg-white/20'}`} /> Scoring</span>
          </div>
        </motion.div>
      )}

      {results && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid lg:grid-cols-3 gap-6">
          
          {/* Score Overview */}
          <div className="card p-6 bg-surface border border-white/10 lg:col-span-1 flex flex-col items-center justify-center text-center">
            <h3 className="text-sm font-bold text-text-secondary uppercase tracking-widest mb-6 w-full text-left">ATS Match Score</h3>
            
            <div className="relative w-48 h-48 mb-6">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                <motion.circle 
                  initial={{ strokeDashoffset: 283 }} animate={{ strokeDashoffset: 283 - (283 * results.score) / 100 }} transition={{ duration: 1.5, ease: "easeOut" }}
                  cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray="283" strokeLinecap="round"
                  className={results.score > 80 ? "text-success" : results.score > 60 ? "text-warning" : "text-danger"}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-black text-white">{results.score}</span>
                <span className="text-xs text-text-secondary">/ 100</span>
              </div>
            </div>

            <p className="text-lg font-bold text-white mb-2">Good, but needs work.</p>
            <p className="text-sm text-text-secondary mb-8">Your resume will pass basic filters, but lacks impact metrics.</p>

            <button onClick={() => setResults(null)} className="btn-outline w-full py-3 text-sm">Scan New Resume</button>
          </div>

          {/* Details */}
          <div className="lg:col-span-2 space-y-6">
            
            <div className="grid sm:grid-cols-3 gap-4">
              {results.sections.map((sec: any, i: number) => (
                <div key={i} className="card p-5 border border-white/5 bg-black/20">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2 rounded-lg ${sec.good ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}`}>
                      <sec.icon size={18} />
                    </div>
                    <span className="text-lg font-bold text-white">{sec.score}%</span>
                  </div>
                  <h4 className="font-bold text-white text-sm mb-1">{sec.name}</h4>
                  <p className="text-xs text-text-secondary leading-relaxed">{sec.text}</p>
                </div>
              ))}
            </div>

            <div className="card p-6 border border-white/10 bg-surface/80">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="text-accent" size={18} />
                <h3 className="font-bold text-white">Missing Keywords</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {results.missingKeywords.map((kw: string) => (
                  <span key={kw} className="px-3 py-1.5 rounded-md bg-danger/10 border border-danger/20 text-danger text-sm font-medium">
                    + {kw}
                  </span>
                ))}
              </div>
              <p className="text-xs text-text-secondary mt-3 italic">Adding these keywords contextually can boost your score by ~15%.</p>
            </div>

            <div className="card p-6 border border-white/10 bg-gradient-to-br from-surface to-accent/5">
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="text-white" size={18} />
                <h3 className="font-bold text-white">AI Improvement Suggestions</h3>
              </div>
              <div className="space-y-4">
                {results.suggestions.map((sug: string, i: number) => (
                  <div key={i} className="flex gap-3">
                    <div className="mt-0.5"><CheckCircle className="text-success" size={16} /></div>
                    <p className="text-sm text-text-primary/90">{sug}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </motion.div>
      )}

    </div>
  );
}
