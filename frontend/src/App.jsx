import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import ForgotPassword from './pages/ForgotPassword'
import { startUptimeMonitor } from './utils/uptimeMonitor'
import Home from './pages/Home'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { WishlistProvider } from './context/WishlistContext'
import { ToastProvider } from './components/ToastManager'
import { SidebarProvider } from './context/SidebarContext'
import ResetPassword from './pages/ResetPassword'
import Profile from './pages/Profile'
import AdminLogin from './pages/AdminLogin'
import StaffLogin from './pages/StaffLogin'
import AdminDashboard from './pages/AdminDashboard'
import FAQ from './pages/FAQ'
import Contact from './pages/Contact'
import SinosplyContact from './pages/sinosplyContact'
import PaymentPage from './pages/PaymentPage'
import CheckoutPage from './pages/CheckoutPage'
import CartPage from './pages/CartPage'
import WishlistPage from './pages/WishlistPage'
import OrderConfirmationPage from './pages/OrderConfirmationPage'
import ProductDetailsPage from './pages/ProductDetailsPage'
import TrackOrderPage from './pages/TrackOrderPage'
import TrackingLookupPage from './pages/TrackingLookupPage'
import OrdersPage from './pages/admin/OrdersPage'
import AdminOrders from './pages/admin/AdminOrders'
import ProductsPage from './pages/admin/ProductsPage'
import CustomersPage from './pages/admin/CustomersPage'
import ChatsPage from './pages/admin/ChatsPage'
import CouponsPage from './pages/admin/CouponsPage'
import CampaignsPage from './pages/admin/CampaignsPage'
import AdminProfile from './pages/admin/AdminProfile'
import AdminSettings from './pages/admin/AdminSettings'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import CollectionsPage from './pages/admin/CollectionsPage'
import PlatformsPage from './pages/admin/PlatformsPage'
import PlatformDetailsPage from './pages/admin/PlatformDetailsPage'
import QuotesPage from './pages/admin/QuotesPage'
import FeaturedCollectionPage from './pages/FeaturedCollectionPage'
import Collection from './pages/Collection'
import SinosplyStores from './pages/SinosplyStores'
import Stores from './pages/Stores'
import Quote from './pages/Quote'
import Products from './pages/Products'
import Services from './pages/Services'
import About from './pages/About'
import SearchResults from './pages/SearchResults'
// Import category pages
import NewArrivalsPage from './pages/NewArrivalsPage'
import BestSellersPage from './pages/BestSellersPage'
import GadgetsPage from './pages/GadgetsPage'
import HairPage from './pages/HairPage'
import ExclusivesPage from './pages/ExclusivesPage'
import BackInStockPage from './pages/BackInStockPage'
import { useOrderStore } from './store/orderStore'
import { useNotificationStore } from './store/notificationStore'
// Import NotificationService to ensure it's initialized
import './services/NotificationService'
// Import new pages
import ShippingPage from './pages/ShippingPage'
import BlogPage from './pages/BlogPage'
import CareersPage from './pages/CareersPage'
import StoreLocatorPage from './pages/StoreLocatorPage'
import ScrollToTop from './components/ScrollToTop'
import ProductSearchPage from './pages/ProductSearchPage'

// Wrap AdminRoute components with SidebarProvider
const AdminRouteWithSidebar = ({ children }) => {
  console.log('[App] Rendering AdminRouteWithSidebar');
  
  return (
    <SidebarProvider>
      <AdminRoute>
        {children}
      </AdminRoute>
    </SidebarProvider>
  );
};

