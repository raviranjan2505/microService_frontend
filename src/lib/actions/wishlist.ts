"use client";

import axiosInstance from "@/lib/axiosInstance";

export type WishlistEntry = {
  id: number;
  userId: number;
  productId: number;
  createdAt: string;
};

export async function getWishlistEntries(): Promise<WishlistEntry[]> {
  const res = await axiosInstance.get("/v1/wishlist");
  if (!res.data?.success) return [];
  return Array.isArray(res.data?.data) ? (res.data.data as WishlistEntry[]) : [];
}

export async function addWishlistProduct(productId: number) {
  const res = await axiosInstance.post("/v1/wishlist", { productId });
  return res.data;
}

export async function removeWishlistProduct(productId: number) {
  const res = await axiosInstance.delete(`/v1/wishlist/${productId}`);
  return res.data;
}

export async function getProductByProductId(productId: number) {
  const res = await axiosInstance.get(`/v1/products/productId/${productId}`);
  return res.data;
}

