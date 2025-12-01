import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  X, 
  Plus, 
  Minus, 
  ArrowLeft, 
  Truck,
  RefreshCw,
  Lock
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useToast } from '../components/ToastManager';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const CartPage = () => {
  const navigate = useNavigate();
  const { cartItems, updateQuantity, removeFromCart, cartCount, totalAmount } = useCart();
  const { success, error } = useToast();
  
  const handleRemoveItem = (index, name) => {
    removeFromCart(index);
    success(`${name} was removed from your cart`);
  };
  
  const handleUpdateQuantity = (index, newQuantity, name) => {
    if (newQuantity < 1) return;
    updateQuantity(index, newQuantity);
  };
  
  const handleCheckout = () => {
    if (cartItems.length === 0) {
      error('Your cart is empty.');
      return;
    }
    
    navigate('/checkout', {
      state: {
        fromCart: true,
        cartItems: cartItems,
        cartTotal: totalAmount
      }
    });
  };
  
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center mb-10">
          <Link to="/sinosply-stores" className="flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Continue Shopping
          </Link>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center">
          <ShoppingBag className="w-8 h-8 mr-3" />
          Your Shopping Bag {cartCount > 0 && `(${cartCount})`}
        </h1>
        
        {cartItems.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-lg">
            <ShoppingBag className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-medium text-gray-900 mb-2">Your bag is empty</h2>
            <p className="text-gray-500 mb-6">Looks like you haven't added any items to your bag yet.</p>
            <Link 
              to="/sinosply-stores" 
              className="inline-block bg-black text-white py-3 px-8 rounded-md hover:bg-gray-900 transition-colors"
            >
              Shop Now
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="divide-y divide-gray-200">
                  {cartItems.map((item, index) => (
                    <div key={`${item.id}-${item.size}-${item.color}`} className="p-6 flex items-start">
                      <div className="h-24 w-20 flex-shrink-0 overflow-hidden rounded-md">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover object-center"
                        />
                      </div>
                      
                      <div className="ml-6 flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-base font-medium text-gray-900">{item.name}</h3>
                            <p className="mt-1 text-sm text-gray-500">
                              Color: {item.colorName} | Size: {item.size}
                            </p>
                          </div>
                          <p className="text-base font-medium text-gray-900">{item.price}</p>
                        </div>
                        
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center border border-gray-300 rounded-md">
                            <button
                              type="button"
                              className="p-2 text-gray-600 hover:text-gray-900"
                              onClick={() => handleUpdateQuantity(index, item.quantity - 1, item.name)}
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="px-4 py-2 text-gray-900">{item.quantity}</span>
                            <button
                              type="button"
                              className="p-2 text-gray-600 hover:text-gray-900"
                              onClick={() => handleUpdateQuantity(index, item.quantity + 1, item.name)}
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <button
                            type="button"
                            className="text-gray-500 hover:text-red-500"
                            onClick={() => handleRemoveItem(index, item.name)}
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded-lg shadow-sm sticky top-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Order Summary</h2>
                
                <div className="space-y-4">
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">GH₵{totalAmount.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium">Calculated at checkout</span>
                  </div>
                  
                  <div className="flex justify-between py-2 text-lg font-bold">
                    <span>Estimated Total</span>
                    <span>GH₵{totalAmount.toFixed(2)}</span>
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleCheckout}
                    className="w-full bg-black text-white py-4 px-4 rounded-md hover:bg-gray-900 transition-colors font-medium text-lg mt-4"
                  >
                    Checkout
                  </button>
                  
                  <div className="flex flex-col space-y-3 mt-6">
                    <div className="flex items-center text-sm text-gray-500">
                      <Truck className="w-4 h-4 mr-2" />
                      <span>Free shipping on orders over GH₵100</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      <span>Free 30-day returns</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Lock className="w-4 h-4 mr-2" />
                      <span>Secure checkout</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default CartPage; 