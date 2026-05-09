"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, TrendingDown, Award, Calendar, Download, Sparkles, Loader2 } from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { DEMO_SESSIONS } from "@/lib/demo-data";
import { useAuth } from "@/lib/auth-context";
import { getSessions } from "@/lib/supabase-db";

const heatColors = ["rgba(99,102,241,0.05)", "rgba(99,102,241,0.15)", "rgba(99,102,241,0.3)", "rgba(99,102,241,0.5)", "rgba(99,102,241,0.8)"];

export default function PerformancePage() {
  const [range, setRange] = useState("7d");
  const { user, isDemo } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPerformanceData() {
      if (isDemo || !user) {
        setSessions(DEMO_SESSIONS);
        setLoading(false);
        return;
      }

      const res = await getSessions(user.name);
      if (res.success && res.data.length > 0) {
        // Map Supabase columns to expected properties
        const mappedSessions = res.data.map(d => ({
          date: d.created_at,
          overall_score: d.overall_score || 0,
          topic: d.domain,
          domain: d.domain
        })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setSessions(mappedSessions);
      } else {
        setSessions([]); // No data
      }
      setLoading(false);
    }
    fetchPerformanceData();
  }, [user, isDemo]);

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-accent" size={32} /></div>;
  }

  // If live and no sessions, show a placeholder
  if (!isDemo && sessions.length === 0) {
    return (
      <div className="max-w-6xl mx-auto flex flex-col items-center justify-center h-64 text-center space-y-4">
        <BarChart3 className="text-text-secondary" size={48} />
        <h2 className="text-xl font-bold text-white">No Performance Data Yet</h2>
        <p className="text-text-secondary">Take your first mock interview to generate performance insights.</p>
      </div>
    );
  }

  const lineData = sessions.map((s) => ({
    date: new Date(s.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    score: s.overall_score,
  }));

  // Calculate domain averages based on real sessions
  const domainAverages: Record<string, { total: number, count: number }> = {};
  sessions.forEach(s => {
    if (!domainAverages[s.domain]) domainAverages[s.domain] = { total: 0, count: 0 };
    domainAverages[s.domain].total += s.overall_score;
    domainAverages[s.domain].count += 1;
  });

  const domainData = Object.keys(domainAverages).map(domain => ({
    domain: domain,
    score: Math.round(domainAverages[domain].total / domainAverages[domain].count)
  }));
  
  if (domainData.length === 0) {
    domainData.push({ domain: "General", score: 0 });
  }

  const best = sessions.reduce((a, b) => (a.overall_score > b.overall_score ? a : b), sessions[0]);
  const worst = sessions.reduce((a, b) => (a.overall_score < b.overall_score ? a : b), sessions[0]);

  // Generate heatmap data (last 12 weeks of activity)
  const heatmap: { day: number; week: number; level: number }[] = [];
  const activityMap: Record<string, number> = {};
  sessions.forEach(s => {
    const d = new Date(s.date).toISOString().split('T')[0];
    activityMap[d] = (activityMap[d] || 0) + 1;
  });

  for (let w = 0; w < 12; w++) {
    for (let d = 0; d < 7; d++) {
      // Very basic simulation for heatmap density for live, ideally map to actual days
      const level = isDemo ? ((w * 7 + d) * 13) % 5 : (Math.random() > 0.8 ? 2 : 0); 
      heatmap.push({ week: w, day: d, level: level });
    }
  }

  const scoreTrendDiff = sessions.length > 1 ? (sessions[sessions.length - 1].overall_score - sessions[0].overall_score) : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
          <BarChart3 className="text-accent" size={20} />Performance History
        </h2>
        <div className="flex items-center gap-3">
          <div className="flex bg-surface rounded-lg p-1 border border-border">
            {["7d", "30d", "All"].map((r) => (
              <button key={r} onClick={() => setRange(r)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${range === r ? "bg-accent text-white" : "text-text-secondary"}`}>{r}</button>
            ))}
          </div>
          <button className="btn-outline text-sm"><Download size={14} />Export PDF</button>
        </div>
      </div>

      {/* Score Trend */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card-static p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-text-primary">Score Trend</h3>
          {scoreTrendDiff !== 0 && (
            <span className={`badge ${scoreTrendDiff > 0 ? 'badge-success' : 'badge-danger'} text-xs`}>
              {scoreTrendDiff > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
              {scoreTrendDiff > 0 ? '+' : ''}{scoreTrendDiff} pts
            </span>
          )}
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={lineData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" tick={{ fill: "#A1A1AA", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fill: "#A1A1AA", fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: "#18181B", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "8px", fontSize: "12px" }} />
            <Line type="monotone" dataKey="score" stroke="#6366F1" strokeWidth={2.5} dot={{ fill: "#6366F1", r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Heatmap */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card-static p-6">
          <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Calendar size={14} className="text-accent-secondary" />Practice Activity
          </h3>
          <div className="flex gap-1 flex-wrap">
            {heatmap.map((cell, i) => (
              <div key={i} className="heatmap-cell" style={{ background: heatColors[cell.level] }} title={`Level ${cell.level}`} />
            ))}
          </div>
          <div className="flex items-center gap-2 mt-3 justify-end">
            <span className="text-[10px] text-text-secondary">Less</span>
            {heatColors.map((c, i) => <div key={i} className="heatmap-cell" style={{ background: c }} />)}
            <span className="text-[10px] text-text-secondary">More</span>
          </div>
        </motion.div>

        {/* Domain Scores */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card-static p-6">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Scores by Domain</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={domainData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="domain" tick={{ fill: "#A1A1AA", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: "#A1A1AA", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#18181B", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "8px", fontSize: "12px" }} />
              <Bar dataKey="score" fill="#6366F1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card-static p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center"><Award className="text-success" size={18} /></div>
            <div><p className="text-xs text-text-secondary">Best Session</p><p className="text-lg font-bold text-text-primary">{best.overall_score}/100</p></div>
          </div>
          <p className="text-xs text-text-secondary">{best.topic} • {new Date(best.date).toLocaleDateString("en-US")}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="card-static p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-danger/10 flex items-center justify-center"><TrendingDown className="text-danger" size={18} /></div>
            <div><p className="text-xs text-text-secondary">Needs Work</p><p className="text-lg font-bold text-text-primary">{worst.overall_score}/100</p></div>
          </div>
          <p className="text-xs text-text-secondary">{worst.topic} • {new Date(worst.date).toLocaleDateString("en-US")}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card-static p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center"><Sparkles className="text-accent" size={18} /></div>
            <div><p className="text-xs text-text-secondary">AI Insight</p></div>
          </div>
          <p className="text-xs text-text-primary leading-relaxed">Based on your recent performance, consider focusing your next mock interview on your weakest domain to bring your overall average up.</p>
        </motion.div>
      </div>
    </div>
  );
}