// App wrapper component to handle global effects
const AppWrapper = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { subscribeToOrderUpdates } = useOrderStore();
  const { addOrderStatusNotification } = useNotificationStore();
  
  // Start the uptime monitor to keep the backend server alive
  useEffect(() => {
    console.log('[App] Starting uptime monitor to keep backend alive');
    const monitorId = startUptimeMonitor();
    
    return () => {
      // Clean up the interval when the app unmounts
      if (monitorId) clearInterval(monitorId);
    };
  }, []);
  
  // Log page navigation for debugging
  useEffect(() => {
    console.log('[App] Page changed:', location.pathname);
  }, [location]);
  
  // Set up global notification listener
  useEffect(() => {
    console.log('[App] Setting up global notification listener');
    
    // First, initialize notification service in global context
    try {
      // Import and initialize notification service directly
      import('./services/NotificationService')
        .then(module => {
          const notificationService = module.default;
          console.log('[App] NotificationService initialized:', !!notificationService);
          
          // Add to window for debugging
          window.notificationService = notificationService;
        })
        .catch(err => {
          console.error('[App] Failed to load NotificationService:', err);
        });
    } catch (err) {
      console.error('[App] Error initializing NotificationService:', err);
    }
    
    // Connect OrderStore updates to browser notifications
    const unsubscribe = subscribeToOrderUpdates((order) => {
      console.log('[App] Received order update in global handler:', order);
      
      if (order && order.status) {
        // Add notification to store
        const notification = addOrderStatusNotification(order);
        console.log('[App] Created notification:', notification);
        
        // Dispatch custom event for NotificationService
        try {
          const customEvent = new CustomEvent('order-status-updated', { 
            detail: { order } 
          });
          console.log('[App] Dispatching order-status-updated event');
          window.dispatchEvent(customEvent);
        } catch (err) {
          console.error('[App] Error dispatching custom event:', err);
        }
      }
    });
    
    // Log initial notification count
    console.log('[App] Initial notification count:', addOrderStatusNotification ? 'Ready' : 'Not available');
    
    return () => {
      console.log('[App] Cleaning up global notification listener');
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [subscribeToOrderUpdates, addOrderStatusNotification]);
  
  // App component tree
  return (
    <>
      <ScrollToTop />
      <AuthProvider>
        <ToastProvider>
          <CartProvider>
            <WishlistProvider>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/home" element={<Home />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/wishlist" element={<WishlistPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/payment" element={<PaymentPage />} />
                <Route path="/order-confirmation" element={<OrderConfirmationPage />} />
                <Route path="/products" element={<Products />} />
                <Route path="/products/:category" element={<Products />} />
                <Route path="/product/:id" element={<ProductDetailsPage />} />
                <Route path="/track" element={<TrackingLookupPage />} />
                <Route path="/track-order/:trackingNumber" element={<TrackOrderPage />} />
                <Route path="/collections/:collectionId" element={<FeaturedCollectionPage />} />
                <Route path="/stores" element={<Stores />} />
                <Route path="/quote" element={<Quote />} />
                <Route path="/services" element={<Services />} />
                <Route path="/about" element={<About />} />
                <Route path="/search" element={<SearchResults />} />
                <Route path="/product-search" element={<ProductSearchPage /> } />
                <Route path="/contact" element={<Contact />} />
                
                {/* New routes for Footer pages */}
                <Route path="/shipping" element={<ShippingPage />} />
                <Route path="/blog" element={<BlogPage />} />
                <Route path="/careers" element={<CareersPage />} />
                <Route path="/store-locator" element={<StoreLocatorPage />} />
                <Route path="/faq" element={<FAQ />} />
                
                {/* Category Pages */}
                <Route path="/new-arrivals" element={<NewArrivalsPage />} />
                <Route path="/best-sellers" element={<BestSellersPage />} />
                <Route path="/gadgets" element={<GadgetsPage />} />
                <Route path="/hair" element={<HairPage />} />
                <Route path="/exclusives" element={<ExclusivesPage />} />
                <Route path="/back-in-stock" element={<BackInStockPage />} />
                <Route path="/sinosply-stores" element={<SinosplyStores />} />
                
                <Route 
                  path="/profile" 
                  element={
                      <Profile />
                  } 
                />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/staff/login" element={<StaffLogin />} />
                
                {/* Admin Routes with SidebarProvider */}
                <Route path="/admin/dashboard" element={
                  <AdminRouteWithSidebar>
                    <AdminDashboard />
                  </AdminRouteWithSidebar>
                } />
                <Route path="/admin/orders" element={
                  <AdminRouteWithSidebar>
                    <OrdersPage />
                  </AdminRouteWithSidebar>
                } />
                <Route path="/admin/all-orders" element={
                  <AdminRouteWithSidebar>
                    <AdminOrders />
                  </AdminRouteWithSidebar>
                } />
                <Route path="/admin/products" element={
                  <AdminRouteWithSidebar>
                    <ProductsPage />
                  </AdminRouteWithSidebar>
                } />
                <Route path="/admin/customers" element={
                  <AdminRouteWithSidebar>
                    <CustomersPage />
                  </AdminRouteWithSidebar>
                } />
                <Route path="/admin/chats" element={
                  <AdminRouteWithSidebar>
                    <ChatsPage />
                  </AdminRouteWithSidebar>
                } />
                <Route path="/admin/coupons" element={
                  <AdminRouteWithSidebar>
                    <CouponsPage />
                  </AdminRouteWithSidebar>
                } />
                <Route path="/admin/campaigns" element={
                  <AdminRouteWithSidebar>
                    <CampaignsPage />
                  </AdminRouteWithSidebar>
                } />
                <Route path="/admin/quotes" element={
                  <AdminRouteWithSidebar>
                    <QuotesPage />
                  </AdminRouteWithSidebar>
                } />
                <Route path="/admin/profile" element={
                  <AdminRouteWithSidebar>
                    <AdminProfile />
                  </AdminRouteWithSidebar>
                } />
                <Route path="/admin/settings" element={
                  <AdminRouteWithSidebar>
                    <AdminSettings />
                  </AdminRouteWithSidebar>
                } />
                <Route path="/admin/collections" element={
                  <AdminRouteWithSidebar>
                    <CollectionsPage />
                  </AdminRouteWithSidebar>
                } />
                <Route path="/admin/platforms" element={
                  <AdminRouteWithSidebar>
                    <PlatformsPage />
                  </AdminRouteWithSidebar>
                } />
                <Route path="/admin/platforms/:id" element={
                  <AdminRouteWithSidebar>
                    <PlatformDetailsPage />
                  </AdminRouteWithSidebar>
                } />
                <Route path="/sinosply-contact" element={<SinosplyContact />} />
                <Route path="/collection/:collectionId" element={<Collection />} />
                
              </Routes>
            </WishlistProvider>
          </CartProvider>
        </ToastProvider>
      </AuthProvider>
    </>
  );
};

function App() {
  console.log('[App] Initializing application');
  
  return (
    <Router>
      <AppWrapper />
    </Router>
  );
}

export default App