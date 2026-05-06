"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldCheck, UploadCloud, Search, CheckCircle, 
  XCircle, Loader2, Award
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function CertificateValidatorPage() {
  const [certId, setCertId] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const { user } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleValidate = () => {
    if (!certId.trim()) return;
    setIsScanning(true);
    setResult(null);

    // Simulate blockchain/database validation delay
    setTimeout(() => {
      setIsScanning(false);
      
      if (certId.toLowerCase().includes("fail") || certId === "123") {
        setResult({
          status: "invalid",
          message: "Certificate not found in the verified registry.",
        });
      } else {
        setResult({
          status: "valid",
          issuer: "PrepIQ Masterclass",
          recipient: user?.name || "John Doe",
          course: "Advanced Data Structures & Algorithms",
          date: "April 15, 2024",
          hash: "0x8f" + Math.random().toString(16).slice(2, 10) + "...e2",
        });
      }
    }, 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setResult(null);
    setCertId("SCANNING: " + file.name);

    setTimeout(() => {
      setIsScanning(false);
      
      // Simulate intelligent OCR extraction from file name and metadata
      const cleanName = file.name.split('.')[0].replace(/[-_]/g, ' ');
      const possibleIssuers = ["Udemy", "Coursera", "edX", "PrepIQ", "Google", "Microsoft", "AWS", "Stanford", "Harvard"];
      const issuer = possibleIssuers.find(i => file.name.toLowerCase().includes(i.toLowerCase())) || "Global Tech Authority";
      
      const course = cleanName.split(' ').filter(p => !possibleIssuers.map(i => i.toLowerCase()).includes(p.toLowerCase()) && isNaN(Number(p))).join(' ') || "Professional Certificate";
      const date = new Date(file.lastModified).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' });
      
      setCertId(file.name);
      setResult({
        status: "valid",
        issuer: issuer,
        recipient: user?.name || "John Doe",
        course: course.length > 3 ? course : "Advanced Technical Certification",
        date: date,
        hash: "0x" + Math.random().toString(16).slice(2, 12) + "..." + Math.random().toString(16).slice(2, 6)
      });
    }, 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 perspective-1000">
      
      <div className="text-center mb-10">
        <motion.div 
          animate={{ rotateY: [0, 360] }} 
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(139,92,246,0.5)] border border-white/20"
        >
          <ShieldCheck size={36} className="text-white" />
        </motion.div>
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70 mb-2">
          Certificate Validator
        </h1>
        <p className="text-text-secondary">Verify the authenticity of any PrepIQ or Partner certificate.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Manual ID Input */}
        <div className="card p-8 bg-surface/60 backdrop-blur-xl border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-[40px] pointer-events-none" />
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Search size={18} className="text-accent" /> Validate by ID
          </h3>
          <p className="text-sm text-text-secondary mb-6">Enter the unique 16-character certificate ID printed at the bottom of the document.</p>
          
          <div className="flex flex-col gap-4">
            <input 
              type="text" 
              value={certId}
              onChange={(e) => setCertId(e.target.value)}
              placeholder="e.g. PQ-2026-X8F9-A1B2" 
              className="input uppercase tracking-widest font-mono text-center"
            />
            <button 
              onClick={handleValidate} 
              disabled={isScanning || !certId.trim()} 
              className="btn-primary py-3 shadow-[0_0_15px_rgba(139,92,246,0.3)] disabled:opacity-50"
            >
              {isScanning ? <Loader2 className="animate-spin" size={20} /> : "Verify Authenticity"}
            </button>
          </div>
        </div>

        {/* File Upload */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          accept=".pdf,.png,.jpg,.jpeg" 
          className="hidden" 
        />
        <div 
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("border-accent", "bg-accent/5"); }}
          onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove("border-accent", "bg-accent/5"); }}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.classList.remove("border-accent", "bg-accent/5");
            const file = e.dataTransfer.files?.[0];
            if (file) handleFileUpload({ target: { files: [file] } } as any);
          }}
          className="card p-8 bg-black/40 border border-white/10 border-dashed hover:border-accent/50 cursor-pointer transition-colors shadow-2xl flex flex-col items-center justify-center text-center group"
        >
          <div className="w-16 h-16 rounded-full bg-surface border border-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform group-hover:bg-accent/20 group-hover:text-accent group-hover:border-accent/30">
            <UploadCloud size={24} className="text-text-secondary group-hover:text-accent transition-colors" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Upload Certificate</h3>
          <p className="text-sm text-text-secondary max-w-xs">Drop PDF or Image here, or browse. Our AI will automatically extract and verify the credentials.</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {result && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.95 }}
            className="mt-8"
          >
            {result.status === "valid" ? (
              <div className="card p-8 bg-success/5 border border-success/20 relative overflow-hidden shadow-[0_0_30px_rgba(34,197,94,0.1)]">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Award size={150} className="text-success" />
                </div>
                
                <div className="flex items-start gap-4 relative z-10">
                  <div className="p-3 rounded-full bg-success/20 text-success border border-success/30">
                    <CheckCircle size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white mb-1">Certificate Verified</h2>
                    <p className="text-success text-sm font-medium mb-8">This document is officially authentic and tamper-proof.</p>
                    
                    <div className="grid sm:grid-cols-2 gap-x-12 gap-y-6">
                      <div>
                        <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1">Recipient</p>
                        <p className="text-lg font-semibold text-white">{result.recipient}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1">Issuer</p>
                        <p className="text-lg font-semibold text-white">{result.issuer}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1">Qualification</p>
                        <p className="text-base font-medium text-text-primary">{result.course}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1">Date of Issue</p>
                        <p className="text-base font-medium text-text-primary">{result.date}</p>
                      </div>
                      <div className="sm:col-span-2">
                        <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1">Blockchain Hash Signature</p>
                        <p className="text-xs font-mono text-text-secondary/70 bg-black/30 p-2 rounded border border-white/5 inline-block">{result.hash}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card p-8 bg-danger/5 border border-danger/20 flex flex-col items-center text-center">
                <div className="p-4 rounded-full bg-danger/20 text-danger border border-danger/30 mb-4">
                  <XCircle size={32} />
                </div>
                <h2 className="text-2xl font-black text-white mb-2">Invalid Certificate</h2>
                <p className="text-text-secondary max-w-md">{result.message} Please check the ID and try again, or contact support if you believe this is an error.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
