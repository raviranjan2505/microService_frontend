"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Bell, Heart, ShoppingCart, User } from "lucide-react"
import useCart from "@/app/store/useCart"
import CartSidebar from "@/app/(root)/cart/CartSidebar"
import WishlistSidebar from "@/app/(root)/wishlist/WishlistSidebar"
import LoginDialog from "@/app/(auth)/login-in/LoginDialog"
import SignUpDialog from "@/app/(auth)/sign-up/SignUpDialog"
import AccountMenu from "@/app/(auth)/account/AccountMenu"
import AccountMenuMobile from "@/app/(auth)/account/AccountMenuMobile"
import Link from "next/link"
import clsx from "clsx"
import AnimatedSearchInput from "./AnimatedSearchInput"
import HeaderLocation from "./HeaderLocation"
import { useLoginStore } from "@/app/store/useLoginStore"
import { useSignupStore } from "@/app/store/useSignupStore"
import { useWishlistStore } from "@/app/store/useWishlistStore"
import { getMyUnreadNotificationCount } from "@/lib/actions/notifications"

export default function Navbar() {
  const [cartOpen, setCartOpen] = useState(false)
  const [wishlistOpen, setWishlistOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [signUpOpen, setSignUpOpen] = useState(false)

  const { cartItems } = useCart()
  const totalQty = cartItems.reduce((sum, i) => sum + i.quantity, 0)
  const totalPrice = cartItems.reduce((sum, i) => sum + i.quantity * i.item.price, 0)

  const loginUser = useLoginStore((s) => s.user)
  const signupUser = useSignupStore((s) => s.user)
  const user = loginUser || signupUser
  const isAuthenticated = !!user

  const wishlistCount = useWishlistStore((s) => s.entries.length)
  const fetchWishlistEntries = useWishlistStore((s) => s.fetchEntries)
  const clearWishlist = useWishlistStore((s) => s.clear)
  const [notificationCount, setNotificationCount] = useState(0)

  useEffect(() => {
    if (user) {
      setLoginOpen(false)
      setSignUpOpen(false)
    }
  }, [user])

  useEffect(() => {
    if (isAuthenticated) {
      fetchWishlistEntries()
    } else {
      clearWishlist()
      setNotificationCount(0)
    }
  }, [isAuthenticated, fetchWishlistEntries, clearWishlist])

  useEffect(() => {
    if (!isAuthenticated) return

    let cancelled = false

    const loadNotificationCount = async () => {
      const count = await getMyUnreadNotificationCount()
      if (!cancelled) {
        setNotificationCount(count)
      }
    }

    void loadNotificationCount()
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        void loadNotificationCount()
      }
    }, 20000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [isAuthenticated])

  return (
    <header className="border-b shadow-sm sticky top-0 bg-white z-50">
      <div className="flex items-center justify-between px-4 py-3 md:px-6">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-2xl font-bold text-green-600 hidden md:block">
            NexusGrocery
          </Link>
          <HeaderLocation />
        </div>

        <div className="hidden md:flex items-center gap-4">
          <AnimatedSearchInput />

          {isAuthenticated ? (
            <AccountMenu />
          ) : (
            <>
              <Button variant="ghost" onClick={() => setLoginOpen(true)}>Login</Button>
              <Button variant="ghost" onClick={() => setSignUpOpen(true)}>SignUp</Button>
            </>
          )}

          {isAuthenticated && (
            <Link
              href="/account/notifications"
              className="relative rounded-md border border-gray-200 p-2 hover:bg-gray-50"
              aria-label="Open notifications"
            >
              <Bell className="h-5 w-5 text-gray-700" />
              {notificationCount > 0 && (
                <span className="absolute -top-2 -right-2 min-w-5 h-5 px-1 rounded-full bg-green-600 text-white text-[10px] flex items-center justify-center">
                  {notificationCount > 99 ? "99+" : notificationCount}
                </span>
              )}
            </Link>
          )}

          <button
            type="button"
            className="relative rounded-md border border-gray-200 p-2 hover:bg-gray-50"
            onClick={() => setWishlistOpen(true)}
            aria-label="Open wishlist"
          >
            <Heart className="h-5 w-5 text-gray-700" />
            {isAuthenticated && wishlistCount > 0 && (
              <span className="absolute -top-2 -right-2 min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-[10px] flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </button>

          <button
            className={clsx(
              "bg-green-600 text-white hover:bg-green-800 transition-colors duration-300 px-2 rounded-md font-bold text-[14px] flex items-center gap-1",
              totalQty === 0 && "py-2"
            )}
            onClick={() => setCartOpen(true)}
          >
            <ShoppingCart />
            <div>
              <div>{totalQty === 0 ? "My Cart" : `${totalQty} items`}</div>
              <div>{totalQty !== 0 && `â‚¹ ${totalPrice}`}</div>
            </div>
          </button>
        </div>

        <div className="md:hidden flex items-center gap-2">
          {isAuthenticated && (
            <Link
              href="/account/notifications"
              className="relative rounded-md border border-gray-200 p-2 hover:bg-gray-50"
              aria-label="Open notifications"
            >
              <Bell className="h-5 w-5 text-gray-700" />
              {notificationCount > 0 && (
                <span className="absolute -top-2 -right-2 min-w-5 h-5 px-1 rounded-full bg-green-600 text-white text-[10px] flex items-center justify-center">
                  {notificationCount > 99 ? "99+" : notificationCount}
                </span>
              )}
            </Link>
          )}

          <button
            type="button"
            className="relative rounded-md border border-gray-200 p-2 hover:bg-gray-50"
            onClick={() => setWishlistOpen(true)}
            aria-label="Open wishlist"
          >
            <Heart className="h-5 w-5 text-gray-700" />
            {isAuthenticated && wishlistCount > 0 && (
              <span className="absolute -top-2 -right-2 min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-[10px] flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </button>

          {isAuthenticated ? (
            <AccountMenuMobile />
          ) : (
            <Button variant="ghost" onClick={() => setLoginOpen(true)}>
              <User className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      <div className="px-4 pb-3 md:hidden">
        <AnimatedSearchInput />
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-green-600 text-white px-4 py-3 flex items-center justify-between md:hidden z-50">
        <div>
          <p className="font-semibold">
            {totalQty === 0 ? "My Cart" : `${totalQty} item${totalQty > 1 ? "s" : ""}`}
          </p>
          {totalQty !== 0 && <p className="text-sm">â‚¹ {totalPrice}</p>}
        </div>
        <button
          onClick={() => setCartOpen(true)}
          className="bg-white text-green-600 font-bold px-4 py-2 rounded-lg"
        >
          {totalQty === 0 ? "Start Shopping" : "View Cart"}
        </button>
      </div>

      <CartSidebar open={cartOpen} onClose={() => setCartOpen(false)} />
      <WishlistSidebar open={wishlistOpen} onClose={() => setWishlistOpen(false)} />
      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
      <SignUpDialog open={signUpOpen} onOpenChange={setSignUpOpen} />
    </header>
  )
}
