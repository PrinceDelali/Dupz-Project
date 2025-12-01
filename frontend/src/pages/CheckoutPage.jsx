import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  User, 
  MapPin, 
  Truck, 
  ShoppingBag, 
  CreditCard, 
  Clock, 
  ChevronRight, 
  ChevronDown, 
  Check, 
  Info,
  ArrowLeft,
  Eye,
  EyeOff,
  Loader
} from 'lucide-react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { register } from '../services/auth';
import { useAuth } from '../context/AuthContext';
import { useOrderStore } from '../store/orderStore';
import { useSettingsStore } from '../store/settingsStore';
import { useCouponStore } from '../store/couponStore';
import axios from 'axios';
import { CURRENCY_SYMBOL } from '../config/constants';

const CheckoutPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const orderStore = useOrderStore();
  const { 
    defaultTaxRate, 
    fetchTaxRates, 
    getTaxRateForCountry, 
    loading: settingsLoading,
  } = useSettingsStore();
  
  // Coupon store integration
  const {
    validateCoupon,
    applyCoupon,
    activeCoupon,
    clearActiveCoupon,
    loading: couponLoading,
    error: couponStoreError,
  } = useCouponStore();
  
  // Check if coming from cart or product page
  const isFromCart = location.state?.fromCart || false;
  const cartItems = location.state?.cartItems || [];
  
  console.log("Initial checkout state:", { 
    isFromCart, 
    cartItemsLength: cartItems?.length || 0,
    locationState: location.state,
    productInfo: location.state?.productInfo
  });
  
  // Get product info from location state or use cart items
  const productInfo = !isFromCart ? (location.state?.productInfo || {
    id: 'sample-id',
    name: 'Sample Product',
    price: 'GH₵0.00',
    image: 'https://via.placeholder.com/400x500',
    selectedColor: '#000000',
    colorName: 'Black',
    size: 'M',
    quantity: 1,
    variants: [],
    currentVariantIndex: 0
  }) : null;
  
  // Form states
  const [step, setStep] = useState(1); // 1: Contact, 2: Shipping, 3: Delivery, 4: Review
  const [contactInfo, setContactInfo] = useState({
    email: user?.email || '',
    phone: ''
  });
  
  // Account creation states for guest users
  const [createAccount, setCreateAccount] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [registrationError, setRegistrationError] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  
  const [addressInfo, setAddressInfo] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Ghana'
  });
  
  const [shippingMethod, setShippingMethod] = useState('');
  const [shippingCost, setShippingCost] = useState(0);
  const [estimatedDelivery, setEstimatedDelivery] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [isCouponLoading, setIsCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [taxRate, setTaxRate] = useState(defaultTaxRate); // Use default tax rate from settings
  const [subtotal, setSubtotal] = useState(0);
  const [total, setTotal] = useState(0);
  const [formError, setFormError] = useState('');
  
  // Add state for shipping methods loading
  const [shippingMethodsLoading, setShippingMethodsLoading] = useState(false);
  const [shippingLoadingError, setShippingLoadingError] = useState(false);
  
  // Update form fields when user logs in or changes
  useEffect(() => {
    if (user) {
      // Pre-fill contact info
      setContactInfo(prevInfo => ({
        ...prevInfo,
        email: user.email || prevInfo.email
      }));
      
      // Pre-fill address info
      setAddressInfo(prevInfo => ({
        ...prevInfo,
        firstName: user.firstName || prevInfo.firstName,
        lastName: user.lastName || prevInfo.lastName
      }));
      
      console.log('CheckoutPage - Populated form with user data:', {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      });
    }
  }, [user]);
  
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  // Scroll to top when step changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);
  
  // Fetch shipping methods from settings
  useEffect(() => {
    // We only need to fetch tax rates, not shipping methods since we're using product-specific shipping
    fetchTaxRates();
  }, [fetchTaxRates]);
  
  // Shipping methods with product-specific pricing
  const availableShippingMethods = [
    {
      id: 'air',
      name: 'Air Shipping',
      description: 'Fast delivery by air',
      price: 0, // Will be calculated based on products
      carrier: 'DHL',
      estimatedDelivery: 'Calculated based on products',
      type: 'air'
    },
    {
      id: 'sea',
      name: 'Sea Shipping',
      description: 'Economic shipping by sea',
      price: 0, // Will be calculated based on products
      carrier: 'Maersk',
      estimatedDelivery: 'Calculated based on products',
      type: 'sea'
    },
    // {
    //   id: 'express',
    //   name: 'Local Express Delivery',
    //   description: '1-2 business days (local only)',
    //   price: 14.99,
    //   carrier: 'FedEx',
    //   estimatedDelivery: '1-2 business days'
    // },
    // {
    //   id: 'standard',
    //   name: 'Local Standard Delivery',
    //   description: '3-5 business days (local only)',
    //   price: 5.99,
    //   carrier: 'DHL',
    //   estimatedDelivery: '3-5 business days'
    // }
  ];
  
  // Available countries
  const countries = [
    { code: 'GH', name: 'Ghana' },
    { code: 'NG', name: 'Nigeria' },
    { code: 'KE', name: 'Kenya' },
    { code: 'ZA', name: 'South Africa' },
    { code: 'CI', name: 'Côte d\'Ivoire' },
    { code: 'UK', name: 'United Kingdom' },
    { code: 'US', name: 'United States' }
  ];
  
  // Update tax rate when country changes
  useEffect(() => {
    if (addressInfo.country) {
      const countryCode = countries.find(c => c.name === addressInfo.country)?.code;
      if (countryCode) {
        const newTaxRate = getTaxRateForCountry(countryCode);
        setTaxRate(newTaxRate);
        console.log(`Tax rate updated for ${addressInfo.country} (${countryCode}): ${newTaxRate * 100}%`);
      }
    } else {
      // When no country is selected, use the default tax rate
      setTaxRate(defaultTaxRate);
      console.log(`Using default tax rate: ${defaultTaxRate * 100}%`);
    }
  }, [addressInfo.country, getTaxRateForCountry, countries, defaultTaxRate]);
  
  // Add a separate useEffect to initialize tax rate with defaultTaxRate
  useEffect(() => {
    // Initialize tax rate when defaultTaxRate changes
    if (defaultTaxRate !== undefined) {
      console.log(`Default tax rate changed: ${defaultTaxRate * 100}%`);
      // Only update if we don't have a country-specific rate
      if (!addressInfo.country) {
        setTaxRate(defaultTaxRate);
      }
    }
  }, [defaultTaxRate, addressInfo.country]);
  
  // Calculate pricing
  useEffect(() => {
    let calculatedSubtotal = 0;
    
    if (isFromCart) {
      // Calculate from cart items
      calculatedSubtotal = location.state?.cartTotal || 0;
      
      // If cartTotal is not provided but we have cartItems, calculate from items
      if (calculatedSubtotal === 0 && cartItems.length > 0) {
        calculatedSubtotal = cartItems.reduce((total, item) => {
          // Handle both € and GH₵ currency symbols
          const price = parseFloat(item.price?.toString().replace(/[€GH₵\s]/g, '').replace(/,/g, '.') || 0);
          return total + (price * item.quantity);
        }, 0);
      }
    } else {
      // Calculate from single product
      // Handle both € and GH₵ currency symbols
      const price = parseFloat(productInfo.price?.toString().replace(/[€GH₵\s]/g, '').replace(/,/g, '.') || 0);
      const quantity = productInfo.quantity || 1;
      calculatedSubtotal = price * quantity;
    }
    
    setSubtotal(calculatedSubtotal);
    
    // Calculate tax using the current tax rate (from settings)
    const calculatedTax = calculatedSubtotal * taxRate;
    
    // Make sure discount is a number
    const discountValue = typeof discount === 'number' ? discount : 0;
    
    // Calculate total
    const calculatedTotal = calculatedSubtotal + shippingCost + calculatedTax - discountValue;
    setTotal(calculatedTotal);
  }, [productInfo, shippingCost, discount, taxRate, isFromCart, location.state, cartItems]);
  
  // Update the calculateShippingDetails function to properly access product shipping data with better logging
  const calculateShippingDetails = (method, products) => {
    // If not air or sea shipping, return the standard price and delivery time
    if (method.id !== 'air' && method.id !== 'sea') {
      return {
        price: method.price,
        estimatedDelivery: method.estimatedDelivery
      };
    }

    console.log(`🚢 SHIPPING: Calculating ${method.id.toUpperCase()} shipping for ${products.length} products`);
    
    let totalPrice = 0;
    let maxDuration = 0;
    let hasValidShippingData = false;
    
    // Calculate the shipping price and find the maximum duration for all products
    products.forEach(product => {
      // Get product details from cart or single product
      const productDetails = isFromCart 
        ? cartItems.find(item => item.id === product.id || item._id === product.id)
        : productInfo;
      
      if (!productDetails) {
        console.warn('⚠️ SHIPPING: Product details not found for', product);
        return;
      }
      
      console.log(`🚢 SHIPPING: Processing product for shipping calculation:`, {
        id: productDetails.id || productDetails._id,
        name: productDetails.name,
        quantity: productDetails.quantity || 1,
        airShippingPrice: productDetails.airShippingPrice,
        airShippingDuration: productDetails.airShippingDuration,
        seaShippingPrice: productDetails.seaShippingPrice,
        seaShippingDuration: productDetails.seaShippingDuration
      });
      
      // Calculate price based on shipping method (air or sea)
      const quantity = productDetails.quantity || 1;
      
      if (method.id === 'air') {
        // Use air shipping price from the product
        const airShippingPrice = parseFloat(productDetails.airShippingPrice || 0);
        const airShippingDuration = parseInt(productDetails.airShippingDuration || 0);
        
        // Consider shipping data valid only if BOTH price AND duration are set and price is > 0
        if (productDetails.airShippingPrice !== undefined && 
            productDetails.airShippingPrice !== null && 
            productDetails.airShippingPrice !== '' &&
            airShippingPrice > 0 &&
            productDetails.airShippingDuration !== undefined && 
            productDetails.airShippingDuration !== null && 
            productDetails.airShippingDuration !== '' &&
            airShippingDuration > 0) {
          hasValidShippingData = true;
        totalPrice += airShippingPrice * quantity;
        maxDuration = Math.max(maxDuration, airShippingDuration);
        
          console.log(`✅ AIR SHIPPING AVAILABLE: Product "${productDetails.name}" - Price: ${airShippingPrice} × ${quantity} = ${airShippingPrice * quantity} GHS, Duration: ${airShippingDuration} days`);
        } else {
          console.log(`❌ AIR SHIPPING UNAVAILABLE for "${productDetails.name}": Price=${airShippingPrice}, Duration=${airShippingDuration}`);
        }
      } else {
        // Use sea shipping price from the product
        const seaShippingPrice = parseFloat(productDetails.seaShippingPrice || 0);
        const seaShippingDuration = parseInt(productDetails.seaShippingDuration || 0);
        
        // Consider shipping data valid only if BOTH price AND duration are set and price is > 0
        if (productDetails.seaShippingPrice !== undefined && 
            productDetails.seaShippingPrice !== null && 
            productDetails.seaShippingPrice !== '' &&
            seaShippingPrice > 0 &&
            productDetails.seaShippingDuration !== undefined && 
            productDetails.seaShippingDuration !== null && 
            productDetails.seaShippingDuration !== '' &&
            seaShippingDuration > 0) {
          hasValidShippingData = true;
        totalPrice += seaShippingPrice * quantity;
        maxDuration = Math.max(maxDuration, seaShippingDuration);
        
          console.log(`✅ SEA SHIPPING AVAILABLE: Product "${productDetails.name}" - Price: ${seaShippingPrice} × ${quantity} = ${seaShippingPrice * quantity} GHS, Duration: ${seaShippingDuration} days`);
        } else {
          console.log(`❌ SEA SHIPPING UNAVAILABLE for "${productDetails.name}": Price=${seaShippingPrice}, Duration=${seaShippingDuration}`);
        }
      }
    });
    
    // Remove fallback values - don't show shipping methods if no valid data
    if (!hasValidShippingData) {
      console.log(`⚠️ SHIPPING: No valid shipping data found for ${method.id} shipping - not showing this method`);
      return {
        price: 0,
        estimatedDelivery: '',
        hasValidShippingData: false
      };
    }
    
    // If no valid duration found but shipping is otherwise valid (shouldn't happen with our validation)
    if (maxDuration === 0 && hasValidShippingData) {
      console.warn(`⚠️ SHIPPING: Valid shipping found but no duration - using fallback duration`);
      maxDuration = method.id === 'air' ? 7 : 30;
    }
    
    console.log(`🚢 SHIPPING: Final calculation for ${method.id} shipping: Price: ${totalPrice} GHS, Duration: ${maxDuration} days`);
    console.log(`🚢 SHIPPING: Products have valid shipping data set: ${hasValidShippingData ? 'YES' : 'NO'}`);
    
    return {
      price: totalPrice,
      estimatedDelivery: `${maxDuration} days`,
      hasValidShippingData
    };
  };

  // Update handleShippingMethodSelect to use the new calculation
  const handleShippingMethodSelect = (methodId) => {
    setShippingMethod(methodId);
    
    // Find the selected shipping method from the store's shipping methods
    const method = availableShippingMethods.find(m => m.id === methodId);
    
    if (method) {
      // If there was a free shipping coupon applied, reset it when changing shipping methods
      if (appliedCoupon && appliedCoupon.code === 'FREESHIP') {
        console.log('🛑 [CheckoutPage] Resetting free shipping coupon as shipping method changed');
        setCouponSuccess('');
        setCouponCode('');
        setAppliedCoupon(null);
        clearActiveCoupon();
      }
      
      // Get products for shipping calculation - include full product objects with shipping data
      let productsForShipping;
      
      if (isFromCart) {
        console.log('🛒 CHECKOUT: Getting shipping data for cart items');
        productsForShipping = cartItems.map(item => {
          console.log(`📦 CART ITEM SHIPPING DATA:`, {
            id: item.id || item._id,
            name: item.name,
            airShippingPrice: item.airShippingPrice,
            airShippingDuration: item.airShippingDuration,
            seaShippingPrice: item.seaShippingPrice,
            seaShippingDuration: item.seaShippingDuration
          });
          return item;
        });
      } else {
        console.log('🛍️ CHECKOUT: Getting shipping data for single product');
        console.log(`📦 PRODUCT SHIPPING DATA:`, {
          id: productInfo.id || productInfo._id,
          name: productInfo.name,
          airShippingPrice: productInfo.airShippingPrice,
          airShippingDuration: productInfo.airShippingDuration,
          seaShippingPrice: productInfo.seaShippingPrice,
          seaShippingDuration: productInfo.seaShippingDuration
        });
        productsForShipping = [productInfo];
      }
      
      const shippingDetails = calculateShippingDetails(method, productsForShipping);
      
      setShippingCost(shippingDetails.price);
      setEstimatedDelivery(shippingDetails.estimatedDelivery);
      console.log(`✅ CHECKOUT: Selected shipping method: ${method.name}, price: ${shippingDetails.price}, delivery: ${shippingDetails.estimatedDelivery}`);
    }
  };
  
  // Handle contact form change
  const handleContactChange = (e) => {
    const { name, value } = e.target;
    setContactInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle phone input change
  const handlePhoneChange = (value) => {
    setContactInfo(prev => ({
      ...prev,
      phone: value
    }));
  };
  
  // Handle password change
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    if (name === 'password') {
      setPassword(value);
    } else if (name === 'confirmPassword') {
      setConfirmPassword(value);
    }
    
    // Clear any previous error messages
    setPasswordError('');
    setRegistrationError('');
  };
  
  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  // Function to handle guest registration
  const handleGuestRegistration = async () => {
    try {
      if (password !== confirmPassword) {
        setPasswordError('Passwords do not match');
        return false;
      }

      if (password.length < 6) {
        setPasswordError('Password must be at least 6 characters');
        return false;
      }

      setRegistrationLoading(true);
      
      // Create user account with shipping address information
      const userData = {
        firstName: addressInfo.firstName,
        lastName: addressInfo.lastName,
        email: contactInfo.email,
        phoneNumber: contactInfo.phone,
        password,
      };

      await register(userData);
      setRegistrationSuccess(true);
      setRegistrationLoading(false);
      setIsNewUser(true);
      
      return true;
    } catch (error) {
      console.error('Error during registration:', error);
      setRegistrationError(
        error.response?.data?.message || 
        'Registration failed. Please try again.'
      );
      setRegistrationLoading(false);
      return false;
    }
  };
  
  // Handle address form change
  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setAddressInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle coupon code application
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }
    
    try {
      setIsCouponLoading(true);
      setCouponError('');
      setCouponSuccess('');
      
      const result = await validateCoupon(couponCode.trim(), subtotal);
      
      if (result.success) {
        const coupon = result.data.coupon;
        const calculatedDiscount = result.discount;
      
      // Update state with discount
      setDiscount(calculatedDiscount);
      setDiscountType(coupon.discountType);
      setAppliedCoupon(coupon);
      setCouponSuccess(`Coupon applied! ${coupon.discountType === 'percentage' ? 
        `${coupon.discountValue}% off` : 
          `${CURRENCY_SYMBOL}${Number(coupon.discountValue).toFixed(2)} off`}`);
      
      if (coupon.code === 'FREESHIP') {
        setShippingCost(0);
        setCouponSuccess('Free shipping coupon applied successfully!');
      }
      } else {
        // Error handling for failed validation
        setCouponError(result.error || 'Invalid coupon code');
      }
    } catch (err) {
      console.error('Error validating coupon:', err);
      setCouponError(couponStoreError || 'Error validating coupon. Please try again.');
    } finally {
      setIsCouponLoading(false);
    }
  };
  
  // Function to handle moving to the next step
  const handleNextStep = async () => {
    // Validate current step before proceeding
    switch (step) {
      case 1: // Contact Information
        if (!contactInfo.email || !contactInfo.phone) {
          setFormError('Please fill in all required fields');
          return;
        }
        
        // Clear any previous errors
        setFormError('');
        setStep(2);
        // Scroll to top when moving to next step
        window.scrollTo(0, 0);
        break;
        
      case 2: // Shipping Address
        if (!addressInfo.firstName || !addressInfo.lastName || !addressInfo.address1 || 
            !addressInfo.city || !addressInfo.state || !addressInfo.zipCode || !addressInfo.country) {
          setFormError('Please fill in all required shipping address fields');
          return;
        }
        
        // If user opted to create an account and is not logged in, register them now
        if (createAccount && !user && !registrationSuccess) {
          const registrationSuccessful = await handleGuestRegistration();
          if (!registrationSuccessful) {
            // Registration failed, don't proceed to next step
            return;
          }
        }
        
        setFormError('');
        setStep(3);
        // Scroll to top when moving to next step
        window.scrollTo(0, 0);
        break;
        
      case 3: // Shipping Method
        if (!shippingMethod) {
          setFormError('Please select a shipping method');
          return;
        }
        
        // Check if the selected shipping method is valid
        const productsForShipping = isFromCart ? cartItems : [productInfo];
        const method = availableShippingMethods.find(m => m.id === shippingMethod);
        
        if (!method) {
          setFormError('Invalid shipping method selected');
          return;
        }
        
        const shippingDetails = calculateShippingDetails(method, productsForShipping);
        if (!shippingDetails.hasValidShippingData) {
          setFormError('The selected shipping method is not available for your products');
          return;
        }
        
        setFormError('');
        setStep(4);
        // Scroll to top when moving to next step
        window.scrollTo(0, 0);
        break;
        
      case 4: // Review & Payment
        // Handle submission and navigate to payment
        navigateToPayment();
        break;
        
      default:
        break;
    }
  };
  
  // Go back to previous step
  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1);
      // Scroll to top when moving to previous step
      window.scrollTo(0, 0);
    } else {
      // Go back to cart or product page
      if (isFromCart) {
        navigate('/cart');
      } else {
        navigate(-1);
      }
    }
  };
  
  // Function to navigate to the payment page
  const navigateToPayment = async () => {
    try {
      setFormError('');
      
      console.log("Cart items debug:", {
        isFromCart,
        cartItems,
        cartItemsLength: cartItems ? cartItems.length : 0,
        cartItemsType: typeof cartItems,
        productInfo
      });
      
      // Check if we have valid items to proceed with
      if (isFromCart && (!cartItems || cartItems.length === 0)) {
        setFormError('Cart is empty. Please add items to your cart.');
        return;
      }
      
      if (!isFromCart && !productInfo) {
        setFormError('Product information is missing. Please go back and try again.');
        return;
      }
      
      // Create orderProducts array based on cart or single product
      const orderProducts = isFromCart 
        ? cartItems.map(item => ({
            id: item.id || item._id,
            name: item.name,
            price: parseFloat(typeof item.price === 'string' ? item.price.replace(/[€GH₵\s]/g, '') : item.price),
            quantity: item.quantity,
            image: item.image,
            colorName: item.colorName,
            size: item.size,
            // Include shipping information
            airShippingPrice: parseFloat(item.airShippingPrice || 0),
            airShippingDuration: parseInt(item.airShippingDuration || 0),
            seaShippingPrice: parseFloat(item.seaShippingPrice || 0),
            seaShippingDuration: parseInt(item.seaShippingDuration || 0)
          }))
        : [{
            id: productInfo.id || productInfo._id,
            name: productInfo.name,
            price: parseFloat(typeof productInfo.price === 'string' ? productInfo.price.replace(/[€GH₵\s]/g, '').replace(/,/g, '.') : productInfo.price),
            quantity: productInfo.quantity || 1,
            image: productInfo.image,
            colorName: productInfo.colorName || 'Default',
            size: productInfo.size || 'One Size',
            // Include shipping information
            airShippingPrice: parseFloat(productInfo.airShippingPrice || 0),
            airShippingDuration: parseInt(productInfo.airShippingDuration || 0),
            seaShippingPrice: parseFloat(productInfo.seaShippingPrice || 0),
            seaShippingDuration: parseInt(productInfo.seaShippingDuration || 0)
          }];

      // Calculate subtotal
      const subtotalCalc = isFromCart
        ? cartItems.reduce((total, item) => {
            // Handle both € and GH₵ currency symbols
            const price = parseFloat(typeof item.price === 'string' ? item.price.replace(/[€GH₵\s]/g, '') : item.price);
            return total + (price * item.quantity);
          }, 0)
        : parseFloat(typeof productInfo.price === 'string' ? productInfo.price.replace(/[€GH₵\s]/g, '') : productInfo.price) * (productInfo.quantity || 1);

      // Get the selected shipping method object from the store
      const selectedShippingMethod = availableShippingMethods.find(method => method.id === shippingMethod);
      
      // If no shipping method is selected or not found, show error
      if (!selectedShippingMethod) {
        setFormError('Please select a shipping method');
        return;
      }
      
      // Calculate tax using country-specific rate
      const countryCode = addressInfo.country ? countries.find(c => c.name === addressInfo.country)?.code : null;
      const appliedTaxRate = countryCode ? getTaxRateForCountry(countryCode) : defaultTaxRate;
      const taxCalc = subtotalCalc * appliedTaxRate;
      
      // Apply discount if any
      const discountAmount = discount || 0;
      
      // Calculate total
      const totalCalc = subtotalCalc + shippingCost + taxCalc - discountAmount;
      
      // Track coupon usage if a coupon was applied
      if (appliedCoupon && appliedCoupon._id) {
        try {
          // Increment the usage counter for this coupon
          await applyCoupon(appliedCoupon._id);
          console.log('Coupon usage recorded:', appliedCoupon.code);
        } catch (error) {
          console.error('Error recording coupon usage:', error);
          // Continue with checkout even if coupon tracking fails
        }
      }

      console.log('Order details:', {
        products: orderProducts,
        subtotal: subtotalCalc,
        shippingCost: selectedShippingMethod.price,
        shippingMethod: selectedShippingMethod.name,
        shippingType: selectedShippingMethod.type || 'standard', // Include shipping type (air/sea)
        tax: taxCalc,
        taxRate: appliedTaxRate,
        discount: discountAmount,
        total: totalCalc,
        appliedCoupon: appliedCoupon ? appliedCoupon.code : 'None'
      });

      // Construct order info
      const orderInfo = {
        products: orderProducts.map(product => ({
          id: product.id || `PROD-${Math.random().toString(36).substr(2, 9)}`,
          name: product.name,
          price: product.price,
          quantity: product.quantity,
          image: product.image,
          variant: {
            color: product.colorName || product.selectedColor,
            size: product.size
          }
        })),
        contactInfo: {
          email: contactInfo.email,
          phone: contactInfo.phone
        },
        shippingAddress: {
          firstName: addressInfo.firstName,
          lastName: addressInfo.lastName,
          address1: addressInfo.address1,
          address2: addressInfo.address2,
          city: addressInfo.city,
          state: addressInfo.state,
          zip: addressInfo.zipCode,
          country: addressInfo.country
        },
        billingAddress: {
          firstName: addressInfo.firstName,
          lastName: addressInfo.lastName,
          address1: addressInfo.address1,
          address2: addressInfo.address2,
          city: addressInfo.city,
          state: addressInfo.state,
          zip: addressInfo.zipCode,
          country: addressInfo.country
        },
        shippingMethod: selectedShippingMethod.id,
        shippingMethodName: selectedShippingMethod.name,
        shippingCarrier: selectedShippingMethod.carrier || 'Standard',
        shippingType: selectedShippingMethod.type || 'standard', // Add shipping type (air/sea)
        subtotal: subtotalCalc,
        shipping: shippingCost,
        tax: taxCalc,
        taxRate: appliedTaxRate,
        discount: discountAmount,
        total: totalCalc,
        coupon: appliedCoupon ? {
          code: appliedCoupon.code,
          discountType: appliedCoupon.discountType,
          discountValue: appliedCoupon.discountValue,
          id: appliedCoupon._id
        } : null,
        customerInfo: {
          firstName: addressInfo.firstName,
          lastName: addressInfo.lastName,
          email: contactInfo.email,
          phone: contactInfo.phone
        },
        userId: user ? user.id : null,
        isNewUser: isNewUser,
        date: new Date().toISOString(),
        orderNumber: `ORD-${Date.now()}`
      };
      
      // Create a draft order for orderStore
      const draftOrder = {
        _id: `draft-${Date.now()}`,
        orderNumber: orderInfo.orderNumber,
        status: 'Draft',
        trackingNumber: `TRK${Math.floor(Math.random() * 10000000000)}`,
        items: orderProducts,
        totalAmount: totalCalc,
        subtotal: subtotalCalc,
        shipping: shippingCost,
        tax: taxCalc,
        taxRate: appliedTaxRate,
        discount: discountAmount,
        couponCode: appliedCoupon ? appliedCoupon.code : null,
        shippingAddress: {
          name: `${addressInfo.firstName} ${addressInfo.lastName}`,
          street: addressInfo.address1,
          addressLine2: addressInfo.address2,
          city: addressInfo.city,
          state: addressInfo.state,
          zip: addressInfo.zipCode,
          country: addressInfo.country,
          phone: contactInfo.phone
        },
        billingAddress: {
          name: `${addressInfo.firstName} ${addressInfo.lastName}`,
          street: addressInfo.address1,
          city: addressInfo.city,
          state: addressInfo.state,
          zip: addressInfo.zipCode,
          country: addressInfo.country
        },
        customerName: `${addressInfo.firstName} ${addressInfo.lastName}`,
        customerEmail: contactInfo.email,
        shippingMethod: selectedShippingMethod.name,
        shippingType: selectedShippingMethod.type || 'standard', // Add shipping type to draft order
        shippingCarrier: selectedShippingMethod.carrier || 'Standard',
        createdAt: new Date().toISOString()
      };
      
      // Save to Zustand store
      orderStore.setOrderInfo(orderInfo);
      
      // Add draft order to store orders array - will be updated with final details after payment
      // but ensures it shows in Profile even if user abandons checkout
      orderStore.addOrder(draftOrder);
      
      // Clear the active coupon from the store after it's been used
      clearActiveCoupon();
      
      // Navigate to payment page (no need to pass orderInfo in state)
      navigate('/payment', { 
        state: { 
          isFromCart,
          clearCartOnSuccess: isFromCart,
          isNewUser: isNewUser  // Pass the isNewUser flag to payment page
        } 
      });
    } catch (error) {
      console.error('Error navigating to payment:', error);
      setFormError(`Error preparing payment: ${error.message || 'Please try again.'}`);
    }
  };
  
  // Render the contact information step
  const renderContactStep = () => {
    return (
      <div className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={contactInfo.email}
            onChange={handleContactChange}
            className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="your@email.com"
            required
          />
        </div>
        
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={contactInfo.phone}
            onChange={handleContactChange}
            className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="+1 (234) 567-8900"
            required
          />
        </div>
        
        {!user && (
          <div className="pt-4">
            <div className="flex items-center mb-4">
              <input
                id="create-account"
                name="create-account"
                type="checkbox"
                checked={createAccount}
                onChange={(e) => setCreateAccount(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="create-account" className="ml-2 block text-sm text-gray-700">
                Create an account for faster checkout next time
              </label>
            </div>
            
            {createAccount && (
              <div className="space-y-4 mt-4 border-t border-gray-200 pt-4">
                <h3 className="text-lg font-medium text-gray-900">Create Your Account</h3>
                
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Your account will be created with your contact information and shipping details.
                  </p>
                  
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={password}
                      onChange={handlePasswordChange}
                      className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter password"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={confirmPassword}
                      onChange={handlePasswordChange}
                      className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Confirm password"
                      required
                    />
                  </div>
                  
                  {passwordError && (
                    <p className="text-sm text-red-600">
                      {passwordError}
                    </p>
                  )}
                  
                  {registrationError && (
                    <p className="text-sm text-red-600">
                      {registrationError}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Render the address form step
  const renderAddressStep = () => {
    return (
      <div className="space-y-6">
        {/* Message about account creation if user opted for it */}
        {!user && createAccount && !registrationSuccess && (
          <div className="mb-4 p-3 bg-blue-50 rounded-md text-blue-700 text-sm">
            <p>Your account will be created using your shipping address details after completing this step.</p>
          </div>
        )}
        
        {registrationSuccess && (
          <div className="mb-4 p-3 bg-green-50 rounded-md text-green-700 text-sm">
            <p>Account successfully created! You'll be able to log in after completing your purchase.</p>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={addressInfo.firstName}
              onChange={handleAddressChange}
              className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="John"
              required
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={addressInfo.lastName}
              onChange={handleAddressChange}
              className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Doe"
              required
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="address1" className="block text-sm font-medium text-gray-700">Address Line 1 <span className="text-red-500">*</span></label>
            <input
              type="text"
              id="address1"
              name="address1"
              value={addressInfo.address1}
              onChange={handleAddressChange}
              className="mt-1 block w-full py-3 px-4 border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              placeholder="Street address, apartment, suite, etc."
              required
            />
          </div>
          
          <div>
            <label htmlFor="address2" className="block text-sm font-medium text-gray-700">Address Line 2</label>
            <input
              type="text"
              id="address2"
              name="address2"
              value={addressInfo.address2}
              onChange={handleAddressChange}
              className="mt-1 block w-full py-3 px-4 border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              placeholder="Apartment, suite, unit, building, floor, etc. (optional)"
            />
          </div>
          
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700">City <span className="text-red-500">*</span></label>
            <input
              type="text"
              id="city"
              name="city"
              value={addressInfo.city}
              onChange={handleAddressChange}
              className="mt-1 block w-full py-3 px-4 border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div>
            <label htmlFor="state" className="block text-sm font-medium text-gray-700">State/Province/Region</label>
            <input
              type="text"
              id="state"
              name="state"
              value={addressInfo.state}
              onChange={handleAddressChange}
              className="mt-1 block w-full py-3 px-4 border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700">Postal/ZIP Code <span className="text-red-500">*</span></label>
            <input
              type="text"
              id="zipCode"
              name="zipCode"
              value={addressInfo.zipCode}
              onChange={handleAddressChange}
              className="mt-1 block w-full py-3 px-4 border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700">Country <span className="text-red-500">*</span></label>
            <select
              id="country"
              name="country"
              value={addressInfo.country}
              onChange={handleAddressChange}
              className="mt-1 block w-full py-3 px-4 border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              required
            >
              {countries.map(country => (
                <option key={country.code} value={country.name}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="mt-6 flex items-center">
          <input
            id="save-address"
            type="checkbox"
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="save-address" className="ml-2 block text-sm text-gray-700">
            Save this address for future orders
          </label>
        </div>
      </div>
    );
  };

  // Add a useEffect for network status detection
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Network: Connection restored');
      if (step === 3 && shippingLoadingError) {
        // Retry loading shipping options when connection is restored
        setShippingMethodsLoading(true);
        setShippingLoadingError(false);
        setTimeout(() => setShippingMethodsLoading(false), 1500);
      }
    };
    
    const handleOffline = () => {
      console.log('🌐 Network: Connection lost');
      if (step === 3) {
        setShippingLoadingError(true);
        setShippingMethodsLoading(false);
      }
    };
    
    // Check connection status on mount
    if (!navigator.onLine && step === 3) {
      setShippingLoadingError(true);
      setShippingMethodsLoading(false);
    }
    
    // Add event listeners for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Clean up
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [step, shippingLoadingError]);

  // Add a useEffect to simulate checking shipping methods with timeout for poor connections
  useEffect(() => {
    if (step === 3) {
      // Start loading when we reach the shipping step
      setShippingMethodsLoading(true);
      setShippingLoadingError(false);
      
      // Set a timeout to detect slow connections
      const timeoutId = setTimeout(() => {
        if (shippingMethodsLoading) {
          console.log('⚠️ SHIPPING: Connection seems slow, showing timeout message');
          setShippingLoadingError(true);
        }
      }, 5000); // 5 seconds timeout
      
      // Simulate loading completion
      const loadingId = setTimeout(() => {
        setShippingMethodsLoading(false);
      }, 1500); // 1.5 seconds for normal loading
      
      return () => {
        clearTimeout(timeoutId);
        clearTimeout(loadingId);
      };
    }
  }, [step]);

  // Update the renderDeliveryStep function to handle poor internet connections
  const renderDeliveryStep = () => {
    // Filter available shipping methods based on products
    let productsForShipping;
    let filteredShippingMethods = [...availableShippingMethods];
    let availableMethodsCount = 0;
    
    if (isFromCart) {
      productsForShipping = cartItems;
    } else {
      productsForShipping = [productInfo];
    }
    
    // Check if any products have air shipping data
    const airShippingDetails = calculateShippingDetails(
      availableShippingMethods.find(m => m.id === 'air'),
      productsForShipping
    );
    
    // Check if any products have sea shipping data
    const seaShippingDetails = calculateShippingDetails(
      availableShippingMethods.find(m => m.id === 'sea'),
      productsForShipping
    );
    
    // Only show air shipping if at least one product has valid air shipping data
    if (!airShippingDetails.hasValidShippingData) {
      filteredShippingMethods = filteredShippingMethods.filter(m => m.id !== 'air');
      console.log('🚢 SHIPPING: Hiding air shipping option - no products have valid air shipping data');
    } else {
      availableMethodsCount++;
    }
    
    // Only show sea shipping if at least one product has valid sea shipping data
    if (!seaShippingDetails.hasValidShippingData) {
      filteredShippingMethods = filteredShippingMethods.filter(m => m.id !== 'sea');
      console.log('🚢 SHIPPING: Hiding sea shipping option - no products have valid sea shipping data');
    } else {
      availableMethodsCount++;
    }
    
    return (
      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-medium">Shipping Method</h3>
          <p className="text-gray-500 text-sm mt-1">Select a shipping method for this order</p>
        </div>
        
        {/* Display form error if any */}
        {formError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formError}
            </p>
          </div>
        )}
        
        {/* Show loading state when fetching shipping methods */}
        {shippingMethodsLoading && (
          <div className="p-6 text-center border rounded-lg bg-blue-50 border-blue-200">
            <div className="mb-3">
              <Loader className="w-10 h-10 text-blue-500 mx-auto animate-spin" />
            </div>
            <h4 className="text-lg font-medium text-blue-700 mb-2">Loading Shipping Options</h4>
            <p className="text-sm text-blue-600">
              Please wait while we calculate shipping options for your products...
            </p>
          </div>
        )}
        
        {/* Show error message for poor internet connections */}
        {shippingLoadingError && !shippingMethodsLoading && (
          <div className="p-6 text-center border rounded-lg bg-orange-50 border-orange-200">
            <div className="mb-3">
              <Clock className="w-10 h-10 text-orange-500 mx-auto" />
            </div>
            <h4 className="text-lg font-medium text-orange-700 mb-2">Slow Connection Detected</h4>
            <p className="text-sm text-orange-600 mb-4">
              We're having trouble loading shipping options. This may be due to a slow internet connection.
            </p>
            <button 
              onClick={() => {
                setShippingMethodsLoading(true);
                setShippingLoadingError(false);
                setTimeout(() => setShippingMethodsLoading(false), 1500);
              }}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 text-sm"
            >
              Try Again
            </button>
          </div>
        )}
        
        {/* Show message if no shipping methods available */}
        {!shippingMethodsLoading && !shippingLoadingError && filteredShippingMethods.length === 0 ? (
          <div className="p-6 text-center border rounded-lg bg-yellow-50 border-yellow-200">
            <div className="mb-3">
              <Truck className="w-10 h-10 text-yellow-500 mx-auto" />
          </div>
            <h4 className="text-lg font-medium text-yellow-700 mb-2">No Shipping Methods Available</h4>
            <p className="text-sm text-yellow-600">
              The selected product(s) don't have shipping options configured.
              Please contact support for assistance.
            </p>
          </div>
        ) : !shippingMethodsLoading && !shippingLoadingError && (
          <div className="space-y-4">
            {filteredShippingMethods.map((method) => {
              // Calculate shipping details for this method
              const products = isFromCart ? cartItems : [productInfo];
              const shippingDetails = calculateShippingDetails(method, products);
              
              // Skip methods with invalid shipping data
              if (!shippingDetails.hasValidShippingData) {
                return null;
              }
              
              // Update method with calculated values
              const displayMethod = {
                ...method,
                price: shippingDetails.price,
                estimatedDelivery: shippingDetails.estimatedDelivery
              };
              
              return (
                <div 
                  key={method.id}
                  onClick={() => handleShippingMethodSelect(method.id)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    shippingMethod === method.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start">
                    <div className={`w-5 h-5 rounded-full border flex-shrink-0 mr-3 mt-0.5 flex items-center justify-center ${
                      shippingMethod === method.id ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                    }`}>
                      {shippingMethod === method.id && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{displayMethod.name}</h4>
                          <p className="text-sm text-gray-500 mt-1">{displayMethod.description}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Estimated delivery: {displayMethod.estimatedDelivery}
                          </p>
                          {displayMethod.carrier && (
                            <p className="text-xs text-gray-400 mt-1">via {displayMethod.carrier}</p>
                          )}
                        </div>
                        <span className="font-medium">GH₵{displayMethod.price.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Show message when only some shipping methods are available */}
            {availableMethodsCount < 2 && availableMethodsCount > 0 && (
              <div className="p-3 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-600">
                <p>
                  <Info className="inline w-4 h-4 mr-1 text-gray-500" />
                  Some shipping methods are not available for the selected product(s).
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Update the Review display to show dynamic tax rate
  const renderReviewStep = () => {
    return (
      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-medium">Review Your Order</h3>
          <p className="text-gray-500 text-sm mt-1">Please review your order details before proceeding to payment</p>
        </div>
        
        {/* Order Items */}
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b">
            <h4 className="font-medium">Order Items</h4>
          </div>
          <div className="p-4 space-y-4">
            {isFromCart ? (
              // Render cart items
              cartItems.map((item, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div className="w-16 h-16 border rounded-md overflow-hidden flex-shrink-0">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/100';
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <h5 className="font-medium">{item.name}</h5>
                    <div className="text-sm text-gray-500">
                      <span>Size: {item.size}</span>
                      {item.colorName && <span> • Color: {item.colorName}</span>}
                      <span> • Qty: {item.quantity}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              // Render single product
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 border rounded-md overflow-hidden flex-shrink-0">
                  <img 
                    src={productInfo.image} 
                    alt={productInfo.name} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/100';
                    }}
                  />
                </div>
                <div className="flex-1">
                  <h5 className="font-medium">{productInfo.name}</h5>
                  <div className="text-sm text-gray-500">
                    <span>Size: {productInfo.size}</span>
                    {productInfo.colorName && <span> • Color: {productInfo.colorName}</span>}
                    <span> • Qty: {productInfo.quantity || 1}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Customer Info */}
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b">
            <h4 className="font-medium">Customer Information</h4>
          </div>
          <div className="p-4">
            <div className="flex flex-col sm:flex-row sm:justify-between">
              <div className="mb-4 sm:mb-0">
                <h5 className="text-sm font-medium text-gray-500">Contact Information</h5>
                <p className="mt-1">{contactInfo.email}</p>
                <p>{contactInfo.phone}</p>
              </div>
              <div>
                <h5 className="text-sm font-medium text-gray-500">Shipping Address</h5>
                <p className="mt-1">{addressInfo.firstName} {addressInfo.lastName}</p>
                <p>{addressInfo.address1}</p>
                {addressInfo.address2 && <p>{addressInfo.address2}</p>}
                <p>{addressInfo.city}, {addressInfo.state} {addressInfo.zipCode}</p>
                <p>{addressInfo.country}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Shipping Method */}
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b">
            <h4 className="font-medium">Delivery Method</h4>
          </div>
          <div className="p-4">
            {shippingMethod ? (
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{availableShippingMethods.find(m => m.id === shippingMethod)?.name}</p>
                  <p className="text-sm text-gray-500">{availableShippingMethods.find(m => m.id === shippingMethod)?.description}</p>
                  {availableShippingMethods.find(m => m.id === shippingMethod)?.carrier && (
                    <p className="text-xs text-gray-400">via {availableShippingMethods.find(m => m.id === shippingMethod)?.carrier}</p>
                  )}
                </div>
                <span className="font-medium">GH₵{shippingCost.toFixed(2)}</span>
              </div>
            ) : (
              <p className="text-gray-500">No shipping method selected</p>
            )}
          </div>
        </div>
        
        {/* Order Summary */}
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b">
            <h4 className="font-medium">Order Summary</h4>
          </div>
          <div className="p-4">
            <div className="space-y-4">
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">GH₵{subtotal.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600">Shipping</span>
                <span className="font-medium">
                  {shippingMethodsLoading ? (
                    <Loader className="inline w-3 h-3 text-gray-400 animate-spin" />
                  ) : (
                    `GH₵${shippingCost.toFixed(2)}`
                  )}
                </span>
              </div>
              
              <div className="flex justify-between py-2 border-b border-gray-200">
                <div className="flex items-center">
                  <span className="text-gray-600">Tax ({(taxRate * 100).toFixed(1)}%)</span>
                  {addressInfo.country && (
                    <div className="relative ml-1 group">
                      <Info className="w-4 h-4 text-gray-400 cursor-help" />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                        Tax rate for {addressInfo.country}
                      </div>
                    </div>
                  )}
                </div>
                <span className="font-medium">GH₵{(subtotal * taxRate).toFixed(2)}</span>
              </div>
              
              {discount > 0 && (
                <div className="flex justify-between py-2 border-b border-gray-200 text-green-600">
                  <span>Discount</span>
                  <span className="font-medium">-GH₵{parseFloat(discount).toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between py-2 text-lg font-bold">
                <span>Total</span>
                <span>GH₵{parseFloat(total).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render the appropriate step content
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return renderContactStep();
      case 2:
        return renderAddressStep();
      case 3:
        return renderDeliveryStep();
      case 4:
        return renderReviewStep();
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center text-sm text-gray-500 mb-8">
          <button 
            onClick={handlePrevStep}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </button>
          <span className="mx-2">/</span>
          <a href="/sinosply-stores" className="hover:text-gray-900">Home</a>
          {isFromCart ? (
            <>
              <span className="mx-2">/</span>
              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); navigate('/cart'); }}
                className="hover:text-gray-900"
              >
                Cart
              </a>
            </>
          ) : (
            <>
              <span className="mx-2">/</span>
              <a href="/shop" className="hover:text-gray-900">Shop</a>
              <span className="mx-2">/</span>
              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); navigate(-1); }}
                className="hover:text-gray-900"
              >
                {productInfo.name}
              </a>
            </>
          )}
          <span className="mx-2">/</span>
          <span className="font-medium text-gray-900">Checkout</span>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Steps */}
          <div className="lg:col-span-2 space-y-8">
            {/* Checkout Progress */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
              {/* Desktop breadcrumbs */}
              <div className="hidden md:flex justify-between items-center">
                <div 
                  onClick={() => step > 1 && setStep(1)} 
                  className={`flex items-center cursor-pointer ${step > 1 ? 'hover:opacity-80' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    <User className="w-4 h-4" />
                  </div>
                  <span className={`ml-2 font-medium ${step >= 1 ? 'text-blue-600' : 'text-gray-600'}`}>Contact</span>
                </div>
                <div className="flex-grow mx-2 h-1 bg-gray-200 relative">
                  <div 
                    className="absolute top-0 left-0 h-full bg-blue-600 transition-all duration-300"
                    style={{ width: step >= 2 ? '100%' : '0%' }}
                  ></div>
                </div>
                <div 
                  onClick={() => step > 2 && setStep(2)} 
                  className={`flex items-center cursor-pointer ${step > 2 ? 'hover:opacity-80' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    <MapPin className="w-4 h-4" />
                  </div>
                  <span className={`ml-2 font-medium ${step >= 2 ? 'text-blue-600' : 'text-gray-600'}`}>Shipping</span>
                </div>
                <div className="flex-grow mx-2 h-1 bg-gray-200 relative">
                  <div 
                    className="absolute top-0 left-0 h-full bg-blue-600 transition-all duration-300"
                    style={{ width: step >= 3 ? '100%' : '0%' }}
                  ></div>
                </div>
                <div 
                  onClick={() => step > 3 && setStep(3)} 
                  className={`flex items-center cursor-pointer ${step > 3 ? 'hover:opacity-80' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    <Truck className="w-4 h-4" />
                  </div>
                  <span className={`ml-2 font-medium ${step >= 3 ? 'text-blue-600' : 'text-gray-600'}`}>Delivery</span>
                </div>
                <div className="flex-grow mx-2 h-1 bg-gray-200 relative">
                  <div 
                    className="absolute top-0 left-0 h-full bg-blue-600 transition-all duration-300"
                    style={{ width: step >= 4 ? '100%' : '0%' }}
                  ></div>
                </div>
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 4 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <span className={`ml-2 font-medium ${step >= 4 ? 'text-blue-600' : 'text-gray-600'}`}>Review</span>
                </div>
              </div>
              
              {/* Mobile breadcrumbs */}
              <div className="md:hidden">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Step {step} of 4</span>
                  <span className="text-sm font-medium text-blue-600">
                    {step === 1 && 'Contact'}
                    {step === 2 && 'Shipping'}
                    {step === 3 && 'Delivery'}
                    {step === 4 && 'Review'}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${(step / 4) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between mt-2">
                  <button 
                    onClick={() => step > 1 && setStep(1)}
                    className={`flex items-center ${step > 1 ? 'text-blue-600' : 'text-gray-400'}`}
                    disabled={step <= 1}
                  >
                    <User className="w-4 h-4 mr-1" />
                    <span className="text-xs">1</span>
                  </button>
                  <button 
                    onClick={() => step > 2 && setStep(2)}
                    className={`flex items-center ${step > 2 ? 'text-blue-600' : 'text-gray-400'}`}
                    disabled={step <= 2}
                  >
                    <MapPin className="w-4 h-4 mr-1" />
                    <span className="text-xs">2</span>
                  </button>
                  <button 
                    onClick={() => step > 3 && setStep(3)}
                    className={`flex items-center ${step > 3 ? 'text-blue-600' : 'text-gray-400'}`}
                    disabled={step <= 3}
                  >
                    <Truck className="w-4 h-4 mr-1" />
                    <span className="text-xs">3</span>
                  </button>
                  <button className="flex items-center text-gray-400">
                    <ShoppingBag className="w-4 h-4 mr-1" />
                    <span className="text-xs">4</span>
                  </button>
                </div>
              </div>
            </div>
            
            {renderStepContent()}
          </div>
          
          {/* Checkout Summary */}
          <div className="lg:col-span-1 space-y-8">
            {/* Coupon Input */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-3">Have a Coupon?</h2>
              <div className="flex items-center space-x-2 mb-2">
                <input
                  type="text"
                  className="flex-1 rounded-full bg-gray-50 border-0 px-4 py-2 text-sm shadow-sm focus:ring-2 focus:ring-purple-400 focus:bg-white transition placeholder-gray-400"
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value)}
                  disabled={isCouponLoading || (appliedCoupon && appliedCoupon.code)}
                  autoComplete="off"
                  spellCheck={false}
                />
                <button
                  onClick={handleApplyCoupon}
                  className={`rounded-full px-5 py-2 text-sm font-semibold shadow-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400
                    ${isCouponLoading || (appliedCoupon && appliedCoupon.code)
                      ? 'bg-blue-200 text-white cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                  disabled={isCouponLoading || (appliedCoupon && appliedCoupon.code)}
                  type="button"
                >
                  {isCouponLoading ? (
                    <span className="flex items-center"><svg className="animate-spin h-4 w-4 mr-2 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>Applying...</span>
                  ) : (appliedCoupon && appliedCoupon.code ? 'Applied' : 'Apply')}
                </button>
              </div>
              {couponError && (
                <div className="flex items-center text-xs text-red-500 mt-1"><svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{couponError}</div>
              )}
              {couponSuccess && (
                <div className="flex items-center text-xs text-green-600 mt-1"><svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>{couponSuccess}</div>
              )}
              {appliedCoupon && appliedCoupon.code && (
                <div className="text-xs text-gray-500 mt-1">Coupon <span className="font-semibold">{appliedCoupon.code}</span> applied.</div>
              )}
            </div>
            {/* Summary */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h2 className="text-2xl font-bold mb-4">Order Summary</h2>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">GH₵{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">GH₵{shippingCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">GH₵{(subtotal * taxRate).toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span className="font-medium">-GH₵{parseFloat(discount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>GH₵{parseFloat(total).toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            {/* Payment Button */}
            <button
              onClick={handleNextStep}
              className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition-colors duration-200"
            >
              Proceed to Payment
            </button>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default CheckoutPage;