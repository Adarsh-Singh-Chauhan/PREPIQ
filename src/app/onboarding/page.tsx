"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  User, Target, FileText, Award, Clock, ArrowRight, ArrowLeft,
  Upload, X, CheckCircle2, AlertCircle, Sparkles, Zap,
} from "lucide-react";
import toast from "react-hot-toast";
import { ThemeProvider } from "@/lib/theme-context";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { insertSkillsBulk, upsertUserProfile } from "@/lib/supabase-db";

const steps = [
  { icon: User, label: "Personal Info" },
  { icon: Target, label: "Career Objective" },
  { icon: FileText, label: "Skills & Resume" },
  { icon: Award, label: "Certificates" },
  { icon: Clock, label: "Availability" },
];

const careerGoals = ["Software Engineer", "Data Scientist", "Product Manager", "Finance Analyst", "Marketing", "UI/UX Designer", "Other"];
const companyTypes = ["Startup", "MNC", "FAANG", "Government", "Consulting", "Open to all"];
const timelines = ["Within 3 months", "6 months", "1 year", "Just exploring"];
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const timeSlots = ["9am", "10am", "11am", "12pm", "1pm", "2pm", "3pm", "4pm", "5pm", "6pm", "7pm", "8pm"];

function OnboardingContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: "", college: "", branch: "", year: "", city: "",
    career_goal: "", company_type: "", timeline: "",
    skills: [] as string[], newSkill: "",
    certs: [] as { name: string; valid: boolean }[],
    availability: {} as Record<string, boolean>,
  });

  // File upload state
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [certFiles, setCertFiles] = useState<{ file: File; validating: boolean; validated: boolean }[]>([]);
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const certInputRef = useRef<HTMLInputElement>(null);

  const next = () => { if (step < 4) setStep(step + 1); };
  const prev = () => { if (step > 0) setStep(step - 1); };

  const finish = () => {
    const userName = user?.name || form.name || 'Guest';
    const userEmail = user?.email || '';

    // Save profile to Supabase
    upsertUserProfile({
      user_name: userName,
      email: userEmail,
      college: form.college,
      branch: form.branch,
      year: form.year,
      city: form.city,
      career_goal: form.career_goal,
      target_company_type: form.company_type,
      placement_timeline: form.timeline,
    });

    // Save skills to Supabase
    if (form.skills.length > 0) {
      insertSkillsBulk(
        form.skills.map(s => ({
          user_name: userName,
          skill_name: s,
          source: 'onboarding',
          level: 'intermediate',
        }))
      );
    }

    // Generate and save Roadmap
    const newRoadmap = [
      {
        phase: 1,
        title: "Foundation for " + (form.career_goal || "Software Engineer"),
        timeframe: "Month 1-2",
        status: "in_progress",
        progress: 0,
        milestones: [
          { id: "1", text: `Complete core concepts for ${form.career_goal || "Software Engineer"}`, completed: false },
          { id: "2", text: `Learn required languages & frameworks`, completed: false },
          { id: "3", text: `Solve 50 Easy problems`, completed: false },
          { id: "4", text: "Complete 2 mock interviews", completed: false },
          { id: "5", text: "Build personal portfolio project", completed: false },
        ]
      },
      {
        phase: 2,
        title: "Building & Projects",
        timeframe: "Month 3-4",
        status: "locked",
        progress: 0,
        milestones: [
          { id: "1", text: "Complete 2 Advanced Projects", completed: false },
          { id: "2", text: "Solve 100 Medium problems", completed: false },
          { id: "3", text: "System Design basics", completed: false },
          { id: "4", text: "Mock interviews (Technical)", completed: false },
        ]
      },
      {
        phase: 3,
        title: "Targeting " + (form.company_type || "MNC"),
        timeframe: "Month 5-6",
        status: "locked",
        progress: 0,
        milestones: [
          { id: "1", text: `Apply to 50 ${form.company_type || "MNC"} openings`, completed: false },
          { id: "2", text: "Advanced System Design", completed: false },
          { id: "3", text: "Solve Hard problems", completed: false },
          { id: "4", text: "Final prep mock interviews", completed: false },
        ]
      }
    ];

    if (user?.id) {
      localStorage.setItem(`roadmap_${user.id}`, JSON.stringify(newRoadmap));
      
      import('@/lib/supabase-db').then(({ insertRoadmapMilestone }) => {
        newRoadmap.forEach(phase => {
          phase.milestones.forEach(m => {
            insertRoadmapMilestone({
              user_name: userName,
              phase_number: phase.phase,
              milestone_text: m.text,
              is_completed: m.completed,
            });
          });
        });
      });
    }

    toast.success("Profile complete! Generating your roadmap...");
    setTimeout(() => router.push("/dashboard"), 1500);
  };

  const toggleSlot = (key: string) => {
    setForm({ ...form, availability: { ...form.availability, [key]: !form.availability[key] } });
  };

  const addSkill = () => {
    if (form.newSkill.trim()) {
      setForm({ ...form, skills: [...form.skills, form.newSkill.trim()], newSkill: "" });
    }
  };

  const handleResumeUpload = (file: File) => {
    setResumeFile(file);
    setResumeUploading(true);
    // Simulate OCR extraction
    setTimeout(() => {
      setResumeUploading(false);
      const extractedSkills = ["Python", "JavaScript", "React", "SQL", "Git"];
      const newSkills = extractedSkills.filter(s => !form.skills.includes(s));
      if (newSkills.length > 0) {
        setForm(prev => ({ ...prev, skills: [...prev.skills, ...newSkills] }));
        toast.success(`Extracted ${newSkills.length} skills from your resume!`);
      } else {
        toast.success("Resume uploaded successfully!");
      }
    }, 2000);
  };

  const handleCertUpload = (files: FileList) => {
    const newCerts = Array.from(files).map(file => ({ file, validating: true, validated: false }));
    setCertFiles(prev => [...prev, ...newCerts]);
    // Simulate AI validation for each certificate
    newCerts.forEach((_, idx) => {
      setTimeout(() => {
        setCertFiles(prev => prev.map((c, i) => 
          i === prev.length - newCerts.length + idx ? { ...c, validating: false, validated: true } : c
        ));
      }, 1500 + idx * 800);
    });
    toast.success(`${files.length} certificate(s) uploaded for validation!`);
  };

  const removeResume = () => {
    setResumeFile(null);
    if (resumeInputRef.current) resumeInputRef.current.value = "";
  };

  const removeCert = (index: number) => {
    setCertFiles(prev => prev.filter((_, i) => i !== index));
    if (certInputRef.current) certInputRef.current.value = "";
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress Bar */}
      <div className="border-b border-border bg-surface/50">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-hero-gradient flex items-center justify-center">
                <Zap className="text-white" size={16} />
              </div>
              <span className="text-sm font-bold text-text-primary">Prep<span className="gradient-text">IQ</span></span>
            </div>
            <span className="text-xs text-text-secondary">Step {step + 1} of 5</span>
          </div>
          <div className="flex gap-2">
            {steps.map((s, i) => (
              <div key={i} className="flex-1">
                <div className={`h-1.5 rounded-full transition-all ${i <= step ? "bg-accent" : "bg-surface"}`} />
                <div className="flex items-center gap-1 mt-2">
                  <s.icon size={10} className={i <= step ? "text-accent" : "text-text-secondary"} />
                  <span className={`text-[10px] ${i <= step ? "text-accent font-medium" : "text-text-secondary"}`}>{s.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait">
            {/* Step 1: Personal */}
            {step === 0 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="card-static p-8">
                <h2 className="text-xl font-bold text-text-primary mb-2">Tell us about yourself</h2>
                <p className="text-sm text-text-secondary mb-6">Basic info to personalise your experience</p>
                <div className="space-y-4">
                  {[
                    { key: "name", label: "Full Name", placeholder: "John Doe" },
                    { key: "college", label: "College", placeholder: "XYZ University" },
                    { key: "branch", label: "Branch", placeholder: "Computer Science" },
                    { key: "year", label: "Year", placeholder: "3rd Year" },
                    { key: "city", label: "City", placeholder: "Generic City" },
                  ].map((f) => (
                    <div key={f.key}>
                      <label className="block text-xs font-medium text-text-secondary mb-1.5">{f.label}</label>
                      <input className="input" placeholder={f.placeholder} value={form[f.key as keyof typeof form] as string}
                        onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2: Career */}
            {step === 1 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="card-static p-8">
                <h2 className="text-xl font-bold text-text-primary mb-2">What&apos;s your career goal?</h2>
                <p className="text-sm text-text-secondary mb-6">We&apos;ll build a personalised roadmap for you</p>
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-3">Primary career goal</label>
                    <div className="grid grid-cols-2 gap-2">
                      {careerGoals.map((g) => (
                        <button key={g} onClick={() => setForm({ ...form, career_goal: g })}
                          className={`card-static p-3 text-sm text-left transition-all ${form.career_goal === g ? "border-accent bg-accent/5 text-accent" : "text-text-primary hover:border-accent/30"}`}>
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-3">Target company type</label>
                    <div className="flex flex-wrap gap-2">
                      {companyTypes.map((c) => (
                        <button key={c} onClick={() => setForm({ ...form, company_type: c })}
                          className={`pill ${form.company_type === c ? "active" : ""}`}>{c}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-3">When do you want to be placed?</label>
                    <div className="flex flex-wrap gap-2">
                      {timelines.map((t) => (
                        <button key={t} onClick={() => setForm({ ...form, timeline: t })}
                          className={`pill ${form.timeline === t ? "active" : ""}`}>{t}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Skills */}
            {step === 2 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="card-static p-8">
                <h2 className="text-xl font-bold text-text-primary mb-2">Skills & Resume</h2>
                <p className="text-sm text-text-secondary mb-6">Upload your resume or add skills manually</p>
                
                {/* Hidden file input */}
                <input
                  ref={resumeInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleResumeUpload(file);
                  }}
                />

                {!resumeFile ? (
                  <div
                    onClick={() => resumeInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("border-accent", "bg-accent/5"); }}
                    onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove("border-accent", "bg-accent/5"); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove("border-accent", "bg-accent/5");
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleResumeUpload(file);
                    }}
                    className="dropzone mb-4 cursor-pointer hover:border-accent/50 hover:bg-accent/5 transition-all"
                  >
                    <Upload className="text-text-secondary mx-auto mb-2" size={24} />
                    <p className="text-sm text-text-secondary">Drop PDF resume here or <span className="text-accent font-medium">browse</span></p>
                    <p className="text-xs text-text-secondary mt-1">OCR will extract skills automatically</p>
                  </div>
                ) : (
                  <div className="mb-4 p-4 rounded-xl bg-surface border border-border flex items-center gap-3">
                    {resumeUploading ? (
                      <>
                        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                            <Upload className="text-accent" size={18} />
                          </motion.div>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-text-primary">{resumeFile.name}</p>
                          <p className="text-xs text-accent">Extracting skills with OCR...</p>
                          <div className="mt-2 h-1.5 bg-surface rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-accent rounded-full"
                              initial={{ width: "0%" }}
                              animate={{ width: "100%" }}
                              transition={{ duration: 2 }}
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="text-success" size={18} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-text-primary">{resumeFile.name}</p>
                          <p className="text-xs text-text-secondary">{formatFileSize(resumeFile.size)} • Skills extracted</p>
                        </div>
                        <button onClick={removeResume} className="p-1.5 rounded-md hover:bg-white/5 text-text-secondary hover:text-danger transition-colors">
                          <X size={16} />
                        </button>
                      </>
                    )}
                  </div>
                )}

                <div className="flex gap-2 mb-4">
                  <input className="input flex-1" placeholder="Add a skill..." value={form.newSkill}
                    onChange={(e) => setForm({ ...form, newSkill: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && addSkill()} />
                  <button onClick={addSkill} className="btn-primary px-4">Add</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.skills.map((s, i) => (
                    <span key={i} className="badge badge-accent flex items-center gap-1">
                      {s}<button onClick={() => setForm({ ...form, skills: form.skills.filter((_, j) => j !== i) })}><X size={10} /></button>
                    </span>
                  ))}
                  {form.skills.length === 0 && <p className="text-xs text-text-secondary">No skills added yet</p>}
                </div>
              </motion.div>
            )}

            {/* Step 4: Certificates */}
            {step === 3 && (
              <motion.div key="s4" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="card-static p-8">
                <h2 className="text-xl font-bold text-text-primary mb-2">Certificates</h2>
                <p className="text-sm text-text-secondary mb-6">Upload certificates for AI validation (optional)</p>
                
                {/* Hidden file input */}
                <input
                  ref={certInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files && files.length > 0) handleCertUpload(files);
                  }}
                />

                <div
                  onClick={() => certInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("border-accent", "bg-accent/5"); }}
                  onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove("border-accent", "bg-accent/5"); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove("border-accent", "bg-accent/5");
                    const files = e.dataTransfer.files;
                    if (files && files.length > 0) handleCertUpload(files);
                  }}
                  className="dropzone mb-4 cursor-pointer hover:border-accent/50 hover:bg-accent/5 transition-all"
                >
                  <Award className="text-text-secondary mx-auto mb-2" size={24} />
                  <p className="text-sm text-text-secondary">Drop certificate PDFs or images, or <span className="text-accent font-medium">browse</span></p>
                  <p className="text-xs text-text-secondary mt-1">Supports PDF, PNG, JPG • Multiple files allowed</p>
                </div>

                <div className="space-y-2">
                  {/* Uploaded certificates */}
                  {certFiles.map((c, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 p-3 rounded-lg bg-surface border border-border"
                    >
                      {c.validating ? (
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                          <AlertCircle className="text-accent" size={16} />
                        </motion.div>
                      ) : (
                        <CheckCircle2 className="text-success" size={16} />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text-primary truncate">{c.file.name}</p>
                        <p className="text-[10px] text-text-secondary">{formatFileSize(c.file.size)}</p>
                      </div>
                      <span className={`badge text-xs ${c.validating ? "badge-accent" : "badge-success"}`}>
                        {c.validating ? "Validating..." : "Verified"}
                      </span>
                      <button onClick={() => removeCert(i)} className="p-1 rounded-md hover:bg-white/5 text-text-secondary hover:text-danger transition-colors">
                        <X size={14} />
                      </button>
                    </motion.div>
                  ))}

                  {/* Default demo certs if no uploads */}
                  {certFiles.length === 0 && (
                    <>
                      {[
                        { name: "Python for Data Science — Coursera", valid: true },
                        { name: "Web Development — Udemy", valid: true },
                      ].map((c, i) => (
                        <div key={`demo-${i}`} className="flex items-center gap-3 p-3 rounded-lg bg-surface border border-border">
                          {c.valid ? <CheckCircle2 className="text-success" size={16} /> : <AlertCircle className="text-danger" size={16} />}
                          <span className="text-sm text-text-primary flex-1">{c.name}</span>
                          <span className={`badge text-xs ${c.valid ? "badge-success" : "badge-danger"}`}>{c.valid ? "Verified" : "Flagged"}</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 5: Availability */}
            {step === 4 && (
              <motion.div key="s5" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="card-static p-8">
                <h2 className="text-xl font-bold text-text-primary mb-2">Your Availability</h2>
                <p className="text-sm text-text-secondary mb-6">Select your free hours — AI will build your schedule</p>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="text-xs text-text-secondary p-1"></th>
                        {days.map((d) => <th key={d} className="text-xs text-text-secondary p-1 font-medium">{d}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {timeSlots.map((t) => (
                        <tr key={t}>
                          <td className="text-[10px] text-text-secondary pr-2">{t}</td>
                          {days.map((d) => {
                            const key = `${d}-${t}`;
                            return (
                              <td key={key} className="p-0.5">
                                <button onClick={() => toggleSlot(key)}
                                  className={`w-full h-6 rounded transition-all ${form.availability[key] ? "bg-accent/30 border-accent" : "bg-surface hover:bg-accent/10"} border border-border`} />
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <button onClick={prev} disabled={step === 0} className="btn-ghost disabled:opacity-30">
              <ArrowLeft size={16} />Back
            </button>
            {step < 4 ? (
              <button onClick={next} className="btn-primary"><span>Continue</span><ArrowRight size={16} /></button>
            ) : (
              <button onClick={finish} className="btn-primary"><Sparkles size={16} />Generate My Roadmap</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <OnboardingContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
