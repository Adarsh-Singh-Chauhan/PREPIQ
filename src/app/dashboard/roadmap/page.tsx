"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Target, Edit3, CheckCircle2, Lock, ChevronDown, ChevronUp,
  MessageSquare, ExternalLink, Sparkles, X, ArrowRight, BookOpen,
  Code2, Youtube, Globe,
} from "lucide-react";
import { DEMO_USER, DEMO_ROADMAP, DEMO_SKILLS } from "@/lib/demo-data";
import { useAuth } from "@/lib/auth-context";

const statusConfig: Record<string, { badge: string; label: string }> = {
  completed: { badge: "badge-success", label: "Completed" },
  in_progress: { badge: "badge-accent", label: "In Progress" },
  locked: { badge: "badge-warning", label: "Locked" },
};

const resources = [
  { icon: Code2, title: "LeetCode", desc: "Practice DSA problems", color: "text-orange-400", url: "https://leetcode.com" },
  { icon: Youtube, title: "NeetCode", desc: "DSA video explanations", color: "text-red-400", url: "https://neetcode.io" },
  { icon: BookOpen, title: "GeeksforGeeks", desc: "CS fundamentals", color: "text-green-400", url: "https://www.geeksforgeeks.org/" },
  { icon: Globe, title: "System Design Primer", desc: "GitHub repo", color: "text-accent", url: "https://github.com/donnemartin/system-design-primer" },
];

