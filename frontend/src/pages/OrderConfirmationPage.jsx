import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  CheckCircle, 
  Truck, 
  ShoppingBag, 
  Calendar, 
  ChevronRight, 
  Home,
  CreditCard,
  MapPin,
  Download,
  Share2,
  X,
  Printer,
  Mail,
  Copy,
  Package,
  User,
  Clock,
  DollarSign,
  ArrowLeft,
  ArrowRight,
  Phone
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useCart } from '../context/CartContext';
import { useToast } from '../components/ToastManager';
import OrderDetailsModal from '../components/OrderDetailsModal';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useOrderStore } from '../store/orderStore';
import { useProductStore } from '../store/productStore';
import apiConfig from '../config/apiConfig';

const OrderConfirmationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth(); // Add useAuth hook to get the current authenticated user
  const [orderDetails, setOrderDetails] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);
  const [downloadType, setDownloadType] = useState('pdf'); // 'pdf' or 'image'
  const [copySuccess, setCopySuccess] = useState('');
  const [activeTab, setActiveTab] = useState('items');
  const receiptRef = useRef(null);
  const { clearCart } = useCart();
  const { success } = useToast();
  const hasInitializedRef = useRef(false); // Track whether we've already initialized
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [apiError, setApiError] = useState(null);
  const orderStore = useOrderStore();
  const productStore = useProductStore();
  
  // API URL - Fixed for Vite
  const API_URL = apiConfig.baseURL;
  
  // Generate a random tracking number
  const generateTrackingNumber = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    
    let trackingNumber = '';
    
    // Add 2 letters
    for (let i = 0; i < 2; i++) {
      trackingNumber += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    
    // Add 9 numbers
    for (let i = 0; i < 9; i++) {
      trackingNumber += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }
    
    // Add 2 more letters
    for (let i = 0; i < 2; i++) {
      trackingNumber += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    
    return trackingNumber;
  };
  
  // Format date to display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Calculate estimated delivery date (5-7 business days from today)
  const calculateEstimatedDelivery = () => {
    const today = new Date();
    const deliveryDate = new Date(today);
    deliveryDate.setDate(today.getDate() + 5 + Math.floor(Math.random() * 3)); // 5-7 days
    
    return formatDate(deliveryDate);
  };
  
  // Generate unique receipt ID
  const generateReceiptId = () => {
    return 'RCP-' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  };
  
  // Format price for display
  const formatPrice = (price) => {
    // Handle various input formats
    if (price === undefined || price === null) return '$0.00';
    
    // If already formatted with a currency symbol, return as-is
    if (typeof price === 'string' && (price.trim().startsWith('$') || price.trim().startsWith('€'))) {
      return price;
    }
    
    // Try to convert to a number
    const numericPrice = typeof price === 'string' ? parseFloat(price.replace(/[^0-9.-]+/g, '')) : price;
    
    // Check if conversion resulted in a valid number
    if (isNaN(numericPrice)) return '$0.00';
    
    // Format as currency
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(numericPrice);
  };
  
  // Save order to backend
  const saveOrderToBackend = async (orderData) => {
    try {
      setIsSavingOrder(true);
      
      // Get authentication information
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
      
      console.log('Order Creation - Authentication Debug:');
      console.log('- Token exists:', !!token);
      console.log('- User from context:', user ? `ID: ${user.id || user._id}, Email: ${user.email}` : 'No user in context');
      console.log('- User from localStorage:', storedUser ? `ID: ${storedUser.id || storedUser._id}, Email: ${storedUser.email}` : 'No user in localStorage');
      
      // Generate an order number if not provided
      const orderNumber = orderData.orderNumber || orderData.id || `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
      
      // Log receipt data as received from OrderPage
      console.log('📷 OrderConfirmation - Receipt data received:', {
        hasReceipt: !!orderData.paymentReceipt,
        receiptType: orderData.paymentReceipt?.type || 'none',
        hasImageData: orderData.paymentReceipt?.imageData ? 'Yes' : 'No',
        hasLink: orderData.paymentReceipt?.link ? 'Yes' : 'No',
        uploadedAt: orderData.paymentReceipt?.uploadedAt ? new Date(orderData.paymentReceipt.uploadedAt).toISOString() : 'N/A'
      });
      
      // Ensure shipping address is complete
      const shippingAddress = {
        name: orderData.shippingAddress?.name || orderData.customer?.name || 'Customer',
        street: orderData.shippingAddress?.street || '123 Example Street',
        city: orderData.shippingAddress?.city || 'Sample City',
        state: orderData.shippingAddress?.state || 'State',
        zip: orderData.shippingAddress?.zip || '12345',
        country: orderData.shippingAddress?.country || 'Country',
        phone: orderData.shippingAddress?.phone || orderData.customer?.phone || '+1 (555) 123-4567'
      };
      
      // Ensure billing address is complete (use shipping if missing)
      const billingAddress = orderData.billingAddress || {
        name: shippingAddress.name,
        street: shippingAddress.street,
        city: shippingAddress.city,
        state: shippingAddress.state,
        zip: shippingAddress.zip,
        country: shippingAddress.country
      };

      // Check if we have a payment receipt with image data that's very large
      let paymentReceiptToSend = orderData.paymentReceipt;
      
      if (!paymentReceiptToSend) {
        console.warn('⚠️ OrderConfirmation - No payment receipt found, creating empty receipt object');
        paymentReceiptToSend = {
          type: 'none',
          imageData: '',
          link: '',
          uploadedAt: new Date()
        };
      } else {
        console.log('🧾 OrderConfirmation - Processing receipt for backend:', {
          type: paymentReceiptToSend.type,
          hasImageData: !!paymentReceiptToSend.imageData,
          hasLink: !!paymentReceiptToSend.link,
          uploadDate: paymentReceiptToSend.uploadedAt
        });
      }
      
      if (orderData.paymentReceipt && 
          orderData.paymentReceipt.type === 'image' && 
          orderData.paymentReceipt.imageData) {
        
        // Check if the image data is very large (over 5MB after JSON stringification)
        const imageDataSize = orderData.paymentReceipt.imageData.length;
        console.log(`📊 OrderConfirmation - Payment receipt image size: ${(imageDataSize / 1024 / 1024).toFixed(2)}MB`);
        
        if (imageDataSize > 5 * 1024 * 1024) { // 5MB
          console.log('⚠️ OrderConfirmation - Image data is very large, replacing with reference');
          // Replace with a reference instead of the full image data
          paymentReceiptToSend = {
            type: 'reference',
            imageData: '', // Clear the large data
            link: '',
            uploadedAt: orderData.paymentReceipt.uploadedAt,
            note: `Large image receipt (${(imageDataSize / 1024 / 1024).toFixed(2)}MB) was uploaded but not stored in database.`
          };
        }
      }
      
      // Format data for the API
      const apiOrderData = {
        orderNumber, // Include order number in the request
        items: orderData.items.map(item => ({
          productId: item.id || item.productId || 'unknown',
          name: item.name,
          price: parseFloat(item.price) || 0,
          quantity: parseInt(item.quantity) || 1,
          image: item.image || '',
          sku: item.sku || '',
          color: item.color || '',
          size: item.size || ''
        })),
        shippingAddress, // Use the complete shipping address
        billingAddress, // Use the complete billing address
        paymentMethod: orderData.paymentMethod || 'Credit Card',
        paymentDetails: orderData.paymentDetails || {
          transactionId: orderData.transactionId || `txn_${Math.random().toString(36).substring(2, 10)}`,
          status: 'completed',
          cardDetails: orderData.cardDetails || {}
        },
        // Add payment receipt information if available
        paymentReceipt: paymentReceiptToSend ? {
          type: paymentReceiptToSend.type || 'none',
          imageData: paymentReceiptToSend.imageData || '',
          link: paymentReceiptToSend.link || '',
          uploadedAt: paymentReceiptToSend.uploadedAt || new Date(),
          note: paymentReceiptToSend.note || ''
        } : {
          type: 'none',
          imageData: '',
          link: '',
          uploadedAt: new Date()
        },
        subtotal: parseFloat(orderData.subtotal) || 0,
        tax: parseFloat(orderData.tax) || 0,
        shipping: parseFloat(orderData.shipping) || 0,
        discount: parseFloat(orderData.discount) || 0,
        totalAmount: parseFloat(orderData.totalAmount || orderData.amount) || 0,
        customerEmail: orderData.customer?.email || 'guest@example.com',
        customerName: orderData.customer?.name || shippingAddress.name,
        shippingMethod: orderData.shippingMethod || 'Standard Shipping',
      };

      // Log the API receipt data being sent
      console.log('📤 OrderConfirmation - Payment receipt in API payload:', {
        type: apiOrderData.paymentReceipt.type,
        hasImageData: !!apiOrderData.paymentReceipt.imageData,
        imageDataLength: apiOrderData.paymentReceipt.imageData?.length || 0,
        hasLink: !!apiOrderData.paymentReceipt.link,
        hasNote: !!apiOrderData.paymentReceipt.note
      });
      
      // SIMPLIFIED USER ID HANDLING - Match the backend createOrder function
      // Use the same approach as the test orders to ensure consistency
      if (user) {
        // Do NOT send user ID from frontend at all - let the backend extract it from the token
        // This ensures the proper MongoDB ObjectId is used
        console.log(`Authenticated user detected: ${user.id || user._id}`);
        console.log('Using server-side authentication for order association');
      } else if (storedUser) {
        // Do NOT send user ID from frontend at all - let the backend extract it from the token
        console.log(`User found in localStorage: ${storedUser.id || storedUser._id}`);
        console.log('Using server-side authentication for order association');
      } else {
        // No user ID available - this will be a guest order
        console.log('No user ID available - creating guest order');
      }
      
      console.log('Sending order data to API:', apiOrderData);
      
      // Set authorization header if we have a token - CRITICAL FIX
      // Must match EXACTLY how test orders send the auth header
      const config = token ? {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      } : {
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      // Log auth header details for debugging
      console.log('Order API request auth details:', {
        hasToken: !!token,
        authHeader: token ? 'Bearer [token]' : 'none',
        contentType: config.headers['Content-Type']
      });
      
      // Send to API
      const response = await axios.post(`${API_URL}/orders`, apiOrderData, config);
      
      // Update order details with API response
      if (response.data && response.data.success) {
        const savedOrder = response.data.data;
        console.log('🟢 Order saved to database successfully:', savedOrder);
        console.log('📄 Receipt info in saved order:', {
          type: savedOrder.paymentReceipt?.type || 'none',
          hasImageData: !!savedOrder.paymentReceipt?.imageData,
          hasLink: !!savedOrder.paymentReceipt?.link
        });
        
        // Keep our UI data but add any server-generated fields
        setOrderDetails(prev => ({
          ...prev,
          id: savedOrder.orderNumber || savedOrder._id,
          trackingNumber: savedOrder.trackingNumber,
          receiptId: savedOrder.receiptId,
          // Keep any other server-generated data
          serverData: savedOrder
        }));
        
        // Save to orderStore to display in Profile page
        const storeOrder = {
          _id: savedOrder._id || apiOrderData._id || `order-${Date.now()}`,
          orderNumber: savedOrder.orderNumber || apiOrderData.orderNumber,
          user: user?._id || storedUser?._id,
          items: apiOrderData.items,
          shippingAddress: apiOrderData.shippingAddress,
          billingAddress: apiOrderData.billingAddress,
          paymentMethod: apiOrderData.paymentMethod,
          paymentDetails: apiOrderData.paymentDetails,
          subtotal: apiOrderData.subtotal,
          tax: apiOrderData.tax,
          shipping: apiOrderData.shipping,
          discount: apiOrderData.discount,
          totalAmount: apiOrderData.totalAmount,
          status: savedOrder.status || 'Processing',
          trackingNumber: savedOrder.trackingNumber || apiOrderData.trackingNumber || orderData.trackingNumber,
          shippingMethod: apiOrderData.shippingMethod,
          estimatedDelivery: savedOrder.estimatedDelivery || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          receiptId: savedOrder.receiptId || apiOrderData.receiptId || orderData.receiptId,
          customerEmail: apiOrderData.customerEmail,
          customerName: apiOrderData.customerName,
          createdAt: savedOrder.createdAt || new Date().toISOString(),
          updatedAt: savedOrder.updatedAt || new Date().toISOString(),
          // Preserve the original payment receipt for local display
          paymentReceipt: orderData.paymentReceipt
        };
        
        // Add the completed order to the store for Profile display
        orderStore.addOrder(storeOrder);
        console.log('Order saved to orderStore for Profile display:', storeOrder);
        
        // Update product stock in frontend store to match backend changes
        productStore.updateStockAfterOrder(apiOrderData.items);
        
        setApiError(null);
        
        // If backend returned stock update status, log it
        if (response.data.stockUpdateStatus) {
          console.log('Backend stock update result:', response.data.stockUpdateStatus);
        }
      }
    } catch (err) {
      console.error('❌ Failed to save order to database:', err);
      if (err.response && err.response.data) {
        console.error('❌ Server error details:', err.response.data);
        if (err.response.status === 413) {
          console.error('❌ The server rejected the request due to its large size. Payment receipt image may be too large.');
        }
      }
      setApiError('Unable to save order details to our system. Your order is still valid.');
      
      // Even if API fails, still save to orderStore with local data
      try {
        // Create minimal order data from local information
        const localOrder = {
          _id: `local-${Date.now()}`,
          orderNumber: orderData.orderNumber || `ORD-${Date.now()}`,
          items: orderData.items || [],
          shippingAddress: orderData.shippingAddress,
          totalAmount: parseFloat(orderData.totalAmount || orderData.amount) || 0,
          status: 'Processing',
          trackingNumber: orderData.trackingNumber,
          shippingMethod: orderData.shippingMethod || 'Standard Shipping',
          createdAt: new Date().toISOString(),
          customerEmail: orderData.customer?.email || 'guest@example.com',
          customerName: orderData.customer?.name || 'Customer',
          paymentReceipt: orderData.paymentReceipt
        };
        
        // Still add to orderStore even if backend fails
        orderStore.addOrder(localOrder);
        console.log('Order saved to orderStore even though backend failed:', localOrder);
      } catch (storeErr) {
        console.error('Failed to save order to local store:', storeErr);
      }
      
      // Continue with local order data
    } finally {
      setIsSavingOrder(false);
    }
  };
  
  useEffect(() => {
    // Prevent multiple initializations (avoid infinite loop)
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;
    
    console.log('🔄 [OrderConfirmationPage] Component initialized, checking for order details');
    
    // Get order details from location state or Zustand store
    const details = location.state?.orderDetails || orderStore.orderInfo;
    
    if (details) {
      console.log('✅ [OrderConfirmationPage] Order details found:', {
        orderNumber: details.orderNumber || details.id,
        customerEmail: details.customerInfo?.email || details.customer?.email || 'Not available',
        // This is now showing up on the confirmation page after the email should have been sent in PaymentPage
        emailStatus: 'Email should have been sent from the payment page'
      });
      
      const orderDate = new Date(details.date || new Date());
      // Generate these values once
      const trackingNumber = generateTrackingNumber();
      const estimatedDelivery = calculateEstimatedDelivery();
      const receiptId = generateReceiptId();
      
      // Process items to ensure each item has valid price and quantity
      const processedItems = Array.isArray(details.items) ? details.items.map(item => ({
        ...item,
        price: parseFloat(item.price) || 0,
        quantity: parseInt(item.quantity) || 1
      })) : [];
      
      // Calculate subtotal properly if not provided
      const calculatedSubtotal = processedItems.length > 0 
        ? processedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        : parseFloat(details.amount || 0);
      
      // Process payment receipt information
      let paymentReceiptData = null;
      if (details.paymentReceipt) {
        // If paymentReceipt is already in the correct format
        paymentReceiptData = {
          type: details.paymentReceipt.type || 'none',
          imageData: details.paymentReceipt.imageData || '',
          link: details.paymentReceipt.link || '',
          uploadedAt: details.paymentReceipt.uploadedAt || new Date()
        };
        
        // Make sure the type field is set properly and not empty
        if (!paymentReceiptData.type || paymentReceiptData.type === '') {
          if (paymentReceiptData.imageData) {
            paymentReceiptData.type = 'image';
          } else if (paymentReceiptData.link) {
            paymentReceiptData.type = 'link';
          } else {
            paymentReceiptData.type = 'none';
          }
        }
        
        console.log('🧾 OrderConfirmation - Processed receipt data:', {
          type: paymentReceiptData.type,
          hasImageData: !!paymentReceiptData.imageData,
          hasLink: !!paymentReceiptData.link
        });
      } else if (details.receiptImage) {
        // Legacy format with direct image data
        paymentReceiptData = {
          type: 'image',
          imageData: details.receiptImage,
          link: '',
          uploadedAt: new Date()
        };
        console.log('🧾 OrderConfirmation - Created image receipt from legacy format');
      } else if (details.receiptLink) {
        // Legacy format with direct link
        paymentReceiptData = {
          type: 'link',
          imageData: '',
          link: details.receiptLink,
          uploadedAt: new Date()
        };
        console.log('🧾 OrderConfirmation - Created link receipt from legacy format');
      } else {
        // No receipt information
        paymentReceiptData = {
          type: 'none',
          imageData: '',
          link: '',
          uploadedAt: new Date()
        };
        console.log('🧾 OrderConfirmation - No receipt data found, created empty receipt');
      }
      
      // Create a comprehensive order details object
      const orderData = {
        ...details,
        trackingNumber,
        orderDate: formatDate(orderDate),
        rawOrderDate: orderDate,
        formattedOrderDate: formatDate(orderDate),
        estimatedDelivery,
        receiptId,
        status: 'Processing',
        items: processedItems.length > 0 ? processedItems : [
          {
            name: 'Sample Product',
            price: 49.99,
            quantity: 1,
            size: 'M',
            color: 'Black'
          }
        ],
        // Include shipping details
        shippingAddress: details.shippingAddress || {
          name: details.customer?.name || 'Customer',
          street: '123 Example Street',
          city: 'Sample City',
          state: 'State',
          zip: '12345',
          country: 'Country',
          phone: details.customer?.phone || '+1 (555) 123-4567'
        },
        // Include billing details
        billingAddress: details.billingAddress || details.shippingAddress || {
          name: details.customer?.name || 'Customer',
          street: '123 Example Street',
          city: 'Sample City',
          state: 'State',
          zip: '12345',
          country: 'Country'
        },
        // Include payment details
        shippingMethod: details.shippingMethod || 'Standard Shipping',
        paymentMethod: details.paymentMethod || 'Credit Card',
        cardDetails: details.cardDetails || {
          brand: 'Visa',
          last4: '4242'
        },
        // Include payment receipt information
        paymentReceipt: paymentReceiptData,
        transactionId: details.transactionId || `txn_${Math.random().toString(36).substring(2, 15)}`,
        // Include pricing details - ensure numeric values
        subtotal: typeof details.subtotal === 'number' ? details.subtotal : calculatedSubtotal,
        shipping: typeof details.shipping === 'number' ? details.shipping : 0,
        tax: typeof details.tax === 'number' ? details.tax : 0,
        discount: typeof details.discount === 'number' ? details.discount : 0,
        // Format the amount properly
        amount: formatPrice(details.amount || calculatedSubtotal),
        totalAmount: parseFloat(details.amount || calculatedSubtotal),
        // Keep user info for order linking
        userId: details.userId || null,
        isNewUser: details.isNewUser || false
      };
      
      setOrderDetails(orderData);
      
      // Save order to database
      saveOrderToBackend(orderData);
      
      // Clear the cart when order confirmation page loads
      clearCart();
      
      // Clear orderStore since we've successfully completed the order
      orderStore.clearOrderInfo();
      orderStore.clearPaymentStatus();
      
      success('Your order has been placed successfully!');
    } else {
      // For demo purposes, create dummy order details with complete information
      const orderDate = new Date();
      // Generate these values once
      const trackingNumber = generateTrackingNumber();
      const estimatedDelivery = calculateEstimatedDelivery();
      const orderId = `REF-${Math.floor(Math.random() * 1000000)}`;
      const receiptId = generateReceiptId();
      
      // Create mock items with properly formatted prices
      const mockItems = [
        {
          name: 'Sample Product 1',
          price: 49.99,
          quantity: 1,
          size: 'M',
          color: 'Black'
        },
        {
          name: 'Sample Product 2',
          price: 35.01,
          quantity: 1,
          size: 'L',
          color: 'Blue'
        }
      ];
      
      // Calculate subtotal
      const mockSubtotal = mockItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const mockShipping = 0;
      const mockTax = 0;
      const mockDiscount = 0;
      const mockTotal = mockSubtotal + mockShipping + mockTax - mockDiscount;
      
      setOrderDetails({
        id: orderId,
        receiptId,
        status: 'Processing',
        product: 'Sample Product',
        amount: formatPrice(mockTotal),
        subtotal: mockSubtotal,
        shipping: mockShipping,
        tax: mockTax,
        discount: mockDiscount,
        trackingNumber,
        orderDate: formatDate(orderDate),
        rawOrderDate: orderDate,
        formattedOrderDate: formatDate(orderDate),
        estimatedDelivery,
        paymentMethod: 'Credit Card',
        cardDetails: {
          brand: 'Visa',
          last4: '4242'
        },
        // Add sample payment receipt
        paymentReceipt: {
          type: 'link',
          imageData: '',
          link: 'https://pay.chippercash.com/api/pdfs/receipt?ref=DEMO-' + Date.now(),
          uploadedAt: new Date()
        },
        transactionId: `txn_${Math.random().toString(36).substring(2, 15)}`,
        // Demo customer
        customer: {
          name: 'John Doe',
          email: 'john.doe@example.com',
          phone: '+1 (555) 123-4567'
        },
        // Demo shipping address
        shippingAddress: {
          name: 'John Doe',
          street: '123 Example Street',
          city: 'Sample City',
          state: 'State',
          zip: '12345',
          country: 'Country',
          phone: '+1 (555) 123-4567'
        },
        // Demo billing address (same as shipping)
        billingAddress: {
          name: 'John Doe',
          street: '123 Example Street',
          city: 'Sample City',
          state: 'State',
          zip: '12345',
          country: 'Country'
        },
        // Demo shipping method
        shippingMethod: 'Standard Shipping',
        // Demo items
        items: mockItems
      });
    }
  }, [location.state, clearCart, orderStore, productStore]);
  
  const handleContinueShopping = () => {
    navigate('/sinosply-stores');
  };
  
  const handleViewDetails = () => {
    setIsOrderDetailsOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsOrderDetailsOpen(false);
  };
  
  // Format time from date
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Format simple date
  const formatSimpleDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  const handleViewReceipt = () => {
    // You could generate and download a PDF receipt here
    alert("Receipt download functionality would be implemented here");
    // For implementation, you could use libraries like jsPDF or react-pdf
  };
  
  const downloadReceipt = async () => {
    if (!receiptRef.current) return;
    
    try {
      if (downloadType === 'pdf') {
        // Download as PDF
        const canvas = await html2canvas(receiptRef.current, {
          scale: 2,
          logging: false,
          useCORS: true,
          backgroundColor: '#ffffff'
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });
        
        const imgWidth = 210;
        const imgHeight = canvas.height * imgWidth / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        pdf.save(`Receipt-${orderDetails.id}.pdf`);
        success('Receipt downloaded successfully!');
      } else {
        // Download as PNG
        const canvas = await html2canvas(receiptRef.current, {
          scale: 2,
          logging: false,
          useCORS: true,
          backgroundColor: '#ffffff'
        });
        
        const image = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = image;
        link.download = `Receipt-${orderDetails.id}.png`;
        link.click();
        success('Receipt downloaded successfully!');
      }
    } catch (err) {
      console.error('Error downloading receipt:', err);
    }
  };
  
  const printReceipt = () => {
    window.print();
  };
  
  const emailReceipt = () => {
    // This would typically involve a backend service to send an email
    // For demo purposes, we'll just show an alert
    success(`Receipt would be emailed to: ${orderDetails.customer?.email || 'your email'}`);
  };
  
  const copyOrderNumber = () => {
    navigator.clipboard.writeText(orderDetails.id);
    setCopySuccess('Copied!');
    setTimeout(() => setCopySuccess(''), 2000);
  };
  
  // Handle back button click
  const handleBack = () => {
    navigate(-1);
  };
  
  // Handle print tracking info
  const handlePrint = () => {
    window.print();
  };
  
  // Handle opening tracking page - this is called when "Track Package" is clicked
  const handleTrackOrder = () => {
    console.log('🔍 [OrderConfirmationPage] Opening track order page with data:', {
      orderNumber: orderDetails.orderNumber || orderDetails.id,
      trackingNumber: orderDetails.trackingNumber
    });
    
    // Navigate to track order with proper details in state
    navigate(`/track-order/${orderDetails.orderNumber || orderDetails.id}`, {
      state: {
        orderInfo: {
          id: orderDetails.id || orderDetails.orderNumber,
          orderNumber: orderDetails.orderNumber || orderDetails.id,
          trackingNumber: orderDetails.trackingNumber,
          date: orderDetails.date,
          orderDate: orderDetails.orderDate || formatDate(new Date(orderDetails.date)),
          formattedOrderDate: orderDetails.formattedOrderDate || formatDate(new Date(orderDetails.date)),
          status: orderDetails.status || 'processing',
          shippingMethod: orderDetails.shippingMethod || 'Standard Shipping',
          estimatedDelivery: orderDetails.estimatedDelivery || calculateEstimatedDelivery(),
          items: orderDetails.items || [],
          // Format shipping address to match expected structure in TrackOrderPage
          shippingAddress: {
            name: orderDetails.shippingAddress 
              ? `${orderDetails.shippingAddress.firstName || ''} ${orderDetails.shippingAddress.lastName || ''}`.trim() || orderDetails.shippingAddress.name || 'Customer'
              : 'Customer',
            street: orderDetails.shippingAddress?.address1 || orderDetails.shippingAddress?.street || '',
            addressLine2: orderDetails.shippingAddress?.address2 || '',
            city: orderDetails.shippingAddress?.city || '',
            state: orderDetails.shippingAddress?.state || '',
            zip: orderDetails.shippingAddress?.zip || orderDetails.shippingAddress?.zipCode || '',
            country: orderDetails.shippingAddress?.country || '',
            phone: orderDetails.shippingAddress?.phone || orderDetails.contactInfo?.phone || ''
          }
        }
      }
    });
  };
  
  // Show loading state if order details are not yet available
  if (!orderDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-3xl mx-auto">
          {/* Success message */}
          <div className="bg-white p-6 rounded-lg shadow-sm mb-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Thank you for your order!</h1>
            <p className="text-lg text-gray-600 mb-4">Your order has been placed successfully.</p>
            
            {/* Email notifications info */}
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <div className="flex items-start">
                <Mail className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                <div className="text-left">
                  <p className="text-gray-700">
                    <span className="font-medium">Order confirmation details:</span>
                  </p>
                  <ul className="mt-1 text-sm text-gray-600 space-y-1">
                    <li>• A confirmation email has been sent to <span className="font-medium">{orderDetails.customerInfo?.email || orderDetails.customer?.email || 'your email address'}</span></li>
                    <li>• Our admin team has been notified about your order</li>
                    <li>• Emails are sent from <span className="font-medium">orders@sinosply.com</span> - please check your spam folder if needed</li>
                  </ul>
                  <p className="mt-2 text-xs text-gray-500">
                    We use Resend for email delivery. If you don't see the email in your inbox within a few minutes, please check your spam folder or contact our support team.
                  </p>
                  {apiError && (
                    <div className="mt-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-xs text-yellow-700">
                        <span className="font-medium">Note:</span> {apiError} A copy of your order details is shown below.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* New user message */}
            {orderDetails.isNewUser && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-800 mb-2">
                  Your account has been created!
                </h3>
                <p className="text-blue-700 text-sm mb-3">
                  We've created an account for you using your email: {orderDetails.customerInfo?.email || orderDetails.customer?.email}
                </p>
                <button
                  onClick={() => navigate('/login')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Log in to your account
                </button>
              </div>
            )}
          </div>
          
          {/* Order details */}
          <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
              <button 
                onClick={handleViewDetails}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
              >
                View Details
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
            
            <div className="border-t border-gray-200 pt-4">
              <dl className="divide-y divide-gray-200">
                {/* Order number */}
                <div className="py-3 flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Order number</dt>
                  <dd className="text-sm font-medium text-gray-900">{orderDetails.orderNumber}</dd>
                </div>
                
                {/* Order date */}
                <div className="py-3 flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Date placed</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {new Date(orderDetails.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </dd>
                </div>
                
                {/* Total amount */}
                <div className="py-3 flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Total amount</dt>
                  <dd className="text-sm font-medium text-gray-900">
                  ₵{orderDetails.total?.toFixed(2)}
                  </dd>
                </div>
                
                {/* Payment method */}
                <div className="py-3 flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Payment method</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {orderDetails.paymentMethod === 'credit-card' ? 'Credit Card' : 
                     orderDetails.paymentMethod === 'paystack' ? 'Paystack' : 
                     orderDetails.paymentMethod}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
          
          {/* What's next section */}
          <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">What's next?</h2>
            <p className="text-gray-600 mb-6">
              We'll email you an order confirmation and updates about your delivery. You can also track your order by clicking the button below.
            </p>
            
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <button
                onClick={handleTrackOrder}
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Truck className="w-5 h-5 mr-2" />
                Track Order
              </button>
              
              <button
                onClick={handleContinueShopping}
                className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ShoppingBag className="w-5 h-5 mr-2" />
                Continue Shopping
              </button>
            </div>
          </div>
          
          {/* Need help section */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Need help?</h2>
            <p className="text-gray-600 mb-4">
              If you have any questions about your order, please contact our customer service team.
            </p>
            
            <div className="flex flex-col space-y-4">
              <a 
                href="mailto:support@example.com" 
                className="inline-flex items-center text-blue-600 hover:text-blue-800"
              >
                <Mail className="w-5 h-5 mr-2" />
                founder@sinosply.com
              </a>
              
              <a 
                href="tel:+1234567890" 
                className="inline-flex items-center text-blue-600 hover:text-blue-800"
              >
                <Phone className="w-5 h-5 mr-2" />
                +1 (234) 567-890
              </a>
            </div>
          </div>
        </div>
      </main>
      
      {/* Order details modal */}
      <OrderDetailsModal 
        isOpen={isOrderDetailsOpen}
        onClose={() => setIsOrderDetailsOpen(false)}
        orderDetails={orderDetails}
        onViewReceipt={handleViewReceipt}
        onContinueShopping={handleContinueShopping}
      />
      
      <Footer />
    </div>
  );
};

export default OrderConfirmationPage; 