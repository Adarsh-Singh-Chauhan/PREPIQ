"use client";

import { useState, ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  Home,
  Mic,
  Map,
  BarChart3,
  MessageSquare,
  Briefcase,
  Calendar,
  Settings,
  LogOut,
  Flame,
  Bell,
  Menu,
  X,
  ChevronRight,
  FileText,
  User as UserIcon,
  Upload,
  Download,
  CheckCircle,
  ShieldCheck,
} from "lucide-react";
import { ThemeProvider } from "@/lib/theme-context";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { DEMO_USER } from "@/lib/demo-data";

const sidebarLinks = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/dashboard/interview", icon: Mic, label: "Interview" },
  { href: "/dashboard/roadmap", icon: Map, label: "Roadmap" },
  { href: "/dashboard/performance", icon: BarChart3, label: "Performance" },
  { href: "/dashboard/chatbot", icon: MessageSquare, label: "Chatbot" },
  { href: "/dashboard/resume", icon: FileText, label: "ATS Resume" },
  { href: "/dashboard/validator", icon: ShieldCheck, label: "Validator" },
  { href: "/dashboard/internships", icon: Briefcase, label: "Internships" },
  { href: "/dashboard/schedule", icon: Calendar, label: "Schedule" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
];

function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isDemo, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Header Dropdown States
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  
  const currentUser = user || DEMO_USER;
  const userStreak = isDemo ? (currentUser.streak || 12) : 0;

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const triggerUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.png,.jpg';
    input.onchange = () => alert('Certificate uploaded successfully to vault!');
    input.click();
  };

  const triggerDownload = () => {
    alert('Downloading your verified certificates...');
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-[240px] bg-surface border-r border-border flex flex-col transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-border">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-hero-gradient flex items-center justify-center">
              <Zap className="text-white" size={16} />
            </div>
            <span className="text-lg font-bold text-text-primary">
              Prep<span className="gradient-text">IQ</span>
            </span>
          </Link>
          <button className="lg:hidden text-text-secondary" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {sidebarLinks.map((link) => {
            const isActive =
              link.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(link.href);

            return (
              <motion.div
                key={link.href}
                whileHover={{ scale: 1.02, x: 5, rotateY: 2 }}
                whileTap={{ scale: 0.98 }}
                style={{ perspective: 1000 }}
              >
                <Link
                  href={link.href}
                  className={`sidebar-link relative overflow-hidden group ${isActive ? "active shadow-[0_0_15px_rgba(139,92,246,0.15)] border border-accent/20" : ""}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  {isActive && (
                    <motion.div layoutId="activeNavIndicator" className="absolute left-0 top-0 w-1 h-full bg-accent rounded-r-full" />
                  )}
                  <link.icon size={18} className={isActive ? "text-accent" : "text-text-secondary group-hover:text-text-primary transition-colors"} />
                  <span className={isActive ? "font-semibold" : ""}>{link.label}</span>
                  {isActive && (
                    <ChevronRight size={14} className="ml-auto text-accent" />
                  )}
                </Link>
              </motion.div>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent to-accent-secondary flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {currentUser.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{currentUser.name}</p>
              <div className="flex items-center gap-1">
                <Flame size={12} className={userStreak > 0 ? "text-orange-400" : "text-text-secondary"} />
                <span className="text-xs text-text-secondary">{userStreak} day streak</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="sidebar-link w-full text-text-secondary hover:text-danger"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-surface/50 backdrop-blur-sm sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden text-text-secondary hover:text-text-primary"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={22} />
            </button>
            <div>
              <h1 className="text-sm font-semibold text-text-primary" suppressHydrationWarning>
                {greeting}, {currentUser.name.split(" ")[0]} 👋
              </h1>
              <p className="text-xs text-text-secondary" suppressHydrationWarning>
                {now.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 relative">
            
            {/* Notification Dropdown */}
            <div className="relative">
              <button onClick={() => { setShowNotifs(!showNotifs); setShowProfile(false); }} className={`relative p-2 rounded-lg transition-colors ${showNotifs ? 'bg-surface' : 'hover:bg-surface'}`}>
                <Bell size={18} className={showNotifs ? 'text-text-primary' : 'text-text-secondary'} />
                <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full animate-pulse" />
              </button>

              <AnimatePresence>
                {showNotifs && (
                  <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute right-0 mt-2 w-80 bg-surface border border-border rounded-xl shadow-2xl overflow-hidden z-50">
                    <div className="p-4 border-b border-border bg-black/20 flex justify-between items-center">
                      <h3 className="font-bold text-sm text-text-primary">Notifications</h3>
                      <span className="text-[10px] bg-accent/20 text-accent px-2 py-0.5 rounded-full">2 New</span>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      <div className="p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors">
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0 text-success"><CheckCircle size={14} /></div>
                          <div>
                            <p className="text-sm font-medium text-text-primary">ATS Resume Scanned</p>
                            <p className="text-xs text-text-secondary mt-1">Your resume score improved by 15% after changes.</p>
                            <p className="text-[10px] text-text-secondary/50 mt-2">Just now</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 hover:bg-white/5 cursor-pointer transition-colors">
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 text-accent"><Mic size={14} /></div>
                          <div>
                            <p className="text-sm font-medium text-text-primary">Interview Scheduled</p>
                            <p className="text-xs text-text-secondary mt-1">Mock HR round is scheduled for tomorrow at 10 AM.</p>
                            <p className="text-[10px] text-text-secondary/50 mt-2">2 hrs ago</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile/Google Account Dropdown */}
            <div className="relative">
              <button onClick={() => { setShowProfile(!showProfile); setShowNotifs(false); }} className="w-9 h-9 rounded-full bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:scale-105 transition-transform">
                {currentUser.name.charAt(0)}
              </button>

              <AnimatePresence>
                {showProfile && (
                  <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute right-0 mt-2 w-64 bg-surface border border-border rounded-xl shadow-2xl overflow-hidden z-50">
                    <div className="p-4 border-b border-border bg-black/20">
                      <p className="text-sm font-bold text-text-primary">{currentUser.name}</p>
                      <p className="text-xs text-text-secondary mt-0.5">{currentUser.email}</p>
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] text-text-secondary">
                        <UserIcon size={10} /> Google Account Connected
                      </div>
                    </div>
                    <div className="p-2">
                      <div className="px-2 py-1.5 text-[10px] font-bold text-text-secondary uppercase tracking-widest">Certificate Vault</div>
                      <button onClick={triggerUpload} className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2">
                        <Upload size={14} className="text-accent" /> Upload Certificate
                      </button>
                      <button onClick={triggerDownload} className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2">
                        <Download size={14} className="text-success" /> Download Portfolio PDF
                      </button>
                    </div>
                    <div className="p-2 border-t border-border">
                      <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm text-danger hover:bg-danger/10 rounded-lg transition-colors flex items-center gap-2">
                        <LogOut size={14} /> Secure Logout
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DashboardShell>{children}</DashboardShell>
      </AuthProvider>
    </ThemeProvider>
  );
}
