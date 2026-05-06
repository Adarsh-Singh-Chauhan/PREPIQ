"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Briefcase, MapPin, Zap, Filter, ExternalLink, BookmarkPlus, Search, AlertTriangle } from "lucide-react";
import { DEMO_INTERNSHIPS } from "@/lib/demo-data";

export default function InternshipsPage() {
  const [search, setSearch] = useState("");
  const [workMode, setWorkMode] = useState("All");
  const filtered = DEMO_INTERNSHIPS.filter((i) =>
    (i.title.toLowerCase().includes(search.toLowerCase()) || i.company.toLowerCase().includes(search.toLowerCase())) &&
    (workMode === "All" || i.work_mode === workMode)
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <Briefcase className="text-accent" size={20} />Internships Matched to Your Profile
          </h2>
          <p className="text-sm text-text-secondary mt-1">Based on your career goal, skills, and roadmap progress</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search roles..." className="input pl-10" />
        </div>
        <div className="flex gap-2">
          {["All", "Remote", "Hybrid", "Office"].map((m) => (
            <button key={m} onClick={() => setWorkMode(m)} className={`pill text-xs ${workMode === m ? "active" : ""}`}>{m}</button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map((intern, i) => (
          <motion.div key={intern.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }} className="card p-6 group relative">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <Briefcase className="text-accent" size={22} />
              </div>
              <span className={`badge text-xs ${intern.match_score >= 80 ? "badge-success" : "badge-warning"}`}>
                {intern.match_score}% match
              </span>
            </div>
            <h3 className="text-base font-semibold text-text-primary mb-1">{intern.title}</h3>
            <p className="text-sm text-text-secondary mb-3">{intern.company}</p>
            <div className="flex flex-wrap gap-3 text-xs text-text-secondary mb-4">
              <span className="flex items-center gap-1"><MapPin size={12} />{intern.location}</span>
              <span className="flex items-center gap-1"><Zap size={12} />{intern.stipend}</span>
              <span className="badge badge-cyan text-xs">{intern.work_mode}</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {intern.skills_required.map((s) => (
                <span key={s} className="badge badge-accent text-xs">{s}</span>
              ))}
            </div>

            {/* Match explanation on hover */}
            <div className="text-xs text-text-secondary italic mb-4 opacity-0 group-hover:opacity-100 transition-opacity">
              💡 {intern.match_reason}
            </div>

            <div className="flex gap-2">
              <button className="btn-outline flex-1 text-sm"><BookmarkPlus size={14} />Save</button>
              <a href={intern.apply_url} target="_blank" rel="noopener noreferrer" className="btn-primary flex-1 text-sm text-center flex items-center justify-center gap-2"><ExternalLink size={14} />Apply</a>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Progress Nudge */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        className="card-static p-5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="text-warning" size={18} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-text-primary">Complete more milestones to unlock better matches</p>
          <p className="text-xs text-text-secondary">Finishing Phase 1 will improve your match scores by ~15%</p>
        </div>
        <div className="progress-bar w-32">
          <div className="progress-bar-fill" style={{ width: "60%" }} />
        </div>
      </motion.div>
    </div>
  );
}
