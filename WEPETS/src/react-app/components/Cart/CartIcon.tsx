/**
 * CartIcon.tsx - Shopping Cart Icon and Drawer Component
 *
 * A unified component that combines the shopping cart icon and drawer functionality.
 * This component manages its own open/close state internally, ensuring that wherever
 * the cart icon is placed, the shopping cart drawer can be opened.
 *
 * Features:
 * - Shopping bag icon with hover effects and item count badge
 * - Integrated drawer-style cart display
 * - Internal state management for open/close
 * - Item quantity controls (increase/decrease/remove)
 * - Real-time total calculation
 * - Checkout integration with payment session creation via API
 * - Empty cart state handling
 * - Responsive design with mobile-friendly interface
 * - Automatic payment session creation and new window opening
 *
 * Usage:
 * ```tsx
 * import { CartIcon } from './components/Cart';
 *
 * <CartIcon />
 * ```
 *
 * Dependencies:
 * - Requires CartProvider to be wrapped around the component
 * - Uses useCart hook for cart state management
 * - Integrates with /api/create-checkout-session API for payment processing
 * - Automatically opens checkout URL in new window on successful checkout
 */

import React, { useState } from "react";
import { Plus, Minus, Trash2, ShoppingBag, CreditCard, X } from "lucide-react";
import { useCart } from "./CartContext";
import { trackInitiateCheckout } from "../../utils/analytics";

export const CartIcon: React.FC = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const { items, updateQuantity, removeItem, getTotalPrice, getTotalItems } =
    useCart();

  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();

  const openCart = () => {
    setIsCartOpen(true);
  };

  const closeCart = () => {
    setIsCartOpen(false);
  };

  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(id);
    } else {
      updateQuantity(id, newQuantity);
    }
  };

  const handleIncrement = (id: string, currentQuantity: number) => {
    handleQuantityChange(id, currentQuantity + 1);
  };

  const handleDecrement = (id: string, currentQuantity: number) => {
    handleQuantityChange(id, currentQuantity - 1);
  };

  const handleCheckout = async () => {
    setIsCheckingOut(true);

    try {
      // Prepare checkout data
      const checkoutData = {
        products: items.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
        successRouter: "/checkout/success",
        cancelRouter: "/checkout/cancel",
      };

      // Call API to create payment session
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(checkoutData),
      });

      const result = await response.json();

      if (result.checkoutUrl) {
        trackInitiateCheckout(items, result.sessionId);
        // Open checkout URL in new window/tab
        window.open(result.checkoutUrl, "_blank");
        closeCart();
      } else {
        // Show error message
        console.error(result.error || "Failed to create payment session");
      }
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <>
      {/* Cart Icon */}
      <button
        onClick={openCart}
        className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <ShoppingBag className="h-6 w-6 text-gray-700" />
        {totalItems > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {totalItems > 99 ? "99+" : totalItems}
          </span>
        )}
      </button>

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={closeCart}
          />

          {/* Drawer Panel */}
          <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Shopping Cart
              </h3>
              <button
                onClick={closeCart}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                  <ShoppingBag className="h-12 w-12 mb-4" />
                  <p className="text-lg font-medium">Your cart is empty</p>
                  <p className="text-sm mt-2">Add some items to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
                    >
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 mb-1">
                          {item.name}
                        </h4>
                        {item.description && (
                          <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                            {item.description}
                          </p>
                        )}
                        <p className="text-sm font-semibold text-blue-600 mb-3">
                          ${item.price.toFixed(2)}
                        </p>

                        {/* Quantity Controls */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() =>
                              handleDecrement(item.id, item.quantity)
                            }
                            className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 transition-colors"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-8 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              handleIncrement(item.id, item.quantity)
                            }
                            className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 transition-colors"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="ml-auto w-8 h-8 rounded-full bg-red-100 hover:bg-red-200 flex items-center justify-center text-red-600 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-gray-200 p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">
                    Total
                  </span>
                  <span className="text-xl font-bold text-blue-600">
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCheckingOut ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5" />
                      Proceed to Checkout
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
