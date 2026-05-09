"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Mic, Target, Flame, TrendingUp, ArrowRight,
  Sparkles, Loader2
} from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { DEMO_USER, DEMO_SESSIONS, DEMO_ROADMAP } from "@/lib/demo-data";
import { useAuth } from "@/lib/auth-context";
import { getSessions, getRoadmapMilestones } from "@/lib/supabase-db";

export default function DashboardHome() {
  const { user, isDemo } = useAuth();
  
  const [sessions, setSessions] = useState<any[]>([]);
  const [currentPhase, setCurrentPhase] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (isDemo || !user) {
        setSessions(DEMO_SESSIONS);
        setCurrentPhase(DEMO_ROADMAP.find((r) => r.status === "in_progress") || DEMO_ROADMAP[0]);
        setLoading(false);
        return;
      }

      // Fetch Live Data
      const [sessionsRes, roadmapRes] = await Promise.all([
        getSessions(user.name),
        getRoadmapMilestones(user.name)
      ]);

      if (sessionsRes.success && sessionsRes.data) {
        const mappedSessions = sessionsRes.data.map(d => ({
          date: d.created_at,
          overall_score: d.overall_score || 0,
        })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setSessions(mappedSessions);
      } else {
        setSessions([]);
      }

      // Handle Live Roadmap Phase
      const localRoadmap = localStorage.getItem(`roadmap_${user.id}`);
      let fullRoadmap = localRoadmap ? JSON.parse(localRoadmap) : DEMO_ROADMAP;

      if (roadmapRes.success && roadmapRes.data.length > 0) {
        fullRoadmap = JSON.parse(JSON.stringify(fullRoadmap));
        roadmapRes.data.forEach((dbM: any) => {
           const phase = fullRoadmap.find((p: any) => p.phase === dbM.phase_number);
           if (phase) {
              const m = phase.milestones.find((m: any) => m.text === dbM.milestone_text);
              if (m) m.completed = dbM.is_completed;
           }
        });
        
        fullRoadmap.forEach((phase: any, i: number) => {
           const done = phase.milestones.filter((m: any) => m.completed).length;
           phase.progress = Math.round((done / phase.milestones.length) * 100);
           if (phase.progress === 100) phase.status = "completed";
           else if (phase.progress > 0 || (i === 0) || (i > 0 && fullRoadmap[i-1].progress === 100)) phase.status = "in_progress";
           else phase.status = "locked";
        });
      }

      const activePhase = fullRoadmap.find((r: any) => r.status === "in_progress") || fullRoadmap[0];
      setCurrentPhase(activePhase);

      setLoading(false);
    }
    
    fetchData();
  }, [user, isDemo]);

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-accent" size={32} /></div>;
  }

  const lineChartData = sessions.map((s) => ({ date: new Date(s.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }), score: s.overall_score }));
  const avgScore = sessions.length > 0 ? Math.round(sessions.reduce((a, s) => a + s.overall_score, 0) / sessions.length) : 0;
  
  const streak = isDemo ? 12 : 0; // Keeping streak at 0 for live until fully implemented
  const scoreTrendDiff = sessions.length > 1 ? (sessions[sessions.length - 1].overall_score - sessions[0].overall_score) : 0;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Overview</h1>
          <p className="text-sm text-text-secondary mt-1">Track your progress and AI recommendations.</p>
        </div>
      </div>

      {/* Metric Cards (Clean & Simple) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: "Interviews Done", value: sessions.length.toString(), icon: Mic, color: "text-accent", bg: "bg-accent/10", change: isDemo ? "+2 this week" : (sessions.length > 0 ? "Keep it up!" : "Start your first!") },
          { label: "Average Score", value: `${avgScore}/100`, icon: TrendingUp, color: "text-success", bg: "bg-success/10", change: isDemo ? "+8 from last week" : (avgScore > 0 ? `Avg Score` : "No data yet") },
          { label: "Day Streak", value: streak.toString(), icon: Flame, color: "text-orange-400", bg: "bg-orange-400/10", change: isDemo ? "🔥 Personal best!" : "Start your streak" },
          { label: "Roadmap Progress", value: `${currentPhase?.progress || 0}%`, icon: Target, color: "text-accent-secondary", bg: "bg-accent-secondary/10", change: `Phase ${currentPhase?.phase || 1} active` },
        ].map((metric, i) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -3, boxShadow: "0 10px 30px -10px rgba(0,0,0,0.1)" }}
            className="card p-6 bg-surface border border-border transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-full ${metric.bg} flex items-center justify-center`}>
                <metric.icon className={metric.color} size={18} />
              </div>
              <span className="text-xs font-semibold text-success">{metric.change}</span>
            </div>
            <div>
              <p className="text-3xl font-bold text-text-primary mb-1">{metric.value}</p>
              <p className="text-sm text-text-secondary">{metric.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Focus - Clean Card */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-6 bg-surface border border-border">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="text-accent" size={18} />
              <h3 className="text-base font-bold text-text-primary">Today&apos;s Focus</h3>
              <span className="badge badge-accent text-xs ml-auto">AI Recommended</span>
            </div>
            <p className="text-text-secondary text-sm mb-6 leading-relaxed">
              {sessions.length > 0 ? (
                <>Based on your roadmap, focus on <strong className="text-text-primary font-semibold">Phase {currentPhase?.phase}: {currentPhase?.title}</strong> today. You&apos;ve completed {currentPhase?.progress}% of this phase. Let&apos;s close the gap!</>
              ) : (
                <>Welcome to PrepIQ! Let&apos;s start your preparation journey. Your first milestone is to complete Phase 1. Start a practice session today!</>
              )}
            </p>
            <Link href="/dashboard/interview" className="btn-primary">
              <Mic size={16} />Start Practice Session<ArrowRight size={16} />
            </Link>
          </motion.div>

          {/* Performance Chart - Minimalist */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="card p-6 bg-surface border border-border">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-bold text-text-primary">Performance Trend</h3>
              {scoreTrendDiff !== 0 && (
                <span className={`badge ${scoreTrendDiff > 0 ? 'badge-success' : 'badge-danger'} text-xs`}>
                  {scoreTrendDiff > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {scoreTrendDiff > 0 ? '+' : ''}{scoreTrendDiff} pts
                </span>
              )}
            </div>
            {sessions.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={lineChartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                  <XAxis dataKey="date" tick={{ fill: "var(--text-secondary)", fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis domain={[0, 100]} tick={{ fill: "var(--text-secondary)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border-color)", borderRadius: "8px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }} itemStyle={{ color: "var(--text-primary)" }} />
                  <Line type="monotone" dataKey="score" stroke="#6366F1" strokeWidth={3} dot={{ fill: "var(--surface)", stroke: "#6366F1", strokeWidth: 2, r: 4 }} activeDot={{ r: 6, fill: "#6366F1" }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex flex-col items-center justify-center border border-dashed border-border rounded-xl">
                <TrendingUp size={32} className="text-text-secondary/50 mb-2" />
                <p className="text-sm text-text-secondary">Take your first interview to see your trend</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Roadmap Progress - Clean List */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="card p-6 bg-surface border border-border h-full">
            <h3 className="text-base font-bold text-text-primary mb-5">Roadmap Progress</h3>
            {currentPhase && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-text-primary">Phase {currentPhase.phase}: {currentPhase.title}</span>
                  <span className="text-sm font-bold text-accent">{currentPhase.progress}%</span>
                </div>
                <div className="progress-bar mb-6 h-2 bg-background border border-border">
                  <div className="progress-bar-fill" style={{ width: `${currentPhase.progress}%` }} />
                </div>
                <div className="space-y-4">
                  {currentPhase.milestones.slice(0, 4).map((m: any) => (
                    <div key={m.id} className="flex items-start gap-3 group">
                      <div className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${m.completed ? "bg-success border-success" : "border-text-secondary/30"}`}>
                        {m.completed && <svg width="10" height="10" viewBox="0 0 8 8" fill="white"><path d="M1 4l2 2 4-4" stroke="white" strokeWidth="2" fill="none" /></svg>}
                      </div>
                      <span className={`text-sm ${m.completed ? "text-text-secondary line-through" : "text-text-primary font-medium"}`}>{m.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
