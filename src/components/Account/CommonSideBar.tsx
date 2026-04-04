"use client";
import Link from "next/link";
import { Bell, Package, Gift, MapPin, LogOut, Shield } from "lucide-react";
import { usePathname } from "next/navigation";
import { useLoginStore } from "@/app/store/useLoginStore"
import { useSignupStore } from "@/app/store/useSignupStore"
import { useRouter } from "next/navigation"


export default function CommonSideBar() {
  const pathname = usePathname();
  // ✅ Logout clears both stores
  const loginLogout = useLoginStore((s) => s.logout)
  const signupLogout = useSignupStore((s) => s.logout)
  const router = useRouter()

  const menuItems = [
    { href: "/account/addresses", icon: MapPin, label: "My Addresses" },
    { href: "/account/orders", icon: Package, label: "My Orders" },
    { href: "/account/notifications", icon: Bell, label: "Notifications" },
    { href: "/account/gift-cards", icon: Gift, label: "E-Gift Cards" },
    { href: "/account/privacy", icon: Shield, label: "Account Privacy" },
  ];
  

  const isActive = (href: string) =>
    pathname === href || pathname?.startsWith(href);

  const logout = async () => {
    await loginLogout()
    await signupLogout()
    router.push("/") // ✅ redirect to home
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-800">My Account</h1>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                active
                  ? "bg-green-100 text-green-700 border-l-4 border-green-500"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Icon className="w-5 h-5 mr-3" />
              {item.label}
            </Link>
          );
        })}
        <div className="pt-8 mt-8 border-t border-gray-200">
           <button
          onClick={logout}
          className="flex items-center px-4 py-3 mt-4 text-red-600 hover:bg-red-50 rounded-lg transition-colors w-full font-medium"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </button>
        </div>
      </nav>
    </div>
  );
}
