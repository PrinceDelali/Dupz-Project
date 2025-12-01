import { useState, useEffect } from 'react';
import { FaCog, FaBell, FaGlobe, FaLock, FaCheck, FaSearch, FaTruck, FaPercentage, FaPlus, FaTrash, FaTimes, FaEdit, FaExclamationTriangle, FaImage, FaLink, FaUserPlus, FaUsers, FaInstagram } from 'react-icons/fa';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/admin/Sidebar';
import LoadingOverlay from '../../components/LoadingOverlay';
import apiConfig from '../../config/apiConfig';
import { useSettingsStore } from '../../store/settingsStore';
import { useAuth } from '../../context/AuthContext';
import { useInstagramStore } from '../../store/instagramStore';
import { useSocialStore } from '../../store/socialStore';

const AdminSettings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user, isAuthenticated } = useAuth();
  const { 
    settings, 
    shippingMethods, 
    taxRates, 
    banners,
    defaultTaxRate,
    fetchSettings, 
    fetchShippingMethods, 
    fetchTaxRates,
    fetchBanners,
    updateShippingMethods, 
    updateTaxRates, 
    updateDefaultTaxRate,
    updateBanners,
    updateBannerByType,
    error: storeError,
    loading: storeLoading
  } = useSettingsStore();
  
  // Instagram store
  const { 
    instagramImages, 
    loading: instagramLoading, 
    error: instagramError,
    success: instagramSuccess,
    fetchAllInstagramImages,
    createInstagramImage,
    updateInstagramImage,
    deleteInstagramImage
  } = useInstagramStore();

  // Social Links state
  const [showNewSocialForm, setShowNewSocialForm] = useState(false);
  const [editingSocial, setEditingSocial] = useState(null);
  const [newSocialLink, setNewSocialLink] = useState({
    platform: 'instagram',
    url: '',
    displayName: '',
    icon: '',
    displayOrder: 0,
    isActive: true
  });

  // Get social store functions
  const {
    socialLinks,
    loading: socialLoading,
    error: socialError,
    success: socialSuccess,
    fetchAllSocialLinks,
    createSocialLink,
    updateSocialLink,
    deleteSocialLink
  } = useSocialStore();

  // Local states for editing
  const [localSettings, setLocalSettings] = useState({
    siteTitle: 'Sinosply',
    siteDescription: 'Your premier online shopping destination',
    emailNotifications: true,
    orderUpdates: true,
    customerMessages: true,
    lowInventoryAlerts: true,
    maintenanceMode: false,
    requireEmailVerification: true,
  });
  const [localShippingMethods, setLocalShippingMethods] = useState([]);
  const [localTaxRates, setLocalTaxRates] = useState([]);
  const [localBanners, setLocalBanners] = useState([]);
  const [localDefaultTaxRate, setLocalDefaultTaxRate] = useState(0.15);
  const [editingShipping, setEditingShipping] = useState(null);
  const [editingTax, setEditingTax] = useState(null);
  const [editingBanner, setEditingBanner] = useState(null);
  const [newShippingMethod, setNewShippingMethod] = useState({
    id: '',
    name: '',
    description: '',
    price: 0,
    carrier: '',
    estimatedDelivery: '',
    isActive: true
  });
  const [newTaxRate, setNewTaxRate] = useState({
    countryCode: '',
    country: '',
    rate: 0,
    isActive: true
  });
  const [newBanner, setNewBanner] = useState({
    type: 'topBanner',
    imageUrl: '',
    alt: '',
    linkUrl: '#',
    caption: '',
    subcaption: '',
    displayOrder: 0,
    isActive: true
  });
  const [showNewShippingForm, setShowNewShippingForm] = useState(false);
  const [showNewTaxForm, setShowNewTaxForm] = useState(false);
  const [showNewBannerForm, setShowNewBannerForm] = useState(false);
  const [authWarning, setAuthWarning] = useState(false);
  
  // User management state
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'staff',
    permissions: []
  });
  const [selectedUser, setSelectedUser] = useState(null);

  // List of all possible permissions (menu items)
  const availablePermissions = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'orders', label: 'Orders' },
    { id: 'products', label: 'Products' },
    { id: 'collections', label: 'Collections' },
    { id: 'platforms', label: 'Platforms' },
    { id: 'customers', label: 'Customers' },
    { id: 'campaigns', label: 'Campaigns' },
    { id: 'coupons', label: 'Coupons' },
    { id: 'settings', label: 'Settings' },
    { id: 'reports', label: 'Reports' }
  ];

  // Instagram state
  const [showNewInstagramForm, setShowNewInstagramForm] = useState(false);
  const [editingInstagram, setEditingInstagram] = useState(null);
  const [newInstagramImage, setNewInstagramImage] = useState({
    imageUrl: '',
    caption: '',
    link: '#',
    displayOrder: 0,
    isActive: true
  });

  // Check authentication on component mount
  useEffect(() => {
    checkAuthentication();
  }, [isAuthenticated]);

  const checkAuthentication = () => {
    const token = localStorage.getItem('token');
    if (!token || !isAuthenticated) {
      console.warn('⚠️ [AdminSettings] User is not authenticated or token is missing');
      console.log('Token exists:', !!token, 'isAuthenticated:', isAuthenticated);
      setAuthWarning(true);
      setError('You must be logged in to update settings. Changes will be saved locally only.');
    } else {
      console.log('✅ [AdminSettings] User is authenticated with valid token');
      setAuthWarning(false);
      setError('');
    }
  };

  useEffect(() => {
    fetchSettingsData();
    fetchAdminUsers();
  }, []);

  const fetchSettingsData = async () => {
      setLoading(true);
    try {
      console.log('🔍 [AdminSettings] Fetching settings data');
      
      // Fetch settings data from the store
      await fetchSettings();
      await fetchShippingMethods();
      await fetchTaxRates();
      await fetchBanners();
      await fetchAllInstagramImages(); // Add this line to fetch Instagram images
      await fetchAllSocialLinks(); // Fetch social links
      
      // Initialize local states
      setLocalShippingMethods(shippingMethods);
      setLocalTaxRates(taxRates);
      setLocalDefaultTaxRate(defaultTaxRate);
      setLocalBanners(banners);
      
      // Fetch other mockup settings
      fetchMockupSettings();
      
      console.log('✅ [AdminSettings] Settings data fetched successfully');
    } catch (error) {
      console.error('❌ [AdminSettings] Error fetching settings:', error);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchMockupSettings = async () => {
    try {
      // Simulating API call for mockup settings
      setTimeout(() => {
        setLocalSettings({
          siteTitle: 'Sinosply',
          siteDescription: 'Your premier online shopping destination',
          emailNotifications: true,
          orderUpdates: true,
          customerMessages: true,
          lowInventoryAlerts: true,
          maintenanceMode: false,
          requireEmailVerification: true,
        });
      }, 500);
    } catch (error) {
      console.error('Error fetching mockup settings:', error);
    }
  };

  useEffect(() => {
    if (shippingMethods.length > 0) {
      setLocalShippingMethods(shippingMethods);
    }
  }, [shippingMethods]);

  useEffect(() => {
    if (taxRates.length > 0) {
      setLocalTaxRates(taxRates);
    }
  }, [taxRates]);

  useEffect(() => {
    setLocalDefaultTaxRate(defaultTaxRate);
  }, [defaultTaxRate]);

  useEffect(() => {
    if (banners.length > 0) {
      setLocalBanners(banners);
    }
  }, [banners]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setLocalSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Enhanced handling of shipping input changes with validation
  const handleShippingInputChange = (e, index) => {
    const { name, value, type, checked } = e.target;
    const updatedMethods = [...localShippingMethods];
    
    // Pre-process numeric values
    let processedValue = value;
    if (name === 'price') {
      processedValue = parseFloat(value);
      if (isNaN(processedValue)) {
        processedValue = 0;
        console.warn(`⚠️ [AdminSettings] Invalid price value converted to 0 for shipping method ${index}`);
      }
    }
    
    updatedMethods[index] = {
      ...updatedMethods[index],
      [name]: type === 'checkbox' ? checked : processedValue
    };
    
    // Log the change for debugging
    console.log(`📝 [AdminSettings] Updated shipping method ${index}, field: ${name}`, updatedMethods[index]);
    
    setLocalShippingMethods(updatedMethods);
    
    // Update the store immediately to reflect changes in real-time
    updateShippingMethods(updatedMethods);
  };

  // Enhanced handling of default tax rate changes
  const handleDefaultTaxRateChange = (e) => {
    const rawValue = e.target.value;
    let value = parseFloat(rawValue) / 100; // Convert from percentage to decimal
    
    if (isNaN(value)) {
      value = 0.15; // Default to 15% if invalid
      console.warn('⚠️ [AdminSettings] Invalid default tax rate, using 15% instead');
    }
    
    if (value < 0) {
      value = 0;
      console.warn('⚠️ [AdminSettings] Negative tax rate not allowed, set to 0%');
    }
    
    if (value > 1) {
      console.warn('⚠️ [AdminSettings] Tax rate entered as percentage, converting to decimal');
      value = value / 100;
      
      // If still greater than 1, cap at 100%
      if (value > 1) {
        value = 1;
        console.warn('⚠️ [AdminSettings] Tax rate capped at 100%');
      }
    }
    
    console.log(`📝 [AdminSettings] Updated default tax rate decimal: ${value}, percentage: ${value * 100}%`);
    setLocalDefaultTaxRate(value);
    
    // Update the store immediately for real-time updates across the application
    updateDefaultTaxRate(value);
  };

  // Enhanced handling of tax rate input changes with validation
  const handleTaxInputChange = (e, index) => {
    const { name, value, type, checked } = e.target;
    const updatedRates = [...localTaxRates];
    
    // Pre-process numeric values for tax rate
    let processedValue = value;
    if (name === 'rate') {
      // Convert from percentage to decimal
      processedValue = parseFloat(value) / 100;
      if (isNaN(processedValue)) {
        processedValue = 0;
        console.warn(`⚠️ [AdminSettings] Invalid rate value converted to 0 for tax rate ${index}`);
      }
    }
    
    updatedRates[index] = {
      ...updatedRates[index],
      [name]: type === 'checkbox' ? checked : processedValue
    };
    
    // Log the change for debugging
    console.log(`📝 [AdminSettings] Updated tax rate ${index}, field: ${name}`, updatedRates[index]);
    
    setLocalTaxRates(updatedRates);
  };

  const handleNewShippingInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewShippingMethod({
      ...newShippingMethod,
      [name]: type === 'checkbox' ? checked : name === 'price' ? parseFloat(value) : value
    });
  };

  const handleNewTaxInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewTaxRate({
      ...newTaxRate,
      [name]: type === 'checkbox' ? checked : name === 'rate' ? parseFloat(value) / 100 : value
    });
  };

  const addNewShippingMethod = () => {
    // Validate required fields
    if (!newShippingMethod.id || !newShippingMethod.name || isNaN(newShippingMethod.price)) {
      setError('Please fill in all required shipping method fields');
      return;
    }

    // Check for duplicate ID
    if (localShippingMethods.some(method => method.id === newShippingMethod.id)) {
      setError('A shipping method with this ID already exists');
      return;
    }

    const updatedMethods = [...localShippingMethods, newShippingMethod];
    setLocalShippingMethods(updatedMethods);
    
    // Update the store immediately to reflect changes in real-time
    updateShippingMethods(updatedMethods);
    
    setNewShippingMethod({
      id: '',
      name: '',
      description: '',
      price: 0,
      carrier: '',
      estimatedDelivery: '',
      isActive: true
    });
    setShowNewShippingForm(false);
    setSuccess('Shipping method added successfully! Changes will appear immediately in checkout.');
  };

  const addNewTaxRate = () => {
    // Validate required fields
    if (!newTaxRate.countryCode || !newTaxRate.country || isNaN(newTaxRate.rate)) {
      setError('Please fill in all required tax rate fields');
      return;
    }

    // Check for duplicate country code
    if (localTaxRates.some(tax => tax.countryCode === newTaxRate.countryCode)) {
      setError('A tax rate for this country already exists');
      return;
    }

    setLocalTaxRates([...localTaxRates, newTaxRate]);
    setNewTaxRate({
      countryCode: '',
      country: '',
      rate: 0,
      isActive: true
    });
    setShowNewTaxForm(false);
  };

  const removeShippingMethod = (index) => {
    const updatedMethods = [...localShippingMethods];
    updatedMethods.splice(index, 1);
    setLocalShippingMethods(updatedMethods);
    
    // Update the store immediately to reflect changes in real-time
    updateShippingMethods(updatedMethods);
    
    setSuccess('Shipping method removed successfully! Changes will appear immediately in checkout.');
  };

  const removeTaxRate = (index) => {
    const updatedRates = [...localTaxRates];
    updatedRates.splice(index, 1);
    setLocalTaxRates(updatedRates);
  };

  // Handle banner input changes
  const handleBannerInputChange = (e, index) => {
    const { name, value, type, checked } = e.target;
    const updatedBanners = [...localBanners];
    
    updatedBanners[index] = {
      ...updatedBanners[index],
      [name]: type === 'checkbox' ? checked : value
    };
    
    console.log(`📝 [AdminSettings] Updated banner ${index}, field: ${name}`, updatedBanners[index]);
    
    setLocalBanners(updatedBanners);
  };

  const handleNewBannerInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewBanner({
      ...newBanner,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const addNewBanner = () => {
    // Validate required fields
    if (!newBanner.type || !newBanner.imageUrl) {
      setError('Please provide banner type and image URL');
      return;
    }

    // For hero banners, we check for duplicates based on imageUrl since we can have multiple hero banners
    if (newBanner.type === 'heroBanner') {
      // Check if we're updating an existing banner
      const existingIndex = localBanners.findIndex(
        banner => banner.type === 'heroBanner' && banner.imageUrl === newBanner.imageUrl
      );
      
      if (existingIndex >= 0) {
        // Update existing hero banner
        const updatedBanners = [...localBanners];
        updatedBanners[existingIndex] = { 
          ...newBanner,
          buttonText: newBanner.buttonText || "Shop Now",
          overlayPosition: newBanner.overlayPosition || "center",
          buttonStyle: newBanner.buttonStyle || "primary"
        };
        setLocalBanners(updatedBanners);
        setShowNewBannerForm(false);
        setSuccess(`Hero banner updated successfully`);
        return;
      }
      
      // Add new hero banner
      setLocalBanners([...localBanners, {
        ...newBanner,
        buttonText: newBanner.buttonText || "Shop Now",
        overlayPosition: newBanner.overlayPosition || "center",
        buttonStyle: newBanner.buttonStyle || "primary"
      }]);
      setNewBanner({
        type: 'heroBanner',
        imageUrl: '',
        alt: 'Hero Image',
        linkUrl: '#',
        caption: '',
        subcaption: '',
        buttonText: 'Shop Now',
        overlayPosition: 'center',
        buttonStyle: 'primary',
        displayOrder: localBanners.filter(b => b.type === 'heroBanner').length + 1,
        isActive: true
      });
      setShowNewBannerForm(false);
      setSuccess('Hero banner added successfully');
      return;
    }

    // For other banner types, we can only have one banner per type
    // Check for duplicate type
    if (localBanners.some(banner => banner.type === newBanner.type)) {
      // If same type exists, update it instead of adding
      const updatedBanners = localBanners.map(banner => 
        banner.type === newBanner.type ? { 
          ...newBanner,
          buttonText: newBanner.buttonText || "Shop Now",
          overlayPosition: newBanner.overlayPosition || "center",
          buttonStyle: newBanner.buttonStyle || "primary"
        } : banner
      );
      setLocalBanners(updatedBanners);
      setShowNewBannerForm(false);
      setSuccess(`${newBanner.type.replace('Banner', ' Banner')} updated successfully`);
      return;
    }

    setLocalBanners([...localBanners, {
      ...newBanner,
      buttonText: newBanner.buttonText || "Shop Now",
      overlayPosition: newBanner.overlayPosition || "center",
      buttonStyle: newBanner.buttonStyle || "primary"
    }]);
    setNewBanner({
      type: 'promoBanner',
      imageUrl: '',
      alt: '',
      linkUrl: '#',
      caption: '',
      subcaption: '',
      buttonText: 'Shop Now',
      overlayPosition: 'center',
      buttonStyle: 'primary',
      displayOrder: 0,
      isActive: true
    });
    setShowNewBannerForm(false);
    setSuccess('Banner added successfully');
  };

  const removeBanner = (index) => {
    const updatedBanners = [...localBanners];
    updatedBanners.splice(index, 1);
    setLocalBanners(updatedBanners);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    console.log('📝 [AdminSettings] Submitting settings form');
    
    // Check authentication before proceeding
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('⚠️ [AdminSettings] No authentication token found, changes will be saved locally only');
      setAuthWarning(true);
    }
    
    // Data validation before submission
    let hasValidationError = false;
    
    // Validate shipping methods
    if (!Array.isArray(localShippingMethods) || localShippingMethods.length === 0) {
      console.error('❌ [AdminSettings] No shipping methods defined');
      setError('At least one shipping method is required');
      setLoading(false);
      return;
    }
    
    // Check that all shipping methods have required fields
    const invalidShippingMethods = localShippingMethods.filter(
      method => !method.id || !method.name || method.price === undefined
    );
    
    if (invalidShippingMethods.length > 0) {
      console.error('❌ [AdminSettings] Invalid shipping methods found:', invalidShippingMethods);
      hasValidationError = true;
    }
    
    // Validate tax rates
    if (localDefaultTaxRate === undefined || localDefaultTaxRate < 0) {
      console.error('❌ [AdminSettings] Invalid default tax rate:', localDefaultTaxRate);
      hasValidationError = true;
    }
    
    // Validate banners
    if (Array.isArray(localBanners)) {
      const invalidBanners = localBanners.filter(
        banner => !banner.type || !banner.imageUrl
      );
      
      if (invalidBanners.length > 0) {
        console.error('❌ [AdminSettings] Invalid banners found:', invalidBanners);
        hasValidationError = true;
      }
    }
    
    // Continue despite validation warnings, but log them
    if (hasValidationError) {
      console.warn('⚠️ [AdminSettings] Proceeding with submission despite validation warnings');
    }
    
    try {
      console.log('🔄 [AdminSettings] Starting settings update process');
      
      // Update shipping methods with extra error handling
      console.log('🚚 [AdminSettings] Updating shipping methods:', localShippingMethods);
      let shippingSuccess = false;
      try {
        const updatedShippingMethods = await updateShippingMethods(localShippingMethods);
        shippingSuccess = !!updatedShippingMethods;
        console.log('✅ [AdminSettings] Shipping methods update result:', updatedShippingMethods);
      } catch (shippingError) {
        console.error('❌ [AdminSettings] Error updating shipping methods:', shippingError);
        // Continue with other updates despite this error
      }
      
      // Update tax rates with extra error handling
      console.log('💰 [AdminSettings] Updating tax rates:', localTaxRates);
      let taxRatesSuccess = false;
      try {
        const updatedTaxRates = await updateTaxRates(localTaxRates);
        taxRatesSuccess = !!updatedTaxRates;
        console.log('✅ [AdminSettings] Tax rates update result:', updatedTaxRates);
      } catch (taxRatesError) {
        console.error('❌ [AdminSettings] Error updating tax rates:', taxRatesError);
        // Continue with other updates despite this error
      }
      
      // Update default tax rate with extra error handling
      console.log('💲 [AdminSettings] Updating default tax rate:', localDefaultTaxRate, `(${localDefaultTaxRate * 100}%)`);
      let defaultTaxRateSuccess = false;
      try {
        const updatedDefaultTaxRate = await updateDefaultTaxRate(localDefaultTaxRate);
        defaultTaxRateSuccess = !!updatedDefaultTaxRate;
        console.log('✅ [AdminSettings] Default tax rate update result:', updatedDefaultTaxRate, `(${updatedDefaultTaxRate.defaultTaxRate * 100}%)`);
      } catch (defaultTaxError) {
        console.error('❌ [AdminSettings] Error updating default tax rate:', defaultTaxError);
        // Continue despite this error
      }
      
      // Update banners with extra error handling
      console.log('🖼️ [AdminSettings] Updating banners:', localBanners);
      let bannersSuccess = false;
      try {
        const updatedBanners = await updateBanners(localBanners);
        bannersSuccess = !!updatedBanners;
        console.log('✅ [AdminSettings] Banners update result:', updatedBanners);
      } catch (bannersError) {
        console.error('❌ [AdminSettings] Error updating banners:', bannersError);
        // Continue despite this error
      }
      
      // Check if any updates were successful
      if (shippingSuccess || taxRatesSuccess || defaultTaxRateSuccess || bannersSuccess) {
        console.log('✅ [AdminSettings] At least some settings were updated successfully');
        
        // Create a backup of the current settings
        try {
          const settingsBackup = {
            shippingMethods: localShippingMethods,
            taxRates: localTaxRates,
            defaultTaxRate: localDefaultTaxRate,
            banners: localBanners,
            timestamp: new Date().toISOString()
          };
          localStorage.setItem('sinosply_admin_settings_backup', JSON.stringify(settingsBackup));
          console.log('💾 [AdminSettings] Created settings backup in localStorage');
        } catch (backupError) {
          console.warn('⚠️ [AdminSettings] Failed to create settings backup:', backupError);
        }
        
        // Simulate API success - in a real app, this would be determined by API responses
        setSuccess('Settings updated successfully' + 
          (!shippingSuccess ? ' (except shipping methods)' : '') +
          (!taxRatesSuccess ? ' (except tax rates)' : '') +
          (!defaultTaxRateSuccess ? ' (except default tax rate)' : '') +
          (!bannersSuccess ? ' (except banners)' : '') +
          (authWarning ? ' - saved locally only' : '')
        );
      } else {
        console.error('❌ [AdminSettings] All settings updates failed');
        setError('Failed to update settings on the server - changes saved locally only');
        
        // Try to recover from localStorage backups
        try {
          console.log('🔄 [AdminSettings] Attempting to use recoverSettings from store');
          const recoveryResult = useSettingsStore.getState().recoverSettings();
          if (recoveryResult) {
            console.log('✅ [AdminSettings] Successfully recovered settings from backups');
          }
        } catch (recoveryError) {
          console.error('❌ [AdminSettings] Failed to recover settings:', recoveryError);
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('❌ [AdminSettings] Error in settings update process:', error);
      setError('An unexpected error occurred: ' + error.message);
      setLoading(false);
    }
  };

  // Add a recovery function to restore from backup if needed
  const recoverFromBackup = () => {
    try {
      console.log('🔄 [AdminSettings] Attempting to recover settings from backup');
      const backupJson = localStorage.getItem('sinosply_admin_settings_backup');
      if (!backupJson) {
        console.warn('⚠️ [AdminSettings] No settings backup found');
        return false;
      }
      
      const backup = JSON.parse(backupJson);
      if (backup.shippingMethods) {
        setLocalShippingMethods(backup.shippingMethods);
      }
      if (backup.taxRates) {
        setLocalTaxRates(backup.taxRates);
      }
      if (backup.defaultTaxRate !== undefined) {
        setLocalDefaultTaxRate(backup.defaultTaxRate);
      }
      if (backup.banners) {
        setLocalBanners(backup.banners);
      }
      
      console.log('✅ [AdminSettings] Settings recovered from backup dated:', backup.timestamp);
      return true;
    } catch (error) {
      console.error('❌ [AdminSettings] Error recovering from backup:', error);
      return false;
    }
  };

  // Additional validation for shipping methods input
  const validateShippingMethod = (method, index) => {
    if (!method.id) {
      return { isValid: false, message: `Shipping method #${index + 1} is missing an ID` };
    }
    if (!method.name) {
      return { isValid: false, message: `Shipping method #${index + 1} is missing a name` };
    }
    if (isNaN(parseFloat(method.price))) {
      return { isValid: false, message: `Shipping method #${index + 1} has an invalid price` };
    }
    return { isValid: true };
  };

  // Additional validation for tax rates input
  const validateTaxRate = (rate, index) => {
    if (!rate.countryCode) {
      return { isValid: false, message: `Tax rate #${index + 1} is missing a country code` };
    }
    if (!rate.country) {
      return { isValid: false, message: `Tax rate #${index + 1} is missing a country name` };
    }
    if (isNaN(parseFloat(rate.rate))) {
      return { isValid: false, message: `Tax rate #${index + 1} has an invalid rate` };
    }
    return { isValid: true };
  };

  // Additional validation for banner input
  const validateBanner = (banner, index) => {
    if (!banner.type) {
      return { isValid: false, message: `Banner #${index + 1} is missing a type` };
    }
    if (!banner.imageUrl) {
      return { isValid: false, message: `Banner #${index + 1} is missing an image URL` };
    }
    return { isValid: true };
  };

  const handleLogin = () => {
    navigate('/login', { state: { returnUrl: '/admin/settings' } });
  };

  // Add listener for unauthorized events
  useEffect(() => {
    const handleUnauthorized = () => {
      console.warn('⚠️ [AdminSettings] Received unauthorized event');
      setAuthWarning(true);
      setError('Your session has expired. Please log in again.');
    };
    
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  // Fetch admin/staff users
  const fetchAdminUsers = async () => {
    if (!isAuthenticated) return;
    
    setLoadingUsers(true);
    try {
      console.log('🔍 [AdminSettings] Fetching admin users');
      
      const response = await axios.get(`${apiConfig.baseURL}/users`, {
        headers: {
          ...apiConfig.headers,
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        params: {
          role: 'admin,staff'
        }
      });

      if (response.data.success) {
        setUsers(response.data.data);
        console.log('✅ [AdminSettings] Admin users fetched successfully');
      }
    } catch (error) {
      console.error('❌ [AdminSettings] Error fetching admin users:', error);
      setError('Failed to load admin users');
    } finally {
      setLoadingUsers(false);
    }
  };

  // Create new admin/staff user
  const createAdminUser = async () => {
    if (!newUser.firstName || !newUser.lastName || !newUser.email || !newUser.password) {
      setError('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    try {
      console.log('🔄 [AdminSettings] Creating new admin/staff user');
      
      const response = await axios.post(
        `${apiConfig.baseURL}/users/admin`,
        newUser,
        {
          headers: {
            ...apiConfig.headers,
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      if (response.data.success) {
        setSuccess('User created successfully');
        setUsers([...users, response.data.data]);
        setNewUser({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          role: 'staff',
          permissions: []
        });
        setShowNewUserForm(false);
      }
    } catch (error) {
      console.error('❌ [AdminSettings] Error creating user:', error);
      setError(error.response?.data?.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  // Update existing user
  const updateUser = async (userId, userData) => {
    setLoading(true);
    try {
      console.log(`🔄 [AdminSettings] Updating user ${userId}`);
      
      const response = await axios.put(
        `${apiConfig.baseURL}/users/${userId}`,
        userData,
        {
          headers: {
            ...apiConfig.headers,
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      if (response.data.success) {
        setSuccess('User updated successfully');
        // Update the users list
        setUsers(users.map(user => 
          user._id === userId ? response.data.data : user
        ));
        setSelectedUser(null);
      }
    } catch (error) {
      console.error('❌ [AdminSettings] Error updating user:', error);
      setError(error.response?.data?.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  // Delete user
  const deleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    setLoading(true);
    try {
      console.log(`🔄 [AdminSettings] Deleting user ${userId}`);
      
      const response = await axios.delete(
        `${apiConfig.baseURL}/users/${userId}`,
        {
          headers: {
            ...apiConfig.headers,
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      if (response.data.success) {
        setSuccess('User deleted successfully');
        // Update the users list
        setUsers(users.filter(user => user._id !== userId));
      }
    } catch (error) {
      console.error('❌ [AdminSettings] Error deleting user:', error);
      setError(error.response?.data?.message || 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  // Handle toggle of permission checkboxes
  const handlePermissionToggle = (permission) => {
    if (selectedUser) {
      // For editing existing user
      const updatedUser = { ...selectedUser };
      if (updatedUser.permissions.includes(permission)) {
        updatedUser.permissions = updatedUser.permissions.filter(p => p !== permission);
      } else {
        updatedUser.permissions = [...updatedUser.permissions, permission];
      }
      setSelectedUser(updatedUser);
    } else {
      // For creating new user
      const updatedNewUser = { ...newUser };
      if (updatedNewUser.permissions.includes(permission)) {
        updatedNewUser.permissions = updatedNewUser.permissions.filter(p => p !== permission);
      } else {
        updatedNewUser.permissions = [...updatedNewUser.permissions, permission];
      }
      setNewUser(updatedNewUser);
    }
  };

  // Handle new user input changes
  const handleNewUserChange = (e) => {
    const { name, value } = e.target;
    setNewUser({
      ...newUser,
      [name]: value
    });
  };

  // Handle changes when editing a user
  const handleEditUserChange = (e) => {
    const { name, value } = e.target;
    setSelectedUser({
      ...selectedUser,
      [name]: value
    });
  };

  const handleInstagramInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewInstagramImage({
      ...newInstagramImage,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const addNewInstagramImage = async () => {
    // Validate required fields
    if (!newInstagramImage.imageUrl) {
      setError('Please provide an image URL');
      return;
    }

    // Check for duplicate URL
    if (instagramImages.some(image => image.imageUrl === newInstagramImage.imageUrl)) {
      setError('An image with this URL already exists');
      return;
    }

    setLoading(true);
    try {
      console.log('🔄 [AdminSettings] Creating new Instagram image');
      
      // Call the store method to create the image
      const result = await createInstagramImage(newInstagramImage);
      
      if (result) {
        setSuccess('Instagram image added successfully');
        // Reset form
        setNewInstagramImage({
          imageUrl: '',
          caption: '',
          link: '#',
          displayOrder: 0,
          isActive: true
        });
        setShowNewInstagramForm(false);
      }
    } catch (error) {
      console.error('❌ [AdminSettings] Error creating Instagram image:', error);
      setError('Failed to create Instagram image');
    } finally {
      setLoading(false);
    }
  };

  const updateInstagram = async () => {
    setLoading(true);
    try {
      console.log('🔄 [AdminSettings] Updating Instagram image');
      
      // Pass the image ID and data to the update function
      const response = await updateInstagramImage(editingInstagram._id, editingInstagram);
      
      if (response) {
        setSuccess('Instagram image updated successfully');
        fetchAllInstagramImages();
        setEditingInstagram(null);
      }
    } catch (error) {
      console.error('❌ [AdminSettings] Error updating Instagram image:', error);
      setError('Failed to update Instagram image');
    } finally {
      setLoading(false);
    }
  };

  const deleteInstagram = async (imageId) => {
    if (!confirm('Are you sure you want to delete this image?')) return;
    
    setLoading(true);
    try {
      console.log(`🔄 [AdminSettings] Deleting Instagram image ${imageId}`);
      
      const success = await deleteInstagramImage(imageId);
      
      if (success) {
        setSuccess('Instagram image deleted successfully');
        fetchAllInstagramImages();
      }
    } catch (error) {
      console.error('❌ [AdminSettings] Error deleting Instagram image:', error);
      setError('Failed to delete Instagram image');
    } finally {
      setLoading(false);
    }
  };

  // Social link handlers
  const handleSocialInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewSocialLink({
      ...newSocialLink,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const addNewSocialLink = async () => {
    // Validate required fields
    if (!newSocialLink.platform || !newSocialLink.url) {
      setError('Please provide the platform and URL');
      return;
    }

    // Validate URL format
    if (!newSocialLink.url.match(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/)) {
      setError('Please enter a valid URL with http:// or https://');
      return;
    }

    setLoading(true);
    try {
      console.log('🔄 [AdminSettings] Creating new social link');
      
      // Call the store method to create the link
      const result = await createSocialLink(newSocialLink);
      
      if (result) {
        setSuccess('Social link added successfully');
        // Reset form
        setNewSocialLink({
          platform: 'instagram',
          url: '',
          displayName: '',
          icon: '',
          displayOrder: 0,
          isActive: true
        });
        setShowNewSocialForm(false);
      }
    } catch (error) {
      console.error('❌ [AdminSettings] Error creating social link:', error);
      setError('Failed to create social link');
    } finally {
      setLoading(false);
    }
  };

  const updateSocial = async () => {
    setLoading(true);
    try {
      console.log('🔄 [AdminSettings] Updating social link');
      
      // Pass the link ID and data to the update function
      const response = await updateSocialLink(editingSocial._id, editingSocial);
      
      if (response) {
        setSuccess('Social link updated successfully');
        fetchAllSocialLinks();
        setEditingSocial(null);
      }
    } catch (error) {
      console.error('❌ [AdminSettings] Error updating social link:', error);
      setError('Failed to update social link');
    } finally {
      setLoading(false);
    }
  };

  const deleteSocial = async (linkId) => {
    if (!confirm('Are you sure you want to delete this social link?')) return;
    
    setLoading(true);
    try {
      console.log(`🔄 [AdminSettings] Deleting social link ${linkId}`);
      
      const success = await deleteSocialLink(linkId);
      
      if (success) {
        setSuccess('Social link deleted successfully');
        fetchAllSocialLinks();
      }
    } catch (error) {
      console.error('❌ [AdminSettings] Error deleting social link:', error);
      setError('Failed to delete social link');
    } finally {
      setLoading(false);
    }
  };

  // Save shipping method changes and update store in real-time
  const saveShippingMethodChanges = () => {
    // Validate the shipping method
    const method = localShippingMethods[editingShipping];
    const validation = validateShippingMethod(method, editingShipping);
    if (!validation.isValid) {
      setError(validation.message);
      return;
    }
    
    // Update the store immediately
    updateShippingMethods(localShippingMethods);
    
    setSuccess('Shipping method updated successfully! Changes will appear immediately in checkout.');
    setEditingShipping(null);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 ml-64">
        {(loading || storeLoading) && <LoadingOverlay />}
        
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled
              />
              <div className="absolute left-3 top-2.5 text-gray-400">
                <FaSearch />
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white">
                {user ? user.firstName?.charAt(0) || 'A' : 'A'}
              </div>
            </div>
          </div>
          
          {/* Authentication Warning Banner */}
          {authWarning && (
            <div className="mb-4 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-lg flex items-center">
              <FaExclamationTriangle className="text-yellow-500 mr-2" />
              <div className="flex-1">
                <p className="font-medium">You are not logged in as an administrator</p>
                <p className="text-sm">Changes will be saved locally but not synchronized with the server</p>
              </div>
              <button 
                onClick={handleLogin}
                className="ml-4 px-3 py-1 bg-yellow-500 text-white rounded-md text-sm hover:bg-yellow-600"
              >
                Log In
              </button>
            </div>
          )}
          
          {(error || storeError) && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center">
              {error || storeError}
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center">
              <FaCheck className="mr-2" />
              {success}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-6">
              {/* Site Settings (Mockup) */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="flex items-center px-6 py-4 border-b border-gray-200">
                  <FaGlobe className="text-purple-600 mr-3" />
                  <h3 className="text-lg font-medium text-gray-900">Site Settings</h3>
                </div>
                
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label htmlFor="siteTitle" className="block text-sm font-medium text-gray-700 mb-1">
                        Site Title
                      </label>
                      <input
                        type="text"
                        id="siteTitle"
                        name="siteTitle"
                        value={localSettings.siteTitle}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="siteDescription" className="block text-sm font-medium text-gray-700 mb-1">
                        Site Description
                      </label>
                      <textarea
                        id="siteDescription"
                        name="siteDescription"
                        value={localSettings.siteDescription}
                        onChange={handleInputChange}
                        rows="3"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      ></textarea>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="maintenanceMode"
                        name="maintenanceMode"
                        checked={localSettings.maintenanceMode}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <label htmlFor="maintenanceMode" className="ml-2 block text-sm text-gray-700">
                        Enable Maintenance Mode
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Shipping Methods Settings */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="flex items-center px-6 py-4 border-b border-gray-200">
                  <FaTruck className="text-purple-600 mr-3" />
                  <h3 className="text-lg font-medium text-gray-900">Shipping Methods</h3>
                </div>
                
                <div className="p-6">
                  <div className="mb-4 flex justify-between items-center">
                    <p className="text-sm text-gray-600">Configure shipping methods available to customers</p>
                    <button 
                      type="button"
                      onClick={() => setShowNewShippingForm(true)}
                      className="px-3 py-1 bg-purple-600 text-white rounded-md text-sm flex items-center"
                    >
                      <FaPlus className="mr-1" /> Add Method
                    </button>
                  </div>
                  
                  {/* New Shipping Method Form */}
                  {showNewShippingForm && (
                    <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium">Add New Shipping Method</h4>
                        <button 
                          type="button" 
                          onClick={() => setShowNewShippingForm(false)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <FaTimes />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
                          <input
                            type="text"
                            name="id"
                            value={newShippingMethod.id}
                            onChange={handleNewShippingInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="e.g. express"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                          <input
                            type="text"
                            name="name"
                            value={newShippingMethod.name}
                            onChange={handleNewShippingInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="e.g. Express Shipping"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                          <input
                            type="text"
                            name="description"
                            value={newShippingMethod.description}
                            onChange={handleNewShippingInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="e.g. 1-2 business days"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Price (GH₵)</label>
                          <input
                            type="number"
                            name="price"
                            value={newShippingMethod.price}
                            onChange={handleNewShippingInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            step="0.01"
                            min="0"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Carrier</label>
                          <input
                            type="text"
                            name="carrier"
                            value={newShippingMethod.carrier}
                            onChange={handleNewShippingInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="e.g. DHL"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Est. Delivery</label>
                          <input
                            type="text"
                            name="estimatedDelivery"
                            value={newShippingMethod.estimatedDelivery}
                            onChange={handleNewShippingInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="e.g. 2-5 days"
                          />
                        </div>
                        <div className="md:col-span-2 flex items-center">
                          <input
                            type="checkbox"
                            id="shippingActive"
                            name="isActive"
                            checked={newShippingMethod.isActive}
                            onChange={handleNewShippingInputChange}
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                          />
                          <label htmlFor="shippingActive" className="ml-2 block text-sm text-gray-700">
                            Active
                          </label>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <button
                          type="button"
                          onClick={addNewShippingMethod}
                          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                        >
                          Add Method
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Shipping Methods List */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Carrier</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {localShippingMethods.map((method, index) => (
                          <tr key={method.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{method.id}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{method.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{method.description}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">GH₵{method.price.toFixed(2)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{method.carrier}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${method.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {method.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button 
                                type="button"
                                onClick={() => {
                                  setEditingShipping(index);
                                }}
                                className="text-indigo-600 hover:text-indigo-900 mr-3"
                              >
                                <FaEdit />
                              </button>
                              <button 
                                type="button"
                                onClick={() => removeShippingMethod(index)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <FaTrash />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Edit Shipping Method Form */}
                  {editingShipping !== null && (
                    <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium">Edit Shipping Method</h4>
                        <button 
                          type="button" 
                          onClick={() => setEditingShipping(null)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <FaTimes />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
                          <input
                            type="text"
                            name="id"
                            value={localShippingMethods[editingShipping].id}
                            onChange={(e) => handleShippingInputChange(e, editingShipping)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="e.g. express"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                          <input
                            type="text"
                            name="name"
                            value={localShippingMethods[editingShipping].name}
                            onChange={(e) => handleShippingInputChange(e, editingShipping)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="e.g. Express Shipping"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                          <input
                            type="text"
                            name="description"
                            value={localShippingMethods[editingShipping].description}
                            onChange={(e) => handleShippingInputChange(e, editingShipping)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="e.g. 1-2 business days"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Price (GH₵)</label>
                          <input
                            type="number"
                            name="price"
                            value={localShippingMethods[editingShipping].price}
                            onChange={(e) => handleShippingInputChange(e, editingShipping)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            step="0.01"
                            min="0"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Carrier</label>
                          <input
                            type="text"
                            name="carrier"
                            value={localShippingMethods[editingShipping].carrier}
                            onChange={(e) => handleShippingInputChange(e, editingShipping)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="e.g. DHL"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Est. Delivery</label>
                          <input
                            type="text"
                            name="estimatedDelivery"
                            value={localShippingMethods[editingShipping].estimatedDelivery}
                            onChange={(e) => handleShippingInputChange(e, editingShipping)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="e.g. 2-5 days"
                          />
                        </div>
                        <div className="md:col-span-2 flex items-center">
                          <input
                            type="checkbox"
                            id="editShippingActive"
                            name="isActive"
                            checked={localShippingMethods[editingShipping].isActive}
                            onChange={(e) => handleShippingInputChange(e, editingShipping)}
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                          />
                          <label htmlFor="editShippingActive" className="ml-2 block text-sm text-gray-700">
                            Active
                          </label>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setEditingShipping(null)}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={saveShippingMethodChanges}
                          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Tax Rates Settings */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="flex items-center px-6 py-4 border-b border-gray-200">
                  <FaPercentage className="text-purple-600 mr-3" />
                  <h3 className="text-lg font-medium text-gray-900">Tax Rates</h3>
                </div>
                
                <div className="p-6">
                  <div className="mb-6">
                    <label htmlFor="defaultTaxRate" className="block text-sm font-medium text-gray-700 mb-1">
                      Default Tax Rate (%)
                    </label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        id="defaultTaxRate"
                        name="defaultTaxRate"
                        value={(localDefaultTaxRate * 100).toFixed(1)}
                        onChange={handleDefaultTaxRateChange}
                        className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        step="0.1"
                        min="0"
                        max="100"
                      />
                      <span className="ml-2 text-gray-600">%</span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      This rate will be applied when a country-specific rate is not available
                    </p>
                  </div>
                  
                  <div className="mb-4 flex justify-between items-center">
                    <p className="text-sm text-gray-600">Configure tax rates for specific countries</p>
                    <button 
                      type="button"
                      onClick={() => setShowNewTaxForm(true)}
                      className="px-3 py-1 bg-purple-600 text-white rounded-md text-sm flex items-center"
                    >
                      <FaPlus className="mr-1" /> Add Tax Rate
                    </button>
                  </div>
                  
                  {/* New Tax Rate Form */}
                  {showNewTaxForm && (
                    <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium">Add New Tax Rate</h4>
                        <button 
                          type="button" 
                          onClick={() => setShowNewTaxForm(false)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <FaTimes />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Country Code</label>
                          <input
                            type="text"
                            name="countryCode"
                            value={newTaxRate.countryCode}
                            onChange={handleNewTaxInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="e.g. US"
                            maxLength="2"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Country Name</label>
                          <input
                            type="text"
                            name="country"
                            value={newTaxRate.country}
                            onChange={handleNewTaxInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="e.g. United States"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
                          <div className="flex items-center">
                            <input
                              type="number"
                              name="rate"
                              value={(newTaxRate.rate * 100).toFixed(1)}
                              onChange={handleNewTaxInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              step="0.1"
                              min="0"
                              max="100"
                              required
                            />
                            <span className="ml-2">%</span>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="taxActive"
                            name="isActive"
                            checked={newTaxRate.isActive}
                            onChange={handleNewTaxInputChange}
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                          />
                          <label htmlFor="taxActive" className="ml-2 block text-sm text-gray-700">
                            Active
                          </label>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <button
                          type="button"
                          onClick={addNewTaxRate}
                          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                        >
                          Add Tax Rate
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Tax Rates List */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country Code</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tax Rate</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {localTaxRates.map((tax, index) => (
                          <tr key={tax.countryCode}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tax.countryCode}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tax.country}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(tax.rate * 100).toFixed(1)}%</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${tax.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {tax.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button 
                                type="button"
                                onClick={() => {
                                  setEditingTax(index);
                                }}
                                className="text-indigo-600 hover:text-indigo-900 mr-3"
                              >
                                <FaEdit />
                              </button>
                              <button 
                                type="button"
                                onClick={() => removeTaxRate(index)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <FaTrash />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              
              {/* Notification Settings (Mockup) */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="flex items-center px-6 py-4 border-b border-gray-200">
                  <FaBell className="text-purple-600 mr-3" />
                  <h3 className="text-lg font-medium text-gray-900">Notification Settings</h3>
                </div>
                
                <div className="p-6 space-y-4">
                  <div>
                    <div className="flex items-center mb-3">
                      <input
                        type="checkbox"
                        id="emailNotifications"
                        name="emailNotifications"
                        checked={localSettings.emailNotifications}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <label htmlFor="emailNotifications" className="ml-2 block text-sm text-gray-700">
                        Enable Email Notifications
                      </label>
                    </div>
                    
                    <div className="flex items-center mb-3">
                      <input
                        type="checkbox"
                        id="orderUpdates"
                        name="orderUpdates"
                        checked={localSettings.orderUpdates}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <label htmlFor="orderUpdates" className="ml-2 block text-sm text-gray-700">
                        Order Updates
                      </label>
                    </div>
                    
                    <div className="flex items-center mb-3">
                      <input
                        type="checkbox"
                        id="customerMessages"
                        name="customerMessages"
                        checked={localSettings.customerMessages}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <label htmlFor="customerMessages" className="ml-2 block text-sm text-gray-700">
                        Customer Messages
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="lowInventoryAlerts"
                        name="lowInventoryAlerts"
                        checked={localSettings.lowInventoryAlerts}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <label htmlFor="lowInventoryAlerts" className="ml-2 block text-sm text-gray-700">
                        Low Inventory Alerts
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Security Settings (Mockup) */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="flex items-center px-6 py-4 border-b border-gray-200">
                  <FaLock className="text-purple-600 mr-3" />
                  <h3 className="text-lg font-medium text-gray-900">Security Settings</h3>
                </div>
                
                <div className="p-6 space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="requireEmailVerification"
                      name="requireEmailVerification"
                      checked={localSettings.requireEmailVerification}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <label htmlFor="requireEmailVerification" className="ml-2 block text-sm text-gray-700">
                      Require Email Verification
                    </label>
                  </div>
                </div>
              </div>
              
              {/* Site Identity and Banners */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="flex items-center px-6 py-4 border-b border-gray-200">
                  <FaImage className="text-purple-600 mr-3" />
                  <h3 className="text-lg font-medium text-gray-900">Site Identity & Banners</h3>
                </div>
                
                <div className="p-6 space-y-6">
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <h4 className="font-medium text-gray-800">Hero Carousel Banners</h4>
                        <p className="text-sm text-gray-600">Add multiple banners for the homepage hero carousel. These will appear in order of the display number.</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => {
                          setNewBanner({
                            type: 'heroBanner',
                            imageUrl: '',
                            alt: 'Hero Image',
                            linkUrl: '#',
                            caption: '',
                            subcaption: '',
                            displayOrder: localBanners.filter(b => b.type === 'heroBanner').length,
                            isActive: true
                          });
                          setShowNewBannerForm(true);
                        }}
                        className="px-3 py-1 bg-purple-600 text-white rounded-md text-sm flex items-center"
                      >
                        <FaPlus className="mr-1" /> Add Hero Banner
                      </button>
                    </div>
                    
                    {/* Hero Banners Preview */}
                    <div className="my-4 bg-gray-50 p-4 rounded-lg">
                      <h5 className="text-sm font-medium text-gray-700 mb-3">Current Hero Carousel:</h5>
                      {localBanners.filter(b => b.type === 'heroBanner' && b.isActive).length > 0 ? (
                        <div className="flex overflow-x-auto pb-4 space-x-4">
                          {localBanners
                            .filter(b => b.type === 'heroBanner' && b.isActive)
                            .sort((a, b) => a.displayOrder - b.displayOrder)
                            .map((banner, idx) => (
                              <div key={idx} className="flex-shrink-0 w-48 relative group">
                                <div className="border rounded-lg overflow-hidden">
                                  <img 
                                    src={banner.imageUrl} 
                                    alt={banner.alt || "Hero banner"} 
                                    className="w-full h-24 object-cover"
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = "https://via.placeholder.com/240x120?text=Error";
                                    }}
                                  />
                                  {banner.caption && (
                                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black to-transparent">
                                      <p className="text-white text-xs truncate">{banner.caption}</p>
                                    </div>
                                  )}
                                </div>
                                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button 
                                    type="button"
                                    onClick={() => {
                                      setNewBanner({...banner});
                                      setShowNewBannerForm(true);
                                    }}
                                    className="bg-white p-1 rounded-full shadow-md text-indigo-600 hover:text-indigo-900 mr-1"
                                  >
                                    <FaEdit size={12} />
                                  </button>
                                  <button 
                                    type="button"
                                    onClick={() => {
                                      const bannerIndex = localBanners.findIndex(b => 
                                        b.type === banner.type && b.imageUrl === banner.imageUrl);
                                      if (bannerIndex >= 0) removeBanner(bannerIndex);
                                    }}
                                    className="bg-white p-1 rounded-full shadow-md text-red-600 hover:text-red-900"
                                  >
                                    <FaTrash size={12} />
                                  </button>
                                </div>
                                <div className="text-center bg-gray-200 py-1 rounded-b-lg">
                                  <span className="text-xs font-medium">Order: {banner.displayOrder}</span>
                                </div>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg bg-white">
                          <p className="text-gray-500">No hero banners added yet. Add hero banners to create a carousel.</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <h4 className="font-medium text-gray-800">Other Banners</h4>
                        <p className="text-sm text-gray-600">Manage top banner and promotional banners for your site.</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => {
                          setNewBanner({
                            type: 'topBanner',
                            imageUrl: '',
                            alt: '',
                            linkUrl: '#',
                            caption: '',
                            subcaption: '',
                            displayOrder: 0,
                            isActive: true
                          });
                          setShowNewBannerForm(true);
                        }}
                        className="px-3 py-1 bg-purple-600 text-white rounded-md text-sm flex items-center"
                      >
                        <FaPlus className="mr-1" /> Add Other Banner
                      </button>
                    </div>
                  </div>
                  
                  {/* New Banner Form */}
                  {showNewBannerForm && (
                    <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium">{newBanner.type === 'heroBanner' ? 'Add/Update Hero Banner' : 'Add/Update Banner'}</h4>
                        <button 
                          type="button" 
                          onClick={() => setShowNewBannerForm(false)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <FaTimes />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Banner Type</label>
                          <select
                            name="type"
                            value={newBanner.type}
                            onChange={handleNewBannerInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            required
                          >
                            <option value="topBanner">Top Banner</option>
                            <option value="heroBanner">Hero Banner (Carousel)</option>
                            <option value="promoBanner">Promotional Banner</option>
                          </select>
                          <p className="mt-1 text-xs text-gray-500">
                            {newBanner.type === 'topBanner' 
                              ? 'Small banner at the top of the home page' 
                              : newBanner.type === 'heroBanner'
                                ? 'Carousel banner on the home page (can add multiple)'
                                : 'Additional promotional banner'}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                          <input
                            type="text"
                            name="imageUrl"
                            value={newBanner.imageUrl}
                            onChange={handleNewBannerInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="https://example.com/image.jpg"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Alt Text</label>
                          <input
                            type="text"
                            name="alt"
                            value={newBanner.alt}
                            onChange={handleNewBannerInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="Banner description for accessibility"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Link URL</label>
                          <input
                            type="text"
                            name="linkUrl"
                            value={newBanner.linkUrl}
                            onChange={handleNewBannerInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="e.g. /collections/summer-sale"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Caption</label>
                          <input
                            type="text"
                            name="caption"
                            value={newBanner.caption}
                            onChange={handleNewBannerInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="Banner caption"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Subcaption</label>
                          <input
                            type="text"
                            name="subcaption"
                            value={newBanner.subcaption}
                            onChange={handleNewBannerInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="Banner subcaption"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {newBanner.type === 'heroBanner' ? 'Display Order (in carousel)' : 'Display Order'}
                          </label>
                          <input
                            type="number"
                            name="displayOrder"
                            value={newBanner.displayOrder}
                            onChange={handleNewBannerInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="Banner display order"
                          />
                          {newBanner.type === 'heroBanner' && (
                            <p className="mt-1 text-xs text-gray-500">
                              Lower numbers appear first in the carousel
                            </p>
                          )}
                        </div>
                        
                        {/* Add button text field */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Button Text</label>
                          <input
                            type="text"
                            name="buttonText"
                            value={newBanner.buttonText || ""}
                            onChange={handleNewBannerInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="e.g. Shop Now"
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            Leave empty to hide button
                          </p>
                        </div>
                        
                        {/* Add overlay position dropdown */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Overlay Position</label>
                          <select
                            name="overlayPosition"
                            value={newBanner.overlayPosition || "center"}
                            onChange={handleNewBannerInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          >
                            <option value="center">Center</option>
                            <option value="left">Left</option>
                            <option value="right">Right</option>
                            <option value="top-left">Top Left</option>
                            <option value="top-right">Top Right</option>
                            <option value="bottom-left">Bottom Left</option>
                            <option value="bottom-right">Bottom Right</option>
                            <option value="top-center">Top Center</option>
                            <option value="bottom-center">Bottom Center</option>
                          </select>
                        </div>
                        
                        {/* Add button style dropdown */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Button Style</label>
                          <select
                            name="buttonStyle"
                            value={newBanner.buttonStyle || "primary"}
                            onChange={handleNewBannerInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          >
                            <option value="primary">Primary (Black)</option>
                            <option value="secondary">Secondary (White)</option>
                            <option value="outlined">Outlined</option>
                            <option value="minimal">Minimal</option>
                          </select>
                        </div>
                        
                        <div className="md:col-span-2 flex items-center">
                          <input
                            type="checkbox"
                            id="bannerActive"
                            name="isActive"
                            checked={newBanner.isActive}
                            onChange={handleNewBannerInputChange}
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                          />
                          <label htmlFor="bannerActive" className="ml-2 block text-sm text-gray-700">
                            Active
                          </label>
                        </div>
                      </div>
                      <div className="mt-4">
                        {newBanner.imageUrl && (
                          <div className="mb-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                            <div className="border rounded-lg overflow-hidden relative">
                              <img 
                                src={newBanner.imageUrl} 
                                alt={newBanner.alt || "Banner preview"} 
                                className="w-full h-48 object-cover"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = "https://via.placeholder.com/800x200?text=Invalid+Image+URL";
                                }}
                              />
                              {newBanner.caption && (
                                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent">
                                  <h3 className="text-white font-medium">{newBanner.caption}</h3>
                                  {newBanner.subcaption && (
                                    <p className="text-white text-sm">{newBanner.subcaption}</p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={addNewBanner}
                            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                          >
                            {localBanners.some(banner => banner.type === newBanner.type && 
                                               banner.imageUrl === newBanner.imageUrl) 
                              ? 'Update Banner' 
                              : 'Add Banner'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Banners List */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preview</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Caption</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {localBanners.map((banner, index) => (
                          <tr key={banner.type + index} className={banner.type === 'heroBanner' ? 'bg-gray-50' : ''}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <FaImage className="text-purple-500 mr-2" />
                                <span className="capitalize">
                                  {banner.type === 'heroBanner' 
                                    ? 'Hero Banner (Carousel)' 
                                    : banner.type.replace('Banner', ' Banner')}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="w-24 h-12 relative rounded overflow-hidden border">
                                <img 
                                  src={banner.imageUrl} 
                                  alt={banner.alt || banner.type} 
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "https://via.placeholder.com/240x120?text=Error";
                                  }}
                                />
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {banner.caption ? (
                                <div>
                                  <div>{banner.caption}</div>
                                  {banner.subcaption && (
                                    <div className="text-xs text-gray-400">{banner.subcaption}</div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-400">No caption</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {banner.displayOrder}
                              {banner.type === 'heroBanner' && (
                                <span className="ml-1 text-xs text-purple-600">(in carousel)</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${banner.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {banner.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button 
                                type="button"
                                onClick={() => {
                                  setNewBanner({...banner});
                                  setShowNewBannerForm(true);
                                }}
                                className="text-indigo-600 hover:text-indigo-900 mr-3"
                              >
                                <FaEdit />
                              </button>
                              <button 
                                type="button"
                                onClick={() => removeBanner(index)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <FaTrash />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {localBanners.length === 0 && (
                          <tr>
                            <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                              No banners configured. Use the buttons above to add banners.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              
              {/* User Management Section */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="flex items-center px-6 py-4 border-b border-gray-200">
                  <FaUsers className="text-purple-600 mr-3" />
                  <h3 className="text-lg font-medium text-gray-900">User Management</h3>
                </div>
                
                <div className="p-6 space-y-6">
                  <div className="mb-4 flex justify-between items-center">
                    <p className="text-sm text-gray-600">Manage admin and staff users</p>
                    <button 
                      type="button"
                      onClick={() => setShowNewUserForm(true)}
                      className="px-3 py-1 bg-purple-600 text-white rounded-md text-sm flex items-center"
                    >
                      <FaUserPlus className="mr-1" /> Add User
                    </button>
                  </div>
                  
                  {/* New User Form */}
                  {showNewUserForm && (
                    <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium">Add New User</h4>
                        <button 
                          type="button" 
                          onClick={() => setShowNewUserForm(false)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <FaTimes />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                          <input
                            type="text"
                            name="firstName"
                            value={newUser.firstName}
                            onChange={handleNewUserChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                          <input
                            type="text"
                            name="lastName"
                            value={newUser.lastName}
                            onChange={handleNewUserChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                          <input
                            type="email"
                            name="email"
                            value={newUser.email}
                            onChange={handleNewUserChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                          <input
                            type="password"
                            name="password"
                            value={newUser.password}
                            onChange={handleNewUserChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            required
                            minLength="6"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                          <select
                            name="role"
                            value={newUser.role}
                            onChange={handleNewUserChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          >
                            <option value="admin">Admin</option>
                            <option value="staff">Staff</option>
                          </select>
                        </div>
                      </div>
                      
                      {/* Permissions Section */}
                      <div className="mt-6">
                        <h5 className="font-medium text-gray-700 mb-2">Permissions</h5>
                        <p className="text-sm text-gray-500 mb-3">
                          {newUser.role === 'admin' 
                            ? 'Admins have access to all areas of the admin panel' 
                            : 'Select which areas of the admin panel this staff member can access'}
                        </p>
                        
                        {newUser.role === 'staff' && (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {availablePermissions.map(permission => (
                              <div key={permission.id} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={`new-perm-${permission.id}`}
                                  checked={newUser.permissions.includes(permission.id)}
                                  onChange={() => handlePermissionToggle(permission.id)}
                                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                                />
                                <label htmlFor={`new-perm-${permission.id}`} className="text-sm text-gray-700">
                                  {permission.label}
                                </label>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-4 flex justify-end">
                        <button
                          type="button"
                          onClick={createAdminUser}
                          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                        >
                          Create User
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Edit User Form */}
                  {selectedUser && (
                    <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium">Edit User</h4>
                        <button 
                          type="button" 
                          onClick={() => setSelectedUser(null)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <FaTimes />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                          <input
                            type="text"
                            name="firstName"
                            value={selectedUser.firstName}
                            onChange={handleEditUserChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                          <input
                            type="text"
                            name="lastName"
                            value={selectedUser.lastName}
                            onChange={handleEditUserChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                          <input
                            type="email"
                            name="email"
                            value={selectedUser.email}
                            onChange={handleEditUserChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                          <select
                            name="role"
                            value={selectedUser.role}
                            onChange={handleEditUserChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          >
                            <option value="admin">Admin</option>
                            <option value="staff">Staff</option>
                          </select>
                        </div>
                      </div>
                      
                      {/* Permissions Section */}
                      <div className="mt-6">
                        <h5 className="font-medium text-gray-700 mb-2">Permissions</h5>
                        <p className="text-sm text-gray-500 mb-3">
                          {selectedUser.role === 'admin' 
                            ? 'Admins have access to all areas of the admin panel' 
                            : 'Select which areas of the admin panel this staff member can access'}
                        </p>
                        
                        {selectedUser.role === 'staff' && (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {availablePermissions.map(permission => (
                              <div key={permission.id} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={`edit-perm-${permission.id}`}
                                  checked={selectedUser.permissions.includes(permission.id)}
                                  onChange={() => handlePermissionToggle(permission.id)}
                                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                                />
                                <label htmlFor={`edit-perm-${permission.id}`} className="text-sm text-gray-700">
                                  {permission.label}
                                </label>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-4 flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setSelectedUser(null)}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => updateUser(selectedUser._id, selectedUser)}
                          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                        >
                          Update User
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Users List */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {loadingUsers ? (
                          <tr>
                            <td colSpan="4" className="px-6 py-4 text-center">
                              Loading users...
                            </td>
                          </tr>
                        ) : users.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="px-6 py-4 text-center">
                              No users found
                            </td>
                          </tr>
                        ) : (
                          users.map(user => (
                            <tr key={user._id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                                    {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {user.email}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button 
                                  type="button"
                                  onClick={() => setSelectedUser(user)}
                                  className="text-indigo-600 hover:text-indigo-900 mr-3"
                                  disabled={user._id === user?.id} // Can't edit self
                                >
                                  <FaEdit />
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => deleteUser(user._id)}
                                  className="text-red-600 hover:text-red-900"
                                  disabled={user._id === user?.id} // Can't delete self
                                >
                                  <FaTrash />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              
              {/* Instagram Feed Management Section */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="flex items-center px-6 py-4 border-b border-gray-200">
                  <FaInstagram className="text-purple-600 mr-3" />
                  <h3 className="text-lg font-medium text-gray-900">Instagram Feed</h3>
                </div>
                
                <div className="p-6 space-y-6">
                  <div className="mb-4 flex justify-between items-center">
                    <p className="text-sm text-gray-600">Manage Instagram images displayed on the homepage</p>
                    <button 
                      type="button"
                      onClick={() => setShowNewInstagramForm(true)}
                      className="px-3 py-1 bg-purple-600 text-white rounded-md text-sm flex items-center"
                    >
                      <FaPlus className="mr-1" /> Add Image
                    </button>
                  </div>
                  
                  {/* New Instagram Image Form */}
                  {showNewInstagramForm && (
                    <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium">Add Instagram Image</h4>
                        <button 
                          type="button" 
                          onClick={() => setShowNewInstagramForm(false)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <FaTimes />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Image URL*</label>
                          <input
                            type="text"
                            name="imageUrl"
                            value={newInstagramImage.imageUrl}
                            onChange={handleInstagramInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="https://example.com/image.jpg"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Caption</label>
                          <input
                            type="text"
                            name="caption"
                            value={newInstagramImage.caption}
                            onChange={handleInstagramInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="Image caption"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Link (Optional)</label>
                          <input
                            type="text"
                            name="link"
                            value={newInstagramImage.link}
                            onChange={handleInstagramInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="https://instagram.com/post/123"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                          <input
                            type="number"
                            name="displayOrder"
                            value={newInstagramImage.displayOrder}
                            onChange={handleInstagramInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="instagramActive"
                            name="isActive"
                            checked={newInstagramImage.isActive}
                            onChange={handleInstagramInputChange}
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                          />
                          <label htmlFor="instagramActive" className="ml-2 block text-sm text-gray-700">
                            Active
                          </label>
                        </div>
                      </div>
                      
                      {/* Preview */}
                      <div className="mt-4">
                        {newInstagramImage.imageUrl && (
                          <div className="mb-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                            <div className="border rounded-lg overflow-hidden">
                              <img 
                                src={newInstagramImage.imageUrl} 
                                alt={newInstagramImage.caption || "Instagram preview"} 
                                className="w-40 h-40 object-cover"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = "https://via.placeholder.com/400x400?text=Image+Error";
                                }}
                              />
                            </div>
                          </div>
                        )}
                        
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={addNewInstagramImage}
                            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                          >
                            Add Instagram Image
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Edit Instagram Image Form */}
                  {editingInstagram && (
                    <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium">Edit Instagram Image</h4>
                        <button 
                          type="button" 
                          onClick={() => setEditingInstagram(null)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <FaTimes />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Image URL*</label>
                          <input
                            type="text"
                            name="imageUrl"
                            value={editingInstagram.imageUrl}
                            onChange={(e) => setEditingInstagram({...editingInstagram, imageUrl: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="https://example.com/image.jpg"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Caption</label>
                          <input
                            type="text"
                            name="caption"
                            value={editingInstagram.caption}
                            onChange={(e) => setEditingInstagram({...editingInstagram, caption: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="Image caption"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Link (Optional)</label>
                          <input
                            type="text"
                            name="link"
                            value={editingInstagram.link}
                            onChange={(e) => setEditingInstagram({...editingInstagram, link: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="https://instagram.com/post/123"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                          <input
                            type="number"
                            name="displayOrder"
                            value={editingInstagram.displayOrder}
                            onChange={(e) => setEditingInstagram({...editingInstagram, displayOrder: parseInt(e.target.value)})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="editInstagramActive"
                            name="isActive"
                            checked={editingInstagram.isActive}
                            onChange={(e) => setEditingInstagram({...editingInstagram, isActive: e.target.checked})}
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                          />
                          <label htmlFor="editInstagramActive" className="ml-2 block text-sm text-gray-700">
                            Active
                          </label>
                        </div>
                      </div>
                      
                      {/* Preview */}
                      <div className="mt-4">
                        {editingInstagram.imageUrl && (
                          <div className="mb-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                            <div className="border rounded-lg overflow-hidden">
                              <img 
                                src={editingInstagram.imageUrl} 
                                alt={editingInstagram.caption || "Instagram preview"} 
                                className="w-40 h-40 object-cover"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = "https://via.placeholder.com/400x400?text=Image+Error";
                                }}
                              />
                            </div>
                          </div>
                        )}
                        
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={updateInstagram}
                            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                          >
                            Update Instagram Image
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Instagram Images Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {instagramImages.map((image) => (
                      <div key={image._id} className="relative group">
                        <div className="border rounded-lg overflow-hidden relative">
                          <img 
                            src={image.imageUrl} 
                            alt={image.caption || "Instagram image"} 
                            className="w-full h-40 object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "https://via.placeholder.com/400x400?text=Image+Error";
                            }}
                          />
                          {image.caption && (
                            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black to-transparent">
                              <p className="text-white text-xs truncate">{image.caption}</p>
                            </div>
                          )}
                          {!image.isActive && (
                            <div className="absolute inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center">
                              <span className="px-2 py-1 bg-red-500 text-white text-xs rounded">Inactive</span>
                            </div>
                          )}
                          <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                            <button 
                              type="button"
                              onClick={() => setEditingInstagram(image)}
                              className="p-1 bg-white rounded shadow text-blue-600 hover:text-blue-800"
                            >
                              <FaEdit size={14} />
                            </button>
                            <button 
                              type="button"
                              onClick={() => deleteInstagram(image._id)}
                              className="p-1 bg-white rounded shadow text-red-600 hover:text-red-800"
                            >
                              <FaTrash size={14} />
                            </button>
                          </div>
                        </div>
                        <p className="mt-1 text-xs text-gray-500 text-center">Order: {image.displayOrder}</p>
                      </div>
                    ))}
                    
                    {instagramImages.length === 0 && (
                      <div className="col-span-full p-8 text-center bg-gray-100 rounded-lg">
                        <p className="text-gray-500">No Instagram images added yet. Add images to display in the Instagram feed on the homepage.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Social Links Management Section */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="flex items-center px-6 py-4 border-b border-gray-200">
                  <FaLink className="text-purple-600 mr-3" />
                  <h3 className="text-lg font-medium text-gray-900">Social Links</h3>
                </div>
                
                <div className="p-6 space-y-6">
                  <div className="mb-4 flex justify-between items-center">
                    <p className="text-sm text-gray-600">Manage social links for your site</p>
                    <button 
                      type="button"
                      onClick={() => setShowNewSocialForm(true)}
                      className="px-3 py-1 bg-purple-600 text-white rounded-md text-sm flex items-center"
                    >
                      <FaPlus className="mr-1" /> Add Link
                    </button>
                  </div>
                  
                  {/* New Social Link Form */}
                  {showNewSocialForm && (
                    <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium">Add New Social Link</h4>
                        <button 
                          type="button" 
                          onClick={() => setShowNewSocialForm(false)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <FaTimes />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
                          <select
                            name="platform"
                            value={newSocialLink.platform}
                            onChange={handleSocialInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            required
                          >
                            <option value="instagram">Instagram</option>
                            <option value="facebook">Facebook</option>
                            <option value="twitter">Twitter</option>
                            <option value="linkedin">LinkedIn</option>
                            <option value="pinterest">Pinterest</option>
                            <option value="tiktok">TikTok</option>
                            <option value="snapchat">Snapchat</option>
                            <option value="youtube">YouTube</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">URL*</label>
                          <input
                            type="text"
                            name="url"
                            value={newSocialLink.url}
                            onChange={handleSocialInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="https://example.com/link"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                          <input
                            type="text"
                            name="displayName"
                            value={newSocialLink.displayName}
                            onChange={handleSocialInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="e.g. @username"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Icon (Optional)</label>
                          <input
                            type="text"
                            name="icon"
                            value={newSocialLink.icon}
                            onChange={handleSocialInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="e.g. fa-instagram"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                          <input
                            type="number"
                            name="displayOrder"
                            value={newSocialLink.displayOrder}
                            onChange={handleSocialInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="Link display order"
                          />
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="socialActive"
                            name="isActive"
                            checked={newSocialLink.isActive}
                            onChange={handleSocialInputChange}
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                          />
                          <label htmlFor="socialActive" className="ml-2 block text-sm text-gray-700">
                            Active
                          </label>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <button
                          type="button"
                          onClick={addNewSocialLink}
                          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                        >
                          Add Link
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Social Links List */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Platform</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">URL</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Display Name</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {socialLinks.map((link) => (
                          <tr key={link._id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <FaLink className="text-purple-500 mr-2" />
                                <span className="capitalize">{link.platform}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                {link.url}
                              </a>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">{link.displayName}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${link.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {link.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button 
                                type="button"
                                onClick={() => {
                                  setEditingSocial(link);
                                  setShowNewSocialForm(true);
                                }}
                                className="text-indigo-600 hover:text-indigo-900 mr-3"
                              >
                                <FaEdit />
                              </button>
                              <button 
                                type="button"
                                onClick={() => deleteSocial(link._id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <FaTrash />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </div>
                  ) : (
                    <>Save Settings</>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings; 