export default function RoadmapPage() {
  const { user, isDemo } = useAuth();
  const currentUser = user || DEMO_USER;
  
  const [editModal, setEditModal] = useState(false);
  const [expandedPhase, setExpandedPhase] = useState<number | null>(1);
  
  // Roadmap State Management
  const [milestones, setMilestones] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`roadmap_${currentUser.id}`);
      if (saved && !isDemo) return JSON.parse(saved);
    }
    return DEMO_ROADMAP;
  });

  // User Goal State
  const [goalSettings, setGoalSettings] = useState({
    role: currentUser.career_goal || "Software Engineer",
    company: currentUser.target_company_type || "MNC",
    timeline: currentUser.placement_timeline || "6 months"
  });

  const saveRoadmap = (newRoadmap: any) => {
    setMilestones(newRoadmap);
    if (!isDemo && typeof window !== "undefined") {
      localStorage.setItem(`roadmap_${currentUser.id}`, JSON.stringify(newRoadmap));
    }
  };

  const toggleMilestone = (pi: number, mid: string) => {
    const updatedRoadmap = milestones.map((phase: any, i: number) => {
      if (i !== pi) return phase;
      const updated = phase.milestones.map((m: any) => m.id === mid ? { ...m, completed: !m.completed } : m);
      const done = updated.filter((m: any) => m.completed).length;
      return { ...phase, milestones: updated, progress: Math.round((done / updated.length) * 100) };
    });
    
    // Unlock next phase if current phase is 100% complete
    updatedRoadmap.forEach((phase: any, i: number) => {
      if (i > 0 && updatedRoadmap[i-1].progress === 100 && phase.status === "locked") {
        phase.status = "in_progress";
      }
    });

    saveRoadmap(updatedRoadmap);
  };

  const regenerateRoadmap = () => {
    // Generate a fresh roadmap based on the new goal
    const newRoadmap = [
      {
        phase: 1,
        title: "Foundation for " + goalSettings.role,
        timeframe: "Month 1-2",
        status: "in_progress",
        progress: 0,
        milestones: [
          { id: "1", text: `Complete core concepts for ${goalSettings.role}`, completed: false },
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
        title: "Targeting " + goalSettings.company,
        timeframe: "Month 5-6",
        status: "locked",
        progress: 0,
        milestones: [
          { id: "1", text: `Apply to 50 ${goalSettings.company} openings`, completed: false },
          { id: "2", text: "Advanced System Design", completed: false },
          { id: "3", text: "Solve Hard problems", completed: false },
          { id: "4", text: "Final prep mock interviews", completed: false },
        ]
      }
    ];
    saveRoadmap(newRoadmap);
    setEditModal(false);
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Career Objective */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card-static p-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-lg font-bold text-text-primary mb-1">Your Career Objective</h2>
            <div className="flex flex-wrap gap-3 mt-3">
              <span className="badge badge-accent"><Target size={12} />{goalSettings.role}</span>
              <span className="badge badge-cyan">🏢 {goalSettings.company}</span>
              <span className="badge badge-warning">⏱️ {goalSettings.timeline}</span>
            </div>
          </div>
          <button onClick={() => setEditModal(true)} className="btn-outline text-sm"><Edit3 size={14} />Edit Goal</button>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Sparkles className="text-accent" size={16} />AI-Generated Roadmap
          </h3>
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-accent via-accent-secondary to-accent/20" />
            {milestones.map((phase: any, pi: number) => {
              const isExpanded = expandedPhase === phase.phase;
              const isLocked = phase.status === "locked";
              const cfg = statusConfig[phase.status];
              return (
                <motion.div key={phase.phase} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: pi * 0.15 }} className={`relative pl-16 pb-8 ${isLocked ? "opacity-60" : ""}`}>
                  <div className={`absolute left-[17px] w-5 h-5 rounded-full border-2 z-10 flex items-center justify-center ${
                    phase.status === "completed" ? "bg-success border-success" :
                    phase.status === "in_progress" ? "bg-accent border-accent" : "bg-surface border-border"
                  }`}>
                    {phase.status === "completed" && <CheckCircle2 size={10} className="text-white" />}
                    {phase.status === "locked" && <Lock size={8} className="text-text-secondary" />}
                    {phase.status === "in_progress" && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <div className="card-static overflow-hidden">
                    <button onClick={() => setExpandedPhase(isExpanded ? null : phase.phase)}
                      className="w-full flex items-center justify-between p-5 text-left hover:bg-surface/50 transition-colors">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-bold text-text-primary">Phase {phase.phase}: {phase.title}</h4>
                          <span className={`badge ${cfg.badge} text-xs`}>{cfg.label}</span>
                        </div>
                        <p className="text-xs text-text-secondary">{phase.timeframe}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-text-primary hidden sm:block">{phase.progress}%</span>
                        {isExpanded ? <ChevronUp size={16} className="text-text-secondary" /> : <ChevronDown size={16} className="text-text-secondary" />}
                      </div>
                    </button>
                    <div className="px-5"><div className="progress-bar"><div className="progress-bar-fill" style={{ width: `${phase.progress}%` }} /></div></div>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="p-5 pt-4 space-y-3">
                        {phase.milestones.map((m: any) => (
                          <div key={m.id} className="flex items-center gap-3">
                            <button onClick={() => !isLocked && toggleMilestone(pi, m.id)} disabled={isLocked}
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                m.completed ? "bg-success border-success" : isLocked ? "border-border cursor-not-allowed" : "border-border hover:border-accent cursor-pointer"
                              }`}>{m.completed && <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 5l2.5 2.5 4-4" stroke="white" strokeWidth="1.5" fill="none" /></svg>}</button>
                            <span className={`text-sm flex-1 ${m.completed ? "text-text-secondary line-through" : "text-text-primary"}`}>{m.text}</span>
                          </div>
                        ))}
                        <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                          <button className="btn-ghost text-xs flex items-center gap-1 text-accent"><MessageSquare size={12} />Get help from Sage</button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
          <div className="mt-8">
            <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2"><BookOpen size={16} className="text-accent-secondary" />Recommended Resources</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {resources.map((r) => (
                <a key={r.title} href={r.url} target="_blank" rel="noopener noreferrer" className="card p-4 flex items-center gap-3 group cursor-pointer hover:border-accent transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center"><r.icon className={r.color} size={18} /></div>
                  <div className="flex-1"><p className="text-sm font-medium text-text-primary">{r.title}</p><p className="text-xs text-text-secondary">{r.desc}</p></div>
                  <ExternalLink size={14} className="text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Skill Gap Sidebar */}
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card-static p-6">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Your Skill Gap</h3>
            <div className="space-y-4">
              <div><p className="text-xs font-medium text-success mb-2 flex items-center gap-1"><CheckCircle2 size={12} />Skills You Have</p>
                <div className="flex flex-wrap gap-1.5">{DEMO_SKILLS.current.map((s) => <span key={s} className="badge badge-success text-xs">{s}</span>)}</div></div>
              <div><p className="text-xs font-medium text-warning mb-2 flex items-center gap-1"><Target size={12} />Skills You Need</p>
                <div className="flex flex-wrap gap-1.5">{DEMO_SKILLS.gap.map((s) => <span key={s} className="badge badge-warning text-xs">{s}</span>)}</div></div>
              <div className="space-y-2 mt-4 pt-4 border-t border-border">
                {DEMO_SKILLS.gap.slice(0, 4).map((s) => (
                  <div key={s} className="flex items-center justify-between">
                    <span className="text-xs text-text-primary">{s}</span>
                    <button className="text-[10px] text-accent hover:underline flex items-center gap-1">Practice <ArrowRight size={8} /></button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card-static w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-text-primary">Edit Career Objective</h3>
              <button onClick={() => setEditModal(false)} className="text-text-secondary hover:text-text-primary"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-xs font-medium text-text-secondary mb-1.5">Career Goal</label>
                <select className="input" value={goalSettings.role} onChange={(e) => setGoalSettings({...goalSettings, role: e.target.value})}><option>Software Engineer</option><option>Data Scientist</option><option>Product Manager</option><option>Cybersecurity Analyst</option></select></div>
              <div><label className="block text-xs font-medium text-text-secondary mb-1.5">Company Type</label>
                <select className="input" value={goalSettings.company} onChange={(e) => setGoalSettings({...goalSettings, company: e.target.value})}><option>MNC</option><option>FAANG</option><option>Startup</option></select></div>
              <div><label className="block text-xs font-medium text-text-secondary mb-1.5">Timeline</label>
                <select className="input" value={goalSettings.timeline} onChange={(e) => setGoalSettings({...goalSettings, timeline: e.target.value})}><option>3 months</option><option>6 months</option><option>1 year</option></select></div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditModal(false)} className="btn-outline flex-1">Cancel</button>
              <button onClick={regenerateRoadmap} className="btn-primary flex-1"><Sparkles size={14} />Regenerate Roadmap</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
