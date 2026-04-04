"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import LoginDialog from "@/app/(auth)/login-in/LoginDialog"
import { useLoginStore } from "@/app/store/useLoginStore"
import { useSignupStore } from "@/app/store/useSignupStore"
import CartView from "@/components/Cart/CartView"
import AddressView from "@/components/Cart/AddressView"
import useAddressStore from "@/app/store/useAddressStore"

interface CartSidebarProps {
  open: boolean
  onClose: () => void
}

export default function CartSidebar({ open, onClose }: CartSidebarProps) {
  const loginUser = useLoginStore((s) => s.user)
  const signupUser = useSignupStore((s) => s.user)
  const isAuthenticated = !!(loginUser || signupUser)

  const [loginOpen, setLoginOpen] = useState(false)
  const [step, setStep] = useState<"cart" | "address">("cart")
  const { selectedAddress, setSelectedAddress } = useAddressStore()

  const goToAddress = () => setStep("address")
  const goToCart = () => setStep("cart")

  const handleChangeAddress = () => {
    setStep("address")
  }

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
                <h2 className="text-lg font-semibold">
                  {step === "cart" ? "My Cart" : "Select delivery address"}
                </h2>
                <button onClick={onClose}>
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {step === "cart" ? (
                  <CartView
                    isAuthenticated={isAuthenticated}
                    onLoginRequired={() => setLoginOpen(true)}
                    onProceed={goToAddress}
                    selectedAddress={selectedAddress}
                    onChangeAddress={handleChangeAddress}
                  />
                ) : (
                  <AddressView onBack={goToCart} onSelectAddress={setSelectedAddress} />
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
    </>
  )
}
