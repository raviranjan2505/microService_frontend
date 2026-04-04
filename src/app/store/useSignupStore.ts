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

type SignupStore = {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;

  email: string;
  password: string;
  name: string;

  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  setName: (name: string) => void;
  setSuccessMessage: (msg: string | null) => void;
  setError: (msg: string | null) => void;

  signup: (payload: { email: string; password: string; name?: string }) => Promise<boolean>;
  logout: () => void;
};

export const useSignupStore = create<SignupStore>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      error: null,
      successMessage: null,

      email: "",
      password: "",
      name: "",

      setEmail: (email) => set({ email }),
      setPassword: (password) => set({ password }),
      setName: (name) => set({ name }),
      setSuccessMessage: (msg) => set({ successMessage: msg }),
      setError: (msg) => set({ error: msg }),

      signup: async ({ email, password, name }) => {
        if (!email?.trim() || !password) {
          set({ error: "Email and password are required" });
          return false;
        }

        set({ isLoading: true, error: null, successMessage: null });
        try {
          const response = await axiosInstance.post(`${API_ROUTES.AUTH}/register`, {
            email: email.trim(),
            password,
            username: name?.trim() || undefined,
          });

          const userId = response.data?.userId ?? null;

          set({
            user: userId
              ? {
                  id: String(userId),
                  name: name?.trim() || null,
                  email: email.trim(),
                  role: "USER",
                }
              : null,
            isLoading: false,
            successMessage: "Signup successful!",
            error: null,
            email: "",
            password: "",
            name: "",
          });

          return true;
        } catch (err: any) {
          set({
            isLoading: false,
            error: err?.response?.data?.message || err.message || "Signup failed",
          });
          return false;
        }
      },

      logout: () => {
        set({
          user: null,
          isLoading: false,
          successMessage: null,
          error: null,
          email: "",
          password: "",
          name: "",
        });
      },
    }),
    {
      name: "signup-storage",
      version: 2,
      partialize: (state) => ({ user: state.user }),
      migrate: (persistedState: any) => ({ user: persistedState?.user ?? null }),
    }
  )
);
