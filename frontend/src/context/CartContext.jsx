import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    const stored = localStorage.getItem('moon_cart');
    return stored ? JSON.parse(stored) : [];
  });
  const [cartShopId, setCartShopId] = useState(() => localStorage.getItem('moon_cart_shop') || null);

  useEffect(() => {
    localStorage.setItem('moon_cart', JSON.stringify(cart));
    if (cartShopId) localStorage.setItem('moon_cart_shop', cartShopId);
  }, [cart, cartShopId]);

  const addItem = (product, shopId) => {
    // Enforce single-shop cart
    if (cartShopId && cartShopId !== shopId) {
      return { error: 'Your cart has items from another shop. Clear cart first.' };
    }
    if (!cartShopId) setCartShopId(shopId);

    setCart(prev => {
      const existing = prev.find(i => i._id === product._id);
      if (existing) return prev.map(i => i._id === product._id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
    return { error: null };
  };

  const removeItem = (productId) => {
    setCart(prev => {
      const next = prev.filter(i => i._id !== productId);
      if (next.length === 0) { setCartShopId(null); localStorage.removeItem('moon_cart_shop'); }
      return next;
    });
  };

  const updateQty = (productId, qty) => {
    if (qty <= 0) return removeItem(productId);
    setCart(prev => prev.map(i => i._id === productId ? { ...i, qty } : i));
  };

  const clearCart = () => {
    setCart([]);
    setCartShopId(null);
    localStorage.removeItem('moon_cart_shop');
  };

  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const itemCount = cart.reduce((sum, i) => sum + i.qty, 0);

  return (
    <CartContext.Provider value={{ cart, cartShopId, addItem, removeItem, updateQty, clearCart, total, itemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
