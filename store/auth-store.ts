"use client";

import { create } from "zustand";

import { authClient } from "@/lib/auth-client";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";
type AuthSession = typeof authClient.$Infer.Session | null;

type AuthStore = {
  session: AuthSession;
  status: AuthStatus;
  setLoading: () => void;
  syncSession: (session: AuthSession) => void;
  reset: () => void;
};

export const useAuthStore = create<AuthStore>((set) => ({
  session: null,
  status: "loading",
  setLoading: () => set({ status: "loading" }),
  syncSession: (session) =>
    set({
      session,
      status: session ? "authenticated" : "unauthenticated",
    }),
  reset: () => set({ session: null, status: "unauthenticated" }),
}));
