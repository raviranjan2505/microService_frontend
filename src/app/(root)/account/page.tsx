"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Bell, MapPin, Package } from "lucide-react";

import { useLoginStore } from "@/app/store/useLoginStore";
import { useSignupStore } from "@/app/store/useSignupStore";
import { getAddresses, getMyOrdersPage } from "@/lib/actions/action";
import { getMyUnreadNotificationCount } from "@/lib/actions/notifications";
import type { Address } from "@/lib/data";

export default function AccountPage() {
  const loginUser = useLoginStore((s) => s.user);
  const signupUser = useSignupStore((s) => s.user);
  const user = loginUser || signupUser;

  const [ordersCount, setOrdersCount] = useState<number | null>(null);
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [notificationCount, setNotificationCount] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const ordersPage = await getMyOrdersPage(1, 1);
        setOrdersCount(ordersPage?.total ?? 0);
      } catch {
        setOrdersCount(0);
      }

      try {
        const a = await getAddresses();
        setAddresses(a || []);
      } catch {
        setAddresses([]);
      }

      try {
        const unread = await getMyUnreadNotificationCount();
        setNotificationCount(unread);
      } catch {
        setNotificationCount(0);
      }
    })();
  }, []);

  const defaultAddress = useMemo(() => {
    if (!addresses?.length) return null;
    return addresses.find((a) => a.isDefault) || addresses[0] || null;
  }, [addresses]);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-xl font-semibold text-gray-800">Account</h2>
        <p className="mt-1 text-sm text-gray-600">
          {user?.email ? `Signed in as ${user.email}` : "Signed in"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Link
          href="/account/orders"
          className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4 transition hover:shadow-sm"
        >
          <Package className="mt-0.5 h-5 w-5 text-green-700" />
          <div>
            <p className="font-semibold text-gray-900">My Orders</p>
            <p className="text-sm text-gray-600">
              {ordersCount === null ? "Loading..." : `${ordersCount} order${ordersCount === 1 ? "" : "s"}`}
            </p>
          </div>
        </Link>

        <Link
          href="/account/addresses"
          className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4 transition hover:shadow-sm"
        >
          <MapPin className="mt-0.5 h-5 w-5 text-green-700" />
          <div>
            <p className="font-semibold text-gray-900">My Addresses</p>
            <p className="text-sm text-gray-600">
              {addresses === null ? "Loading..." : `${addresses.length} saved`}
            </p>
            {defaultAddress && (
              <p className="mt-1 line-clamp-1 text-xs text-gray-500">
                Default: {defaultAddress.address1 || defaultAddress.fullAddress || ""}
              </p>
            )}
          </div>
        </Link>

        <Link
          href="/account/notifications"
          className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4 transition hover:shadow-sm"
        >
          <Bell className="mt-0.5 h-5 w-5 text-green-700" />
          <div>
            <p className="font-semibold text-gray-900">Notifications</p>
            <p className="text-sm text-gray-600">
              {notificationCount === null
                ? "Loading..."
                : `${notificationCount} unread notification${notificationCount === 1 ? "" : "s"}`}
            </p>
          </div>
        </Link>
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <p className="text-sm text-gray-700">
          Tip: open an order to see shipping status and tracking number (if available).
        </p>
      </div>
    </div>
  );
}
