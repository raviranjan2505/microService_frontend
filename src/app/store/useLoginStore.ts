"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import axiosInstance from "@/lib/axiosInstance";
import { API_ROUTES } from "@/utils/api";

type User = {
  id: string;
  name: string | null;
  email: string | null;
  role: "USER" | "SUPER_ADMIN" | null;
};

type LoginStore = {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;

  email: string;
  password: string;

  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  setSuccessMessage: (msg: string | null) => void;

  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
};

export const useLoginStore = create<LoginStore>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      error: null,
      successMessage: null,
      email: "",
      password: "",

      setEmail: (email) => set({ email }),
      setPassword: (password) => set({ password }),
      setSuccessMessage: (msg) => set({ successMessage: msg }),

      login: async (email, password) => {
        if (!email?.trim() || !password) {
          set({ error: "Email and password are required" });
          return false;
        }
        set({ isLoading: true, error: null, successMessage: null });
        try {
          const res = await axiosInstance.post(`${API_ROUTES.AUTH}/login`, {
            email: email.trim(),
            password,
          });

          const userId = res.data?.userId ?? null;
          const role = res.data?.Role ?? null;

          set({
            user: userId
              ? {
                  id: String(userId),
                  name: null,
                  email: email.trim(),
                  role,
                }
              : null,
            isLoading: false,
            successMessage: "Login successful!",
            email: "",
            password: "",
          });

          return true;
        } catch (err: any) {
          set({ isLoading: false, error: err.response?.data?.message || "Login failed" });
          return false;
        }
      },

      logout: async () => {
        try {
          await axiosInstance.post(`${API_ROUTES.AUTH}/logout`, {});
        } catch (err) {
          console.error("Logout failed", err);
        } finally {
          if (typeof window !== "undefined") {
            localStorage.removeItem("address-storage");
          }
          set({
            user: null,
            successMessage: null,
            error: null,
            email: "",
            password: "",
          });
        }
      },
    }),
    {
      name: "login-storage",
      version: 2,
      partialize: (state) => ({ user: state.user }),
      migrate: (persistedState: any) => ({ user: persistedState?.user ?? null }),
    }
  )
);
