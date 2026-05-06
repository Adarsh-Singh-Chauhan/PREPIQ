"use client";

import { useState, useRef, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Zap,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Camera,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { ThemeProvider } from "@/lib/theme-context";
import { AuthProvider, useAuth } from "@/lib/auth-context";

import { supabase } from "@/lib/supabase";

function AuthContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login, loginDemo, signup, googleLoginLocal, faceLoginLocal } = useAuth() as any;
  const [isSignup, setIsSignup] = useState(searchParams.get("mode") === "signup");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [faceStatus, setFaceStatus] = useState<"idle" | "scanning" | "blink" | "success" | "fail">("idle");
  const videoRef = useRef<HTMLVideoElement>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [googleEmail, setGoogleEmail] = useState("");

  const handleGoogleLogin = () => {
    setShowGoogleModal(true);
  };

  const submitGoogleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail) return;
    setLoading(true);
    try {
      await googleLoginLocal(googleEmail);
      setShowGoogleModal(false);
      toast.success("Logged in with Google!");
      router.push("/dashboard");
    } catch {
      toast.error("Google login failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignup) {
        await signup({ ...form, password: form.password });
        toast.success("Account created! Welcome to PrepIQ.");
        router.push("/onboarding");
      } else {
        await login(form.email, form.password);
        toast.success("Welcome back!");
        router.push("/dashboard");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = () => {
    loginDemo();
    toast.success("Demo mode activated! Explore all features.");
    router.push("/dashboard");
  };

  const handleFaceLogin = async () => {
    setShowFaceModal(true);
    setFaceStatus("scanning");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Simulate face detection flow
      setTimeout(() => setFaceStatus("blink"), 2000);
      setTimeout(() => {
        setFaceStatus("success");
        stream.getTracks().forEach((track) => track.stop());
        setTimeout(async () => {
          setShowFaceModal(false);
          if (faceLoginLocal) {
            // Generate a random face ID to simulate logging into a unique account based on face
            const faceId = "face_" + Math.random().toString(36).substring(2, 6);
            await faceLoginLocal(faceId);
          } else {
            loginDemo();
          }
          toast.success("Face recognized! Logged into your account.");
          router.push("/dashboard");
        }, 1500);
      }, 4000);
    } catch {
      setFaceStatus("fail");
      toast.error("Camera access denied. Please use email login.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-surface overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-accent-secondary/10" />
        <div className="absolute inset-0 bg-grid opacity-50" />

        {/* Floating orbs */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-accent/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-accent-secondary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />

        <div className="relative z-10 flex flex-col justify-center px-16">
          <Link href="/" className="flex items-center gap-2 mb-12">
            <div className="w-10 h-10 rounded-xl bg-hero-gradient flex items-center justify-center">
              <Zap className="text-white" size={22} />
            </div>
            <span className="text-2xl font-bold text-text-primary">
              Prep<span className="gradient-text">IQ</span>
            </span>
          </Link>

          <h2 className="text-3xl font-bold text-text-primary mb-4 leading-tight">
            Your AI-powered career <br />
            <span className="gradient-text">preparation partner</span>
          </h2>

          <p className="text-text-secondary leading-relaxed mb-8 max-w-md">
            Set your career objective, practice with AI interviews, track your progress,
            and get placed at your dream company.
          </p>

          <div className="card-static p-6 max-w-md">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 mt-1">
                <Zap className="text-accent" size={18} />
              </div>
              <div>
                <p className="text-sm text-text-primary font-medium mb-1">
                  &ldquo;PrepIQ helped me go from zero to a Microsoft internship in 4 months. The roadmap feature is genius.&rdquo;
                </p>
                <p className="text-xs text-text-secondary">— Priya S., XYZ University</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel — Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <Link href="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-hero-gradient flex items-center justify-center">
              <Zap className="text-white" size={18} />
            </div>
            <span className="text-lg font-bold text-text-primary">
              Prep<span className="gradient-text">IQ</span>
            </span>
          </Link>

          <h1 className="text-2xl font-bold text-text-primary mb-2">
            {isSignup ? "Create your account" : "Welcome back"}
          </h1>
          <p className="text-sm text-text-secondary mb-8">
            {isSignup
              ? "Start your career preparation journey"
              : "Sign in to continue your preparation"}
          </p>

          {/* Toggle */}
          <div className="flex bg-surface rounded-lg p-1 mb-8 border border-border">
            <button
              onClick={() => setIsSignup(false)}
              className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all ${
                !isSignup
                  ? "bg-accent text-white shadow-lg"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsSignup(true)}
              className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all ${
                isSignup
                  ? "bg-accent text-white shadow-lg"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence>
              {isSignup && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                >
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
                    <input
                      type="text"
                      className="input !pl-10"
                      placeholder="John Doe"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
                <input
                  type="email"
                  className="input !pl-10"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
                <input
                  type={showPassword ? "text" : "password"}
                  className="input !pl-10 !pr-10"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  {isSignup ? "Create Account" : "Sign In"}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Google OAuth */}
          <button type="button" onClick={handleGoogleLogin} className="btn-outline w-full mt-4 py-3">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          {/* Face Login Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-text-secondary">or login with face</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <button onClick={handleFaceLogin} className="btn-outline w-full py-3">
            <Camera size={18} />
            Face Login
          </button>

          {/* Demo button */}
          <div className="mt-6 text-center">
            <button
              onClick={handleDemo}
              className="text-sm text-accent hover:text-accent-hover font-medium transition-colors"
            >
              🎮 Try Demo Mode (no account needed)
            </button>
          </div>
        </motion.div>
      </div>

      {/* Google Login Modal */}
      <AnimatePresence>
        {showGoogleModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card-static w-full max-w-sm p-8 bg-surface rounded-2xl relative"
            >
              <button
                onClick={() => setShowGoogleModal(false)}
                className="absolute top-4 right-4 text-text-secondary hover:text-text-primary"
              >
                <X size={20} />
              </button>
              
              <div className="flex flex-col items-center mb-6">
                <svg className="w-10 h-10 mb-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <h3 className="text-xl font-medium text-text-primary">Sign in</h3>
                <p className="text-sm text-text-secondary mt-1">Use your Google Account</p>
              </div>

              <form onSubmit={submitGoogleLogin} className="space-y-4">
                <div>
                  <input
                    type="email"
                    required
                    className="w-full bg-transparent border border-border rounded-md px-4 py-3 text-text-primary focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors"
                    placeholder="Email or phone"
                    value={googleEmail}
                    onChange={(e) => setGoogleEmail(e.target.value)}
                  />
                </div>
                <div className="flex items-center justify-between mt-8">
                  <button type="button" className="text-sm text-accent hover:text-accent-hover font-medium">
                    Create account
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-accent hover:bg-accent-hover text-white px-6 py-2 rounded-md font-medium transition-colors disabled:opacity-50 flex items-center"
                  >
                    {loading ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                    Next
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Face Login Modal */}
      <AnimatePresence>
        {showFaceModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card-static w-full max-w-md p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-text-primary">Face Login</h3>
                <button
                  onClick={() => {
                    setShowFaceModal(false);
                    setFaceStatus("idle");
                    if (videoRef.current?.srcObject) {
                      (videoRef.current.srcObject as MediaStream)
                        .getTracks()
                        .forEach((t) => t.stop());
                    }
                  }}
                  className="text-text-secondary hover:text-text-primary"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="relative aspect-video bg-surface rounded-xl overflow-hidden mb-4">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                {/* Scanning overlay */}
                {faceStatus === "scanning" && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-32 h-32 border-2 border-accent rounded-2xl animate-pulse" />
                  </div>
                )}
              </div>

              <div className="text-center">
                {faceStatus === "scanning" && (
                  <div className="flex items-center justify-center gap-2 text-accent">
                    <Loader2 className="animate-spin" size={16} />
                    <span className="text-sm">Detecting face...</span>
                  </div>
                )}
                {faceStatus === "blink" && (
                  <div className="flex items-center justify-center gap-2 text-warning">
                    <Eye size={16} />
                    <span className="text-sm font-medium">Please blink to verify liveness</span>
                  </div>
                )}
                {faceStatus === "success" && (
                  <div className="flex items-center justify-center gap-2 text-success">
                    <CheckCircle2 size={16} />
                    <span className="text-sm font-medium">Face recognized! Logging in...</span>
                  </div>
                )}
                {faceStatus === "fail" && (
                  <div className="flex items-center justify-center gap-2 text-danger">
                    <AlertCircle size={16} />
                    <span className="text-sm font-medium">Face not recognized. Use email login.</span>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AuthPage() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Suspense fallback={<div className="min-h-screen bg-background" />}>
          <AuthContent />
        </Suspense>
      </AuthProvider>
    </ThemeProvider>
  );
}

