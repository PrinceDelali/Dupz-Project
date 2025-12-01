import { useState, useEffect } from 'react';
import { FaSearch, FaEdit, FaTrash, FaPlus, FaTimes, FaImage, FaGlobe, FaLink, FaCheck, FaBars } from 'react-icons/fa';
import Sidebar from '../../components/admin/Sidebar';
import LoadingOverlay from '../../components/LoadingOverlay';
import apiConfig from '../../config/apiConfig';
import axios from 'axios';
import { usePlatformsStore } from '../../store/platformsStore';
import { useNavigate } from 'react-router-dom';

const PlatformsPage = () => {
  // Use platforms store
  const {
    platforms,
    loading,
    error,
    fetchPlatformsFromAPI,
    createPlatform,
    updatePlatform,
    deletePlatform
  } = usePlatformsStore();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentPlatform, setCurrentPlatform] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // Form state for new/edit platform
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    logoUrl: '',
    bannerUrl: '',
    domain: '',
    theme: 'default',
    isActive: true,
    productCategories: []
  });

  // Product categories for demonstration
  const availableCategories = [
    { id: '1', name: 'Electronics' },
    { id: '2', name: 'Clothing' },
    { id: '3', name: 'Home & Kitchen' },
    { id: '4', name: 'Furniture' },
    { id: '5', name: 'Beauty' },
    { id: '6', name: 'Sports' },
    { id: '7', name: 'Toys' },
    { id: '8', name: 'Books' },
    { id: '9', name: 'Jewelry' }
  ];

  // Available themes
  const availableThemes = [
    { id: 'default', name: 'Default' },
    { id: 'modern', name: 'Modern' },
    { id: 'elegant', name: 'Elegant' },
    { id: 'minimalist', name: 'Minimalist' },
    { id: 'colorful', name: 'Colorful' },
    { id: 'dark', name: 'Dark Mode' }
  ];

  // Add navigate hook to allow navigation to platform details
  const navigate = useNavigate();

  // Add state for last updated timestamp
  const [lastUpdated, setLastUpdated] = useState(null);

  // Load platforms when component mounts
  useEffect(() => {
    fetchPlatformsData();
  }, [fetchPlatformsFromAPI]);

  // Add resize listener to detect mobile screens
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Function to fetch platforms data
  const fetchPlatformsData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiConfig.baseURL}/platforms?populate=featuredProductsList`);
      const data = await response.json();
      
      if (data.success) {
        // Process platforms to ensure they have proper descriptions and featured products
        const processedPlatforms = data.data.map(platform => ({
          ...platform,
          description: platform.description || `${platform.name} - Your trusted shopping destination`,
          longDescription: platform.longDescription || platform.description,
          featuredProducts: platform.featuredProductsList || []
        }));
        
        setPlatforms(processedPlatforms);
      } else {
        console.error('Failed to fetch platforms:', data.error);
      }
    } catch (error) {
      console.error('Error fetching platforms:', error);
    } finally {
      setLoading(false);
    }
  };

  // Refresh platforms data
  const handleRefreshData = async () => {
    await fetchPlatformsData();
  };

  // Handle search
  const filteredPlatforms = platforms.filter(platform => 
    platform.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    platform.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    platform.domain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Open add modal
  const handleAddPlatform = () => {
    setFormData({
      name: '',
      description: '',
      logoUrl: '',
      bannerUrl: '',
      domain: '',
      theme: 'default',
      isActive: true,
      productCategories: []
    });
    setShowAddModal(true);
  };

  // Open edit modal
  const handleEditPlatform = (platform) => {
    setCurrentPlatform(platform);
    setFormData({
      name: platform.name,
      description: platform.description || '',
      logoUrl: platform.logoUrl || '',
      bannerUrl: platform.bannerUrl || '',
      domain: platform.domain,
      theme: platform.theme || 'default',
      isActive: platform.isActive !== undefined ? platform.isActive : true,
      productCategories: platform.productCategories || []
    });
    setShowEditModal(true);
  };

  // Open delete modal
  const handleDeletePlatform = (platform) => {
    setCurrentPlatform(platform);
    setShowDeleteModal(true);
  };

  // Handle form changes
  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle category toggle
  const handleCategoryToggle = (categoryId) => {
    setFormData(prev => {
      if (prev.productCategories.includes(categoryId)) {
        return {
          ...prev,
          productCategories: prev.productCategories.filter(id => id !== categoryId)
        };
      } else {
        return {
          ...prev,
          productCategories: [...prev.productCategories, categoryId]
        };
      }
    });
  };

  // Save new platform
  const handleSavePlatform = async () => {
    try {
      await createPlatform(formData);
      setShowAddModal(false);
    } catch (error) {
      alert(`Error creating platform: ${error.message}`);
    }
  };

  // Update existing platform
  const handleUpdatePlatform = async () => {
    try {
      await updatePlatform(currentPlatform._id, formData);
      setShowEditModal(false);
      setCurrentPlatform(null);
    } catch (error) {
      alert(`Error updating platform: ${error.message}`);
    }
  };

  // Confirm delete platform
  const handleConfirmDelete = async () => {
    try {
      await deletePlatform(currentPlatform._id);
      setShowDeleteModal(false);
      setCurrentPlatform(null);
    } catch (error) {
      alert(`Error deleting platform: ${error.message}`);
    }
  };
  
  // Toggle platform active status
  const handleToggleActive = async (platform) => {
    try {
      const updatedData = { 
        ...platform,
        isActive: !platform.isActive 
      };
      await updatePlatform(platform._id, updatedData);
      
      // Show success message
      const message = updatedData.isActive 
        ? `${platform.name} is now active`
        : `${platform.name} is now inactive`;
      
      // Create and show toast notification instead of alert
      const toastElement = document.createElement('div');
      toastElement.className = 'success-toast';
      toastElement.innerHTML = `
        <div class="fixed top-4 right-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded shadow-lg z-50 flex items-center">
          <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
          </svg>
          ${message}
        </div>
      `;
      document.body.appendChild(toastElement);
      setTimeout(() => {
        document.body.removeChild(toastElement);
      }, 3000);
    } catch (error) {
      alert(`Error updating platform status: ${error.message}`);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format currency with revenue source indicator
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return 'N/A';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Handle click on platform card
  const handlePlatformClick = (platformId) => {
    navigate(`/admin/platforms/${platformId}`);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className={`flex-1 ${isMobile ? 'ml-0' : 'ml-64'} transition-all duration-300 ease-in-out`}>
        {loading && <LoadingOverlay />}
        
        <div className="p-4">
          <div className={`${isMobile ? 'flex flex-col space-y-3' : 'flex justify-between items-center'} mb-4`}>
            <div className={`relative ${isMobile ? 'w-full' : ''}`}>
              <input
                type="text"
                placeholder="Search platforms..."
                className="pl-10 pr-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute left-3 top-2.5 text-gray-400">
                <FaSearch />
              </div>
            </div>
            
            <div className={`flex items-center ${isMobile ? 'justify-between w-full' : 'space-x-4'}`}>
              {lastUpdated && (
                <span className="text-xs text-gray-500">
                  Last updated: {formatDate(lastUpdated)}
                </span>
              )}
              <button 
                onClick={handleRefreshData}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700"
                title="Refresh data"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button
                className={`${isMobile ? 'w-full' : ''} bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center ${isMobile ? 'justify-center' : ''}`}
                onClick={handleAddPlatform}
              >
                <FaPlus className="mr-2" /> Add Platform
              </button>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-semibold text-gray-800">Storefront Platforms</h2>
            </div>
            
            {/* Error message */}
            {error && (
              <div className="p-4 bg-red-50 text-red-700 border-b border-red-100">
                <p className="font-medium">Error: {error}</p>
                <p className="text-sm mt-1">Please try again or contact support if the error persists.</p>
              </div>
            )}
            
            {/* Platform List */}
            {filteredPlatforms.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {filteredPlatforms.map((platform) => (
                  <div 
                    key={platform._id} 
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handlePlatformClick(platform._id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex">
                        <img
                          src={platform.logoUrl}
                          alt={platform.name}
                          className="w-16 h-16 rounded-lg object-cover mr-4"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/80?text=Logo';
                          }}
                        />
                        <div>
                          <h3 className="font-medium text-lg text-gray-900 flex items-center">
                            {platform.name}
                            <button 
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent card click
                                handleToggleActive(platform);
                              }}
                              className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                                platform.isActive 
                                  ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                              }`}
                              title={platform.isActive ? "Click to deactivate" : "Click to activate"}
                            >
                              {platform.isActive ? 'Active' : 'Inactive'}
                            </button>
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">{platform.description}</p>
                          <div className="flex items-center mt-2 text-sm text-gray-500">
                            <FaLink className="mr-1" />
                            <a 
                              href={`https://${platform.domain}`} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-purple-600 hover:underline"
                              onClick={(e) => e.stopPropagation()} // Prevent card click when clicking link
                            >
                              {platform.domain}
                            </a>
                          </div>
                          <div className="mt-2 text-sm text-gray-500">
                            Created on {formatDate(platform.createdAt)}
                          </div>
                        </div>
                      </div>
                      <div className="space-x-2">
                        <button
                          className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent card click
                            handleEditPlatform(platform);
                          }}
                        >
                          <FaEdit className="inline mr-1" /> Edit
                        </button>
                        <button
                          className="px-3 py-1 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent card click
                            handleDeletePlatform(platform);
                          }}
                        >
                          <FaTrash className="inline mr-1" /> Delete
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm font-medium text-gray-500">Theme</div>
                        <div className="text-lg font-semibold">{availableThemes.find(t => t.id === platform.theme)?.name || platform.theme}</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm font-medium text-gray-500">Total Sales</div>
                        <div className="text-lg font-semibold">{platform.salesCount?.toLocaleString() || '0'} orders</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm font-medium text-gray-500">Revenue</div>
                        <div className="text-lg font-semibold text-green-600">
                          {formatCurrency(platform.revenue || 0)}
                          <span className="block text-xs text-gray-500 font-normal">
                            (From product orders)
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex flex-wrap gap-2">
                      {platform.productCategories?.map(categoryId => {
                        const category = availableCategories.find(cat => cat.id === categoryId);
                        return category && (
                          <span key={categoryId} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {category.name}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20">
                <FaGlobe className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-xl font-medium text-gray-700 mb-1">No platforms found</h3>
                <p className="text-gray-500">Create your first storefront platform</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Add Platform Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-xl font-bold text-gray-900">Add New Platform</h2>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaTimes />
                </button>
              </div>
              
              <div className="p-6">
                <form>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Platform Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                        required
                        placeholder="e.g., Sinosply Electronics"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="domain" className="block text-sm font-medium text-gray-700 mb-1">
                        Domain <span className="text-red-500">*</span>
                      </label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                          https://
                        </span>
                        <input
                          type="text"
                          id="domain"
                          name="domain"
                          value={formData.domain}
                          onChange={handleChange}
                          className="block w-full px-4 py-2 border border-gray-300 rounded-r-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                          required
                          placeholder="electronics.sinosply.com"
                        />
                      </div>
                    </div>
                    
                    <div className="col-span-1 md:col-span-2">
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="3"
                        className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                        placeholder="Describe what this storefront sells or its purpose"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="logoUrl" className="block text-sm font-medium text-gray-700 mb-1">
                        Logo URL
                      </label>
                      <div className="flex items-center">
                        <input
                          type="text"
                          id="logoUrl"
                          name="logoUrl"
                          value={formData.logoUrl}
                          onChange={handleChange}
                          className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                          placeholder="https://example.com/logo.png"
                        />
                      </div>
                      {formData.logoUrl && (
                        <div className="mt-2 flex justify-center">
                          <img 
                            src={formData.logoUrl} 
                            alt="Logo Preview" 
                            className="h-16 w-16 object-cover rounded"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://via.placeholder.com/80?text=Logo';
                            }}
                          />
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="bannerUrl" className="block text-sm font-medium text-gray-700 mb-1">
                        Banner URL
                      </label>
                      <div className="flex items-center">
                        <input
                          type="text"
                          id="bannerUrl"
                          name="bannerUrl"
                          value={formData.bannerUrl}
                          onChange={handleChange}
                          className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                          placeholder="https://example.com/banner.jpg"
                        />
                      </div>
                      {formData.bannerUrl && (
                        <div className="mt-2 flex justify-center">
                          <img 
                            src={formData.bannerUrl} 
                            alt="Banner Preview" 
                            className="h-20 w-full object-cover rounded"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://via.placeholder.com/800x200?text=Banner';
                            }}
                          />
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="theme" className="block text-sm font-medium text-gray-700 mb-1">
                        Theme
                      </label>
                      <select
                        id="theme"
                        name="theme"
                        value={formData.theme}
                        onChange={handleChange}
                        className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                      >
                        {availableThemes.map(theme => (
                          <option key={theme.id} value={theme.id}>{theme.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isActive"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleChange}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                        Platform is active and visible to customers
                      </label>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Categories
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {availableCategories.map(category => (
                        <div 
                          key={category.id}
                          className={`flex items-center p-3 rounded-lg cursor-pointer border ${
                            formData.productCategories.includes(category.id)
                              ? 'bg-purple-50 border-purple-300'
                              : 'bg-white border-gray-200'
                          }`}
                          onClick={() => handleCategoryToggle(category.id)}
                        >
                          <div className={`h-4 w-4 rounded flex items-center justify-center mr-2 ${
                            formData.productCategories.includes(category.id)
                              ? 'bg-purple-600 text-white'
                              : 'border border-gray-300'
                          }`}>
                            {formData.productCategories.includes(category.id) && <FaCheck className="h-3 w-3" />}
                          </div>
                          <span className="text-sm">{category.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3 mt-8 pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSavePlatform}
                      className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                      disabled={loading}
                    >
                      {loading ? "Creating..." : "Create Platform"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
        
        {/* Edit Platform Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-xl font-bold text-gray-900">Edit Platform</h2>
                <button 
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaTimes />
                </button>
              </div>
              
              <div className="p-6">
                <form>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-1">
                        Platform Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="edit-name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="edit-domain" className="block text-sm font-medium text-gray-700 mb-1">
                        Domain <span className="text-red-500">*</span>
                      </label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                          https://
                        </span>
                        <input
                          type="text"
                          id="edit-domain"
                          name="domain"
                          value={formData.domain}
                          onChange={handleChange}
                          className="block w-full px-4 py-2 border border-gray-300 rounded-r-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="col-span-1 md:col-span-2">
                      <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        id="edit-description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="3"
                        className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="edit-logoUrl" className="block text-sm font-medium text-gray-700 mb-1">
                        Logo URL
                      </label>
                      <div className="flex items-center">
                        <input
                          type="text"
                          id="edit-logoUrl"
                          name="logoUrl"
                          value={formData.logoUrl}
                          onChange={handleChange}
                          className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                      {formData.logoUrl && (
                        <div className="mt-2 flex justify-center">
                          <img 
                            src={formData.logoUrl} 
                            alt="Logo Preview" 
                            className="h-16 w-16 object-cover rounded"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://via.placeholder.com/80?text=Logo';
                            }}
                          />
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="edit-bannerUrl" className="block text-sm font-medium text-gray-700 mb-1">
                        Banner URL
                      </label>
                      <div className="flex items-center">
                        <input
                          type="text"
                          id="edit-bannerUrl"
                          name="bannerUrl"
                          value={formData.bannerUrl}
                          onChange={handleChange}
                          className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                      {formData.bannerUrl && (
                        <div className="mt-2 flex justify-center">
                          <img 
                            src={formData.bannerUrl} 
                            alt="Banner Preview" 
                            className="h-20 w-full object-cover rounded"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://via.placeholder.com/800x200?text=Banner';
                            }}
                          />
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="edit-theme" className="block text-sm font-medium text-gray-700 mb-1">
                        Theme
                      </label>
                      <select
                        id="edit-theme"
                        name="theme"
                        value={formData.theme}
                        onChange={handleChange}
                        className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                      >
                        {availableThemes.map(theme => (
                          <option key={theme.id} value={theme.id}>{theme.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="edit-isActive"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleChange}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <label htmlFor="edit-isActive" className="ml-2 block text-sm text-gray-700">
                        Platform is active and visible to customers
                      </label>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Categories
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {availableCategories.map(category => (
                        <div 
                          key={category.id}
                          className={`flex items-center p-3 rounded-lg cursor-pointer border ${
                            formData.productCategories.includes(category.id)
                              ? 'bg-purple-50 border-purple-300'
                              : 'bg-white border-gray-200'
                          }`}
                          onClick={() => handleCategoryToggle(category.id)}
                        >
                          <div className={`h-4 w-4 rounded flex items-center justify-center mr-2 ${
                            formData.productCategories.includes(category.id)
                              ? 'bg-purple-600 text-white'
                              : 'border border-gray-300'
                          }`}>
                            {formData.productCategories.includes(category.id) && <FaCheck className="h-3 w-3" />}
                          </div>
                          <span className="text-sm">{category.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3 mt-8 pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleUpdatePlatform}
                      className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                      disabled={loading}
                    >
                      {loading ? "Updating..." : "Update Platform"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
        
        {/* Delete Confirmation Modal */}
        {showDeleteModal && currentPlatform && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
              <div className="mb-4">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <FaTrash className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 text-center">Delete Platform</h3>
                <p className="text-gray-500 text-center mt-2">
                  Are you sure you want to delete <span className="font-medium">{currentPlatform.name}</span>? This action cannot be undone.
                </p>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  disabled={loading}
                >
                  {loading ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlatformsPage; 