import { useState, useEffect } from 'react';
import { FaSearch, FaEdit, FaTrash, FaPlus, FaTimes, FaImage, FaShoppingBag, FaEye, FaArrowLeft, FaChevronDown, FaChevronRight, FaCheck } from 'react-icons/fa';
import axios from 'axios';
import Sidebar from '../../components/admin/Sidebar';
import LoadingOverlay from '../../components/LoadingOverlay';
import apiConfig from '../../config/apiConfig';
import { useCollectionsStore } from '../../store/collectionsStore';
import { useProductStore } from '../../store/productStore';

// Helper function to validate image URLs
const isValidImageUrl = (url) => {
  if (!url) return false;
  
  // Basic URL format validation
  try {
    new URL(url);
    return true; // Consider any valid URL as potentially valid for images
  } catch (e) {
    return false;
  }
  
  // Removed overly restrictive image extension and domain checking
};

const CollectionsPage = () => {
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState(null);
  const [viewingCollectionProducts, setViewingCollectionProducts] = useState(false);
  const [currentCollection, setCurrentCollection] = useState(null);
  const [collectionProducts, setCollectionProducts] = useState([]);
  const [selectedVariants, setSelectedVariants] = useState({});
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  
  // Get collections from store - Make sure these are actual functions
  const collectionsStore = useCollectionsStore();
  const collections = collectionsStore.collections || [];
  const fetchCollectionsFromAPI = collectionsStore.fetchCollectionsFromAPI;
  const storeAddCollection = collectionsStore.addCollection;
  const storeRemoveCollection = collectionsStore.removeCollection;
  
  // Get products from store
  const productStore = useProductStore();
  const allProducts = productStore.products || [];
  const fetchProductsFromAPI = productStore.fetchProductsFromAPI;
  
  // New collection state
  const [newCollection, setNewCollection] = useState({
    name: '',
    description: '',
    image: '',
    featured: false,
    products: []
  });

  // State for managing category expansion in dropdown
  const [expandedCategories, setExpandedCategories] = useState([]);
  const [productSearchTerm, setProductSearchTerm] = useState('');

  useEffect(() => {
    fetchCollections();
  }, [currentPage, searchTerm]);

  // Initialize collections and products
  useEffect(() => {
    console.log('Initializing collections and products...');
    
    const initializeData = async () => {
      setLoading(true);
      
      // Fetch products first to ensure we have them for display
      if (allProducts.length === 0) {
        try {
          await fetchProductsFromAPI();
          console.log('Products loaded from API');
        } catch (error) {
          console.error('Error loading products:', error);
        }
      } else {
        console.log(`Using ${allProducts.length} products from store`);
      }
      
      // Then fetch collections
      if (collections.length === 0) {
        try {
          await fetchCollectionsFromAPI();
          console.log('Collections loaded from API');
        } catch (error) {
          console.error('Error loading collections:', error);
        }
      } else {
        // Collections already in store, just update pagination
        setTotalPages(Math.ceil(collections.length / 10));
        console.log(`Using ${collections.length} collections from store`);
      }
      
      setLoading(false);
    };
    
    initializeData();
  }, []);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      
      // Real API call
      const response = await axios.get(`${apiConfig.baseURL}/collections`, {
        params: {
          page: currentPage,
          limit: 10,
          search: searchTerm || undefined
        },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Update total pages
      if (response.data.success) {
        // Process collection images
        const processedCollections = response.data.data.map(collection => ({
          ...collection,
          // Ensure image URL is valid or set a placeholder
          image: collection.image || `https://via.placeholder.com/400x200?text=${encodeURIComponent(collection.name || 'Collection')}`
        }));
        
        // Update collections in store
        collectionsStore.setCollections(processedCollections);
        
        setTotalPages(Math.ceil(response.data.total / 10) || 1);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching collections:', error);
      setLoading(false);
    }
  };

  // Fetch products for a specific collection
  const fetchCollectionProducts = async (collectionId) => {
    try {
      setLoading(true);
      console.log(`[Fetch Collection] Starting to fetch collection: ${collectionId}`);
      
      // Get the collection details from the API
      const response = await axios.get(`${apiConfig.baseURL}/collections/${collectionId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success) {
        const collection = response.data.data;
        setCurrentCollection(collection);
        console.log(`[Fetch Collection] Collection details:`, {
          name: collection.name,
          productCount: collection.products?.length || 0
        });
        
        // Extract product IDs from the collection
        const productIds = collection.products?.map(item => 
          typeof item === 'object' ? item._id : item
        ) || [];
        
        console.log(`[Fetch Collection] Product IDs in collection:`, productIds);
        console.log(`[Fetch Collection] Available products in store:`, allProducts.length);
        
        // Get products directly from the productStore
        if (productIds.length > 0) {
          const products = allProducts.filter(product => productIds.includes(product._id));
          
          // Initialize selected variants
          const initialVariants = {};
          products.forEach(product => {
            initialVariants[product._id] = 0;
          });
          setSelectedVariants(initialVariants);
          
          // Log product image paths for each product
          products.forEach(product => {
            console.log(`[Fetch Collection] Product ${product.name} images:`, {
              productId: product._id,
              mainImage: product.image,
              hasVariants: !!product.variants?.length,
              variantImage: product.variants?.[0]?.image,
              variantAdditionalImage: product.variants?.[0]?.additionalImages?.[0]
            });
          });
          
          console.log(`[Fetch Collection] Found ${products.length} products for collection "${collection.name}"`);
          setCollectionProducts(products);
        } else {
          setCollectionProducts([]);
          console.log(`[Fetch Collection] Collection "${collection.name}" has no products`);
        }
      } else {
        console.error(`[Fetch Collection] API call failed:`, response.data.error);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('[Fetch Collection] Error:', error);
      setLoading(false);
    }
  };

  const handleViewCollectionProducts = (collection) => {
    setViewingCollectionProducts(true);
    fetchCollectionProducts(collection._id);
  };

  const handleBackToCollections = () => {
    setViewingCollectionProducts(false);
    setCurrentCollection(null);
    setCollectionProducts([]);
  };

  const handleRemoveProductFromCollection = async (productId) => {
    try {
      setLoading(true);
      
      const response = await axios.delete(
        `${apiConfig.baseURL}/collections/${currentCollection._id}/products/${productId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      if (response.data.success) {
        // Update collection in store
        fetchCollectionsFromAPI();
        
        // Update local state
        setCollectionProducts(prevProducts => 
          prevProducts.filter(product => product._id !== productId)
        );
        
        alert('Product removed from collection successfully');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error removing product from collection:', error);
      alert('Failed to remove product from collection');
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);  // Reset to first page on new search
    fetchCollections();
  };
  
  // Add new collection handlers
  const handleAddCollectionOpen = () => {
    setShowAddModal(true);
  };
  
  const handleAddCollectionClose = () => {
    setShowAddModal(false);
    setNewCollection({
      name: '',
      description: '',
      image: '',
      featured: false,
      products: []
    });
  };
  
  const handleNewCollectionChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewCollection(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Toggle category expansion
  const toggleCategory = (category) => {
    setExpandedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Check if a product is selected
  const isProductSelected = (productId) => {
    return newCollection.products.includes(productId);
  };

  // Toggle product selection
  const toggleProductSelection = (productId) => {
    setNewCollection(prev => {
      if (prev.products.includes(productId)) {
        return {
          ...prev,
          products: prev.products.filter(id => id !== productId)
        };
      } else {
        return {
          ...prev,
          products: [...prev.products, productId]
        };
      }
    });
  };

  // Filter products based on search term
  const getFilteredProducts = () => {
    if (!productSearchTerm.trim()) return allProducts;
    
    return allProducts.filter(product => 
      product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(productSearchTerm.toLowerCase())
    );
  };

  // Group products by category
  const getProductsByCategory = () => {
    // Just use the filtered products directly, no need for extra processing
    const filtered = getFilteredProducts();
    const groupedProducts = {};
    
    filtered.forEach(product => {
      const category = product.category || 'Uncategorized';
      if (!groupedProducts[category]) {
        groupedProducts[category] = [];
      }
      groupedProducts[category].push(product);
    });
    
    return groupedProducts;
  };

  const handleAddCollection = async () => {
    try {
      // Start loading state
      setLoading(true);
      
      // Validate required fields
      if (!newCollection.name) {
        alert('Please enter a collection name');
        setLoading(false);
        return;
      }
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('You must be logged in to add collections');
        setLoading(false);
        return;
      }
      
      // Use the image URL as provided by user without replacing it with a placeholder
      let collectionData = {...newCollection};
      
      // Only log a warning for potentially invalid URLs but don't replace them
      if (collectionData.image && !isValidImageUrl(collectionData.image)) {
        console.warn(`⚠️ [CollectionsPage] Potentially invalid image URL format: ${collectionData.image}`);
        // No longer replacing with placeholder - use the URL as provided
      }
      
      const response = await axios.post(
        `${apiConfig.baseURL}/collections`,
        collectionData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        // No longer forcing placeholder images - use the image as returned by the API
        const returnedCollection = response.data.data;
        
        // Add to store
        storeAddCollection(returnedCollection);
        
        // Show success message
        alert('Collection added successfully!');
        
        // Close modal and reset form
        handleAddCollectionClose();
        
        // Refresh collections
        fetchCollections();
      } else {
        throw new Error(response.data.error || 'Failed to add collection');
      }
    } catch (error) {
      console.error('Error adding collection:', error);
      alert(error.response?.data?.error || 'Failed to add collection. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Edit collection handlers
  const handleEditCollectionOpen = (collection) => {
    setEditingCollection(collection);
    setNewCollection({
      name: collection.name,
      description: collection.description,
      image: collection.image,
      featured: collection.featured,
      products: collection.products || []
    });
    setShowEditModal(true);
  };
  
  const handleEditCollectionClose = () => {
    setShowEditModal(false);
    setEditingCollection(null);
    setNewCollection({
      name: '',
      description: '',
      image: '',
      featured: false,
      products: []
    });
  };
  
  const handleUpdateCollection = async () => {
    try {
      // Start loading state
      setLoading(true);
      
      // Validate required fields
      if (!newCollection.name) {
        alert('Please enter a collection name');
        setLoading(false);
        return;
      }
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('You must be logged in to update collections');
        setLoading(false);
        return;
      }
      
      // Use the image URL as provided by user without replacing it with a placeholder
      let collectionData = {...newCollection};
      
      // Only log a warning for potentially invalid URLs but don't replace them
      if (collectionData.image && !isValidImageUrl(collectionData.image)) {
        console.warn(`⚠️ [CollectionsPage] Potentially invalid image URL format: ${collectionData.image}`);
        // No longer replacing with placeholder - use the URL as provided
      }
      
      const response = await axios.put(
        `${apiConfig.baseURL}/collections/${editingCollection._id}`,
        collectionData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        // No longer forcing placeholder images - use the image as returned by the API
        const returnedCollection = response.data.data;
        
        // Update in store
        storeAddCollection(returnedCollection);
        
        // Show success message
        alert('Collection updated successfully!');
        
        // Close modal
        handleEditCollectionClose();
        
        // Refresh collections
        fetchCollections();
      } else {
        throw new Error(response.data.error || 'Failed to update collection');
      }
    } catch (error) {
      console.error('Error updating collection:', error);
      alert(error.response?.data?.error || 'Failed to update collection. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Delete collection handlers
  const handleDeleteConfirmation = (collection) => {
    setCollectionToDelete(collection);
    setShowDeleteModal(true);
  };
  
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setCollectionToDelete(null);
  };
  
  const confirmDeleteCollection = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('You must be logged in to delete collections');
        setLoading(false);
        closeDeleteModal();
        return;
      }
      
      // Check if we have the collection to delete and log it
      if (!collectionToDelete || !collectionToDelete._id) {
        console.error('No collection to delete or missing ID:', collectionToDelete);
        setLoading(false);
        alert('Error: Invalid collection selected for deletion');
        closeDeleteModal();
        return;
      }
      
      console.log('Attempting to delete collection with ID:', collectionToDelete._id);
      console.log('storeRemoveCollection function:', storeRemoveCollection);
      
      const response = await axios.delete(
        `${apiConfig.baseURL}/collections/${collectionToDelete._id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        try {
          // Remove from store using the imported function directly
          if (typeof storeRemoveCollection === 'function') {
            storeRemoveCollection(collectionToDelete._id);
          } else {
            console.error('storeRemoveCollection is not a function:', storeRemoveCollection);
            // Fallback: Reset collections from API
            await fetchCollectionsFromAPI();
          }
        } catch (storeError) {
          console.error('Error removing collection from store:', storeError);
          // Fallback: Reset collections from API
          await fetchCollectionsFromAPI();
        }
        
        // Close modal
        closeDeleteModal();
        
        // Refresh collections
        fetchCollections();
        
        // Show success message
        alert('Collection deleted successfully!');
      } else {
        throw new Error(response.data.error || 'Failed to delete collection');
      }
    } catch (error) {
      console.error('Error deleting collection:', error);
      alert(error.response?.data?.error || 'Failed to delete collection. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate collections for the current page
  const paginatedCollections = collections.slice(
    (currentPage - 1) * 10,
    currentPage * 10
  );

  // Add variant selection function similar to ShopCategory/FashionShop
  const handleColorSelect = (productId, variantIndex) => {
    setSelectedVariants(prev => ({
      ...prev,
      [productId]: variantIndex
    }));
  };
  
  // Function to get image from variant similar to other pages
  const getImageFromVariant = (variant, product) => {
    return variant?.additionalImages?.[0] || "https://via.placeholder.com/400x500?text=" + encodeURIComponent(product.name);
  };
  
  // Handle product click for possible navigation or other actions
  const handleProductClick = (product) => {
    // Get the currently selected variant index for this product
    const variantIndex = selectedVariants[product._id] || 0;
    console.log(`Clicked on product: ${product.name}, variant: ${variantIndex}`);
    // You can add navigation here if needed in the admin context
  };

  // Add resize handler to detect mobile view
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className={`flex-1 ${isMobileView ? '' : 'ml-64'}`}>
        {loading && <LoadingOverlay />}
        
        <div className="p-2 sm:p-4">
          <div className="flex flex-wrap sm:flex-nowrap justify-between items-center mb-4 gap-3">
            <div className="relative w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search collections..."
                className="pl-10 pr-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch(e)}
              />
              <div className="absolute left-3 top-2.5 text-gray-400">
                <FaSearch />
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white">
                O
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {viewingCollectionProducts ? (
              // Redesigned collection products view for mobile
              <>
                <div className="flex flex-wrap justify-between items-center p-3 sm:p-4 border-b">
                  <div className="flex items-center w-full sm:w-auto mb-2 sm:mb-0">
                    <button 
                      onClick={handleBackToCollections}
                      className="mr-3 text-gray-500 hover:text-gray-700 p-1"
                    >
                      <FaArrowLeft className="text-lg" />
                    </button>
                    <h2 className="text-base sm:text-lg font-medium text-gray-800 truncate">
                      {currentCollection?.name} - Products ({collectionProducts.length})
                    </h2>
                  </div>
                </div>

                {collectionProducts.length > 0 ? (
                  // Responsive grid layout for products
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 p-3 sm:p-6">
                    {collectionProducts.map((product) => {
                      const variantIndex = selectedVariants[product._id] || 0;
                      const variants = product.variants || [];
                      const selectedVariant = variants[variantIndex];
                      
                      // Determine image to display with proper fallbacks
                      const mainImage = product.image;
                      const variantImage = selectedVariant?.image;
                      const variantAdditionalImage = selectedVariant?.additionalImages?.[0];
                      const imageToUse = variantAdditionalImage || variantImage || mainImage || 
                        `https://via.placeholder.com/400x500?text=${encodeURIComponent(product.name || 'Product')}`;
                      
                      return (
                        <div 
                          key={product._id} 
                          className="border rounded-lg overflow-hidden hover:shadow-md transition duration-200 cursor-pointer"
                          onClick={() => handleProductClick(product)}
                        >
                          <div className="relative">
                            <div className="aspect-[3/4] overflow-hidden">
                              <img
                                src={imageToUse}
                                alt={product.name}
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                  console.log(`[Image Error] Failed to load image for ${product.name}, using placeholder`);
                                  e.target.onerror = null;
                                  e.target.src = `https://via.placeholder.com/400x500?text=${encodeURIComponent(product.name || 'Product')}`;
                                }}
                              />
                            </div>
                            <div className="p-3">
                              <h3 className="text-sm font-medium text-gray-900 truncate">{product.name}</h3>
                              <p className="mt-1 text-sm text-gray-500">
                                {product.salePrice > 0 ? (
                                  <>
                                    <span className="line-through mr-2">GH₵{product.basePrice.toFixed(2)}</span>
                                    <span className="text-red-600">GH₵{product.salePrice.toFixed(2)}</span>
                                  </>
                                ) : (
                                  `GH₵${product.basePrice?.toFixed(2) || '0.00'}`
                                )}
                              </p>
                              
                              {/* Variant color selection */}
                              {variants.length > 0 && (
                                <div className="mt-2 flex gap-1">
                                  {variants.map((variant, index) => (
                                    <button
                                      key={index}
                                      className={`w-5 h-5 rounded-full border border-gray-300 ${
                                        variantIndex === index ? 'ring-1 ring-black ring-offset-1' : ''
                                      }`}
                                      style={{ backgroundColor: variant.color || "#000000" }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleColorSelect(product._id, index);
                                      }}
                                    />
                                  ))}
                                </div>
                              )}
                              
                              {/* Remove from collection button */}
                              <div className="mt-3 flex justify-end">
                                <button 
                                  className="p-2 bg-red-50 text-red-600 rounded-full hover:bg-red-100"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveProductFromCollection(product._id);
                                  }}
                                >
                                  <FaTrash className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 sm:py-20 px-4 text-center">
                    <div className="h-16 w-16 sm:h-24 sm:w-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <FaShoppingBag className="h-8 w-8 sm:h-10 sm:w-10 text-gray-300" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-medium text-gray-700 mb-1">No products in this collection</h3>
                    <p className="text-gray-500 text-sm sm:text-base">Add products to this collection from the Products page</p>
                  </div>
                )}
              </>
            ) : (
              // Collections view
              <>
                <div className="flex flex-wrap justify-between items-center p-3 sm:p-4 border-b">
                  <h2 className="text-base sm:text-lg font-medium text-gray-800 mb-2 sm:mb-0 w-full sm:w-auto">Product Collections</h2>
                  <button
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center w-full sm:w-auto justify-center sm:justify-start"
                    onClick={handleAddCollectionOpen}
                  >
                    <FaPlus className="mr-2" /> Add Collection
                  </button>
                </div>
                
                {paginatedCollections.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 p-3 sm:p-4">
                    {paginatedCollections.map((collection) => (
                      <div key={collection._id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                        <div className="relative h-36 sm:h-40 bg-gray-100 overflow-hidden">
                          <img 
                            src={collection.image} 
                            alt={collection.name}
                            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                            onError={(e) => {
                              e.target.onerror = null;
                              // Set placeholder with collection name
                              e.target.src = `https://via.placeholder.com/400x200?text=${encodeURIComponent(collection.name || 'Collection')}`;
                            }}
                          />
                          {collection.featured && (
                            <div className="absolute top-2 right-2 bg-yellow-400 text-xs text-yellow-900 px-2 py-1 rounded-full">
                              Featured
                            </div>
                          )}
                          <div className="absolute bottom-2 right-2 bg-purple-600 text-xs text-white px-2 py-1 rounded-full">
                            {collection.productCount || collection.products?.length || 0} Products
                          </div>
                        </div>
                        <div className="p-3 sm:p-4">
                          <h3 className="font-medium text-gray-900 text-sm sm:text-base">{collection.name}</h3>
                          <p className="text-gray-500 text-xs sm:text-sm mt-1 line-clamp-2">{collection.description}</p>
                          <div className="flex flex-wrap items-center justify-between mt-3 gap-2">
                            <button
                              className="px-2 py-1 text-xs sm:text-sm text-purple-600 border border-purple-200 rounded hover:bg-purple-50 flex items-center"
                              onClick={() => handleViewCollectionProducts(collection)}
                            >
                              <FaEye className="w-3 h-3 mr-1" /> View Products
                            </button>
                            <div className="flex space-x-2">
                              <button
                                className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100"
                                onClick={() => handleEditCollectionOpen(collection)}
                                title="Edit collection"
                              >
                                <FaEdit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                className="p-2 bg-red-50 text-red-600 rounded-full hover:bg-red-100"
                                onClick={() => handleDeleteConfirmation(collection)}
                                title="Delete collection"
                              >
                                <FaTrash className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 sm:py-20 px-4 text-center">
                    <div className="h-16 w-16 sm:h-24 sm:w-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <FaImage className="h-8 w-8 sm:h-10 sm:w-10 text-gray-300" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-medium text-gray-700 mb-1">No collections found</h3>
                    <p className="text-gray-500 text-sm sm:text-base">Create your first collection to organize your products</p>
                    <button
                      className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center"
                      onClick={handleAddCollectionOpen}
                    >
                      <FaPlus className="mr-2" /> Add Collection
                    </button>
                  </div>
                )}
                
                {collections.length > 0 && totalPages > 1 && (
                  <div className="px-3 sm:px-6 py-3 sm:py-4 flex flex-wrap sm:flex-nowrap items-center justify-between border-t gap-3">
                    <div>
                      <p className="text-sm text-gray-700">
                        Page <span className="font-medium">{currentPage}</span> of{' '}
                        <span className="font-medium">{totalPages}</span>
                      </p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`px-3 py-1 border rounded flex-1 sm:flex-auto ${
                          currentPage === 1
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-1 border rounded flex-1 sm:flex-auto ${
                          currentPage === totalPages
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        
        {/* Add Collection Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-3 sm:p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-3 sm:p-6 border-b">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Add New Collection</h2>
                <button 
                  onClick={handleAddCollectionClose}
                  className="text-gray-500 hover:text-gray-700 p-1"
                >
                  <FaTimes />
                </button>
              </div>
              
              <div className="p-3 sm:p-6">
                <form className="space-y-4 sm:space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Collection Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={newCollection.name}
                      onChange={handleNewCollectionChange}
                      className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={newCollection.description}
                      onChange={handleNewCollectionChange}
                      rows="3"
                      className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                    ></textarea>
                  </div>
                  
                  <div>
                    <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
                      Collection Image URL
                    </label>
                    <input
                      type="text"
                      id="image"
                      name="image"
                      value={newCollection.image}
                      onChange={handleNewCollectionChange}
                      placeholder="https://example.com/image.jpg"
                      className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                    />
                    {newCollection.image && (
                      <div className="mt-2">
                        <img 
                          src={newCollection.image} 
                          alt="Preview" 
                          className="h-32 w-full object-cover rounded-md"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = `https://via.placeholder.com/400x200?text=${encodeURIComponent(newCollection.name || 'Invalid Image URL')}`;
                            console.log(`⚠️ [CollectionsPage] Preview image failed to load: ${newCollection.image}`);
                          }}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          {isValidImageUrl(newCollection.image) ? 
                            '✓ Valid URL format' : 
                            '⚠️ This might not be a valid URL format. Make sure it\'s a complete URL including http:// or https://'}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Product Selection Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 sm:mb-3">
                      Select Products for this Collection
                    </label>
                    
                    <div className="mb-3 sm:mb-4">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search products..."
                          value={productSearchTerm}
                          onChange={(e) => setProductSearchTerm(e.target.value)}
                          className="block w-full px-4 py-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                        />
                        <div className="absolute left-3 top-2.5 text-gray-400">
                          <FaSearch />
                        </div>
                      </div>
                      
                      {newCollection.products.length > 0 && (
                        <div className="mt-2 text-sm text-purple-600">
                          {newCollection.products.length} product{newCollection.products.length !== 1 ? 's' : ''} selected
                        </div>
                      )}
                    </div>
                    
                    <div className="border border-gray-200 rounded-md max-h-60 sm:max-h-96 overflow-y-auto">
                      {Object.entries(getProductsByCategory()).map(([category, products]) => (
                        <div key={category} className="border-b border-gray-200 last:border-b-0">
                          <div 
                            className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                            onClick={() => toggleCategory(category)}
                          >
                            <div className="font-medium text-sm sm:text-base">{category} ({products.length})</div>
                            <div>
                              {expandedCategories.includes(category) ? <FaChevronDown /> : <FaChevronRight />}
                            </div>
                          </div>
                          
                          {expandedCategories.includes(category) && (
                            <div className="pl-3 sm:pl-4 pb-2">
                              {products.map(product => {
                                // Log product selection image source paths
                                const mainImage = product.image;
                                const variantImage = product.variants && product.variants[0]?.image;
                                const variantAdditionalImage = product.variants && product.variants[0]?.additionalImages && product.variants[0]?.additionalImages[0];
                                const placeholderImage = `https://via.placeholder.com/80?text=${encodeURIComponent(product.name || 'Product')}`;
                                
                                // Determine which image will be used
                                const imageToUse = mainImage || variantImage || variantAdditionalImage || placeholderImage;
                                
                                if (isProductSelected(product._id)) {
                                  console.log(`[Selected Product] ${product.name}:`, {
                                    productId: product._id,
                                    mainImage,
                                    variantImage,
                                    variantAdditionalImage,
                                    imageUsed: imageToUse
                                  });
                                }
                                
                                return (
                                  <div 
                                    key={product._id} 
                                    className={`flex items-center p-2 cursor-pointer hover:bg-gray-50 border-l-2 ${isProductSelected(product._id) ? 'border-purple-500' : 'border-transparent'}`}
                                    onClick={() => toggleProductSelection(product._id)}
                                  >
                                    <div className="w-8 h-8 mr-3 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                                      <img 
                                        src={imageToUse} 
                                        alt={product.name}
                                        className="w-8 h-8 object-cover"
                                        onError={(e) => {
                                          console.log(`[Selection Image Error] Failed to load image for ${product.name}, using placeholder`);
                                          e.target.onerror = null;
                                          e.target.src = placeholderImage;
                                        }}
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                                      <p className="text-xs text-gray-500">
                                        {typeof product.basePrice === 'number' ? 
                                          `GH₵ ${product.basePrice.toFixed(2)}` : 
                                          product.basePrice || "GH₵ 0.00"}
                                      </p>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isProductSelected(product._id) ? 'bg-purple-500 text-white' : 'border border-gray-300'}`}>
                                      {isProductSelected(product._id) && <FaCheck className="w-3 h-3" />}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                      
                      {Object.keys(getProductsByCategory()).length === 0 && (
                        <div className="p-4 text-center text-gray-500">
                          No products found matching your search.
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="featured"
                        name="featured"
                        type="checkbox"
                        checked={newCollection.featured}
                        onChange={handleNewCollectionChange}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="featured" className="font-medium text-gray-700">Featured Collection</label>
                      <p className="text-gray-500 text-xs sm:text-sm">Featured collections will be highlighted on the homepage</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap sm:flex-nowrap justify-end gap-2 pt-4 border-t">
                    <button
                      type="button"
                      onClick={handleAddCollectionClose}
                      className="w-full sm:w-auto px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddCollection}
                      className="w-full sm:w-auto px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                    >
                      Save Collection
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
        
        {/* Edit Collection Modal - Same mobile optimizations as Add modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-3 sm:p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-3 sm:p-6 border-b">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Edit Collection</h2>
                <button 
                  onClick={handleEditCollectionClose}
                  className="text-gray-500 hover:text-gray-700 p-1"
                >
                  <FaTimes />
                </button>
              </div>
              
              {/* Same form structure as Add modal but with edit specific handlers */}
              <div className="p-3 sm:p-6">
                <form className="space-y-4 sm:space-y-6">
                  <div>
                    <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-1">
                      Collection Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="edit-name"
                      name="name"
                      value={newCollection.name}
                      onChange={handleNewCollectionChange}
                      className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      id="edit-description"
                      name="description"
                      value={newCollection.description}
                      onChange={handleNewCollectionChange}
                      rows="3"
                      className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                    ></textarea>
                  </div>
                  
                  <div>
                    <label htmlFor="edit-image" className="block text-sm font-medium text-gray-700 mb-1">
                      Collection Image URL
                    </label>
                    <input
                      type="text"
                      id="edit-image"
                      name="image"
                      value={newCollection.image}
                      onChange={handleNewCollectionChange}
                      placeholder="https://example.com/image.jpg"
                      className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                    />
                    {newCollection.image && (
                      <div className="mt-2">
                        <img 
                          src={newCollection.image} 
                          alt="Preview" 
                          className="h-32 w-full object-cover rounded-md"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = `https://via.placeholder.com/400x200?text=${encodeURIComponent(newCollection.name || 'Invalid Image URL')}`;
                            console.log(`⚠️ [CollectionsPage] Preview image failed to load: ${newCollection.image}`);
                          }}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          {isValidImageUrl(newCollection.image) ? 
                            '✓ Valid URL format' : 
                            '⚠️ This might not be a valid URL format. Make sure it\'s a complete URL including http:// or https://'}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Product Selection Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 sm:mb-3">
                      Select Products for this Collection
                    </label>
                    
                    <div className="mb-3 sm:mb-4">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search products..."
                          value={productSearchTerm}
                          onChange={(e) => setProductSearchTerm(e.target.value)}
                          className="block w-full px-4 py-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                        />
                        <div className="absolute left-3 top-2.5 text-gray-400">
                          <FaSearch />
                        </div>
                      </div>
                      
                      {newCollection.products.length > 0 && (
                        <div className="mt-2 text-sm text-purple-600">
                          {newCollection.products.length} product{newCollection.products.length !== 1 ? 's' : ''} selected
                        </div>
                      )}
                    </div>
                    
                    <div className="border border-gray-200 rounded-md max-h-60 sm:max-h-96 overflow-y-auto">
                      {Object.entries(getProductsByCategory()).map(([category, products]) => (
                        <div key={category} className="border-b border-gray-200 last:border-b-0">
                          <div 
                            className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                            onClick={() => toggleCategory(category)}
                          >
                            <div className="font-medium text-sm sm:text-base">{category} ({products.length})</div>
                            <div>
                              {expandedCategories.includes(category) ? <FaChevronDown /> : <FaChevronRight />}
                            </div>
                          </div>
                          
                          {expandedCategories.includes(category) && (
                            <div className="pl-3 sm:pl-4 pb-2">
                              {products.map(product => {
                                // Log product selection image source paths
                                const mainImage = product.image;
                                const variantImage = product.variants && product.variants[0]?.image;
                                const variantAdditionalImage = product.variants && product.variants[0]?.additionalImages && product.variants[0]?.additionalImages[0];
                                const placeholderImage = `https://via.placeholder.com/80?text=${encodeURIComponent(product.name || 'Product')}`;
                                
                                // Determine which image will be used
                                const imageToUse = mainImage || variantImage || variantAdditionalImage || placeholderImage;
                                
                                if (isProductSelected(product._id)) {
                                  console.log(`[Selected Product] ${product.name}:`, {
                                    productId: product._id,
                                    mainImage,
                                    variantImage,
                                    variantAdditionalImage,
                                    imageUsed: imageToUse
                                  });
                                }
                                
                                return (
                                  <div 
                                    key={product._id} 
                                    className={`flex items-center p-2 cursor-pointer hover:bg-gray-50 border-l-2 ${isProductSelected(product._id) ? 'border-purple-500' : 'border-transparent'}`}
                                    onClick={() => toggleProductSelection(product._id)}
                                  >
                                    <div className="w-8 h-8 mr-3 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                                      <img 
                                        src={imageToUse} 
                                        alt={product.name}
                                        className="w-8 h-8 object-cover"
                                        onError={(e) => {
                                          console.log(`[Selection Image Error] Failed to load image for ${product.name}, using placeholder`);
                                          e.target.onerror = null;
                                          e.target.src = placeholderImage;
                                        }}
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                                      <p className="text-xs text-gray-500">
                                        {typeof product.basePrice === 'number' ? 
                                          `GH₵ ${product.basePrice.toFixed(2)}` : 
                                          product.basePrice || "GH₵ 0.00"}
                                      </p>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isProductSelected(product._id) ? 'bg-purple-500 text-white' : 'border border-gray-300'}`}>
                                      {isProductSelected(product._id) && <FaCheck className="w-3 h-3" />}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                      
                      {Object.keys(getProductsByCategory()).length === 0 && (
                        <div className="p-4 text-center text-gray-500">
                          No products found matching your search.
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="edit-featured"
                        name="featured"
                        type="checkbox"
                        checked={newCollection.featured}
                        onChange={handleNewCollectionChange}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="edit-featured" className="font-medium text-gray-700">Featured Collection</label>
                      <p className="text-gray-500 text-xs sm:text-sm">Featured collections will be highlighted on the homepage</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap sm:flex-nowrap justify-end gap-2 pt-4 border-t">
                    <button
                      type="button"
                      onClick={handleEditCollectionClose}
                      className="w-full sm:w-auto px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleUpdateCollection}
                      className="w-full sm:w-auto px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                    >
                      Update Collection
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
        
        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-3 sm:p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-4 sm:p-6">
              <div className="mb-4">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <FaTrash className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 text-center">Delete Collection</h3>
                <p className="text-gray-500 text-center mt-2 text-sm sm:text-base">
                  Are you sure you want to delete <span className="font-medium">{collectionToDelete?.name}</span>? This action cannot be undone.
                </p>
                {collectionToDelete?.productCount > 0 && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-yellow-700 text-xs sm:text-sm">
                      This collection contains {collectionToDelete.productCount} products. Deleting this collection will not delete the products.
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex flex-wrap sm:flex-nowrap justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  className="w-full sm:w-auto px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteCollection}
                  className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollectionsPage;