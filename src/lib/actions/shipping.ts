"use client";

import axiosInstance from "@/lib/axiosInstance";

export type Shipment = {
  id: number;
  orderId: number;
  userId: number;
  status: string;
  courier: string;
  trackingNumber?: string | null;
  estimatedDelivery?: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function getShipmentByOrderId(orderId: number | string): Promise<Shipment | null> {
  try {
    const res = await axiosInstance.get(`/v1/shipping/order/${encodeURIComponent(String(orderId))}`);
    if (!res.data?.success) return null;
    return (res.data.data as Shipment) ?? null;
  } catch (err: unknown) {
    const maybeAxios = err as { response?: { status?: number } };
    if (maybeAxios?.response?.status === 404) return null;
    return null;
  }
}

