import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Search, ChevronRight, AlertCircle, Info } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const TrackingLookupPage = () => {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [error, setError] = useState('');
  const [isTouched, setIsTouched] = useState(false);
  const [showTestInfo, setShowTestInfo] = useState(false);
  const navigate = useNavigate();
  
  // Check if in development mode
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      setShowTestInfo(true);
    }
  }, []);

  // Basic validation for tracking/order number format
  const validateTrackingNumber = (number) => {
    if (!number) return { valid: false, reason: 'empty' };
    if (number.length < 5) return { valid: false, reason: 'too_short' };
    if (number.length > 30) return { valid: false, reason: 'too_long' };
    
    // Most tracking numbers are alphanumeric with possible hyphen
    if (!/^[a-zA-Z0-9-]+$/.test(number)) {
      return { valid: false, reason: 'invalid_chars' };
    }
    
    return { valid: true };
  };
  
  const getValidationMessage = (validationResult) => {
    if (!validationResult) return '';
    
    switch (validationResult.reason) {
      case 'empty':
        return 'Please enter a tracking or order number';
      case 'too_short':
        return 'Tracking number is too short (minimum 5 characters)';
      case 'too_long':
        return 'Tracking number is too long (maximum 30 characters)';
      case 'invalid_chars':
        return 'Tracking number should only contain letters, numbers, and hyphens';
      default:
        return 'Invalid tracking number format';
    }
  };
  
  const handleInputChange = (e) => {
    const value = e.target.value;
    setTrackingNumber(value);
    
    if (isTouched) {
      const validationResult = validateTrackingNumber(value);
      if (!validationResult.valid) {
        setError(getValidationMessage(validationResult));
      } else {
        setError('');
      }
    }
  };
  
  const handleInputBlur = () => {
    setIsTouched(true);
    if (trackingNumber) {
      const validationResult = validateTrackingNumber(trackingNumber);
      if (!validationResult.valid) {
        setError(getValidationMessage(validationResult));
      } else {
        setError('');
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationResult = validateTrackingNumber(trackingNumber.trim());
    
    if (!validationResult.valid) {
      setError(getValidationMessage(validationResult));
      return;
    }
    
    // Clear any previous errors
    setError('');
    
    // Navigate to the tracking page with the entered tracking number
    navigate(`/track-order/${trackingNumber.trim()}`);
  };

  return (
    <>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-12 mb-16">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Track Your Order</h1>
          <p className="text-lg text-gray-600">Enter your order number or tracking number to check status</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="trackingNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Order Number / Tracking Number
              </label>
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-grow">
                  <input
                    type="text"
                    id="trackingNumber"
                    className={`block w-full rounded-md shadow-sm py-3 px-4 focus:ring-blue-500 focus:outline-none
                      ${error ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'}`}
                    placeholder="Enter your order or tracking number"
                    value={trackingNumber}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    aria-describedby="tracking-error"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <Search className={`h-5 w-5 ${error ? 'text-red-500' : 'text-gray-400'}`} />
                  </div>
                </div>
                <button
                  type="submit"
                  className="md:flex-shrink-0 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300 disabled:cursor-not-allowed"
                  disabled={!!error}
                >
                  Track
                </button>
              </div>
              {error && (
                <div className="flex items-center mt-2 text-sm text-red-600" id="tracking-error">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {error}
                </div>
              )}
              <div className="mt-3">
                <p className="text-sm text-gray-500 mb-1">
                  Enter the order number from your confirmation email or the tracking number you received
                </p>
                <p className="text-xs text-gray-500">
                  Example formats: <span className="font-medium">ORD-12345</span> (Order Number) or <span className="font-medium">TRK123456789XY</span> (Tracking Number)
                </p>
                
                {showTestInfo && (
                  <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800 flex items-center">
                    <Info className="w-4 h-4 mr-1 flex-shrink-0" />
                    <span>
                      <strong>Note:</strong> Make sure you have the valid order number or contact customer support
                    </span>
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 mb-4">How to track your order</h2>
          <ol className="space-y-4">
            <li className="flex">
              <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 mr-3 font-bold">
                1
              </span>
              <div>
                <p className="text-gray-700">Enter your order number or tracking number in the field above</p>
                <p className="text-sm text-gray-500">You can find this in your order confirmation email</p>
              </div>
            </li>
            <li className="flex">
              <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 mr-3 font-bold">
                2
              </span>
              <div>
                <p className="text-gray-700">Click the "Track" button</p>
                <p className="text-sm text-gray-500">This will take you to your order tracking information</p>
              </div>
            </li>
            <li className="flex">
              <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 mr-3 font-bold">
                3
              </span>
              <div>
                <p className="text-gray-700">View the real-time status of your order</p>
                <p className="text-sm text-gray-500">
                  See where your order is in the delivery process and when you can expect to receive it
                </p>
              </div>
            </li>
          </ol>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-3">
              <strong>Need help?</strong> If you can't find your tracking information or have any questions:
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="/sinosply-contact"
                className="inline-flex items-center text-blue-600 hover:text-blue-700"
              >
                Contact Support <ChevronRight className="w-4 h-4 ml-1" />
              </a>
              <a 
                href="/faq"
                className="inline-flex items-center text-blue-600 hover:text-blue-700" 
              >
                View FAQs <ChevronRight className="w-4 h-4 ml-1" />
              </a>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default TrackingLookupPage;