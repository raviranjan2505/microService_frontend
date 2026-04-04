"use client";

import Navbar from "../Navbar";
import Footer from "../Footer";
import { useEffect } from "react";
import useCart from "@/app/store/useCart";

function CommonLayout({ children }: { children: React.ReactNode }) {
  const { initCookieId, fetchCart, cartItems } = useCart();

  useEffect(() => {
    initCookieId();
    fetchCart();
  }, [initCookieId, fetchCart]);

  useEffect(() => {
    if (cartItems.length === 0) {
      return;
    }

    console.log("cookieId kept because cart has items");
  }, [cartItems]);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}

export default CommonLayout;
