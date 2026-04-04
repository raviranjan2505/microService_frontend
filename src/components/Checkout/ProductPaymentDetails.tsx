"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";

import useAddressStore from "@/app/store/useAddressStore";
import useCart from "@/app/store/useCart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axiosInstance from "@/lib/axiosInstance";
import { handleCheckoutAPI } from "@/lib/actions/action";
import { openRazorpayCheckout } from "@/lib/payments/razorpay";
import type { CheckoutPaymentMethod } from "./PaymentMethod";

type OrderPaymentInfo = {
  orderId: string; // Razorpay order id
  amount: number; // paise
  currency: string;
  key: string; // Razorpay key_id (public)
  paymentId?: number;
};

type CheckoutPreview = {
  items: Array<{
    productId: number;
    quantity: number;
    price: number;
    name?: string;
    image?: string | null;
  }>;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  couponCode?: string | null;
};

export default function ProductPaymentDetails({ selectedPayment }: { selectedPayment: CheckoutPaymentMethod }) {
  const router = useRouter();
  const { selectedAddress } = useAddressStore();
  const { cartItems, total, fetchTotal, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [preview, setPreview] = useState<CheckoutPreview | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const subTotal =
    preview?.totalAmount ??
    total?.subTotal ??
    cartItems.reduce((sum, i) => sum + i.quantity * i.item.price, 0);

  const discount = preview?.discountAmount ?? total?.discount ?? 0;

  const totalPrice =
    preview?.finalAmount ??
    total?.payableAmt ??
    cartItems.reduce((sum, i) => sum + i.quantity * i.item.price, 0);

  useEffect(() => {
    fetchTotal();
  }, [fetchTotal]);

  const refreshPreview = async (couponCode?: string | null) => {
    const code = (couponCode ?? "").trim().toUpperCase();
    setCouponLoading(true);
    try {
      const res = await axiosInstance.post("/v1/checkout/preview", code ? { couponCode: code } : {});
      if (res.data?.success) {
        setPreview(res.data.data as CheckoutPreview);
        setAppliedCoupon(code || null);
        if (code) toast.success("Coupon applied");
      } else {
        setPreview(null);
        setAppliedCoupon(null);
        toast.error(res.data?.message || "Coupon validation failed");
      }
    } catch (e: any) {
      setPreview(null);
      setAppliedCoupon(null);
      toast.error(e?.response?.data?.message || e?.message || "Coupon validation failed");
    } finally {
      setCouponLoading(false);
    }
  };

  const finalizeOrderUI = async () => {
    const orderSummary = { items: cartItems, totalPrice };
    localStorage.setItem("justPlacedOrderItems", JSON.stringify(orderSummary));
    localStorage.setItem("justPlacedOrder", "true");

    await clearCart();
    toast.success("Order placed successfully");
    router.push("/checkout/order-summary");
  };

  const handlePayNow = async () => {
    if (!selectedAddress) return toast.error("Please select a delivery address");
    if (!selectedAddress.id) return toast.error("Please re-select your address");
    if (cartItems.length === 0) return toast.error("Your cart is empty");

    let createdOrderId: number | null = null;

    setLoading(true);
    try {
      const checkoutRes = await handleCheckoutAPI(
        selectedAddress.id,
        selectedPayment === "cash" ? "COD" : "ONLINE",
        appliedCoupon
      );
      if (!checkoutRes?.success) {
        toast.error(checkoutRes?.message || "Checkout failed. Try again.");
        return;
      }

      const order = checkoutRes.data as any;
      createdOrderId = typeof order?.id === "number" ? order.id : null;

      if (selectedPayment === "cash") {
        await finalizeOrderUI();
        return;
      }

      const payment = (order?.payment ?? null) as OrderPaymentInfo | null;
      if (!payment?.orderId || !payment?.key) throw new Error("Payment order not created");

      const razorpayResponse = await openRazorpayCheckout({
        razorpayKey: payment.key,
        razorpayOrderId: payment.orderId,
        amountPaise: Number(payment.amount),
        currency: String(payment.currency || "INR"),
        name: "Blinkit",
        description: "Order payment",
        prefill: {
          name: selectedAddress.fullName || selectedAddress.name || "",
          contact: selectedAddress.mobile || selectedAddress.phone || "",
        },
        notes: { payment_method: selectedPayment, order_id: String(createdOrderId || "") },
      });

      if (!createdOrderId) throw new Error("Order id missing");

      const confirmRes = await axiosInstance.post("/v1/order/confirm-payment", {
        orderId: createdOrderId,
        razorpay_order_id: razorpayResponse.razorpay_order_id,
        razorpay_payment_id: razorpayResponse.razorpay_payment_id,
        razorpay_signature: razorpayResponse.razorpay_signature,
      });

      if (!confirmRes.data?.success) {
        throw new Error(confirmRes.data?.message || "Payment confirmation failed");
      }

      await finalizeOrderUI();
    } catch (e: any) {
      if (createdOrderId) {
        try {
          await axiosInstance.post(`/v1/order/${createdOrderId}/cancel`, {});
        } catch {
          // ignore cancel errors
        }
      }

      toast.error(e?.message || "Payment failed. Please try again.");
      router.push("/checkout/payment-failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-lg shadow p-4">
      <h2 className="text-lg font-semibold mb-2">Delivery Address</h2>
      {selectedAddress ? (
        <div className="text-sm text-gray-600 mb-4">
          <p className="text-sm font-medium">
            Deliver to: {selectedAddress.addressType} {selectedAddress.isDefault && "(Default)"}
          </p>
          <p className="text-xs text-gray-600">
            {selectedAddress.fullAddress}, {selectedAddress.locality}, {selectedAddress.city}
          </p>
          <p className="text-xs text-gray-500">Mobile: {selectedAddress.mobile}</p>
        </div>
      ) : (
        <p className="text-sm text-red-500 mb-4">No address selected</p>
      )}

      <div className="mt-4 border-t pt-4">
        <h3 className="text-md font-semibold mb-2">My Cart</h3>
        {cartItems.map(({ item, quantity }) => (
          <div key={item.id} className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {item.img ? (
                <Image
                  src={item.img}
                  alt={item.title}
                  width={48}
                  height={48}
                  className="w-12 h-12 object-cover rounded"
                />
              ) : (
                <div className="w-12 h-12 rounded bg-gray-100" />
              )}
              <span className="text-sm">
                {item.title} x {quantity}
              </span>
            </div>
            <span className="text-sm font-medium">₹{item.price * quantity}</span>
          </div>
        ))}

        <div className="mt-4 border-t pt-2 space-y-1 text-sm">
          <div className="pt-2">
            <p className="text-sm font-semibold mb-2">Coupon</p>
            <div className="flex gap-2">
              <Input
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                placeholder="Enter coupon code"
                disabled={couponLoading || loading}
              />
              {appliedCoupon ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={couponLoading || loading}
                  onClick={() => {
                    setCouponInput("");
                    refreshPreview(null);
                  }}
                >
                  Remove
                </Button>
              ) : (
                <Button
                  type="button"
                  disabled={couponLoading || loading}
                  onClick={() => refreshPreview(couponInput)}
                >
                  {couponLoading ? "Applying..." : "Apply"}
                </Button>
              )}
            </div>
            {appliedCoupon && (
              <p className="text-xs text-green-700 mt-1">Applied: {appliedCoupon}</p>
            )}
          </div>

          <div className="flex justify-between">
            <span>SubTotal:</span>
            <span>₹{subTotal ?? 0}</span>
          </div>
          <div className="flex justify-between">
            <span>Discount:</span>
            <span>₹{discount ?? 0}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax:</span>
            <span>₹{total?.tax ?? 0}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping:</span>
            <span>₹{total?.shipping ?? 0}</span>
          </div>
          <div className="flex justify-between font-semibold border-t pt-2">
            <span>Payable Amount:</span>
            <span>₹{totalPrice}</span>
          </div>
        </div>
      </div>

      <Button
        className="w-full mt-4"
        disabled={cartItems.length === 0 || !selectedAddress || loading}
        onClick={handlePayNow}
      >
        {loading ? "Processing..." : selectedPayment === "cash" ? "Place Order" : "Pay Now"}
      </Button>
    </div>
  );
}
