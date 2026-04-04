"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { toast } from "sonner";

import LoginDialog from "@/app/(auth)/login-in/LoginDialog";
import { useLoginStore } from "@/app/store/useLoginStore";
import { useSignupStore } from "@/app/store/useSignupStore";
import { useWishlistStore } from "@/app/store/useWishlistStore";
import { Button } from "@/components/ui/button";

interface WishlistSidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function WishlistSidebar({ open, onClose }: WishlistSidebarProps) {
  const loginUser = useLoginStore((s) => s.user);
  const signupUser = useSignupStore((s) => s.user);
  const isAuthenticated = !!(loginUser || signupUser);

  const [loginOpen, setLoginOpen] = useState(false);

  const entries = useWishlistStore((s) => s.entries);
  const products = useWishlistStore((s) => s.products);
  const loading = useWishlistStore((s) => s.loading);
  const fetchEntries = useWishlistStore((s) => s.fetchEntries);
  const fetchProducts = useWishlistStore((s) => s.fetchProducts);
  const toggle = useWishlistStore((s) => s.toggle);

  useEffect(() => {
    if (!open || !isAuthenticated) return;

    (async () => {
      try {
        await fetchEntries();
        await fetchProducts();
      } catch {
        // ignore
      }
    })();
  }, [open, isAuthenticated, fetchEntries, fetchProducts]);

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-40 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />

            <motion.div
              className="fixed top-0 right-0 h-full w-full md:w-96 bg-white shadow-lg z-50 flex flex-col"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
            >
              <div className="flex justify-between items-center p-4 border-b">
                <h2 className="text-lg font-semibold">My Wishlist</h2>
                <button onClick={onClose} aria-label="Close wishlist">
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {!isAuthenticated ? (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-700">Please login to view your wishlist.</p>
                    <Button type="button" onClick={() => setLoginOpen(true)}>
                      Login
                    </Button>
                  </div>
                ) : loading ? (
                  <p className="text-sm text-gray-600">Loading wishlist...</p>
                ) : entries.length === 0 ? (
                  <p className="text-sm text-gray-600">Your wishlist is empty.</p>
                ) : (
                  <div className="space-y-3">
                    {products.map((p) => (
                      <div
                        key={p.productId}
                        className="flex items-center gap-3 rounded-lg border border-gray-200 p-3"
                      >
                        <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded bg-gray-50">
                          <Image
                            src={p.image || "/fallback.png"}
                            alt={p.title}
                            fill
                            className="object-contain"
                            sizes="56px"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-1">{p.title}</p>
                          <p className="text-xs text-gray-600">â‚¹{p.price}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          {p.categoryId && p.productSlug ? (
                            <Link
                              href={`/products/${p.categoryId}/${p.productSlug}`}
                              className="text-xs text-green-700 hover:underline"
                              onClick={onClose}
                            >
                              View
                            </Link>
                          ) : null}
                          <button
                            type="button"
                            className="text-xs text-red-600 hover:underline"
                            onClick={async () => {
                              const res = await toggle(p.productId);
                              if (!res) toast.error("Failed to update wishlist");
                              else toast.success("Removed from wishlist");
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
    </>
  );
}
