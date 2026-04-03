import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import Toast from '../components/Toast';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  // Load cart from localStorage on init
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('kyusda_cart');
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
    } catch (err) {
      console.error('Failed to load cart', err);
    }
  }, []);

  // Save cart to localStorage on change
  useEffect(() => {
    localStorage.setItem('kyusda_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, quantity = 1) => {
    const stock = Number(product?.stock);
    if (Number.isFinite(stock) && stock <= 0) {
      showToast('Out of stock', 'error');
      return;
    }
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        const nextQty = existing.quantity + quantity;
        if (Number.isFinite(stock) && nextQty > stock) {
          showToast('Not enough stock available', 'error');
          return prev;
        }
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { ...product, quantity }];
    });
    showToast('Added to cart');
  };

  const removeFromCart = (productId) => {
    setCartItems((prev) => prev.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => (item.id === productId ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => setCartItems([]);

  const getCartTotal = () => {
    return cartItems.reduce((sum, item) => {
      const price = item.offer_active ? item.offer_price : item.price;
      return sum + Number(price) * item.quantity;
    }, 0);
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Group items by seller for multi-store checkout
  const groupedItems = cartItems.reduce((groups, item) => {
    const sellerId = item.sellerId || 'unknown';
    const sellerName = item.seller || 'Unknown Store';
    if (!groups[sellerId]) {
      groups[sellerId] = {
        sellerId,
        sellerName,
        items: [],
      };
    }
    groups[sellerId].items.push(item);
    return groups;
  }, {});

  return (
    <CartContext.Provider
      value={{
        cartItems,
        groupedItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        cartCount,
        showToast,
      }}
    >
      {children}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
