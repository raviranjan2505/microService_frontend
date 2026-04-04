"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { useLoginStore } from "@/app/store/useLoginStore"
import { useSignupStore } from "@/app/store/useSignupStore"
import { Bell, Package, Gift, MapPin, Shield } from "lucide-react";
import { useRouter } from "next/navigation"

export default function AccountMenu() {
  // ✅ Get user from either store
   const router = useRouter()
  const loginUser = useLoginStore((s) => s.user)
  const signupUser = useSignupStore((s) => s.user)
  const user = loginUser || signupUser

  // ✅ Logout clears both stores
  const loginLogout = useLoginStore((s) => s.logout)
  const signupLogout = useSignupStore((s) => s.logout)
  const logout = async () => {
    await loginLogout()
    await signupLogout()
    router.push("/") // ✅ redirect to home
  }

   const menuItems = [
    { href: "/account/addresses", icon: MapPin, label: "My Addresses" },
    { href: "/account/orders", icon: Package, label: "My Orders" },
    { href: "/account/notifications", icon: Bell, label: "Notifications" },
    { href: "/account/gift-cards", icon: Gift, label: "E-Gift Cards" },
    { href: "/account/privacy", icon: Shield, label: "Account Privacy" },
  ];
  

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost">
          {user?.name ? `Hi, ${user.name}` : "Account"}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64 p-2">
        <DropdownMenuLabel>
          <div className="font-semibold">My Account</div>
          <div className="text-sm text-gray-600">{user?.email || "Guest"}</div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {menuItems.map((item) => (
          
              <DropdownMenuItem asChild key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </DropdownMenuItem>
            ))}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="text-red-600 cursor-pointer"
          onClick={logout}
        >
          Log Out
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* QR Section */}
        <div className="flex flex-col items-center text-center px-2 py-3">
          <Image
            src="/qr-code.png"
            alt="QR Code"
            width={100}
            height={100}
          />
          <p className="text-xs font-medium mt-2">
            Simple way to get groceries in minutes
          </p>
          <p className="text-xs text-gray-500">
            Scan the QR code and download our app
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}





           
