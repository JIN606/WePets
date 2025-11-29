/**
 * Cart Component Package - Main Export File
 *
 * This file serves as the main entry point for the Cart component package.
 * It exports all cart-related components and hooks for easy integration.
 *
 * Available Exports:
 * - CartProvider: Context provider for cart state management
 * - useCart: Hook to access cart state and methods
 * - CartIcon: Combined cart icon and drawer component
 *
 * Usage:
 * ```tsx
 * import { CartProvider, useCart, CartIcon } from './components/Cart';
 * ```
 */

// Export all cart-related components and hooks
export { CartProvider, useCart } from "./CartContext";
export { CartIcon } from "./CartIcon";
