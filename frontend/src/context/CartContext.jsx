import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../api/axios'
import { useAuth } from './AuthContext'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const { isBuyer, isAuthenticated } = useAuth()
  const [cart, setCart] = useState(null)
  const [cartLoading, setCartLoading] = useState(false)

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated || !isBuyer) return
    try {
      setCartLoading(true)
      const { data } = await api.get('/orders/cart/')
      setCart(data)
    } catch {
      setCart(null)
    } finally {
      setCartLoading(false)
    }
  }, [isAuthenticated, isBuyer])

  useEffect(() => { fetchCart() }, [fetchCart])

  const addToCart = async (productId, quantity = 1) => {
    const { data } = await api.post('/orders/cart/add/', { product_id: productId, quantity })
    setCart(data)
    return data
  }

  const removeFromCart = async (itemId) => {
    const { data } = await api.delete(`/orders/cart/${itemId}/`)
    setCart(data)
  }

  const updateQty = async (itemId, quantity) => {
    const { data } = await api.patch(`/orders/cart/${itemId}/`, { quantity })
    setCart(data)
  }

  const clearCart = () => setCart(null)

  return (
    <CartContext.Provider value={{
      cart,
      cartLoading,
      cartCount: cart?.item_count ?? 0,
      cartTotal: cart?.total ?? 0,
      cartItems: cart?.items ?? [],
      fetchCart,
      addToCart,
      removeFromCart,
      updateQty,
      clearCart,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
