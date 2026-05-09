"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Brain,
  Target,
  BarChart3,
  MessageSquare,
  Shield,
  Briefcase,
  ArrowRight,
  Play,
  ChevronRight,
  Sparkles,
  Menu,
  X,
  Zap,
  Users,
  Award,
  type LucideIcon,
} from "lucide-react";
import { FEATURE_CARDS } from "@/lib/demo-data";
import { ThemeProvider } from "@/lib/theme-context";
import { AuthProvider } from "@/lib/auth-context";

const iconMap: Record<string, LucideIcon> = {
  Brain,
  Target,
  BarChart3,
  MessageSquare,
  Shield,
  Briefcase,
};

// Floating orbs background
function FloatingOrbs() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-float" />
      <div
        className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent-secondary/5 rounded-full blur-3xl animate-float"
        style={{ animationDelay: "3s" }}
      />
      <div
        className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl animate-float"
        style={{ animationDelay: "1.5s" }}
      />
    </div>
  );
}

// Mock interview preview component
const interviewQuestions = [
  "Tell me about a challenging project you've worked on.",
  "How would you design a URL shortener?",
  "What's your approach to debugging complex issues?",
];

function InterviewMockup() {
  const [currentQ, setCurrentQ] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentQ((p) => (p + 1) % interviewQuestions.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.4 }}
      className="relative"
    >
      <div className="card-static p-1 rounded-2xl overflow-hidden glow-indigo">
        {/* Window chrome */}
        <div className="bg-[#0C0C0E] rounded-t-xl px-4 py-3 flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <div className="flex-1 text-center">
            <span className="text-xs text-text-secondary">PrepIQ — Mock Interview</span>
          </div>
        </div>

        {/* Interview content */}
        <div className="bg-[#0C0C0E] p-6 grid grid-cols-5 gap-4">
          {/* Webcam area */}
          <div className="col-span-3 aspect-video bg-gradient-to-br from-surface to-[#1a1a2e] rounded-xl flex items-center justify-center relative overflow-hidden">
            <div className="absolute top-3 left-3 live-indicator">
              <div className="pulse-dot" />
              <span>Live</span>
            </div>
            <div className="absolute top-3 right-3 text-xs font-mono text-text-secondary bg-surface/80 px-2 py-1 rounded">
              04:32
            </div>
            <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center">
              <Users className="text-accent" size={32} />
            </div>
            <div className="absolute bottom-3 left-3 bg-surface/80 backdrop-blur px-3 py-1.5 rounded-lg text-xs">
              <span className="text-green-400">● </span>
              <span className="text-text-secondary">Confidence: </span>
              <span className="text-green-400 font-semibold">78%</span>
            </div>
            <div className="absolute bottom-3 right-3 badge badge-success text-xs">
              😊 Confident
            </div>
          </div>

          {/* Question area */}
          <div className="col-span-2 flex flex-col gap-3">
            <div className="text-xs text-text-secondary font-medium">
              Q{currentQ + 1} of 8
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQ}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-sm text-text-primary font-medium leading-relaxed"
              >
                {interviewQuestions[currentQ]}
              </motion.div>
            </AnimatePresence>
            <div className="mt-auto space-y-2">
              <div className="h-2 bg-surface rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-accent rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: "60%" }}
                  transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                />
              </div>
              <p className="text-[10px] text-text-secondary">AI transcribing your answer...</p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute -top-4 -right-4 bg-surface border border-border rounded-xl px-3 py-2 shadow-xl"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="text-accent" size={14} />
          <span className="text-xs font-semibold text-text-primary">AI Scoring Live</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute -bottom-4 -left-4 bg-surface border border-border rounded-xl px-3 py-2 shadow-xl"
      >
        <div className="flex items-center gap-2">
          <Target className="text-accent-secondary" size={14} />
          <span className="text-xs font-semibold text-text-primary">Score: 85/100</span>
        </div>
      </motion.div>
    </motion.div>
  );
}

