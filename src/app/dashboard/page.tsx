"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Mic, Target, Flame, TrendingUp, ArrowRight,
  Sparkles,
} from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { DEMO_USER, DEMO_SESSIONS, DEMO_ROADMAP } from "@/lib/demo-data";
import { useAuth } from "@/lib/auth-context";

export default function DashboardHome() {
  const { user, isDemo } = useAuth();

  const sessions = isDemo ? DEMO_SESSIONS : [];
  const lineChartData = isDemo ? DEMO_SESSIONS.map((s) => ({ date: new Date(s.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }), score: s.overall_score })) : [];
  const avgScore = sessions.length > 0 ? Math.round(sessions.reduce((a, s) => a + s.overall_score, 0) / sessions.length) : 0;
  
  const currentPhase = isDemo ? DEMO_ROADMAP.find((r) => r.status === "in_progress") : {
    phase: 1,
    title: "Foundation",
    progress: 0,
    status: "in_progress",
    milestones: [
      { id: "1", text: "Complete DSA basics (Arrays, Strings)", completed: false },
      { id: "2", text: "Learn Python deeply", completed: false },
      { id: "3", text: "Solve 10 LeetCode Easy problems", completed: false },
      { id: "4", text: "Complete 1 mock interview", completed: false },
    ]
  };

  const streak = isDemo ? 12 : 0;
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
          { label: "Interviews Done", value: sessions.length.toString(), icon: Mic, color: "text-accent", bg: "bg-accent/10", change: isDemo ? "+2 this week" : "Start your first!" },
          { label: "Average Score", value: `${avgScore}/100`, icon: TrendingUp, color: "text-success", bg: "bg-success/10", change: isDemo ? "+8 from last week" : "No data yet" },
          { label: "Day Streak", value: streak.toString(), icon: Flame, color: "text-orange-400", bg: "bg-orange-400/10", change: isDemo ? "🔥 Personal best!" : "Start your streak" },
          { label: "Roadmap Progress", value: `${currentPhase?.progress || 0}%`, icon: Target, color: "text-accent-secondary", bg: "bg-accent-secondary/10", change: "Phase 1 active" },
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
              {isDemo ? (
                <>Based on your roadmap, focus on <strong className="text-text-primary font-semibold">Dynamic Programming patterns</strong> today. You&apos;ve completed 3 of 5 milestones in Phase 1. Let&apos;s close the gap!</>
              ) : (
                <>Welcome to PrepIQ! Let&apos;s start your preparation journey. Your first milestone is to complete DSA basics. Start a practice session today!</>
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
              <span className="badge badge-success text-xs"><TrendingUp size={12} />+13 pts</span>
            </div>
            {sessions.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={lineChartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                  <XAxis dataKey="date" tick={{ fill: "var(--text-secondary)", fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis domain={[50, 100]} tick={{ fill: "var(--text-secondary)", fontSize: 12 }} axisLine={false} tickLine={false} />
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
                  {currentPhase.milestones.slice(0, 4).map((m) => (
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
