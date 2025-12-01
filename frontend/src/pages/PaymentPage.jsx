import { useState, useEffect } from 'react';
import { ArrowLeft, Lock, Upload, Check, ExternalLink, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useOrderStore } from '../store/orderStore';
import apiConfig from '../config/apiConfig';
import axios from 'axios';
import SocketService from '../services/SocketService';

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('initial'); // initial, pending, receipt-uploaded, completed
  const [paymentUrl, setPaymentUrl] = useState('');
  const [paymentReceipt, setPaymentReceipt] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState('');
  const [receiptLink, setReceiptLink] = useState('');
  const [receiptType, setReceiptType] = useState('image'); // 'image' or 'link'
  const [formData, setFormData] = useState({
    amount: '',
    email: '',
    note: ''
  });
  
  const orderStore = useOrderStore();
  // Extract orderInfo from Zustand store instead of location.state
  const orderInfo = orderStore.orderInfo || {};

  // Extract product info from orderInfo instead of location state
  const productInfo = location.state?.productInfo || (() => {
    // If we have orderInfo with products, use the first product as the display product
    if (orderInfo && orderInfo.products && orderInfo.products.length > 0) {
      const firstProduct = orderInfo.products[0];
      return {
        name: firstProduct.name || 'Your Order',
        price: typeof firstProduct.price === 'number' ? `GH₵${firstProduct.price.toFixed(2)}` : firstProduct.price || 'GH₵0.00',
        image: firstProduct.image || 'https://via.placeholder.com/400x500',
        selectedColor: firstProduct.colorName ? '#000000' : '#000000',
        colorName: firstProduct.colorName || 'Default',
        size: firstProduct.size || '',
        quantity: firstProduct.quantity || 1,
        allVariants: [{
          color: '#000000',
          colorName: firstProduct.colorName || 'Default',
          image: firstProduct.image || 'https://via.placeholder.com/400x500',
          price: typeof firstProduct.price === 'number' ? `GH₵${firstProduct.price.toFixed(2)}` : firstProduct.price || 'GH₵0.00'
        }],
        currentVariantIndex: 0
      };
    }
    // Fallback to default
    return {
      name: 'Your Order',
      price: 'GH₵0.00',
      image: 'https://via.placeholder.com/400x500',
      selectedColor: '#000000',
      allVariants: [{
        color: '#000000',
        colorName: 'Default',
        image: 'https://via.placeholder.com/400x500',
        price: 'GH₵0.00'
      }],
      currentVariantIndex: 0
    };
  })();

  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [currentImage, setCurrentImage] = useState('');

  // Initialize with the clicked image and variant index
  useEffect(() => {
    // Log received data to help with debugging
    console.log("Payment page received state:", location.state);
    
    if (location.state?.productInfo) {
      setSelectedVariantIndex(location.state.productInfo.currentVariantIndex || 0);
      setCurrentImage(location.state.productInfo.image);
      setFormData(prev => ({
        ...prev,
        amount: location.state.productInfo.price?.replace(/[GH₵\s]/g, '') || '0',
        email: location.state.orderInfo?.contactInfo?.email || '',
        note: getOrderNote()
      }));
    }
  }, [location.state]);

  // Initialize form data from orderInfo when component mounts
  useEffect(() => {
    if (orderInfo) {
      setFormData({
        amount: orderInfo.total ? String(orderInfo.total).replace(/[GH₵\s]/g, '') : '0',
        email: orderInfo.customerInfo?.email || orderInfo.contactInfo?.email || '',
        note: getOrderNote()
      });
    }
  }, [orderInfo]);

  // Helper function to get note from order info
  const getOrderNote = () => {
    if (!orderInfo || !orderInfo.products) return 'Order payment';
    
    if (orderInfo.products.length === 1) {
      const product = orderInfo.products[0];
      return `${product.name} - ${product.size || ''} ${product.colorName || ''}`.trim();
    } else {
      return `Order with ${orderInfo.products.length} items`;
    }
  };

  // Helper function to parse price to a valid number
  const parsePrice = (price) => {
    if (typeof price === 'number') return price;
    if (!price || typeof price !== 'string') return 0;
    
    // Remove currency symbols and other non-numeric characters
    return parseFloat(price.replace(/[^0-9.-]+/g, '')) || 0;
  };

  // Fix: Handle missing or undefined properties safely
  const safelyFormatPrice = (price) => {
    if (price === undefined || price === null) return 'GH₵0.00';
    if (typeof price === 'string' && price.includes('GH₵')) return price;
    return `GH₵${typeof price === 'number' ? price.toFixed(2) : '0.00'}`;
  };

  const handleReceiptLinkChange = (e) => {
    const value = e.target.value;
    setReceiptLink(value);
    
    // If a valid Chipper Cash receipt link is entered, update payment status
    if (value && value.includes('pay.chippercash.com/api/pdfs/receipt')) {
      setReceiptType('link');
      setPaymentStatus('receipt-uploaded');
    }
  };

  const validateReceiptLink = () => {
    // Basic validation for Chipper Cash receipt link
    return receiptLink && receiptLink.includes('pay.chippercash.com/api/pdfs/receipt');
  };

  const handleChipperCashPayment = async () => {
    try {
      setIsProcessing(true);
      
      // Get the amount and note parameters
      const amount = parsePrice(orderInfo?.total || formData.amount);
      const note = formData.note || getOrderNote();
      const email = formData.email || orderInfo?.customerInfo?.email || orderInfo?.contactInfo?.email || '';
      
      // Create a transaction record with a unique ID
      const transactionId = `CHIP-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      
      // Store transaction details in localStorage (in a real app, this would be in your database)
      const transactionData = {
        id: transactionId,
        amount: amount,
        note: note,
        orderNumber: orderInfo?.orderNumber || `ORD-${Date.now()}`,
        createdAt: new Date().toISOString(),
        status: 'pending'
      };
      
      localStorage.setItem(`payment_${transactionId}`, JSON.stringify(transactionData));
      
      // Create a simple checksum to verify amount hasn't been tampered with
      const timestamp = Date.now();
      const simpleChecksum = btoa(`${amount}-${timestamp}-${transactionId}`).replace(/=/g, '');
      
      // Generate payment URL for Chipper Cash
      const paymentUrl = `https://pay.chippercash.com/user/4f2cacfa-e937-4c96-9b8f-58ddc24c4412?amount=${amount}&note=${encodeURIComponent(note)}&txn_id=${transactionId}&ts=${timestamp}&check=${simpleChecksum}`;
      
      // Set the payment URL and change state to pending
      setPaymentUrl(paymentUrl);
      setPaymentStatus('pending');
      
      // Open the payment URL in a new tab
      window.open(paymentUrl, '_blank');
      
      // After a short delay, stop the processing state
      setTimeout(() => {
        setIsProcessing(false);
      }, 500);
    } catch (error) {
      console.error('Chipper Cash payment error:', error);
      setIsProcessing(false);
    }
  };

  const handleReceiptUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    console.log('📷 Receipt upload - File selected:', {
      name: file.name,
      type: file.type,
      size: apiConfig.upload.formatFileSize(file.size)
    });
    
    // Check if file type is acceptable
    if (!apiConfig.upload.acceptedImageFormats.includes(file.type)) {
      alert(`Unsupported file type. Please upload ${apiConfig.upload.acceptedImageFormats.map(t => t.replace('image/', '.')).join(', ')}`);
      return;
    }
    
    setPaymentReceipt(file);
    setReceiptType('image');
    
    // Check file size against the maximum size in apiConfig
    const fileSizeMB = file.size / (1024 * 1024);
    const isLargeFile = file.size > apiConfig.upload.maxFileSize;
    
    if (isLargeFile) {
      // For very large files, warn the user
      console.log(`⚠️ Receipt upload - Large file detected (${fileSizeMB.toFixed(2)}MB)`);
      alert(`Warning: Your image is ${fileSizeMB.toFixed(2)}MB which is larger than our recommended size of ${apiConfig.upload.maxFileSize / (1024 * 1024)}MB. The image will be compressed.`);
    }
    
    // Compress if larger than 1MB or very large files
    if (file.size > 1024 * 1024) {
      console.log('🔄 Receipt upload - Starting image compression');
      compressImage(file)
        .then(compressedDataUrl => {
          const base64Size = compressedDataUrl.length * 0.75; // approximate size in bytes
          const compressedSizeMB = base64Size / (1024 * 1024);
          
          console.log(`✅ Receipt upload - Compression complete: ${fileSizeMB.toFixed(2)}MB → ${compressedSizeMB.toFixed(2)}MB`);
          setReceiptPreview(compressedDataUrl);
          
          // Check the size of the compressed data
          if (compressedSizeMB > 5) {
            console.warn(`⚠️ Receipt upload - Compressed image is still large: ${compressedSizeMB.toFixed(2)}MB`);
          }
          
          setPaymentStatus('receipt-uploaded');
        })
        .catch(err => {
          console.error("❌ Receipt upload - Image compression failed:", err);
          // Fall back to regular file reader
          const reader = new FileReader();
          reader.onloadend = () => {
            console.log('⚠️ Receipt upload - Using uncompressed image as fallback');
            setReceiptPreview(reader.result);
          };
          reader.readAsDataURL(file);
          setPaymentStatus('receipt-uploaded');
        });
    } else {
      // For small files, don't compress
      console.log('📷 Receipt upload - Small file, skipping compression');
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result);
        console.log('✅ Receipt upload - Image loaded successfully');
      };
      reader.readAsDataURL(file);
      setPaymentStatus('receipt-uploaded');
    }
  };

  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          // Calculate new dimensions using apiConfig settings
          const maxWidth = apiConfig.upload.maxImageWidth;
          const maxHeight = apiConfig.upload.maxImageHeight;
          let width = img.width;
          let height = img.height;
          
          // Calculate aspect ratio to maintain proportions
          const aspectRatio = width / height;
          
          // Resize based on whichever dimension exceeds max first
          if (width > maxWidth) {
            width = maxWidth;
            height = width / aspectRatio;
          }
          
          if (height > maxHeight) {
            height = maxHeight;
            width = height * aspectRatio;
          }
          
          // Create canvas for resizing
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          
          // Draw image on canvas
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Get compressed data URL (JPEG at quality from apiConfig)
          const compressedDataUrl = canvas.toDataURL('image/jpeg', apiConfig.upload.imageQuality);
          
          resolve(compressedDataUrl);
        };
        img.onerror = (error) => {
          reject(error);
        };
      };
      reader.onerror = (error) => {
        reject(error);
      };
    });
  };
  
  const handleMarkAsPaid = async () => {
    setIsProcessing(true);
    
    // In a real app, you would upload the receipt to your server here
    // For now, we'll simulate a successful upload and payment verification
    
    try {
      // Extract reference from receipt link if available
      let transactionId = `CHIP-MANUAL-${Date.now()}`;
      
      if (receiptType === 'link' && receiptLink) {
        // Try to extract the reference from the URL
        const urlParams = new URLSearchParams(new URL(receiptLink).search);
        const ref = urlParams.get('ref');
        if (ref) {
          transactionId = ref;
        }
      }

      console.log('💳 Payment - Marking as paid with receipt:', {
        receiptType,
        receiptImageSize: receiptType === 'image' ? apiConfig.upload.formatFileSize(receiptPreview?.length * 0.75 || 0) : 'N/A',
        receiptLink: receiptType === 'link' ? receiptLink : 'N/A',
        transactionId
      });
      
      // Create order data for confirmation
      const orderData = createOrderData(transactionId);
      
      // Send email notification - call backend API to send email
      try {
        console.log('📧 [PaymentPage] Preparing to send order confirmation email to:', orderData.customer.email);
        
        const emailData = {
          email: orderData.customer.email,
          subject: `Your Sinosply Order Confirmation - Order #${orderData.orderNumber}`,
          orderDetails: {
            orderNumber: orderData.orderNumber,
            date: orderData.date,
            items: orderData.items,
            customer: orderData.customer,
            shipping: orderData.shipping,
            subtotal: orderData.subtotal,
            tax: orderData.tax,
            discount: orderData.discount,
            total: orderData.total,
            shippingAddress: orderData.shippingAddress || {},
            paymentMethod: orderData.paymentMethod
          }
        };
        
        console.log('📧 [PaymentPage] Email data prepared:', {
          recipient: emailData.email,
          subject: emailData.subject,
          orderNumber: emailData.orderDetails.orderNumber,
          itemCount: emailData.orderDetails.items.length,
          total: emailData.orderDetails.total
        });
        
        console.log(`📧 [PaymentPage] Calling API endpoint: ${apiConfig.apiUrl}/api/v1/email/order-confirmation`);
        
        const response = await axios.post(`${apiConfig.apiUrl}/api/v1/email/order-confirmation`, emailData);
        
        if (response.data.success) {
          console.log('✅ [PaymentPage] Order confirmation email sent successfully:', {
            messageId: response.data.messageId,
            status: response.status
          });
        } else {
          console.error('❌ [PaymentPage] Failed to send order confirmation email:', {
            error: response.data.error,
            status: response.status
          });
        }
      } catch (emailError) {
        console.error('❌ [PaymentPage] Error sending order confirmation email:', {
          error: emailError.message,
          stack: emailError.stack
        });
        
        // Additional details about the request
        if (emailError.response) {
          console.error('❌ [PaymentPage] API response error details:', {
            status: emailError.response.status,
            data: emailError.response.data,
            headers: emailError.response.headers
          });
        } else if (emailError.request) {
          console.error('❌ [PaymentPage] API request error:', {
            request: emailError.request
          });
        }
        
        // Continue with order confirmation even if email fails
      }
      
      // Navigate to order confirmation
      navigateToOrderConfirmation('Chipper Cash', transactionId, formData.amount);
      
    } catch (error) {
      console.error('❌ Payment processing error:', error);
      setIsProcessing(false);
    }
  };

  const createOrderData = (transactionId) => {
    // Get user ID from localStorage if available
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    
    // Ensure numeric values for prices
    const calculatedAmount = parsePrice(formData.amount || 0);
    const subtotal = parsePrice(orderInfo?.subtotal || calculatedAmount);
    const shipping = parsePrice(orderInfo?.shipping || 0);
    const tax = parsePrice(orderInfo?.tax || 0);
    const discount = parsePrice(orderInfo?.discount || 0);
    const total = subtotal + shipping + tax - discount;
    
    // Process order items to ensure valid prices and quantities
    const processedItems = Array.isArray(orderInfo?.products) 
      ? orderInfo.products.map(item => ({
          id: item.id,
          name: item.name || 'Product',
          price: parsePrice(item.price),
          quantity: parseInt(item.quantity) || 1,
          image: item.image,
          colorName: item.colorName,
          size: item.size
        }))
      : [];

    // Generate order number if not already present
    const orderNumber = orderInfo?.orderNumber || `ORD-${Date.now().toString().slice(-6)}`;
      
    // Create payment receipt object
    const paymentReceipt = {
      type: receiptType, // 'image' or 'link'
      imageData: receiptType === 'image' ? receiptPreview : null,
      link: receiptType === 'link' ? receiptLink : null,
      uploadedAt: new Date()
    };

    // Create order details object
    return {
      id: transactionId,
      orderNumber: orderNumber,
      userId: userId,
      user: userId,
      date: new Date().toISOString(),
      paymentMethod: 'Chipper Cash',
      transactionId: transactionId,
      amount: calculatedAmount,
      subtotal: subtotal,
      shipping: shipping,
      tax: tax,
      discount: discount,
      total: total,
      items: processedItems.length > 0 ? processedItems : [{
        id: 'default-item',
        name: productInfo.name,
        price: parsePrice(productInfo.price),
        quantity: 1,
        image: productInfo.image,
        colorName: productInfo.colorName,
        size: productInfo.size
      }],
      customer: {
        name: orderInfo?.contactInfo?.name || 'Customer',
        email: formData.email || orderInfo?.contactInfo?.email || 'customer@example.com'
      },
      shippingAddress: orderInfo?.shippingAddress || null,
      billingAddress: orderInfo?.billingAddress || orderInfo?.shippingAddress || null,
      shippingMethod: orderInfo?.shippingMethod || 'Standard Shipping',
      paymentReceipt: paymentReceipt
    };
  };

  const navigateToOrderConfirmation = (paymentMethod, transactionId, amount) => {
    try {
      // Create order details for confirmation page
      const orderDetails = createOrderData(transactionId);
      
      // Update the payment status in the store
      orderStore.setPaymentStatus({
        status: 'success',
        userId: orderDetails.userId,
        transactionId: transactionId,
        paymentMethod: paymentMethod,
        date: new Date(),
        receiptType: receiptType,
        receiptImage: receiptType === 'image' ? receiptPreview : null,
        receiptLink: receiptType === 'link' ? receiptLink : null
      });
      
      // Create the order object to save
      const orderObject = {
        ...orderDetails,
        status: 'Processing',
        createdAt: new Date().toISOString(),
        customerEmail: formData.email || orderInfo?.contactInfo?.email || 'customer@example.com',
        customerName: orderInfo?.contactInfo?.name || 'Customer'
      };

      // Save the order to the store with user association
      console.log('💾 Order - Saving order to store with receipt included');
      orderStore.addOrder(orderObject);
      
      // Notify admins about the new order via socket
      try {
        // Initialize socket if needed (for guest users)
        const socket = SocketService.getSocket() || SocketService.initializeSocket('guest-user');
        if (socket && socket.connected) {
          console.log('🔌 Emitting new-order event via socket');
          socket.emit('new-order', { order: orderObject });
        } else {
          console.log('🔌 Socket not connected, using API fallback for notifying admins');
          // Fallback: Make a direct API call to notify about the new order
          axios.post(`${apiConfig.apiUrl}/api/v1/orders/notify-new-order`, {
            order: orderObject
          }).catch(err => console.error('Failed to notify about new order:', err));
        }
      } catch (socketError) {
        console.error('❌ Socket notification error:', socketError);
        // Continue with order process even if socket fails
      }
      
      console.log("🔄 Order - Navigating to order confirmation with:", {
        orderId: orderDetails.id, 
        orderNumber: orderDetails.orderNumber,
        hasReceipt: !!orderDetails.paymentReceipt,
        receiptType: orderDetails.paymentReceipt?.type
      });
      
      // Navigate to order confirmation page
      navigate('/order-confirmation', {
        state: { orderDetails }
      });
    } catch (error) {
      console.error('❌ Navigation error:', error);
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4 sm:mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Shopping
        </button>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Product Summary Section */}
            <div className="bg-gray-50 p-4 sm:p-8 flex flex-col">
              <div className="flex-1">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Order Summary</h2>
                
                {/* If we have multiple products from orderInfo, show them all */}
                {orderInfo && orderInfo.products && orderInfo.products.length > 0 ? (
                  <div className="space-y-4 mb-6">
                    {orderInfo.products.map((product, index) => (
                      <div key={index} className="flex items-center space-x-4">
                        <div className="w-16 h-16 overflow-hidden rounded-lg flex-shrink-0">
                          <img
                            src={product.image || 'https://via.placeholder.com/400x500'}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/150?text=Product';
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{product.name}</h3>
                          <p className="text-xs sm:text-sm text-gray-600 truncate">
                            {product.colorName && `Color: ${product.colorName}`} 
                            {product.size && product.colorName && ' | '} 
                            {product.size && `Size: ${product.size}`}
                            {product.quantity > 1 && ` | Qty: ${product.quantity}`}
                          </p>
                        </div>
                        <div className="font-medium text-sm sm:text-base whitespace-nowrap">
                          {typeof product.price === 'number' ? `GH₵${product.price.toFixed(2)}` : product.price}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="aspect-[3/4] max-w-sm mx-auto mb-6 overflow-hidden rounded-lg">
                    <img
                      src={currentImage || productInfo.image}
                      alt={productInfo.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('Image failed to load:', currentImage);
                        e.target.src = 'https://via.placeholder.com/400x500';
                      }}
                    />
                  </div>
                )}

                <div className="space-y-3 sm:space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm sm:text-base">Product</span>
                    <span className="font-medium text-sm sm:text-base">
                      {orderInfo && orderInfo.products && orderInfo.products.length > 1 
                        ? `${orderInfo.products.length} items` 
                        : productInfo.name}
                    </span>
                  </div>
                  
                  {!orderInfo.subtotal && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-sm sm:text-base">Price</span>
                      <span className="font-medium text-base sm:text-lg">
                        {productInfo.allVariants[selectedVariantIndex]?.price || productInfo.price}
                      </span>
                    </div>
                  )}
                  
                  {orderInfo && orderInfo.subtotal !== undefined && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-sm sm:text-base">Subtotal</span>
                      <span className="font-medium text-base sm:text-lg">{safelyFormatPrice(orderInfo.subtotal)}</span>
                    </div>
                  )}
                  
                  {orderInfo && orderInfo.shipping !== undefined && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-sm sm:text-base">Shipping</span>
                      <span className="font-medium text-base sm:text-lg">{safelyFormatPrice(orderInfo.shipping)}</span>
                    </div>
                  )}
                  
                  {orderInfo && orderInfo.tax !== undefined && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-sm sm:text-base">Tax</span>
                      <span className="font-medium text-base sm:text-lg">{safelyFormatPrice(orderInfo.tax)}</span>
                    </div>
                  )}
                  
                  {orderInfo && orderInfo.discount !== undefined && orderInfo.discount > 0 && (
                    <div className="flex justify-between items-center text-green-600">
                      <span className="text-sm sm:text-base">Discount</span>
                      <span className="font-medium text-base sm:text-lg">-{safelyFormatPrice(orderInfo.discount)}</span>
                    </div>
                  )}
                  
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm sm:text-base">Total</span>
                      <span className="font-bold text-lg sm:text-xl text-blue-600">
                        {orderInfo && orderInfo.total !== undefined
                          ? safelyFormatPrice(orderInfo.total)
                          : productInfo.allVariants[selectedVariantIndex]?.price || productInfo.price}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 sm:mt-8">
                <div className="flex items-center justify-center space-x-2 text-xs sm:text-sm text-gray-500">
                  <Lock className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Secure Checkout</span>
                </div>
              </div>
          </div>

            {/* Payment Section */}
          <div className="p-4 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Payment Method</h2>
            
              <div className="mb-6 sm:mb-8">
                {/* Payment Status Indicator */}
                {paymentStatus !== 'initial' && (
                  <div className="mb-6">
                    <div className="flex items-center mb-4">
                      <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 mr-3">
                        <span className="text-base sm:text-lg font-semibold">1</span>
                      </div>
                      <div className="flex-grow min-w-0">
                        <h4 className="font-medium text-sm sm:text-base">Make Payment</h4>
                        <p className="text-xs sm:text-sm text-gray-500">Pay via Chipper Cash</p>
                      </div>
                      <div className={`ml-3 ${paymentUrl ? 'text-green-500' : 'text-gray-400'}`}>
                        {paymentUrl && <Check className="h-5 w-5" />}
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-full ${(receiptPreview || receiptLink) ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'} mr-3`}>
                        <span className="text-base sm:text-lg font-semibold">2</span>
                      </div>
                      <div className="flex-grow min-w-0">
                        <h4 className="font-medium text-sm sm:text-base">Verify Payment</h4>
                        <p className="text-xs sm:text-sm text-gray-500 truncate">Share receipt link or upload screenshot</p>
                      </div>
                      <div className={`ml-3 ${(receiptPreview || validateReceiptLink()) ? 'text-green-500' : 'text-gray-400'}`}>
                        {(receiptPreview || validateReceiptLink()) && <Check className="h-5 w-5" />}
                      </div>
                    </div>
                  </div>
                )}

                {paymentStatus === 'initial' && (
                  <>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                  <p className="text-green-800 text-sm sm:text-base">
                    You'll be redirected to Chipper Cash to complete your payment safely and securely. PLEASE COME BACK HERE TO UPLOAD YOUR RECEIPT!!
                  </p>
                </div>
                
                <div className="mb-4 sm:mb-6">
                  <img 
                        src="https://play-lh.googleusercontent.com/EzUq7fHrWw2DQR9KfTu3-vhpwOn5Ffiyd9rYHVlphPItqBqMBZP4o5XWQhPCFikPbNID" 
                    alt="Chipper Cash" 
                    className="h-8 sm:h-10 mx-auto mb-2 sm:mb-4"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/200x50?text=Chipper+Cash';
                    }}
                  />
                  <p className="text-center text-xs sm:text-sm text-gray-600">
                    Fast, secure payments across Africa
                  </p>
            </div>

                    <div className="py-3 sm:py-4 px-4 sm:px-6 bg-blue-50 rounded-lg mb-4 sm:mb-6">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700 text-sm sm:text-base">Order Total:</span>
                        <span className="font-bold text-base sm:text-lg">{safelyFormatPrice(orderInfo?.total || formData.amount)}</span>
                    </div>
                      <div className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-500">
                        Payment will be processed through Chipper Cash
                    </div>
                  </div>

                <button
                  type="button"
                  onClick={handleChipperCashPayment}
                  disabled={isProcessing}
                  className="w-full bg-[#0066F5] text-white py-3 sm:py-4 px-4 rounded-xl hover:bg-blue-700 transition-colors duration-200 disabled:bg-blue-300 disabled:cursor-not-allowed font-medium text-base sm:text-lg mt-4 sm:mt-6"
                >
                  {isProcessing ? (
                    <div className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 sm:h-5 sm:w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Processing...
                    </div>
                  ) : (
                    `Pay with MoMo ${safelyFormatPrice(orderInfo?.total || formData.amount)}`
                  )}
                </button>
                
                <p className="mt-3 text-center text-sm text-gray-600">
                  <AlertCircle className="inline w-4 h-4 mr-1 text-red-500" />
                  You <strong>MUST</strong> return to this page after payment to complete your order
                </p>
                  </>
                )}

                {paymentStatus === 'pending' && (
                  <div className="space-y-4 sm:space-y-6">
                    <div className="bg-red-100 border-2 border-red-500 rounded-lg p-3 sm:p-4">
                      <p className="text-red-700 font-bold mb-2 text-base sm:text-lg">
                        IMPORTANT: YOU MUST RETURN HERE AFTER PAYMENT!
                      </p>
                      <p className="text-red-700 mb-2 text-sm sm:text-base">
                        Your order is NOT complete until you upload your receipt or provide the receipt link below.
                      </p>
                      <p className="text-blue-800 mb-2 text-sm sm:text-base">
                        Please complete your payment on Chipper Cash. After payment, provide the receipt link or upload a screenshot below.
                      </p>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                        <button
                          onClick={() => window.open(paymentUrl, '_blank')}
                          className="flex items-center text-blue-600 hover:underline text-sm font-medium"
                        >
                          Re-open payment page <ExternalLink className="w-3 h-3 ml-1" />
                        </button>
                        <button
                          onClick={() => setPaymentStatus('initial')}
                          className="text-sm text-gray-600 hover:text-gray-800"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                    
                    <div className="border-t border-b border-gray-200 py-4 sm:py-6">
                      <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">Verify Your Payment</h3>
                      
                      <div className="space-y-4 sm:space-y-6">
                        {/* Receipt Link Option */}
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                            Enter Receipt Link
                          </label>
                          <div className="relative rounded-md">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <LinkIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                            </div>
                            <input
                              type="url"
                              placeholder="https://pay.chippercash.com/api/pdfs/receipt?ref=..."
                              value={receiptLink}
                              onChange={handleReceiptLinkChange}
                              className="block w-full pl-10 py-2 sm:py-3 px-3 sm:px-4 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                            />
                          </div>
                          <p className="mt-1 text-xs text-gray-500">
                            You can find this link in your Chipper Cash transaction receipt
                          </p>
                        </div>
                        
                        <div className="flex items-center">
                          <span className="flex-grow border-t border-gray-300"></span>
                          <span className="mx-4 text-gray-600 text-xs sm:text-sm">OR</span>
                          <span className="flex-grow border-t border-gray-300"></span>
                        </div>
                        
                        {/* Screenshot Upload Option */}
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center">
                          <input
                            type="file"
                            id="receipt-upload"
                            accept="image/*"
                            className="hidden"
                            onChange={handleReceiptUpload}
                          />
                          <label 
                            htmlFor="receipt-upload"
                            className="cursor-pointer flex flex-col items-center justify-center"
                          >
                            <Upload className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400 mb-2 sm:mb-3" />
                            <p className="text-xs sm:text-sm text-gray-700 font-medium">
                              Click to upload receipt screenshot
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              PNG, JPG or JPEG up to 5MB
                            </p>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {paymentStatus === 'receipt-uploaded' && (
                  <div className="space-y-4 sm:space-y-6">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
                      <p className="text-green-800 text-sm sm:text-base">
                        Receipt {receiptType === 'image' ? 'uploaded' : 'link added'} successfully! Please review and confirm your payment.
                      </p>
                    </div>
                    
                    <div className="border rounded-lg p-3 sm:p-4">
                      <h3 className="text-base sm:text-lg font-medium mb-2 sm:mb-3">Payment Receipt</h3>
                      
                      <div className="mb-3 sm:mb-4">
                        {receiptType === 'image' && receiptPreview ? (
                          <img 
                            src={receiptPreview} 
                            alt="Payment receipt" 
                            className="w-full max-h-48 sm:max-h-64 object-contain rounded-md border border-gray-200" 
                          />
                        ) : receiptType === 'link' && receiptLink ? (
                          <div className="w-full">
                            <div className="mb-2 flex items-center justify-between">
                              <span className="text-blue-600 text-xs sm:text-sm overflow-hidden text-ellipsis max-w-[200px] sm:max-w-none">{receiptLink}</span>
                              <button
                                onClick={() => window.open(receiptLink, '_blank')}
                                className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 whitespace-nowrap ml-2"
                              >
                                Open <ExternalLink className="inline h-3 w-3" />
                              </button>
                            </div>
                            <iframe
                              src={receiptLink}
                              className="w-full h-48 sm:h-64 border border-gray-200 rounded-md"
                              title="Chipper Cash Receipt"
                            />
                          </div>
                        ) : (
                          <div className="text-center py-6 sm:py-8 text-gray-500 text-sm">
                            No receipt provided
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:items-center gap-3">
                        <button 
                          onClick={() => {
                            if (receiptType === 'image') {
                              setPaymentReceipt(null);
                              setReceiptPreview('');
                            } else {
                              setReceiptLink('');
                            }
                            setPaymentStatus('pending');
                          }}
                          className="text-sm text-gray-600 hover:text-gray-800 text-center sm:mr-3"
                        >
                          Change
                        </button>
                        
                        <button
                          onClick={handleMarkAsPaid}
                          disabled={isProcessing || (receiptType === 'link' && !validateReceiptLink())}
                          className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:bg-green-300 disabled:cursor-not-allowed font-medium text-sm"
                        >
                          {isProcessing ? (
                            <div className="flex items-center justify-center">
                              <svg
                                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                              Processing...
                            </div>
                          ) : (
                            'Mark as Paid'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="text-center mt-4">
                  <div className="flex items-center justify-center">
                    <Lock className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 mr-1 sm:mr-2" />
                    <span className="text-xs sm:text-sm text-gray-500">Your payment is secured with SSL encryption</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
