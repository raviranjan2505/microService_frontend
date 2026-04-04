"use client";

import { useEffect } from "react";
import { Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import useCart from "@/app/store/useCart";
import type { Address } from "@/lib/data";
import { useRouter } from "next/navigation";

interface CartViewProps {
  isAuthenticated: boolean;
  onLoginRequired: () => void;
  onProceed: () => void;
  selectedAddress: Address | null;
  onChangeAddress: () => void;
}

export default function CartView({
  isAuthenticated,
  onLoginRequired,
  onProceed,
  selectedAddress,
  onChangeAddress,
}: CartViewProps) {
  const {
    cartItems,
    increaseQuantity,
    decreaseQuantity,
    removeItem,
    initCookieId,
    fetchCart,
    total,
    loading,
    fetchTotal,
  } = useCart();

  const router = useRouter();

  useEffect(() => {
    const loadCart = async () => {
      initCookieId();
      await fetchCart();
      await fetchTotal();
    };
    loadCart();
  }, [initCookieId, fetchCart, fetchTotal]);

  const handleCheckout = () => {
    if (!isAuthenticated) onLoginRequired();
    else if (!selectedAddress) onProceed();
    else router.push("/checkout");
  };

  return (
    <div>
      {cartItems.length === 0 ? (
        <p className="text-sm text-gray-500">Your cart is empty</p>
      ) : (
        <>
          {cartItems.map(({ item, quantity }) => (
            <div key={`cart-item-${item.id}`} className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <img src={item.img} alt={item.title} className="w-12 h-12 object-cover rounded" />
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-gray-500">â‚¹{item.price}</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <div className="flex items-center gap-2 border border-green-600 rounded-md px-2 py-1">
                  <button
                    className="text-green-600 font-bold"
                    onClick={() => decreaseQuantity(item.id)}
                    disabled={loading}
                  >
                    âˆ’
                  </button>
                  <span>{quantity}</span>
                  <button
                    className="text-green-600 font-bold"
                    onClick={() => increaseQuantity(item.id)}
                    disabled={loading}
                  >
                    +
                  </button>
                </div>
                <button
                  className="text-red-500 ml-2"
                  onClick={() => removeItem(item.id)}
                  disabled={loading}
                >
                  <Trash />
                </button>
              </div>
            </div>
          ))}

          <div className="border-t pt-4 mt-4 space-y-1 text-sm">
            <div className="flex justify-between">
              <span>SubTotal:</span>
              <span>â‚¹{total?.subTotal ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Discount:</span>
              <span>â‚¹{total?.discount ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax:</span>
              <span>â‚¹{total?.tax ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping:</span>
              <span>â‚¹{total?.shipping ?? 0}</span>
            </div>
            <div className="flex justify-between font-semibold border-t pt-2">
              <span>Payable Amount:</span>
              <span>â‚¹{total?.payableAmt ?? 0}</span>
            </div>
          </div>

          {selectedAddress && (
            <div
              className="border p-3 rounded mb-3 bg-green-50 cursor-pointer mt-2"
              onClick={onChangeAddress}
            >
              <p className="text-sm font-medium">
                Deliver to: {selectedAddress.addressType} {selectedAddress.isDefault && "(Default)"}
              </p>
              <p className="text-xs text-gray-600">
                {selectedAddress.fullAddress}, {selectedAddress.locality}, {selectedAddress.city}
              </p>
              <p className="text-xs text-gray-500">Mobile: {selectedAddress.mobile}</p>
              <p className="text-xs text-gray-500 text-right text-blue-600 underline">Change</p>
            </div>
          )}

          <Button
            className="w-full bg-green-600 text-white disabled:opacity-50 mt-2"
            onClick={handleCheckout}
            disabled={cartItems.length === 0 || loading}
          >
            {isAuthenticated ? (selectedAddress ? "Proceed to Payment" : "Proceed") : "Login to Continue"}
          </Button>
        </>
      )}
    </div>
  );
}
