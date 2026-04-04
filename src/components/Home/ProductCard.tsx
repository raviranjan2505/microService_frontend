"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import useCart from "@/app/store/useCart"
import { Heart } from "lucide-react"
import { toast } from "sonner"
import { useWishlistStore } from "@/app/store/useWishlistStore"
import { useLoginStore } from "@/app/store/useLoginStore"
import { useSignupStore } from "@/app/store/useSignupStore"

export interface UIProductCard {
  id: string
  categoryId: string
  title: string
  subtitle: string
  price: number
  slag: string
  img: string
  deliveryTime?: string
}

interface ProductCardProps {
  product: UIProductCard
}

export default function ProductCard({ product }: ProductCardProps) {
  const { cartItems, addItem, increaseQuantity, decreaseQuantity } = useCart()
  const inCart = cartItems.find((c) => c.item.id === product.id)
  const qty = inCart?.quantity || 0

  const loginUser = useLoginStore((s) => s.user)
  const signupUser = useSignupStore((s) => s.user)
  const isAuthenticated = !!(loginUser || signupUser)

  const wishlistToggle = useWishlistStore((s) => s.toggle)
  const isWishlisted = useWishlistStore((s) => s.isWishlisted)
  const wishlistSyncing = useWishlistStore((s) => s.syncing)
  const wished = isWishlisted(product.id)

  return (
    <div className="relative bg-white rounded-2xl shadow-md p-3 hover:shadow-lg transition duration-200 h-full flex flex-col justify-between border border-gray-300">
      <button
        type="button"
        aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
        disabled={wishlistSyncing}
        onClick={async (e) => {
          e.preventDefault()
          e.stopPropagation()

          if (!isAuthenticated) {
            toast.error("Please login to use wishlist")
            return
          }

          const res = await wishlistToggle(Number(product.id))
          if (!res) {
            toast.error("Wishlist update failed")
            return
          }
          toast.success(res.added ? "Added to wishlist" : "Removed from wishlist")
        }}
        className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-2 shadow-sm border border-gray-200 hover:bg-white disabled:opacity-60"
      >
        <Heart
          className={wished ? "h-4 w-4 text-red-500" : "h-4 w-4 text-gray-500"}
          fill={wished ? "currentColor" : "none"}
        />
      </button>
      <Link href={`/products/${product.categoryId}/${product.slag}`} className="block">
        <div className="relative w-full h-36 md:h-40 lg:h-44 mb-2">
          <Image
            src={product.img || "/fallback.png"}
            alt={product.title}
            fill
            className="object-contain rounded-lg"
            sizes="(max-width: 768px) 100vw, 200px"
          />
        </div>
      </Link>

      <div className="flex flex-col gap-1">
        {product.deliveryTime && (
          <span className="text-[10px] sm:text-xs text-green-600 font-medium">
            {product.deliveryTime}
          </span>
        )}

        <h3 className="text-xs sm:text-sm font-medium line-clamp-1">
          {product.title}
        </h3>
        <p className="text-[11px] sm:text-xs text-gray-500 line-clamp-1">
          {product.subtitle}
        </p>

        <div className="flex items-center justify-between mt-2">
          <span className="text-[11px] sm:text-xs font-semibold text-gray-800">
            â‚¹{product.price}
          </span>

          {qty === 0 ? (
            <Button
              variant="outline"
              size="sm"
              className="border-green-600 text-green-600 hover:bg-green-50 text-[11px] sm:text-sm"
              onClick={() => addItem(product)}
            >
              ADD
            </Button>
          ) : (
            <div className="flex items-center gap-2 border border-green-600 rounded-md px-2 py-1">
              <button
                className="text-green-600 font-bold text-[11px] sm:text-base"
                onClick={() => decreaseQuantity(product.id)}
              >
                âˆ’
              </button>
              <span className="text-[11px] sm:text-sm">{qty}</span>
              <button
                className="text-green-600 font-bold text-[11px] sm:text-base"
                onClick={() => increaseQuantity(product.id)}
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
