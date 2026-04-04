"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Checkout from "@/components/Checkout/Checkout";
import useCart from "@/app/store/useCart";
import { useLoginStore } from "@/app/store/useLoginStore";
import { useSignupStore } from "@/app/store/useSignupStore";

export default function CheckOutPage() {
  const router = useRouter();
  const { cartItems, loading, fetchCart } = useCart();
  const loginUser = useLoginStore((s) => s.user);
  const signupUser = useSignupStore((s) => s.user);
  const isAuthenticated = !!(loginUser || signupUser);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    fetchCart();
    setHydrated(true);
  }, [fetchCart]);

  useEffect(() => {
    if (!hydrated) return;

    if (!isAuthenticated) {
      router.replace("/login-in");
      return;
    }

    const justPlacedOrder = localStorage.getItem("justPlacedOrder") === "true";
    if (justPlacedOrder) {
      router.replace("/checkout/order-summary");
      return;
    }

    if (!loading && cartItems.length === 0) {
      router.replace("/");
    }
  }, [hydrated, isAuthenticated, cartItems, loading, router]);

  if (!hydrated || loading) {
    return <p className="text-center mt-10">Checking authentication...</p>;
  }

  return <Checkout />;
}
