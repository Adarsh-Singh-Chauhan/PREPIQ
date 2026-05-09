"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Settings, User, Target, Camera, Bell, Palette, Trash2, Save,
  Moon, Sun, Zap, AlertTriangle,
} from "lucide-react";
import { DEMO_USER } from "@/lib/demo-data";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/auth-context";
import { upsertUserProfile, getUserProfile } from "@/lib/supabase-db";

export default function SettingsPage() {
  const { user, updateUser } = useAuth() as any;
  const currentUser = user || DEMO_USER;
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [deleteModal, setDeleteModal] = useState(false);
  const [profile, setProfile] = useState({
    name: currentUser.name || "",
    email: currentUser.email || "",
    college: currentUser.college || "",
    branch: currentUser.branch || "",
    year: currentUser.year || "",
    city: currentUser.city || "",
    career_goal: currentUser.career_goal || "",
    target_company_type: currentUser.target_company_type || "",
    placement_timeline: currentUser.placement_timeline || "",
  });

  useEffect(() => {
    // Sync profile state when user changes (e.g. after onboarding)
    if (user) {
      setProfile({
        name: user.name || "",
        email: user.email || "",
        college: user.college || "",
        branch: user.branch || "",
        year: user.year || "",
        city: user.city || "",
        career_goal: user.career_goal || "",
        target_company_type: user.target_company_type || "",
        placement_timeline: user.placement_timeline || "",
      });
    }

    // Also try to fetch from Supabase for any additional data
    async function loadProfile() {
      if (currentUser?.email) {
        const res = await getUserProfile(currentUser.email);
        if (res.success && res.data) {
          setProfile(prev => ({
            name: prev.name || res.data.name || "",
            email: prev.email || res.data.email || "",
            college: prev.college || res.data.college || "",
            branch: prev.branch || res.data.branch || "",
            year: prev.year || res.data.year || "",
            city: prev.city || res.data.city || "",
            career_goal: prev.career_goal || res.data.career_goal || "",
            target_company_type: prev.target_company_type || res.data.target_company_type || "",
            placement_timeline: prev.placement_timeline || res.data.placement_timeline || "",
          }));
        }
      }
    }
    loadProfile();
  }, [user, currentUser?.email]);

  const changeTheme = (t: string) => {
    setTheme(t as any);
    document.documentElement.classList.remove("light", "dark", "ocean", "cyberpunk");
    if (t !== "dark") document.documentElement.classList.add(t);
    localStorage.setItem("prepiq-theme", t);
    toast.success(`Switched to ${t} theme`);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
        <Settings className="text-accent" size={20} />Settings
      </h2>

      {/* Profile */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card-static p-6">
        <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
          <User size={16} className="text-accent" />Profile
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { key: "name", label: "Full Name" },
            { key: "email", label: "Email" },
            { key: "college", label: "College" },
            { key: "branch", label: "Branch" },
            { key: "year", label: "Year" },
            { key: "city", label: "City" },
          ].map((f) => (
            <div key={f.key}>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">{f.label}</label>
              <input
                className="input"
                value={profile[f.key as keyof typeof profile]}
                onChange={(e) => setProfile({ ...profile, [f.key]: e.target.value })}
              />
            </div>
          ))}
        </div>
        <button onClick={() => {
          // Save to Supabase
          upsertUserProfile({
            user_name: profile.name,
            email: profile.email,
            college: profile.college,
            branch: profile.branch,
            year: profile.year,
            city: profile.city,
            career_goal: profile.career_goal,
            target_company_type: profile.target_company_type,
            placement_timeline: profile.placement_timeline,
          });
          // Update the auth session so all pages see the new data
          updateUser({
            name: profile.name,
            college: profile.college,
            branch: profile.branch,
            year: profile.year,
            city: profile.city,
            career_goal: profile.career_goal,
            target_company_type: profile.target_company_type,
            placement_timeline: profile.placement_timeline,
          });
          toast.success("Profile saved!");
        }} className="btn-primary mt-4">
          <Save size={14} />Save Profile
        </button>
      </motion.div>

      {/* Career Objective */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card-static p-6">
        <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Target size={16} className="text-accent" />Career Objective
        </h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Goal</label>
            <select className="input" value={profile.career_goal} onChange={(e) => setProfile({ ...profile, career_goal: e.target.value })}>
              <option>Software Engineer</option><option>Data Scientist</option><option>Product Manager</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Company Type</label>
            <select className="input" value={profile.target_company_type} onChange={(e) => setProfile({ ...profile, target_company_type: e.target.value })}>
              <option>MNC</option><option>FAANG</option><option>Startup</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Timeline</label>
            <select className="input" value={profile.placement_timeline} onChange={(e) => setProfile({ ...profile, placement_timeline: e.target.value })}>
              <option>3 months</option><option>6 months</option><option>1 year</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Face Data */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card-static p-6">
        <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Camera size={16} className="text-accent" />Face Data
        </h3>
        <p className="text-sm text-text-secondary mb-4">Your face embedding is stored securely. Re-capture if needed.</p>
        <button onClick={() => toast.success("Camera opening...")} className="btn-outline text-sm">
          <Camera size={14} />Re-capture Face
        </button>
      </motion.div>

      {/* Notifications */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card-static p-6">
        <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Bell size={16} className="text-accent" />Notifications
        </h3>
        <div className="space-y-3">
          {["Daily practice reminder", "Weekly progress report", "New internship matches"].map((n) => (
            <div key={n} className="flex items-center justify-between">
              <span className="text-sm text-text-primary">{n}</span>
              <label className="relative inline-flex items-center cursor-pointer w-9 h-5">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="absolute inset-0 bg-surface rounded-full peer-checked:bg-accent transition-colors border border-border" />
                <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-text-secondary peer-checked:bg-white peer-checked:translate-x-4 transition-all" />
              </label>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Theme */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="card-static p-6">
        <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Palette size={16} className="text-accent" />Theme Preference
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { id: "dark", label: "Dark", icon: Moon },
            { id: "light", label: "Light", icon: Sun },
            { id: "ocean", label: "Ocean", icon: Palette },
            { id: "cyberpunk", label: "Cyberpunk", icon: Zap },
          ].map((t) => (
            <button key={t.id} onClick={() => changeTheme(t.id)}
              className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all ${
                theme === t.id ? "border-accent bg-accent/10 text-accent" : "border-border text-text-secondary hover:border-text-secondary/50"
              }`}>
              <t.icon size={20} />
              <span className="text-sm font-medium">{t.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Danger Zone */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="card-static p-6 border-danger/20">
        <h3 className="text-sm font-semibold text-danger mb-2 flex items-center gap-2">
          <AlertTriangle size={16} />Danger Zone
        </h3>
        <p className="text-xs text-text-secondary mb-4">This action is irreversible. All your data will be permanently deleted.</p>
        <button onClick={() => setDeleteModal(true)} className="btn-danger text-sm">
          <Trash2 size={14} />Delete Account
        </button>
      </motion.div>

      {/* Delete Modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card-static w-full max-w-sm p-6 text-center">
            <AlertTriangle className="text-danger mx-auto mb-4" size={32} />
            <h3 className="text-lg font-bold text-text-primary mb-2">Delete Account?</h3>
            <p className="text-sm text-text-secondary mb-6">All your data, sessions, and progress will be permanently deleted.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteModal(false)} className="btn-outline flex-1">Cancel</button>
              <button onClick={() => { setDeleteModal(false); toast.error("Account deleted."); }} className="btn-danger flex-1">Delete</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
