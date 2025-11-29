/**
 * CartContext.tsx - Shopping Cart Context Component
 *
 * This file provides global state management for shopping cart functionality, including:
 * - Shopping cart item state management
 * - Shopping cart operation method encapsulation
 * - React Context API implementation for shopping cart
 *
 * Main Features:
 * 1. Item Management: Add, remove, update item quantities
 * 2. State Calculation: Total items, total price, item existence in cart
 * 3. Cart Operations: Clear cart
 *
 * Usage:
 * 1. Wrap your app with <CartProvider> at the root level
 * 2. Use useCart() Hook in child components to access cart state and methods
 *
 * Example:
 * ```tsx
 * // In App.tsx
 * <CartProvider>
 *   <YourApp />
 * </CartProvider>
 *
 * // In components
 * const { items, addItem, removeItem, getTotalItems, getTotalPrice } = useCart();
 * ```
 *
 */

import React, { createContext, useContext, useState, ReactNode } from "react";
import { trackAddToCart } from "../../utils/analytics";

/**
 * Shopping cart item interface
 * @interface CartItem
 * @property {string} id - Unique item identifier
 * @property {string} name - Item name
 * @property {number} price - Item price
 * @property {number} quantity - Item quantity
 * @property {string} [image] - Item image URL (optional)
 * @property {string} [description] - Item description (optional)
 */
export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  description?: string;
}

/**
 * Shopping cart context type definition
 * @interface CartContextType
 * @property {CartItem[]} items - List of items in the shopping cart
 * @property {function} addItem - Add item to shopping cart
 * @property {function} updateQuantity - Update item quantity
 * @property {function} removeItem - Remove item from shopping cart
 * @property {function} clearCart - Clear the shopping cart
 * @property {function} getTotalItems - Get total number of items in cart
 * @property {function} getTotalPrice - Get total price of items in cart
 * @property {function} isInCart - Check if item exists in cart
 */
interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  isInCart: (id: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

/**
 * Shopping cart Hook
 * Used to access shopping cart state and methods in components
 * @returns {CartContextType} Shopping cart context object
 * @throws {Error} Throws error if used outside of CartProvider
 *
 * Usage example:
 * ```tsx
 * const { items, addItem, removeItem, totalItems, totalPrice } = useCart();
 * ```
 */
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

/**
 * Shopping cart provider component props
 * @interface CartProviderProps
 * @property {ReactNode} children - Child components
 */
interface CartProviderProps {
  children: ReactNode;
}

/**
 * Shopping cart provider component
 * Provides shopping cart state management functionality for the entire application
 *
 * Features include:
 * - Item state management (add, remove, update quantities)
 * - Cart calculations (total items, total price)
 * - Item checking (whether item exists in cart)
 * - Checkout functionality (create payment sessions)
 *
 * @param {CartProviderProps} props - Component props
 * @returns {JSX.Element} Shopping cart provider component
 */
export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  /**
   * Add item to shopping cart
   * If item already exists, increase quantity; otherwise add new item
   * @param {Omit<CartItem, "quantity">} item - Item to add (without quantity)
   */
  const addItem = (item: Omit<CartItem, "quantity">) => {
    trackAddToCart(item);
    setItems((prevItems) => {
      const existingItem = prevItems.find((i) => i.id === item.id);
      if (existingItem) {
        return prevItems.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prevItems, { ...item, quantity: 1 }];
    });
  };

  /**
   * Update item quantity
   * If quantity is 0 or negative, remove the item from cart
   * @param {string} id - Item ID
   * @param {number} quantity - New quantity
   */
  const updateQuantity = (id: string, quantity: number) => {
    setItems((prevItems) => {
      if (quantity <= 0) {
        return prevItems.filter((item) => item.id !== id);
      }
      return prevItems.map((item) =>
        item.id === id ? { ...item, quantity } : item
      );
    });
  };

  /**
   * Remove item from shopping cart
   * @param {string} id - ID of item to remove
   */
  const removeItem = (id: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== id));
  };

  /**
   * Clear shopping cart
   * Remove all items
   */
  const clearCart = () => {
    setItems([]);
  };

  /**
   * Get total number of items in shopping cart
   * @returns {number} Sum of all item quantities
   */
  const getTotalItems = () => {
    return items.length;
  };

  /**
   * Get total price of items in shopping cart
   * @returns {number} Sum of all item prices
   */
  const getTotalPrice = () => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  /**
   * Check if item exists in shopping cart
   * @param {string} id - Item ID
   * @returns {boolean} Whether item exists in cart
   */
  const isInCart = (id: string) => {
    return items.some((item) => item.id === id);
  };

  // Build shopping cart context value object
  const value: CartContextType = {
    items,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    getTotalItems,
    getTotalPrice,
    isInCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
