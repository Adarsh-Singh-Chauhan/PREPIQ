"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { DEMO_USER } from "./demo-data";
import { insertLoginActivity } from "./supabase-db";

interface User {
  id: string;
  name: string;
  email: string;
  college: string;
  branch: string;
  year: string;
  city: string;
  career_goal: string;
  target_company_type: string;
  placement_timeline: string;
  avatar: string | null;
  streak: number;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  isDemo: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginDemo: () => void;
  signup: (data: Partial<User> & { password: string }) => Promise<void>;
  logout: () => Promise<void>;
  googleLoginLocal: (email: string) => Promise<void>;
  faceLoginLocal: (faceId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isDemo: false,
  login: async () => {},
  loginDemo: () => {},
  signup: async () => {},
  logout: async () => {},
  googleLoginLocal: async () => {},
  faceLoginLocal: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    // Check URL for simulated Google login redirect
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (url.searchParams.get("google_login") === "success") {
        // Automatically create/login to a simulated Google account
        const email = "google_user_" + Math.random().toString(36).substring(2, 8) + "@gmail.com";
        googleLoginLocal(email).then(() => {
          // Clean up the URL
          window.history.replaceState({}, document.title, window.location.pathname);
        });
        return; // Don't check local storage if we just logged in
      }
    }

    // Check local storage for session
    const storedUser = localStorage.getItem("prepiq_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsDemo(localStorage.getItem("prepiq_isDemo") === "true");
    }
  }, []);

  const saveSession = (u: User, demo: boolean = false) => {
    setUser(u);
    setIsDemo(demo);
    localStorage.setItem("prepiq_user", JSON.stringify(u));
    localStorage.setItem("prepiq_isDemo", demo.toString());
  };

  const getLocalUsers = () => {
    const users = localStorage.getItem("prepiq_users_db");
    return users ? JSON.parse(users) : [];
  };

  const saveLocalUsers = (users: any[]) => {
    localStorage.setItem("prepiq_users_db", JSON.stringify(users));
  };

  const login = async (email: string, password: string) => {
    const users = getLocalUsers();
    const found = users.find((u: any) => u.email === email && u.password === password);
    if (!found) throw new Error("Invalid credentials");
    saveSession(found);
    // Log to Supabase
    insertLoginActivity({ user_name: found.name, user_email: found.email, login_status: 'success' });
  };

  const loginDemo = () => {
    saveSession(DEMO_USER, true);
  };

  const signup = async (data: Partial<User> & { password: string }) => {
    const users = getLocalUsers();
    if (users.find((u: any) => u.email === data.email)) {
      throw new Error("User already exists");
    }
    const newUser = {
      ...DEMO_USER,
      id: "usr_" + Math.random().toString(36).substring(2, 9),
      name: data.name || "User",
      email: data.email!,
      password: data.password, // storing password locally for simulation
      created_at: new Date().toISOString(),
      streak: 0,
      interviewsDone: 0,
      roadmapProgress: 0,
      averageScore: 0,
    };
    users.push(newUser);
    saveLocalUsers(users);
    saveSession(newUser);
    // Log signup to Supabase
    insertLoginActivity({ user_name: newUser.name, user_email: newUser.email!, login_status: 'signup' });
  };

  const googleLoginLocal = async (email: string) => {
    const users = getLocalUsers();
    let found = users.find((u: any) => u.email === email);
    if (!found) {
      found = {
        ...DEMO_USER,
        id: "usr_" + Math.random().toString(36).substring(2, 9),
        name: email.split("@")[0],
        email: email,
        created_at: new Date().toISOString(),
        streak: 0,
        interviewsDone: 0,
        roadmapProgress: 0,
        averageScore: 0,
      };
      users.push(found);
      saveLocalUsers(users);
    }
    saveSession(found);
    // Log Google login to Supabase
    insertLoginActivity({ user_name: found.name, user_email: found.email, login_status: 'google_login' });
  };

  const faceLoginLocal = async (faceId: string) => {
    const users = getLocalUsers();
    let found = users.find((u: any) => u.faceId === faceId);
    if (!found) {
      found = {
        ...DEMO_USER,
        id: "usr_" + Math.random().toString(36).substring(2, 9),
        name: "Face User " + faceId.substring(0, 4),
        email: `face_${faceId}@example.com`,
        faceId: faceId,
        created_at: new Date().toISOString(),
        streak: 0,
        interviewsDone: 0,
        roadmapProgress: 0,
        averageScore: 0,
      };
      users.push(found);
      saveLocalUsers(users);
    }
    saveSession(found);
    // Log face login to Supabase
    insertLoginActivity({ user_name: found.name, user_email: found.email, login_status: 'face_login' });
  };

  const logout = async () => {
    setUser(null);
    setIsDemo(false);
    localStorage.removeItem("prepiq_user");
    localStorage.removeItem("prepiq_isDemo");
  };

  return (
    <AuthContext.Provider value={{ user, isDemo, login, loginDemo, signup, logout, googleLoginLocal, faceLoginLocal }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