function LandingContent() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background bg-grid relative">
      <FloatingOrbs />

      {/* ===== NAVBAR ===== */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "glass shadow-lg" : "bg-transparent"
        }`}
      >
        <div className="container-app flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-hero-gradient flex items-center justify-center">
              <Zap className="text-white" size={18} />
            </div>
            <span className="text-lg font-bold text-text-primary">
              Prep<span className="gradient-text">IQ</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
              How it works
            </a>
            <a href="#testimonials" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
              Demo
            </a>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/auth" className="btn-ghost">
              Login
            </Link>
            <Link href="/auth?mode=signup" className="btn-primary">
              Get Started
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* Mobile menu */}
          <button
            className="md:hidden text-text-primary"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden glass border-t border-border overflow-hidden"
            >
              <div className="container-app py-4 flex flex-col gap-3">
                <a href="#features" className="text-sm text-text-secondary py-2">Features</a>
                <a href="#how-it-works" className="text-sm text-text-secondary py-2">How it works</a>
                <Link href="/auth" className="btn-outline w-full text-center">Login</Link>
                <Link href="/auth?mode=signup" className="btn-primary w-full text-center">Get Started</Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* ===== HERO ===== */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32">
        <div className="container-app">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="badge badge-accent mb-6 inline-flex">
                <Sparkles size={12} />
                AI-Powered Interview Prep
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight text-text-primary mb-6">
                Know where you&apos;re going.{" "}
                <span className="gradient-text">Practice until you get there.</span>
              </h1>
              <p className="text-lg text-text-secondary max-w-lg mb-8 leading-relaxed">
                PrepIQ is your AI interview coach, career planner, and job prep partner.
                Set your goal, follow your roadmap, and ace every interview.
              </p>

              <div className="flex flex-wrap gap-4 mb-12">
                <Link href="/auth?mode=signup" className="btn-primary text-base px-8 py-3">
                  Get Started Free
                  <ArrowRight size={18} />
                </Link>
                <Link href="/dashboard" className="btn-outline text-base px-8 py-3">
                  <Play size={18} />
                  Try Demo
                </Link>
              </div>

              {/* Social proof */}
              <div className="mt-8">
                <p className="text-2xl font-bold tracking-widest uppercase bg-clip-text text-transparent bg-gradient-to-r from-accent to-accent-secondary inline-block">
                  SAGE ANANDAM
                </p>
              </div>
            </motion.div>

            {/* Right: Interview Mockup */}
            <div className="hidden lg:block">
              <InterviewMockup />
            </div>
          </div>
        </div>
      </section>



      {/* ===== FEATURES ===== */}
      <section id="features" className="py-20 md:py-32">
        <div className="container-app">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="badge badge-cyan inline-flex mb-4">
              <Zap size={12} />
              Features
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
              Everything you need to{" "}
              <span className="gradient-text">land your dream job</span>
            </h2>
            <p className="text-text-secondary max-w-2xl mx-auto">
              From setting your career goal to getting placed — PrepIQ covers your entire journey
              with AI-powered tools and personalised guidance.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURE_CARDS.map((feature, i) => {
              const Icon = iconMap[feature.icon];
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="card p-6 group cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                    {Icon && <Icon className="text-accent" size={24} />}
                  </div>
                  <h3 className="text-lg font-semibold text-text-primary mb-2">{feature.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{feature.description}</p>
                  <div className="flex items-center gap-1 mt-4 text-accent text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Learn more <ChevronRight size={14} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-it-works" className="py-20 md:py-32 bg-surface/30">
        <div className="container-app">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="badge badge-accent inline-flex mb-4">
              <Target size={12} />
              How It Works
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
              Three steps to your <span className="gradient-text">dream career</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-16 left-[16.66%] right-[16.66%] h-0.5 bg-gradient-to-r from-accent via-accent-secondary to-accent" />

            {[
              {
                step: 1,
                title: "Set Your Goal",
                description:
                  "Tell PrepIQ your career objective, target company, and timeline. Our AI builds a personalised roadmap just for you.",
                icon: Target,
              },
              {
                step: 2,
                title: "Practice & Learn",
                description:
                  "Take AI mock interviews, follow your roadmap milestones, chat with Sage for guidance, and track your progress.",
                icon: Brain,
              },
              {
                step: 3,
                title: "Get Placed",
                description:
                  "Match with internships, validate your certificates, and ace your real interviews with confidence.",
                icon: Award,
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="text-center relative"
              >
                <div className="w-14 h-14 rounded-full bg-hero-gradient flex items-center justify-center mx-auto mb-6 relative z-10">
                  <item.icon className="text-white" size={24} />
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-3">
                  Step {item.step}: {item.title}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed max-w-xs mx-auto">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>



      {/* ===== CTA ===== */}
      <section className="py-20 md:py-32">
        <div className="container-app">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="card-static p-12 md:p-16 text-center relative overflow-hidden"
          >
            {/* BG gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-accent-secondary/5" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                Ready to start your <span className="gradient-text">career journey</span>?
              </h2>
              <p className="text-text-secondary max-w-lg mx-auto mb-8">
                Join thousands of students who are using PrepIQ to set goals, practice interviews,
                and land their dream placements.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link href="/auth?mode=signup" className="btn-primary text-base px-8 py-3">
                  Get Started Free
                  <ArrowRight size={18} />
                </Link>
                <Link href="/dashboard" className="btn-outline text-base px-8 py-3">
                  <Play size={18} />
                  Try Demo
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="py-12 border-t border-border">
        <div className="container-app">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-hero-gradient flex items-center justify-center">
                  <Zap className="text-white" size={18} />
                </div>
                <span className="text-lg font-bold text-text-primary">
                  Prep<span className="gradient-text">IQ</span>
                </span>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">
                AI-powered career preparation platform for students. Set goals, practice, and get placed.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-text-primary mb-4">Product</h4>
              <div className="flex flex-col gap-2">
                <a href="#features" className="text-sm text-text-secondary hover:text-text-primary transition-colors">Features</a>
                <a href="#how-it-works" className="text-sm text-text-secondary hover:text-text-primary transition-colors">How it works</a>
                <Link href="/dashboard" className="text-sm text-text-secondary hover:text-text-primary transition-colors">Demo</Link>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-text-primary mb-4">Company</h4>
              <div className="flex flex-col gap-2">
                <a href="#" className="text-sm text-text-secondary hover:text-text-primary transition-colors">About</a>
                <a href="#" className="text-sm text-text-secondary hover:text-text-primary transition-colors">Blog</a>
                <a href="#" className="text-sm text-text-secondary hover:text-text-primary transition-colors">Careers</a>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-text-primary mb-4">Legal</h4>
              <div className="flex flex-col gap-2">
                <a href="#" className="text-sm text-text-secondary hover:text-text-primary transition-colors">Privacy Policy</a>
                <a href="#" className="text-sm text-text-secondary hover:text-text-primary transition-colors">Terms of Service</a>
                <a href="#" className="text-sm text-text-secondary hover:text-text-primary transition-colors">Contact</a>
              </div>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center">
            <p className="text-sm text-text-secondary">&copy; PrepIQ 2026. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function LandingPage() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LandingContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
