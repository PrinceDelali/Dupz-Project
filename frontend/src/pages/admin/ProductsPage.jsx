import { useState, useEffect } from 'react';
import { FaSearch, FaEdit, FaTrash, FaPlus, FaTimes, FaImage, FaCopy, FaStar, FaSync, FaGlobe, FaBoxOpen } from 'react-icons/fa';
import axios from 'axios';
import Sidebar from '../../components/admin/Sidebar';
import LoadingOverlay from '../../components/LoadingOverlay';
import { useProductStore } from '../../store/productStore';
import { useCollectionsStore } from '../../store/collectionsStore';
import { usePlatformsStore } from '../../store/platformsStore';
import apiConfig from '../../config/apiConfig';

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stockRefreshing, setStockRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const [showSampleOnly, setShowSampleOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  
  // Product store
  const productStore = useProductStore();
  
  // Collections store
  const { 
    collections, 
    fetchCollectionsFromAPI, 
    addProductToCollection 
  } = useCollectionsStore();
  
  // Platforms store
  const {
    platforms,
    fetchPlatformsFromAPI
  } = usePlatformsStore();
  
  // New product state
  const [newProduct, setNewProduct] = useState({
    name: '',
    basePrice: '',
    salePrice: '',
    description: '',
    category: '',
    details: [''],
    variants: [
      { 
        color: '#000000', 
        colorName: 'Black',
        price: '',
        additionalImages: ['']
      }
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    stock: 0,
    collectionId: '',
    platformId: '',
    isFeatured: false,
    isSample: false,
    // Add new shipping fields
    airShippingPrice: '',
    airShippingDuration: '',
    seaShippingPrice: '',
    seaShippingDuration: ''
  });

  useEffect(() => {
    fetchProducts();
  }, [currentPage, categoryFilter, showFeaturedOnly, showSampleOnly]);

  // Initialize products from store or fetch if empty
  useEffect(() => {
    const storedProducts = productStore.getProducts();
    
    if (storedProducts.length > 0) {
      // If we have products in the store, use them for initial display
      setProducts(storedProducts.slice(0, 10)); // Show first page
      setTotalPages(Math.ceil(storedProducts.length / 10));
      setLoading(false);
    } else {
      // Otherwise fetch from API
      fetchProducts();
    }
    
    // Fetch collections for dropdown
    fetchCollectionsFromAPI();
    
    // Fetch platforms for dropdown
    fetchPlatformsFromAPI();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${apiConfig.baseURL}/products`, {
        params: {
          page: currentPage,
          limit: 10,
          category: categoryFilter !== 'all' ? categoryFilter : undefined,
          search: searchTerm || undefined,
          featured: showFeaturedOnly ? true : undefined,
          isSample: showSampleOnly ? true : undefined
        },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const fetchedProducts = response.data.data || [];
      
      // Update the local state for the current page
      setProducts(fetchedProducts);
      setTotalPages(Math.ceil(response.data.total / 10) || 1);
      
      // Add all products to the store
      fetchedProducts.forEach(product => {
        productStore.addProduct(product);
      });
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add a function to refresh product stock data - using shimmer loading
  const refreshProductStock = async () => {
    try {
      setStockRefreshing(true);
      
      // Fetch all products to get the latest stock values
      const response = await axios.get(`${apiConfig.baseURL}/products`, {
        params: {
          showAll: true // Get all products for accurate stock count
        },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success) {
        const fetchedProducts = response.data.data || [];
        
        // Update the product store with the latest data
        fetchedProducts.forEach(product => {
          productStore.addProduct(product);
        });
        
        // Update the current page view
        setProducts(currentPage === 1 
          ? fetchedProducts.slice(0, 10) 
          : fetchedProducts.slice((currentPage - 1) * 10, currentPage * 10)
        );
        
        // Show success message
        alert('Product stock data has been refreshed!');
      }
    } catch (error) {
      console.error('Error refreshing product stock:', error);
      alert('Failed to refresh product stock. Please try again.');
    } finally {
      setStockRefreshing(false);
    }
  };

  // Add function to clear all products
  const handleClearAllProducts = async () => {
    if (window.confirm("WARNING! This will permanently delete ALL products from the database. This action cannot be undone. Are you sure you want to proceed?")) {
      setLoading(true);
      try {
        // Call the store method to clear all products from API
        const result = await productStore.clearAllProductsFromAPI();
        
        if (result.success) {
          // Clear local products state
          setProducts([]);
          setTotalPages(1);
          setCurrentPage(1);
          alert('All products have been successfully deleted');
        } else {
          alert(result.error || 'Failed to clear products. Please try again.');
        }
      } catch (error) {
        console.error('Error clearing products:', error);
        alert('An error occurred while clearing products');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleCategoryChange = (e) => {
    setCategoryFilter(e.target.value);
    setCurrentPage(1); // Reset to first page when filter changes
  };
  
  const toggleFeaturedFilter = () => {
    setShowFeaturedOnly(!showFeaturedOnly);
    setCurrentPage(1); // Reset to first page when filter changes
  };
  
  const toggleSampleFilter = () => {
    setShowSampleOnly(!showSampleOnly);
    setCurrentPage(1); // Reset to first page when filter changes
  };
  
  // Add new product handlers
  const handleAddProductOpen = () => {
    setShowAddModal(true);
  };
  
  const handleAddProductClose = () => {
    setShowAddModal(false);
  };
  
  const handleNewProductChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setNewProduct(prev => {
      // Add console logging for sample product checkbox
      if (name === 'isSample') {
        console.log(`Setting product as sample: ${newValue}`);
      }
      
      return {
      ...prev,
        [name]: newValue
      };
    });
  };
  
  const handleVariantChange = (index, field, value) => {
    setNewProduct(prev => {
      const updatedVariants = [...prev.variants];
      updatedVariants[index] = {
        ...updatedVariants[index],
        [field]: value
      };
      return {
        ...prev,
        variants: updatedVariants
      };
    });
  };
  
  const addVariant = () => {
    setNewProduct(prev => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          color: '#FFFFFF', 
          colorName: 'White',
          price: prev.basePrice,
          additionalImages: ['']
        }
      ]
    }));
  };
  
  const removeVariant = (index) => {
    if (newProduct.variants.length <= 1) return;
    
    setNewProduct(prev => {
      const updatedVariants = prev.variants.filter((_, i) => i !== index);
      return {
        ...prev,
        variants: updatedVariants
      };
    });
  };
  
  const handleVariantImageChange = (variantIndex, imageIndex, value) => {
    setNewProduct(prev => {
      const updatedVariants = [...prev.variants];
      const updatedImages = [...updatedVariants[variantIndex].additionalImages];
      updatedImages[imageIndex] = value;
      updatedVariants[variantIndex].additionalImages = updatedImages;
      return {
        ...prev,
        variants: updatedVariants
      };
    });
  };
  
  const addVariantImage = (variantIndex) => {
    setNewProduct(prev => {
      const updatedVariants = [...prev.variants];
      updatedVariants[variantIndex].additionalImages.push('');
      return {
        ...prev,
        variants: updatedVariants
      };
    });
  };
  
  const removeVariantImage = (variantIndex, imageIndex) => {
    if (newProduct.variants[variantIndex].additionalImages.length <= 1) return;
    
    setNewProduct(prev => {
      const updatedVariants = [...prev.variants];
      updatedVariants[variantIndex].additionalImages = 
        updatedVariants[variantIndex].additionalImages.filter((_, i) => i !== imageIndex);
      return {
        ...prev,
        variants: updatedVariants
      };
    });
  };
  
  const handleDetailChange = (index, value) => {
    setNewProduct(prev => {
      const updatedDetails = [...prev.details];
      updatedDetails[index] = value;
      return {
        ...prev,
        details: updatedDetails
      };
    });
  };
  
  const addDetail = () => {
    setNewProduct(prev => ({
      ...prev,
      details: [...prev.details, '']
    }));
  };
  
  const removeDetail = (index) => {
    if (newProduct.details.length <= 1) return;
    
    setNewProduct(prev => {
      const updatedDetails = prev.details.filter((_, i) => i !== index);
      return {
        ...prev,
        details: updatedDetails
      };
    });
  };
  
  const handleSizeToggle = (size) => {
    setNewProduct(prev => {
      if (prev.sizes.includes(size)) {
        return {
          ...prev,
          sizes: prev.sizes.filter(s => s !== size)
        };
      } else {
        return {
          ...prev,
          sizes: [...prev.sizes, size]
        };
      }
    });
  };

  const handleAddProduct = async () => {
    try {
      // Start loading state
      setLoading(true);
      
      // Validate required fields
      if (!newProduct.name || !newProduct.basePrice || !newProduct.description || !newProduct.category) {
        alert('Please fill in all required fields');
        setLoading(false);
        return;
      }
      
      // Log if product is being marked as sample
      if (newProduct.isSample) {
        console.log(`Product "${newProduct.name}" is being created as a sample product`);
      }
      
      // Make sure each variant has at least one image
      const hasInvalidVariants = newProduct.variants.some(
        variant => !variant.color || !variant.colorName || !variant.additionalImages[0]
      );
      
      if (hasInvalidVariants) {
        alert('Each color variant must have a color, name, and at least one image');
        setLoading(false);
        return;
      }
      
      // Format data for API
      const productData = {
        ...newProduct,
        basePrice: Number(newProduct.basePrice),
        salePrice: newProduct.salePrice ? Number(newProduct.salePrice) : 0,
        stock: parseInt(newProduct.stock),
        // Convert shipping values to numbers
        airShippingPrice: newProduct.airShippingPrice ? Number(newProduct.airShippingPrice) : 0,
        airShippingDuration: newProduct.airShippingDuration ? Number(newProduct.airShippingDuration) : 0,
        seaShippingPrice: newProduct.seaShippingPrice ? Number(newProduct.seaShippingPrice) : 0,
        seaShippingDuration: newProduct.seaShippingDuration ? Number(newProduct.seaShippingDuration) : 0
      };
      
      // Send data to API
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('You must be logged in to add products');
        setLoading(false);
        return;
      }
      
      const response = await axios.post(
        `${apiConfig.baseURL}/products`,
        productData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        // Add the product to the product store
        productStore.addProduct(response.data.data);
        
        // If a collection was selected, add the product to that collection
        if (newProduct.collectionId) {
          try {
            await axios.post(
              `${apiConfig.baseURL}/collections/${newProduct.collectionId}/products`,
              { productId: response.data.data._id },
              {
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                }
              }
            );
            
            // Refresh collections to update product counts
            fetchCollectionsFromAPI();
          } catch (collectionError) {
            console.error('Error associating product with collection:', collectionError);
            // Don't block the product creation if collection association fails
          }
        }
        
        // Show success message
        alert('Product added successfully!');
        
        // Close modal
        setShowAddModal(false);
        
        // Reset form
        setNewProduct({
          name: '',
          basePrice: '',
          salePrice: '',
          description: '',
          category: '',
          details: [''],
          variants: [
            { 
              color: '#000000', 
              colorName: 'Black',
              price: '',
              additionalImages: ['']
            }
          ],
          sizes: ['XS', 'S', 'M', 'L', 'XL'],
          stock: 0,
          collectionId: '',
          platformId: '',
          isFeatured: false,
          isSample: false,
          // Reset shipping fields
          airShippingPrice: '',
          airShippingDuration: '',
          seaShippingPrice: '',
          seaShippingDuration: ''
        });
        
        // Refresh products list
        fetchProducts();
      } else {
        throw new Error(response.data.error || 'Failed to add product');
      }
    } catch (error) {
      console.error('Error adding product:', error);
      alert(error.response?.data?.error || 'Failed to add product. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Delete product handler
  const handleDeleteProduct = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        setLoading(true);
        
        const token = localStorage.getItem('token');
        
        const response = await axios.delete(
          `${apiConfig.baseURL}/products/${id}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        if (response.data.success) {
          // Remove from local state
          setProducts(products.filter(product => product._id !== id));
          
          // Remove from store
          productStore.removeProduct(id);
          
          alert('Product deleted successfully');
        } else {
          throw new Error(response.data.error || 'Failed to delete product');
        }
      } catch (error) {
        console.error('Error deleting product:', error);
        alert(error.response?.data?.error || 'Failed to delete product');
      } finally {
        setLoading(false);
      }
    }
  };

  // Delete product handlers with confirmation modal
  const handleDeleteConfirmation = (product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };
  
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setProductToDelete(null);
  };
  
  const confirmDeleteProduct = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      
      const response = await axios.delete(
        `${apiConfig.baseURL}/products/${productToDelete._id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        // Remove from local state
        setProducts(products.filter(product => product._id !== productToDelete._id));
        
        // Remove from store
        productStore.removeProduct(productToDelete._id);
        
        // Close the modal
        closeDeleteModal();
      } else {
        throw new Error(response.data.error || 'Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert(error.response?.data?.error || 'Failed to delete product');
    } finally {
      setLoading(false);
    }
  };

  // Duplicate product handler
  const handleDuplicateProduct = async (product) => {
    try {
      setLoading(true);
      
      // Create a duplicate product without ID
      const duplicatedProduct = {
        ...product,
        name: `${product.name} (Copy)`,
        // Remove fields that should be unique or generated by the server
        _id: undefined,
        createdAt: undefined,
        updatedAt: undefined,
        slug: undefined,
        sku: undefined
      };
      
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `${apiConfig.baseURL}/products`,
        duplicatedProduct,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        // Add the product to the product store
        productStore.addProduct(response.data.data);
        
        // Refresh products list
        fetchProducts();
      } else {
        throw new Error(response.data.error || 'Failed to duplicate product');
      }
    } catch (error) {
      console.error('Error duplicating product:', error);
      alert(error.response?.data?.error || 'Failed to duplicate product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Open edit modal and populate with product data
  const handleEditProductOpen = (product) => {
    // Format the product data to match the form state
    const productForEdit = {
      _id: product._id,
      name: product.name,
      basePrice: String(product.basePrice),
      salePrice: product.salePrice ? String(product.salePrice) : '',
      description: product.description,
      category: product.category,
      details: product.details?.length > 0 ? product.details : [''],
      variants: product.variants?.length > 0 ? product.variants.map(variant => ({
        ...variant,
        price: variant.price ? String(variant.price) : ''
      })) : [{ 
        color: '#000000', 
        colorName: 'Black',
        price: '',
        additionalImages: ['']
      }],
      sizes: product.sizes || ['XS', 'S', 'M', 'L', 'XL'],
      stock: product.stock || 0,
      slug: product.slug,
      sku: product.sku,
      collectionId: product.collectionId || '',
      platformId: product.platformId || '',
      isFeatured: !!product.isFeatured,
      isSample: !!product.isSample,
      // Add shipping fields
      airShippingPrice: product.airShippingPrice ? String(product.airShippingPrice) : '',
      airShippingDuration: product.airShippingDuration ? String(product.airShippingDuration) : '',
      seaShippingPrice: product.seaShippingPrice ? String(product.seaShippingPrice) : '',
      seaShippingDuration: product.seaShippingDuration ? String(product.seaShippingDuration) : ''
    };
    
    // Log the converted price values for debugging
    console.log('Edit form populated with prices:', {
      basePrice: productForEdit.basePrice,
      salePrice: productForEdit.salePrice
    });
    
    // Set the editing product
    setEditingProduct(productForEdit);
    
    // Copy to the newProduct form state for the modal form
    setNewProduct(productForEdit);
    
    // Open the modal
    setShowEditModal(true);
  };
  
  // Close edit modal
  const handleEditProductClose = () => {
    setShowEditModal(false);
    setEditingProduct(null);
    
    // Reset form 
    setNewProduct({
      name: '',
      basePrice: '',
      salePrice: '',
      description: '',
      category: '',
      details: [''],
      variants: [
        { 
          color: '#000000', 
          colorName: 'Black',
          price: '',
          additionalImages: ['']
        }
      ],
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      stock: 0,
      collectionId: '',
      platformId: '',
      isFeatured: false,
      isSample: false,
      // Reset shipping fields
      airShippingPrice: '',
      airShippingDuration: '',
      seaShippingPrice: '',
      seaShippingDuration: ''
    });
  };
  
  // Update existing product
  const handleUpdateProduct = async () => {
    try {
      // Start loading state
      setLoading(true);
      
      // Validate required fields
      if (!newProduct.name || !newProduct.basePrice || !newProduct.description || !newProduct.category) {
        alert('Please fill in all required fields');
        setLoading(false);
        return;
      }
      
      // Log if product's sample status is being updated
      const originalProduct = products.find(p => p._id === editingProduct._id);
      if (originalProduct && originalProduct.isSample !== newProduct.isSample) {
        console.log(`Product "${newProduct.name}" sample status changing from ${originalProduct.isSample} to ${newProduct.isSample}`);
      }
      
      // Make sure each variant has at least one image
      const hasInvalidVariants = newProduct.variants.some(
        variant => !variant.color || !variant.colorName || !variant.additionalImages[0]
      );
      
      if (hasInvalidVariants) {
        alert('Each color variant must have a color, name, and at least one image');
        setLoading(false);
        return;
      }
      
      // Log price values before conversion for debugging
      console.log('Before conversion - basePrice:', newProduct.basePrice, 'type:', typeof newProduct.basePrice);
      console.log('Before conversion - salePrice:', newProduct.salePrice, 'type:', typeof newProduct.salePrice);
      
      // Format data for API
      const productData = {
        ...newProduct,
        basePrice: Number(newProduct.basePrice),
        salePrice: newProduct.salePrice ? Number(newProduct.salePrice) : 0,
        stock: parseInt(newProduct.stock),
        slug: newProduct.slug, // Preserve original slug
        sku: newProduct.sku, // Preserve original SKU
        isFeatured: !!newProduct.isFeatured,
        isSample: !!newProduct.isSample,
        // Convert shipping values to numbers
        airShippingPrice: newProduct.airShippingPrice ? Number(newProduct.airShippingPrice) : 0,
        airShippingDuration: newProduct.airShippingDuration ? Number(newProduct.airShippingDuration) : 0,
        seaShippingPrice: newProduct.seaShippingPrice ? Number(newProduct.seaShippingPrice) : 0,
        seaShippingDuration: newProduct.seaShippingDuration ? Number(newProduct.seaShippingDuration) : 0
      };
      
      // Log the formatted data for debugging
      console.log('After conversion - productData prices:', {
        basePrice: productData.basePrice,
        salePrice: productData.salePrice
      });
      
      // Send data to API
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('You must be logged in to update products');
        setLoading(false);
        return;
      }
      
      const response = await axios.put(
        `${apiConfig.baseURL}/products/${editingProduct._id}`,
        productData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        console.log('API Response data:', response.data.data);
        
        // Update the product in the store
        productStore.addProduct(response.data.data);
        
        // If collection changed, update the collection association
        if (newProduct.collectionId) {
          try {
            // First add to new collection
            await axios.post(
              `${apiConfig.baseURL}/collections/${newProduct.collectionId}/products`,
              { productId: response.data.data._id },
              {
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                }
              }
            );
            
            // Refresh collections to update product counts
            fetchCollectionsFromAPI();
          } catch (collectionError) {
            console.error('Error associating product with collection:', collectionError);
            // Don't block the product update if collection association fails
          }
        }
        
        // Update local product list
        setProducts(prevProducts => 
          prevProducts.map(p => p._id === response.data.data._id ? response.data.data : p)
        );
        
        // Show success message
        alert('Product updated successfully!');
        
        // Close modal
        handleEditProductClose();
        
        // Refresh products list to ensure we have the latest data
        fetchProducts();
      } else {
        throw new Error(response.data.error || 'Failed to update product');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      alert(error.response?.data?.error || 'Failed to update product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Add shimmer loading effect component
  const ProductRowSkeleton = () => (
    <div className="grid grid-cols-6 gap-4 px-6 py-4 animate-pulse">
      <div className="col-span-2">
        <div className="flex items-center">
          <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
          <div className="ml-4 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-3 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
      </div>
      <div className="flex items-center">
        <div className="h-4 bg-gray-200 rounded w-20"></div>
      </div>
      <div className="flex items-center">
        <div className="h-4 bg-gray-200 rounded w-16"></div>
      </div>
      <div className="flex items-center">
        <div className="h-6 bg-gray-200 rounded-full w-20"></div>
      </div>
      <div className="flex justify-center space-x-3 items-center">
        <div className="h-4 w-4 bg-gray-200 rounded-full"></div>
        <div className="h-4 w-4 bg-gray-200 rounded-full"></div>
        <div className="h-4 w-4 bg-gray-200 rounded-full"></div>
      </div>
    </div>
  );

  // Mobile product card component
  const ProductCard = ({ product }) => (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <div className="h-12 w-12 flex-shrink-0">
            <img 
              className="h-12 w-12 rounded-lg object-cover" 
              src={product.variants?.[0]?.additionalImages?.[0] || product.image} 
              alt={product.name}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://via.placeholder.com/50?text=No+Image';
              }}
            />
          </div>
          <div className="ml-3">
            <div className="text-sm font-medium text-gray-900 flex items-center">
              {product.name}
              {product.isFeatured && (
                <span title="Featured product" className="ml-2 text-yellow-500">
                  <FaStar size={14} />
                </span>
              )}
              {product.isSample && (
                <span title="Sample product" className="ml-2 text-blue-500">
                  <FaImage size={14} />
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500">{product.sku || 'No SKU'}</div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <span className="text-xs text-gray-500">Category:</span>
          <p className="text-sm text-gray-700">{product.category}</p>
        </div>
        <div>
          <span className="text-xs text-gray-500">Price:</span>
          <p className="text-sm text-gray-700">GH₵ {product.basePrice?.toFixed(2) || "0.00"}</p>
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <span className={`px-2 py-1 rounded-full text-xs
          ${product.stock > 10 ? 'bg-green-100 text-green-800' : 
            product.stock > 0 ? 'bg-yellow-100 text-yellow-800' : 
            'bg-red-100 text-red-800'}
        `}>
          {product.stock > 0 
            ? <span><strong>{product.stock}</strong> in stock</span> 
            : 'Out of stock'}
        </span>
        
        <div className="flex space-x-3">
          <button 
            className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100"
            onClick={(e) => {
              e.stopPropagation();
              handleEditProductOpen(product);
            }}
            title="Edit product"
          >
            <FaEdit size={14} />
          </button>
          <button 
            className="p-2 bg-green-50 text-green-600 rounded-full hover:bg-green-100"
            onClick={(e) => {
              e.stopPropagation();
              handleDuplicateProduct(product);
            }}
            title="Duplicate product"
          >
            <FaCopy size={14} />
          </button>
          <button 
            className="p-2 bg-red-50 text-red-600 rounded-full hover:bg-red-100"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteConfirmation(product);
            }}
            title="Delete product"
          >
            <FaTrash size={14} />
          </button>
        </div>
      </div>
    </div>
  );

  // Mobile skeleton for card view
  const ProductCardSkeleton = () => (
    <div className="animate-pulse bg-white rounded-lg shadow-sm p-4 mb-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <div className="h-12 w-12 bg-gray-200 rounded-lg"></div>
          <div className="ml-3">
            <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <div className="h-3 bg-gray-200 rounded w-16 mb-1"></div>
          <div className="h-4 bg-gray-200 rounded w-20"></div>
        </div>
        <div>
          <div className="h-3 bg-gray-200 rounded w-12 mb-1"></div>
          <div className="h-4 bg-gray-200 rounded w-16"></div>
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="h-6 bg-gray-200 rounded-full w-20"></div>
        <div className="flex space-x-2">
          <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
          <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
          <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
        </div>
      </div>
    </div>
  );

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
                placeholder="Search..."
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
            <div className={`border-b ${isMobileView ? 'p-3' : 'p-4'}`}>
              <div className="flex flex-wrap gap-2 sm:gap-4 mb-3 sm:mb-0">
                <select
                  value={categoryFilter}
                  onChange={handleCategoryChange}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 w-full sm:w-auto"
                >
                  <option value="all">All Categories</option>
                  <option value="NEW ARRIVALS">NEW ARRIVALS</option>
                  <option value="BEST SELLERS">BEST SELLERS</option>
                  <option value="HAIR">HAIR</option>
                  <option value="GADGETS">GADGETS</option>
                  <option value="EXCLUSIVES">EXCLUSIVES</option>
                  <option value="BACK IN STOCK">BACK IN STOCK</option>
                </select>
                
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <button
                    onClick={refreshProductStock}
                    disabled={stockRefreshing}
                    className={`flex items-center px-3 py-2 text-sm border rounded-lg flex-grow sm:flex-grow-0 ${
                      stockRefreshing ? 'text-gray-400 border-gray-300 bg-gray-50' : 'text-blue-600 border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    <FaSync className={`mr-2 ${stockRefreshing ? 'animate-spin' : ''}`} /> 
                    {stockRefreshing ? 'Refreshing...' : 'Refresh'}
                  </button>
                  <button
                    onClick={toggleFeaturedFilter}
                    className={`flex items-center px-3 py-2 text-sm border rounded-lg flex-grow sm:flex-grow-0 ${
                      showFeaturedOnly 
                        ? 'text-yellow-600 border-yellow-300 bg-yellow-50' 
                        : 'text-gray-600 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <FaStar className="mr-2" /> 
                    {showFeaturedOnly ? 'All' : 'Featured'}
                  </button>
                  <button
                    onClick={toggleSampleFilter}
                    className={`flex items-center px-3 py-2 text-sm border rounded-lg flex-grow sm:flex-grow-0 ${
                      showSampleOnly 
                        ? 'text-green-600 border-green-300 bg-green-50' 
                        : 'text-gray-600 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <FaImage className="mr-2" /> 
                    {showSampleOnly ? 'All' : 'Sample'}
                  </button>
                  <button
                    onClick={handleClearAllProducts}
                    className="flex items-center px-3 py-2 text-sm border border-red-300 text-red-600 hover:bg-red-50 rounded-lg flex-grow sm:flex-grow-0"
                  >
                    <FaTrash className="mr-2" /> 
                    Clear All
                  </button>
                </div>
              </div>
              
              <button
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center w-full sm:w-auto justify-center sm:justify-start mt-3 sm:mt-0 sm:float-right"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddProductOpen();
                }}
              >
                <FaPlus className="mr-2" /> Add Product
              </button>
              <div className="clear-both"></div>
            </div>
            
            {/* Desktop Table View */}
            {!isMobileView && (
              <div className="min-w-full divide-y divide-gray-200">
                <div className="bg-gray-50 grid grid-cols-6 gap-4 px-6 py-3">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider col-span-2">
                    Product
                  </div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                    Actions
                  </div>
                </div>
                
                {/* Show shimmer loading for products if stock is refreshing */}
                {stockRefreshing ? (
                  <div className="bg-white divide-y divide-gray-200">
                    {Array(products.length || 5).fill(0).map((_, index) => (
                      <ProductRowSkeleton key={index} />
                    ))}
                  </div>
                ) : products.length > 0 ? (
                  <div className="bg-white divide-y divide-gray-200">
                    {products.map((product) => (
                      <div key={product._id} className="grid grid-cols-6 gap-4 px-6 py-4 hover:bg-gray-50">
                        <div className="col-span-2">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              <img 
                                className="h-10 w-10 rounded-lg object-cover" 
                                src={product.variants?.[0]?.additionalImages?.[0] || product.image} 
                                alt={product.name}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = 'https://via.placeholder.com/50?text=No+Image';
                                }}
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 flex items-center">
                                {product.name}
                                {product.isFeatured && (
                                  <span title="Featured product" className="ml-2 text-yellow-500">
                                    <FaStar size={14} />
                                  </span>
                                )}
                                {product.isSample && (
                                  <span title="Sample product" className="ml-2 text-blue-500">
                                    <FaImage size={14} />
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-500">{product.sku || 'No SKU'}</div>
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500 self-center">
                          {product.category}
                        </div>
                        <div className="text-sm text-gray-500 self-center">
                          GH₵ {product.basePrice?.toFixed(2) || "0.00"}
                        </div>
                        <div className="text-sm self-center">
                          <span className={`px-2 py-1 rounded-full text-xs
                            ${product.stock > 10 ? 'bg-green-100 text-green-800' : 
                              product.stock > 0 ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-red-100 text-red-800'}
                          `}>
                            {product.stock > 0 
                              ? <span><strong>{product.stock}</strong> in stock</span> 
                              : 'Out of stock'}
                          </span>
                        </div>
                        <div className="flex justify-center space-x-3 self-center">
                          <button 
                            className="text-blue-600 hover:text-blue-900"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditProductOpen(product);
                            }}
                            title="Edit product"
                          >
                            <FaEdit />
                          </button>
                          <button 
                            className="text-green-600 hover:text-green-900"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicateProduct(product);
                            }}
                            title="Duplicate product"
                          >
                            <FaCopy />
                          </button>
                          <button 
                            className="text-red-600 hover:text-red-900"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteConfirmation(product);
                            }}
                            title="Delete product"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 max-w-md w-full text-center">
                      <FaBoxOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-xl font-medium text-gray-700 mb-2">No products found</h3>
                      <p className="text-gray-500 mb-6">Your inventory is currently empty. Add your first product to get started.</p>
                      <button 
                        onClick={handleAddProductOpen}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 inline-flex items-center"
                      >
                        <FaPlus className="mr-2" /> Add Your First Product
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Mobile Card View */}
            {isMobileView && (
              <div className="p-3">
                {stockRefreshing ? (
                  Array(products.length || 3).fill(0).map((_, index) => (
                    <ProductCardSkeleton key={index} />
                  ))
                ) : products.length > 0 ? (
                  products.map(product => (
                    <ProductCard key={product._id} product={product} />
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 w-full mx-3 text-center">
                      <FaBoxOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-700 mb-1">No products found</h3>
                      <p className="text-sm text-gray-500 mb-4">Your inventory is currently empty</p>
                      <button 
                        onClick={handleAddProductOpen}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 inline-flex items-center text-sm"
                      >
                        <FaPlus className="mr-2" /> Add Product
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {products.length > 0 && !stockRefreshing && (
              <div className="px-4 py-3 sm:px-6 sm:py-4 flex flex-wrap sm:flex-nowrap items-center justify-between border-t gap-3">
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
          </div>
        </div>
        
        {/* Add Product Modal */}
        {showAddModal && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
            onClick={(e) => e.target === e.currentTarget && handleAddProductClose()}
          >
            <div 
              className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative"
              onClick={(e) => e.stopPropagation()}
              style={{ isolation: "isolate" }}
            >
              <div className="flex justify-between items-center p-4 sm:p-6 border-b">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Add New Product</h2>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddProductClose();
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaTimes />
                </button>
              </div>
              
              <div className="p-4 sm:p-6">
                <form>
                  {/* Basic Info Section */}
                  <div className="mb-6 sm:mb-8">
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4 pb-2 border-b">Basic Information</h3>
                    
                    <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                          Product Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={newProduct.name}
                          onChange={handleNewProductChange}
                          className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                          Category <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="category"
                          name="category"
                          value={newProduct.category}
                          onChange={handleNewProductChange}
                          className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                          required
                        >
                          <option value="">Select Category</option>
                          <option value="NEW ARRIVALS">NEW ARRIVALS</option>
                          <option value="BEST SELLERS">BEST SELLERS</option>
                          <option value="HAIR">HAIR</option>
                          <option value="GADGETS">GADGETS</option>
                          <option value="EXCLUSIVES">EXCLUSIVES</option>
                          <option value="BACK IN STOCK">BACK IN STOCK</option>
                        </select>
                      </div>
                      
                      <div>
                        <label htmlFor="collectionId" className="block text-sm font-medium text-gray-700 mb-1">
                          Collection (Optional)
                        </label>
                        <select
                          id="collectionId"
                          name="collectionId"
                          value={newProduct.collectionId}
                          onChange={handleNewProductChange}
                          className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                        >
                          <option value="">Select Collection</option>
                          {collections.map((collection) => (
                            <option key={collection._id} value={collection._id}>
                              {collection.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label htmlFor="platformId" className="block text-sm font-medium text-gray-700 mb-1">
                          Platform (Optional)
                        </label>
                        <select
                          id="platformId"
                          name="platformId"
                          value={newProduct.platformId}
                          onChange={handleNewProductChange}
                          className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                        >
                          <option value="">Select Platform</option>
                          {platforms.map((platform) => (
                            <option key={platform._id} value={platform._id}>
                              {platform.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label htmlFor="basePrice" className="block text-sm font-medium text-gray-700 mb-1">
                          Regular Price <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500">GH₵</span>
                          </div>
                          <input
                            type="number"
                            id="basePrice"
                            name="basePrice"
                            value={newProduct.basePrice}
                            onChange={handleNewProductChange}
                            className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                            step="any"
                            required
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="salePrice" className="block text-sm font-medium text-gray-700 mb-1">
                          Sale Price (Optional)
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500">GH₵</span>
                          </div>
                          <input
                            type="number"
                            id="salePrice"
                            name="salePrice"
                            value={newProduct.salePrice}
                            onChange={handleNewProductChange}
                            className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                            step="any"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">
                          Stock Quantity <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          id="stock"
                          name="stock"
                          value={newProduct.stock}
                          onChange={handleNewProductChange}
                          className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                          min="0"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Shipping Information Section for Add Product Modal */}
                  <div className="mb-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b">Shipping Information</h3>
                    
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div>
                        <label htmlFor="airShippingPrice" className="block text-sm font-medium text-gray-700 mb-1">
                          Air Shipping Price (GHS)
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500">GH₵</span>
                          </div>
                          <input
                            type="number"
                            id="airShippingPrice"
                            name="airShippingPrice"
                            value={newProduct.airShippingPrice}
                            onChange={handleNewProductChange}
                            className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                            placeholder="0.00"
                            step="any"
                          />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          Setting to 0 will make air shipping unavailable
                        </p>
                      </div>
                      
                      <div>
                        <label htmlFor="airShippingDuration" className="block text-sm font-medium text-gray-700 mb-1">
                          Air Shipping Duration (days)
                        </label>
                        <input
                          type="number"
                          id="airShippingDuration"
                          name="airShippingDuration"
                          value={newProduct.airShippingDuration}
                          onChange={handleNewProductChange}
                          className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                          placeholder="e.g. 5"
                          min="1"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Both price and duration must be set for air shipping
                        </p>
                      </div>
                      
                      <div>
                        <label htmlFor="seaShippingPrice" className="block text-sm font-medium text-gray-700 mb-1">
                          Sea Shipping Price (GHS)
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500">GH₵</span>
                          </div>
                          <input
                            type="number"
                            id="seaShippingPrice"
                            name="seaShippingPrice"
                            value={newProduct.seaShippingPrice}
                            onChange={handleNewProductChange}
                            className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                            placeholder="0.00"
                            step="any"
                          />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          Setting to 0 will make sea shipping unavailable
                        </p>
                      </div>
                      
                      <div>
                        <label htmlFor="seaShippingDuration" className="block text-sm font-medium text-gray-700 mb-1">
                          Sea Shipping Duration (days)
                        </label>
                        <input
                          type="number"
                          id="seaShippingDuration"
                          name="seaShippingDuration"
                          value={newProduct.seaShippingDuration}
                          onChange={handleNewProductChange}
                          className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                          placeholder="e.g. 30"
                          min="1"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Both price and duration must be set for sea shipping
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Feature Flag Section */}
                  <div className="mb-8">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <input
                          id="isFeatured"
                          name="isFeatured"
                          type="checkbox"
                          className="h-5 w-5 text-yellow-600 focus:ring-yellow-500 border-yellow-300 rounded"
                          checked={newProduct.isFeatured}
                          onChange={(e) => setNewProduct(prev => ({
                            ...prev,
                            isFeatured: e.target.checked
                          }))}
                        />
                        <div className="ml-3">
                          <label htmlFor="isFeatured" className="font-medium text-yellow-800 flex items-center">
                            <FaStar className="text-yellow-500 mr-1" /> Feature this product
                          </label>
                          <p className="text-yellow-700 text-sm">
                            Featured products will be highlighted on the homepage and in featured sections
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Sample Product Flag Section */}
                  <div className="mb-8">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <input
                          id="isSample"
                          name="isSample"
                          type="checkbox"
                          className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-blue-300 rounded"
                          checked={newProduct.isSample}
                          onChange={(e) => setNewProduct(prev => ({
                            ...prev,
                            isSample: e.target.checked
                          }))}
                        />
                        <div className="ml-3">
                          <label htmlFor="isSample" className="font-medium text-blue-800 flex items-center">
                            <FaImage className="text-blue-500 mr-1" /> Mark as sample product
                          </label>
                          <p className="text-blue-700 text-sm">
                            Sample products will be displayed in the sample products section on the homepage
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Platform Association Indicator (if already selected) */}
                  {newProduct.platformId && (
                    <div className="mb-8">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center">
                          <FaGlobe className="h-5 w-5 text-blue-500" />
                          <div className="ml-3">
                            <p className="text-blue-700">
                              This product will be associated with the platform: 
                              <span className="font-medium ml-1">
                                {platforms.find(p => p._id === newProduct.platformId)?.name || 'Selected Platform'}
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Description Section */}
                  <div className="mb-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b">Description</h3>
                    
                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                        Product Description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        value={newProduct.description}
                        onChange={handleNewProductChange}
                        rows="4"
                        className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                        required
                      ></textarea>
                    </div>
                  </div>
                  
                  {/* Product Details Section */}
                  <div className="mb-8">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b">
                      <h3 className="text-lg font-medium text-gray-900">Product Details</h3>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          addDetail();
                        }}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
                      >
                        + Add Detail
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      {newProduct.details.map((detail, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={detail}
                            onChange={(e) => handleDetailChange(index, e.target.value)}
                            className="block flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                            placeholder="e.g., 100% cotton, Machine washable, Model wears size S"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeDetail(index);
                            }}
                            className="px-2 py-2 bg-red-50 text-red-500 rounded-md hover:bg-red-100"
                          >
                            <FaTimes />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Sizes Section */}
                  <div className="mb-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b">Available Sizes</h3>
                    
                    <div className="flex flex-wrap gap-2">
                      {['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL'].map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSizeToggle(size);
                          }}
                          className={`px-4 py-2 rounded-md ${
                            newProduct.sizes.includes(size)
                              ? 'bg-purple-100 text-purple-700 border-purple-300 border'
                              : 'bg-gray-100 text-gray-700 border-gray-300 border'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Color Variants Section */}
                  <div className="mb-8">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b">
                      <h3 className="text-lg font-medium text-gray-900">Color Variants</h3>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          addVariant();
                        }}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
                      >
                        + Add Color Variant
                      </button>
                    </div>
                    
                    <div className="space-y-8">
                      {newProduct.variants.map((variant, variantIndex) => (
                        <div key={variantIndex} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="font-medium">Variant {variantIndex + 1}</h4>
                            {newProduct.variants.length > 1 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeVariant(variantIndex);
                                }}
                                className="px-2 py-1 bg-red-50 text-red-500 rounded-md hover:bg-red-100 text-sm"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Color <span className="text-red-500">*</span>
                              </label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={variant.color}
                                  onChange={(e) => handleVariantChange(variantIndex, 'color', e.target.value)}
                                  className="h-10 w-10 rounded-md border border-gray-300 p-0"
                                />
                                <input
                                  type="text"
                                  value={variant.colorName}
                                  onChange={(e) => handleVariantChange(variantIndex, 'colorName', e.target.value)}
                                  placeholder="Color name (e.g. Black, Red)"
                                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                                />
                              </div>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Variant Price (Optional)
                              </label>
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                  <span className="text-gray-500">GH₵</span>
                                </div>
                                <input
                                  type="number"
                                  value={variant.price}
                                  onChange={(e) => handleVariantChange(variantIndex, 'price', e.target.value)}
                                  placeholder="Leave empty to use base price"
                                  className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                                  step="any"
                                />
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <label className="block text-sm font-medium text-gray-700">
                                Variant Images <span className="text-red-500">*</span>
                              </label>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addVariantImage(variantIndex);
                                }}
                                className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-xs"
                              >
                                + Add Image
                              </button>
                            </div>
                            
                            <div className="space-y-3">
                              {variant.additionalImages.map((image, imageIndex) => (
                                <div key={imageIndex} className="flex gap-2">
                                  <div className="flex-1 flex items-center gap-3 px-4 py-2 border border-gray-300 rounded-md bg-white">
                                    {image ? (
                                      <img 
                                        src={image}
                                        alt={`Variant ${variantIndex + 1} image ${imageIndex + 1}`}
                                        className="h-10 w-10 object-cover rounded"
                                        onError={(e) => {
                                          e.target.onerror = null;
                                          e.target.src = 'https://via.placeholder.com/40?text=Error';
                                        }}
                                      />
                                    ) : (
                                      <div className="h-10 w-10 bg-gray-100 flex items-center justify-center rounded">
                                        <FaImage className="text-gray-400" />
                                      </div>
                                    )}
                                    <input
                                      type="text"
                                      value={image}
                                      onChange={(e) => handleVariantImageChange(variantIndex, imageIndex, e.target.value)}
                                      placeholder="Enter image URL"
                                      className="flex-1 border-0 focus:ring-0 p-0"
                                    />
                                  </div>
                                  {variant.additionalImages.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeVariantImage(variantIndex, imageIndex);
                                      }}
                                      className="px-2 py-2 bg-red-50 text-red-500 rounded-md hover:bg-red-100"
                                    >
                                      <FaTimes />
                                    </button>
                                  )}
                                </div>
                              ))}
                              <p className="text-xs text-gray-500">
                                The first image will be used as the main product image for this color variant
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3 mt-8 pt-4 border-t relative">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddProductClose();
                      }}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <div className="relative" style={{ zIndex: 50, position: "relative" }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddProduct();
                        }}
                        className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 cursor-pointer"
                        style={{ pointerEvents: "auto" }}
                      >
                        Save Product
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
        
        {/* Edit Product Modal */}
        {showEditModal && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && handleEditProductClose()}
          >
            <div 
              className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative"
              onClick={(e) => e.stopPropagation()}
              style={{ isolation: "isolate" }}
            >
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-xl font-bold text-gray-900">Edit Product</h2>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditProductClose();
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaTimes />
                </button>
              </div>
              
              <div className="p-6">
                <form>
                  {/* Basic Info Section */}
                  <div className="mb-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b">Basic Information</h3>
                    
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div>
                        <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-1">
                          Product Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="edit-name"
                          name="name"
                          value={newProduct.name}
                          onChange={handleNewProductChange}
                          className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="edit-category" className="block text-sm font-medium text-gray-700 mb-1">
                          Category <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="edit-category"
                          name="category"
                          value={newProduct.category}
                          onChange={handleNewProductChange}
                          className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                          required
                        >
                          <option value="">Select Category</option>
                          <option value="NEW ARRIVALS">NEW ARRIVALS</option>
                          <option value="BEST SELLERS">BEST SELLERS</option>
                          <option value="HAIR">HAIR</option>
                          <option value="GADGETS">GADGETS</option>
                          <option value="EXCLUSIVES">EXCLUSIVES</option>
                          <option value="BACK IN STOCK">BACK IN STOCK</option>
                        </select>
                      </div>
                      
                      <div>
                        <label htmlFor="edit-collectionId" className="block text-sm font-medium text-gray-700 mb-1">
                          Collection (Optional)
                        </label>
                        <select
                          id="edit-collectionId"
                          name="collectionId"
                          value={newProduct.collectionId}
                          onChange={handleNewProductChange}
                          className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                        >
                          <option value="">Select Collection</option>
                          {collections.map((collection) => (
                            <option key={collection._id} value={collection._id}>
                              {collection.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label htmlFor="edit-platformId" className="block text-sm font-medium text-gray-700 mb-1">
                          Platform (Optional)
                        </label>
                        <select
                          id="edit-platformId"
                          name="platformId"
                          value={newProduct.platformId}
                          onChange={handleNewProductChange}
                          className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                        >
                          <option value="">Select Platform</option>
                          {platforms.map((platform) => (
                            <option key={platform._id} value={platform._id}>
                              {platform.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label htmlFor="edit-basePrice" className="block text-sm font-medium text-gray-700 mb-1">
                          Regular Price <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500">GH₵</span>
                          </div>
                          <input
                            type="number"
                            id="edit-basePrice"
                            name="basePrice"
                            value={newProduct.basePrice}
                            onChange={handleNewProductChange}
                            className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                            step="any"
                            required
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="edit-salePrice" className="block text-sm font-medium text-gray-700 mb-1">
                          Sale Price (Optional)
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500">GH₵</span>
                          </div>
                          <input
                            type="number"
                            id="edit-salePrice"
                            name="salePrice"
                            value={newProduct.salePrice}
                            onChange={handleNewProductChange}
                            className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                            step="any"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="edit-stock" className="block text-sm font-medium text-gray-700 mb-1">
                          Stock Quantity <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          id="edit-stock"
                          name="stock"
                          value={newProduct.stock}
                          onChange={handleNewProductChange}
                          className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                          min="0"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Shipping Information Section for Edit Product Modal */}
                  <div className="mb-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b">Shipping Information</h3>
                    
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div>
                        <label htmlFor="edit-airShippingPrice" className="block text-sm font-medium text-gray-700 mb-1">
                          Air Shipping Price (GHS)
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500">GH₵</span>
                          </div>
                          <input
                            type="number"
                            id="edit-airShippingPrice"
                            name="airShippingPrice"
                            value={newProduct.airShippingPrice}
                            onChange={handleNewProductChange}
                            className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                            placeholder="0.00"
                            step="any"
                          />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          Setting to 0 will make air shipping unavailable
                        </p>
                      </div>
                      
                      <div>
                        <label htmlFor="edit-airShippingDuration" className="block text-sm font-medium text-gray-700 mb-1">
                          Air Shipping Duration (days)
                        </label>
                        <input
                          type="number"
                          id="edit-airShippingDuration"
                          name="airShippingDuration"
                          value={newProduct.airShippingDuration}
                          onChange={handleNewProductChange}
                          className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                          placeholder="e.g. 5"
                          min="1"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Both price and duration must be set for air shipping
                        </p>
                      </div>
                      
                      <div>
                        <label htmlFor="edit-seaShippingPrice" className="block text-sm font-medium text-gray-700 mb-1">
                          Sea Shipping Price (GHS)
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500">GH₵</span>
                          </div>
                          <input
                            type="number"
                            id="edit-seaShippingPrice"
                            name="seaShippingPrice"
                            value={newProduct.seaShippingPrice}
                            onChange={handleNewProductChange}
                            className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                            placeholder="0.00"
                            step="any"
                          />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          Setting to 0 will make sea shipping unavailable
                        </p>
                      </div>
                      
                      <div>
                        <label htmlFor="edit-seaShippingDuration" className="block text-sm font-medium text-gray-700 mb-1">
                          Sea Shipping Duration (days)
                        </label>
                        <input
                          type="number"
                          id="edit-seaShippingDuration"
                          name="seaShippingDuration"
                          value={newProduct.seaShippingDuration}
                          onChange={handleNewProductChange}
                          className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                          placeholder="e.g. 30"
                          min="1"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Both price and duration must be set for sea shipping
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Feature Flag Section */}
                  <div className="mb-8">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <input
                          id="edit-isFeatured"
                          name="isFeatured"
                          type="checkbox"
                          className="h-5 w-5 text-yellow-600 focus:ring-yellow-500 border-yellow-300 rounded"
                          checked={newProduct.isFeatured}
                          onChange={(e) => setNewProduct(prev => ({
                            ...prev,
                            isFeatured: e.target.checked
                          }))}
                        />
                        <div className="ml-3">
                          <label htmlFor="edit-isFeatured" className="font-medium text-yellow-800 flex items-center">
                            <FaStar className="text-yellow-500 mr-1" /> Feature this product
                          </label>
                          <p className="text-yellow-700 text-sm">
                            Featured products will be highlighted on the homepage and in featured sections
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Sample Product Flag Section */}
                  <div className="mb-8">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <input
                          id="edit-isSample"
                          name="isSample"
                          type="checkbox"
                          className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-blue-300 rounded"
                          checked={newProduct.isSample}
                          onChange={(e) => setNewProduct(prev => ({
                            ...prev,
                            isSample: e.target.checked
                          }))}
                        />
                        <div className="ml-3">
                          <label htmlFor="edit-isSample" className="font-medium text-blue-800 flex items-center">
                            <FaImage className="text-blue-500 mr-1" /> Mark as sample product
                          </label>
                          <p className="text-blue-700 text-sm">
                            Sample products will be displayed in the sample products section on the homepage
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Platform Association Indicator (if already selected) */}
                  {newProduct.platformId && (
                    <div className="mb-8">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center">
                          <FaGlobe className="h-5 w-5 text-blue-500" />
                          <div className="ml-3">
                            <p className="text-blue-700">
                              This product will be associated with the platform: 
                              <span className="font-medium ml-1">
                                {platforms.find(p => p._id === newProduct.platformId)?.name || 'Selected Platform'}
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Description Section */}
                  <div className="mb-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b">Description</h3>
                    
                    <div>
                      <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-1">
                        Product Description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="edit-description"
                        name="description"
                        value={newProduct.description}
                        onChange={handleNewProductChange}
                        rows="4"
                        className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                        required
                      ></textarea>
                    </div>
                  </div>
                  
                  {/* Product Details Section */}
                  <div className="mb-8">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b">
                      <h3 className="text-lg font-medium text-gray-900">Product Details</h3>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          addDetail();
                        }}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
                      >
                        + Add Detail
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      {newProduct.details.map((detail, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={detail}
                            onChange={(e) => handleDetailChange(index, e.target.value)}
                            className="block flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                            placeholder="e.g., 100% cotton, Machine washable, Model wears size S"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeDetail(index);
                            }}
                            className="px-2 py-2 bg-red-50 text-red-500 rounded-md hover:bg-red-100"
                          >
                            <FaTimes />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Sizes Section */}
                  <div className="mb-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b">Available Sizes</h3>
                    
                    <div className="flex flex-wrap gap-2">
                      {['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL'].map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSizeToggle(size);
                          }}
                          className={`px-4 py-2 rounded-md ${
                            newProduct.sizes.includes(size)
                              ? 'bg-purple-100 text-purple-700 border-purple-300 border'
                              : 'bg-gray-100 text-gray-700 border-gray-300 border'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Color Variants Section */}
                  <div className="mb-8">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b">
                      <h3 className="text-lg font-medium text-gray-900">Color Variants</h3>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          addVariant();
                        }}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
                      >
                        + Add Color Variant
                      </button>
                    </div>
                    
                    <div className="space-y-8">
                      {newProduct.variants.map((variant, variantIndex) => (
                        <div key={variantIndex} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="font-medium">Variant {variantIndex + 1}</h4>
                            {newProduct.variants.length > 1 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeVariant(variantIndex);
                                }}
                                className="px-2 py-1 bg-red-50 text-red-500 rounded-md hover:bg-red-100 text-sm"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Color <span className="text-red-500">*</span>
                              </label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={variant.color}
                                  onChange={(e) => handleVariantChange(variantIndex, 'color', e.target.value)}
                                  className="h-10 w-10 rounded-md border border-gray-300 p-0"
                                />
                                <input
                                  type="text"
                                  value={variant.colorName}
                                  onChange={(e) => handleVariantChange(variantIndex, 'colorName', e.target.value)}
                                  placeholder="Color name (e.g. Black, Red)"
                                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                                />
                              </div>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Variant Price (Optional)
                              </label>
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                  <span className="text-gray-500">GH₵</span>
                                </div>
                                <input
                                  type="number"
                                  value={variant.price}
                                  onChange={(e) => handleVariantChange(variantIndex, 'price', e.target.value)}
                                  placeholder="Leave empty to use base price"
                                  className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                                  step="any"
                                />
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <label className="block text-sm font-medium text-gray-700">
                                Variant Images <span className="text-red-500">*</span>
                              </label>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addVariantImage(variantIndex);
                                }}
                                className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-xs"
                              >
                                + Add Image
                              </button>
                            </div>
                            
                            <div className="space-y-3">
                              {variant.additionalImages.map((image, imageIndex) => (
                                <div key={imageIndex} className="flex gap-2">
                                  <div className="flex-1 flex items-center gap-3 px-4 py-2 border border-gray-300 rounded-md bg-white">
                                    {image ? (
                                      <img 
                                        src={image}
                                        alt={`Variant ${variantIndex + 1} image ${imageIndex + 1}`}
                                        className="h-10 w-10 object-cover rounded"
                                        onError={(e) => {
                                          e.target.onerror = null;
                                          e.target.src = 'https://via.placeholder.com/40?text=Error';
                                        }}
                                      />
                                    ) : (
                                      <div className="h-10 w-10 bg-gray-100 flex items-center justify-center rounded">
                                        <FaImage className="text-gray-400" />
                                      </div>
                                    )}
                                    <input
                                      type="text"
                                      value={image}
                                      onChange={(e) => handleVariantImageChange(variantIndex, imageIndex, e.target.value)}
                                      placeholder="Enter image URL"
                                      className="flex-1 border-0 focus:ring-0 p-0"
                                    />
                                  </div>
                                  {variant.additionalImages.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeVariantImage(variantIndex, imageIndex);
                                      }}
                                      className="px-2 py-2 bg-red-50 text-red-500 rounded-md hover:bg-red-100"
                                    >
                                      <FaTimes />
                                    </button>
                                  )}
                                </div>
                              ))}
                              <p className="text-xs text-gray-500">
                                The first image will be used as the main product image for this color variant
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3 mt-8 pt-4 border-t relative">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditProductClose();
                      }}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <div className="relative" style={{ zIndex: 50, position: "relative" }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateProduct();
                        }}
                        className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 cursor-pointer"
                        style={{ pointerEvents: "auto" }}
                      >
                        Update Product
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
        
        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
              <div className="mb-4">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <FaTrash className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 text-center">Delete Product</h3>
                <p className="text-gray-500 text-center mt-2">
                  Are you sure you want to delete <span className="font-medium">{productToDelete?.name}</span>? This action cannot be undone.
                </p>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteProduct}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
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

export default ProductsPage; 