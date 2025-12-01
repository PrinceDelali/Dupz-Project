import React, { useState } from 'react';
import { X, Copy, Facebook, Twitter, Instagram, MessageCircle, Mail } from 'lucide-react';

const ShareModal = ({ isOpen, onClose, product, currentUrl }) => {
  const [copySuccess, setCopySuccess] = useState(false);
  
  if (!isOpen || !product) return null;
  
  // Get current variant safely
  const currentVariant = product.variants && 
                        Array.isArray(product.variants) && 
                        product.variants.length > 0 ? 
                        product.variants[product.currentVariantIndex || 0] : 
                        { image: '', price: '' };
  
  // Generate share URLs
  const shareData = {
    title: `Check out ${product.name || 'this product'}`,
    text: `I found this amazing ${product.name || 'product'} on Sinosply!`,
    url: currentUrl || window.location.href
  };
  
  // Handle copy to clipboard
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl || window.location.href);
      setCopySuccess(true);
      
      // Reset copy success message after 2 seconds
      setTimeout(() => {
        setCopySuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };
  
  // Handle native share if available
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Error sharing:', err);
      }
    }
  };
  
  // Handle platform-specific sharing
  const handleSharePlatform = (platform) => {
    let shareUrl;
    const url = currentUrl || window.location.href;
    
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareData.text)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareData.text} ${url}`)}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=${encodeURIComponent(shareData.title)}&body=${encodeURIComponent(`${shareData.text} ${url}`)}`;
        break;
      default:
        return;
    }
    
    // Open share URL in new window
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center border-b p-4">
          <h3 className="text-lg font-semibold text-gray-800">Share this Product</h3>
          <button 
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          {/* Product preview */}
          <div className="flex items-center mb-6">
            <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0 bg-gray-100">
              <img 
                src={currentVariant.image || ''} 
                alt={product.name || 'Product'} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null; 
                  e.target.src = 'https://via.placeholder.com/150?text=No+Image';
                }}
              />
            </div>
            <div className="ml-4">
              <h4 className="font-medium text-gray-900">{product.name || 'Product'}</h4>
              <p className="text-sm text-gray-500">{currentVariant.price || ''}</p>
            </div>
          </div>
          
          {/* Share URL */}
          <div className="flex items-center mb-6">
            <input
              type="text"
              value={currentUrl || window.location.href}
              readOnly
              className="flex-1 p-2 border border-gray-300 rounded-l-md text-sm bg-gray-50"
            />
            <button
              onClick={handleCopyLink}
              className="bg-gray-100 text-gray-700 border border-gray-300 border-l-0 rounded-r-md p-2 flex items-center hover:bg-gray-200 transition-colors"
            >
              <Copy className="w-5 h-5" />
            </button>
          </div>
          
          {copySuccess && (
            <div className="text-green-600 text-sm mb-4 flex items-center justify-center">
              Link copied to clipboard!
            </div>
          )}
          
          {/* Native share button (for mobile) */}
          {navigator.share && (
            <button
              onClick={handleNativeShare}
              className="w-full bg-black text-white py-3 rounded-md mb-4 hover:bg-gray-800 transition-colors"
            >
              Share
            </button>
          )}
          
          {/* Social sharing options */}
          <div className="grid grid-cols-4 gap-4">
            <button
              onClick={() => handleSharePlatform('facebook')}
              className="flex flex-col items-center justify-center p-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              <Facebook className="w-6 h-6 mb-1" />
              <span className="text-xs">Facebook</span>
            </button>
            <button
              onClick={() => handleSharePlatform('twitter')}
              className="flex flex-col items-center justify-center p-3 bg-blue-400 text-white rounded-md hover:bg-blue-500 transition-colors"
            >
              <Twitter className="w-6 h-6 mb-1" />
              <span className="text-xs">Twitter</span>
            </button>
            <button
              onClick={() => handleSharePlatform('whatsapp')}
              className="flex flex-col items-center justify-center p-3 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
            >
              <MessageCircle className="w-6 h-6 mb-1" />
              <span className="text-xs">WhatsApp</span>
            </button>
            <button
              onClick={() => handleSharePlatform('email')}
              className="flex flex-col items-center justify-center p-3 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              <Mail className="w-6 h-6 mb-1" />
              <span className="text-xs">Email</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal; 