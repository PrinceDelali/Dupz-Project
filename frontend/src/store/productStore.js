import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiConfig from '../config/apiConfig';
import axios from 'axios';
import { getCachedData, setCachedData } from '../utils/cacheManager';

// Change from process.env to import.meta.env for Vite
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const useProductStore = create(
  persist(
    (set, get) => ({
      products: [], // All products
      featuredProducts: [], // Products marked as featured
      sampleProducts: [], // Products marked as sample
      categories: [], // Available product categories
      filteredProducts: [], // Products filtered by category or search
      platformProducts: {}, // Products organized by platform ID
      loading: false, // Loading state
      error: null,
      lastFetched: null,
      
      // Set all products
      setProducts: (products) => {
        set({ products });
        
        // Update derived state
        const featuredProducts = products.filter(p => p.isFeatured === true);
        const sampleProducts = products.filter(p => p.isSample === true);
        
        console.log(`ProductStore: Products loaded - ${products.length} total`);
        console.log(`ProductStore: ${featuredProducts.length} featured products`);
        console.log(`ProductStore: ${sampleProducts.length} sample products`);
        
        const categories = [...new Set(products.map(p => p.category))];
        
        // Organize products by platform
        const platformProducts = {};
        products.forEach(product => {
          if (product.platformId) {
            if (!platformProducts[product.platformId]) {
              platformProducts[product.platformId] = [];
            }
            platformProducts[product.platformId].push(product);
          }
        });
        
        set({ 
          featuredProducts,
          sampleProducts,
          categories,
          platformProducts
        });
      },
      
      // Add a single product
      addProduct: (product) => {
        const products = get().products;
        const platformProducts = get().platformProducts;
        
        // Check if product already exists
        const exists = products.some(p => p._id === product._id);
        
        // Log shipping data
        console.log(`📦 ProductStore: Product shipping data for "${product.name}":`, {
          airShippingPrice: product.airShippingPrice || 0,
          airShippingDuration: product.airShippingDuration || 0,
          seaShippingPrice: product.seaShippingPrice || 0,
          seaShippingDuration: product.seaShippingDuration || 0
        });
        
        if (exists) {
          // Update existing product
          const updatedProducts = products.map(p => 
            p._id === product._id ? product : p
          );
          set({ products: updatedProducts });
          console.log(`📝 ProductStore: Updated product: ${product.name} (ID: ${product._id})`);
        } else {
          // Add new product
          set({ products: [product, ...products] });
          console.log(`➕ ProductStore: Added new product: ${product.name} (ID: ${product._id})`);
        }
        
        // Update derived state
        const allProducts = exists 
          ? products.map(p => p._id === product._id ? product : p)
          : [product, ...products];
          
        const featuredProducts = allProducts.filter(p => p.isFeatured === true);
        const sampleProducts = allProducts.filter(p => p.isSample === true);
        const categories = [...new Set(allProducts.map(p => p.category))];
        
        // Update platform products mapping
        const updatedPlatformProducts = { ...platformProducts };
        
        // Handle old platform association removal
        if (exists) {
          // Find product's previous platform if it exists
          const oldProduct = products.find(p => p._id === product._id);
          if (oldProduct && oldProduct.platformId && oldProduct.platformId !== product.platformId) {
            // Remove from old platform's product list
            if (updatedPlatformProducts[oldProduct.platformId]) {
              updatedPlatformProducts[oldProduct.platformId] = updatedPlatformProducts[oldProduct.platformId]
                .filter(p => p._id !== product._id);
            }
          }
        }
        
        // Add or update in new platform's product list
        if (product.platformId) {
          if (!updatedPlatformProducts[product.platformId]) {
            updatedPlatformProducts[product.platformId] = [];
          }
          
          // Check if product already exists in platform list
          const platformProductIndex = updatedPlatformProducts[product.platformId]
            .findIndex(p => p._id === product._id);
            
          if (platformProductIndex >= 0) {
            // Update existing product in platform list
            updatedPlatformProducts[product.platformId][platformProductIndex] = product;
          } else {
            // Add new product to platform list
            updatedPlatformProducts[product.platformId].push(product);
          }
          
          console.log(`🔄 ProductStore: Associated product "${product.name}" with platform ID: ${product.platformId}`);
        }
        
        // Log featured product status
        if (product.isFeatured === true) {
          console.log(`⭐ ProductStore: Product "${product.name}" is marked as featured`);
        }
        
        // Log sample product status
        if (product.isSample === true) {
          console.log(`🔍 ProductStore: Product "${product.name}" is marked as sample`);
        }
        
        console.log(`✨ ProductStore: Total featured products: ${featuredProducts.length}`);
        console.log(`✨ ProductStore: Total sample products: ${sampleProducts.length}`);
        
        set({ 
          featuredProducts,
          sampleProducts,
          categories,
          platformProducts: updatedPlatformProducts
        });
      },
      
      // Get all products
      getProducts: () => get().products,
      
      // Get featured products
      getFeaturedProducts: () => get().featuredProducts,
      
      // Get sample products
      getSampleProducts: () => get().sampleProducts,
      
      // Get product by ID
      getProductById: (id) => {
        const products = get().products;
        return products.find(p => p._id === id);
      },
      
      // Get product by slug
      getProductBySlug: (slug) => {
        const products = get().products;
        return products.find(p => p.slug === slug);
      },
      
      // Get products by platform ID
      getProductsByPlatform: (platformId) => {
        if (!platformId) return [];
        
        const platformProducts = get().platformProducts;
        return platformProducts[platformId] || [];
      },
      
      // Filter products by category
      filterByCategory: (category) => {
        const products = get().products;
        console.log(`🔍 ProductStore: Filtering ${products.length} products by category: "${category}"`);
        
        const filtered = category === 'all' 
          ? products 
          : products.filter(p => p.category === category);
        
        console.log(`🔍 ProductStore: Found ${filtered.length} products in category "${category}"`);
        set({ filteredProducts: filtered });
        return filtered;
      },

      
      // Filter products by platform
      filterByPlatform: (platformId) => {
        if (!platformId) {
          set({ filteredProducts: get().products });
          return get().products;
        }
        
        console.log(`🔍 ProductStore: Filtering products by platform ID: "${platformId}"`);
        const filtered = get().products.filter(p => p.platformId === platformId);
        console.log(`🔍 ProductStore: Found ${filtered.length} products for platform "${platformId}"`);
        
        set({ filteredProducts: filtered });
        return filtered;
      },
      
      // Search products
      searchProducts: (query) => {
        if (!query || query.trim() === '') {
          set({ filteredProducts: get().products });
          return get().products;
        }
        
        const products = get().products;
        const searchTerms = query.toLowerCase().split(' ');
        
        const filtered = products.filter(product => {
          const searchableText = `
            ${product.name} 
            ${product.description} 
            ${product.category} 
            ${product.details?.join(' ') || ''}
            ${product.variants?.map(v => v.colorName).join(' ') || ''}
            ${product.platformId ? `platform ${product.platformId}` : ''}
            price ${product.basePrice} 
            ${product.salePrice ? 'sale ' + product.salePrice : ''}
            stock ${product.stock}
            quantity ${product.stock}
            ${product.stock === 0 ? 'out of stock' : 'in stock'}
          `.toLowerCase();
          
          return searchTerms.every(term => searchableText.includes(term));
        });
        
        set({ filteredProducts: filtered });
        return filtered;
      },
      
      // Get categories
      getCategories: () => get().categories,
      
      // Remove a product
      removeProduct: (id) => {
        const products = get().products;
        const platformProducts = get().platformProducts;
        const productToRemove = products.find(p => p._id === id);
        const updatedProducts = products.filter(p => p._id !== id);
        
        // Update platform products mapping if needed
        const updatedPlatformProducts = { ...platformProducts };
        if (productToRemove && productToRemove.platformId && updatedPlatformProducts[productToRemove.platformId]) {
          updatedPlatformProducts[productToRemove.platformId] = updatedPlatformProducts[productToRemove.platformId]
            .filter(p => p._id !== id);
            
          console.log(`🔄 ProductStore: Removed product ${id} from platform ${productToRemove.platformId}`);
        }
        
        set({ 
          products: updatedProducts,
          platformProducts: updatedPlatformProducts 
        });
        
        // Update derived state
        const featuredProducts = updatedProducts.filter(p => p.isFeatured === true);
        const sampleProducts = updatedProducts.filter(p => p.isSample === true);
        const categories = [...new Set(updatedProducts.map(p => p.category))];
        
        set({ 
          featuredProducts,
          sampleProducts,
          categories
        });
      },
      
      // Clear all products
      clearProducts: () => set({ 
        products: [],
        featuredProducts: [],
        sampleProducts: [],
        categories: [],
        filteredProducts: [],
        platformProducts: {}
      }),
      
      // Clear all products from API and store
      clearAllProductsFromAPI: async () => {
        try {
          set({ loading: true });
          console.log('🧹 ProductStore: Clearing all products from database');
          
          const token = localStorage.getItem('token');
          
          if (!token) {
            console.error('❌ ProductStore: Authentication error - No token found');
            set({ loading: false });
            return { success: false, error: 'Authentication error: No token found' };
          }
          
          const response = await fetch(`${apiConfig.baseURL}/products/clear-all`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          
          const data = await response.json();
          
          if (data.success) {
            console.log('✅ ProductStore: Successfully cleared all products from database');
            
            // Clear local store
            get().clearProducts();
            
            // Also clear from localStorage
            localStorage.removeItem('sinosply-product-storage');
            
            set({ loading: false });
            return { success: true };
          } else {
            console.error('❌ ProductStore: Failed to clear products from database', data);
            set({ loading: false });
            return { success: false, error: data.error || 'Failed to clear products' };
          }
        } catch (error) {
          console.error('❌ ProductStore: Error clearing products:', error);
          set({ loading: false });
          return { success: false, error: error.message || 'An error occurred' };
        }
      },
      
      // Update product stock levels after an order is placed
      updateStockAfterOrder: (orderedItems) => {
        if (!orderedItems || !orderedItems.length) return;
        
        console.log('Updating local product stock levels after order');
        
        const products = get().products;
        const updatedProducts = [...products];
        let stockUpdated = false;
        
        // Process each ordered item
        orderedItems.forEach(item => {
          const productId = item.productId || item.id;
          const quantity = parseInt(item.quantity) || 1;
          
          if (!productId) {
            console.warn('No product ID found for item:', item.name);
            return;
          }
          
          // Find product and update stock
          const index = updatedProducts.findIndex(p => p._id === productId);
          
          if (index !== -1) {
            const product = updatedProducts[index];
            const currentStock = product.stock || 0;
            const newStock = Math.max(0, currentStock - quantity); // Prevent negative stock
            
            // Update product stock in local store
            updatedProducts[index] = {
              ...product,
              stock: newStock
            };
            
            console.log(`Local stock updated for ${product.name}: ${currentStock} → ${newStock}`);
            stockUpdated = true;
          }
        });
        
        // Only update state if any products were actually updated
        if (stockUpdated) {
          set({ products: updatedProducts });
          
          // Update derived state
          const featuredProducts = updatedProducts.filter(p => p.isFeatured === true);
          const sampleProducts = updatedProducts.filter(p => p.isSample === true);
          set({ featuredProducts, sampleProducts });
          
          // Re-organize products by platform
          const platformProducts = {};
          updatedProducts.forEach(product => {
            if (product.platformId) {
              if (!platformProducts[product.platformId]) {
                platformProducts[product.platformId] = [];
              }
              platformProducts[product.platformId].push(product);
            }
          });
          
          set({ platformProducts });
        }
      },
      
      // Fetch products from API
      fetchProductsFromAPI: async () => {
        try {
          set({ loading: true });

          // First check if we have cached products data
          const cachedProducts = getCachedData('products');
          if (cachedProducts) {
            console.log('[ProductStore] Using cached products data');
            set({ 
              products: cachedProducts,
              loading: false,
              lastFetched: new Date().getTime()
            });
            return cachedProducts;
          }
          
          // If no cache, fetch from API
          const response = await axios.get(`${API_URL}/products`);
          
          if (response.data.success && Array.isArray(response.data.data)) {
            console.log('[ProductStore] Successfully fetched products from API');
            const productsData = response.data.data;
            
            // Cache the products data
            setCachedData('products', productsData);
            
            set({ 
              products: productsData,
              loading: false,
              lastFetched: new Date().getTime()
            });
            return productsData;
          } else {
            console.error('[ProductStore] Failed to fetch products:', response.data.message || 'Unknown error');
            set({ error: response.data.message || 'Failed to fetch products', loading: false });
            return [];
          }
        } catch (error) {
          console.error('[ProductStore] Error fetching products:', error);
          set({ error: error.message, loading: false });
          return [];
        }
      },
      
      // Get products by category without affecting state
      getProductsByCategory: (category) => {
        console.log(`🔍 ProductStore: Getting products by category: "${category}"`);
        const products = get().products;
        
        if (category === 'all') {
          console.log(`🔍 ProductStore: Returning all ${products.length} products`);
          return products;
        }
        
        // Make the comparison case-insensitive
        const uppercaseCategory = category.toUpperCase();
        const categoryProducts = products.filter(p => 
          p.category && p.category.toUpperCase() === uppercaseCategory
        );
        console.log(`🔍 ProductStore: Found ${categoryProducts.length} products in category "${category}"`);
        
        return categoryProducts;
      },
      
      // Get products by both platform and category
      getProductsByPlatformAndCategory: (platformId, category) => {
        if (!platformId && (!category || category === 'all')) {
          return get().products;
        }
        
        const products = get().products;
        return products.filter(product => {
          const matchesPlatform = !platformId || product.platformId === platformId;
          const matchesCategory = !category || category === 'all' || product.category === category;
          return matchesPlatform && matchesCategory;
        });
      },
      
      // Fetch only featured products from API
      fetchFeaturedProducts: async () => {
        try {
          set({ loading: true });

          // First check if we have cached featured products data
          const cachedFeaturedProducts = getCachedData('featured_products');
          if (cachedFeaturedProducts) {
            console.log('[ProductStore] Using cached featured products data');
            set({ 
              featuredProducts: cachedFeaturedProducts,
              loading: false
            });
            return cachedFeaturedProducts;
          }
          
          // Check if we have products in store already
          const { products } = get();
          if (products && products.length > 0) {
            const featured = products.filter(product => product.isFeatured);
            if (featured.length > 0) {
              console.log('[ProductStore] Using featured products from store');
              
              // Cache the featured products
              setCachedData('featured_products', featured);
              
              set({ featuredProducts: featured, loading: false });
              return featured;
            }
          }
          
          // If no cached data and no products in store, fetch from API
          const response = await axios.get(`${API_URL}/products?featured=true`);
          
          if (response.data.success && Array.isArray(response.data.data)) {
            const featuredData = response.data.data;
            console.log('[ProductStore] Successfully fetched featured products from API');
            
            // Cache the featured products
            setCachedData('featured_products', featuredData);
            
            set({ featuredProducts: featuredData, loading: false });
            return featuredData;
          } else {
            console.error('[ProductStore] Failed to fetch featured products:', response.data.message || 'Unknown error');
            set({ error: response.data.message || 'Failed to fetch featured products', loading: false });
            return [];
          }
        } catch (error) {
          console.error('[ProductStore] Error fetching featured products:', error);
          set({ error: error.message, loading: false });
          return [];
        }
      },
      
      // Fetch only sample products from API
      fetchSampleProducts: async () => {
        set({ loading: true });
        console.log('🔍 ProductStore: Fetching sample products from API');
        
        try {
          const response = await fetch(`${apiConfig.baseURL}/products?isSample=true&limit=6`);
          const data = await response.json();
          
          if (data.success) {
            console.log(`✅ ProductStore: Successfully fetched ${data.data.length} sample products from API`);
            
            // Ensure we only get products marked as sample
            const sampleProductsOnly = data.data.filter(product => product.isSample === true);
            
            // Update sample products in store
            set({ sampleProducts: sampleProductsOnly, loading: false });
            
            // Log sample products
            sampleProductsOnly.forEach(p => {
              console.log(`  - Sample: ${p.name} (ID: ${p._id})`);
              console.log(`    Image: ${p.variants?.[0]?.additionalImages?.[0] || 'No image'}`);
            });
            
            return sampleProductsOnly;
          } else {
            console.error('❌ ProductStore: API request for sample products failed', data);
            set({ loading: false });
            return [];
          }
        } catch (error) {
          console.error('❌ ProductStore: Error fetching sample products:', error);
          set({ loading: false });
          return [];
        }
      },
      
      // Reset the store state
      resetState: () => {
        set({
          products: [],
          featuredProducts: [],
          sampleProducts: [],
          productDetails: null,
          loading: false,
          error: null,
          lastFetched: null
        });
      },
      
      // Check if stored products data is stale (older than 1 hour)
      isDataStale: () => {
        const { lastFetched } = get();
        if (!lastFetched) return true;
        
        const now = new Date().getTime();
        const oneHour = 60 * 60 * 1000; // ms
        return (now - lastFetched) > oneHour;
      },
      
      // Fetch trending products
      fetchTrendingProducts: async () => {
        try {
          set({ loading: true });

          // First check if we have cached trending products data
          const cachedTrendingProducts = getCachedData('trending_products');
          if (cachedTrendingProducts) {
            console.log('[ProductStore] Using cached trending products data');
            set({ 
              trendingProducts: cachedTrendingProducts,
              loading: false
            });
            return cachedTrendingProducts;
          }
          
          // If no cached data, fetch from API
          const response = await axios.get(`${API_URL}/products/trending`);
          
          if (response.data.success && Array.isArray(response.data.products)) {
            const trendingData = response.data.products;
            console.log('[ProductStore] Successfully fetched trending products');
            
            // Cache the trending products
            setCachedData('trending_products', trendingData);
            
            set({ trendingProducts: trendingData, loading: false });
            return trendingData;
          } else {
            console.error('[ProductStore] Failed to fetch trending products:', response.data.message || 'Unknown error');
            set({ error: response.data.message || 'Failed to fetch trending products', loading: false });
            return [];
          }
        } catch (error) {
          console.error('[ProductStore] Error fetching trending products:', error);
          set({ error: error.message, loading: false });
          return [];
        }
      },
      
      // Fetch a single product by ID
      fetchProductById: async (productId) => {
        try {
          set({ loading: true });

          // First check if we have cached product details
          const cachedProductDetails = getCachedData(`product_${productId}`);
          if (cachedProductDetails) {
            console.log(`[ProductStore] Using cached details for product ${productId}`);
            set({ 
              productDetails: cachedProductDetails,
              loading: false
            });
            return cachedProductDetails;
          }
          
          // Check if product exists in current products array
          const { products } = get();
          const existingProduct = products.find(p => p._id === productId || p.id === productId);
          if (existingProduct) {
            console.log(`[ProductStore] Using existing product details for ${productId} from store`);
            
            // Cache the product details
            setCachedData(`product_${productId}`, existingProduct);
            
            set({ productDetails: existingProduct, loading: false });
            return existingProduct;
          }
          
          // If product not in cache or store, fetch from API
          const response = await axios.get(`${API_URL}/products/${productId}`);
          
          if (response.data.success && response.data.product) {
            const productData = response.data.product;
            console.log(`[ProductStore] Successfully fetched product ${productId}`);
            
            // Cache the product details
            setCachedData(`product_${productId}`, productData);
            
            set({ productDetails: productData, loading: false });
            return productData;
          } else {
            console.error(`[ProductStore] Failed to fetch product ${productId}:`, response.data.message || 'Unknown error');
            set({ error: response.data.message || 'Failed to fetch product', loading: false });
            return null;
          }
        } catch (error) {
          console.error(`[ProductStore] Error fetching product ${productId}:`, error);
          set({ error: error.message, loading: false });
          return null;
        }
      },
      
      // Update product in the store
      updateProduct: (productId, updatedData) => {
        const { products, featuredProducts, trendingProducts } = get();
        
        // Update in main products array
        const updatedProducts = products.map(product => 
          (product._id === productId || product.id === productId) 
            ? { ...product, ...updatedData } 
            : product
        );
        
        // Update in featured products if present
        const updatedFeatured = featuredProducts.map(product =>
          (product._id === productId || product.id === productId)
            ? { ...product, ...updatedData }
            : product
        );
        
        // Update in trending products if present
        const updatedTrending = trendingProducts.map(product =>
          (product._id === productId || product.id === productId)
            ? { ...product, ...updatedData }
            : product
        );
        
        // Update the cache
        setCachedData('products', updatedProducts);
        setCachedData('featured_products', updatedFeatured);
        setCachedData('trending_products', updatedTrending);
        setCachedData(`product_${productId}`, { ...get().productDetails, ...updatedData });
        
        set({ 
          products: updatedProducts,
          featuredProducts: updatedFeatured,
          trendingProducts: updatedTrending,
          productDetails: get().productDetails?._id === productId 
            ? { ...get().productDetails, ...updatedData } 
            : get().productDetails
        });
      },
      
      // Delete product from the store
      deleteProduct: (productId) => {
        const { products, featuredProducts, trendingProducts } = get();
        
        const updatedProducts = products.filter(product => 
          product._id !== productId && product.id !== productId
        );
        
        const updatedFeatured = featuredProducts.filter(product =>
          product._id !== productId && product.id !== productId
        );
        
        const updatedTrending = trendingProducts.filter(product =>
          product._id !== productId && product.id !== productId
        );
        
        // Update the cache
        setCachedData('products', updatedProducts);
        setCachedData('featured_products', updatedFeatured);
        setCachedData('trending_products', updatedTrending);
        
        set({
          products: updatedProducts,
          featuredProducts: updatedFeatured,
          trendingProducts: updatedTrending,
          productDetails: get().productDetails?._id === productId ? null : get().productDetails
        });
      }
    }),
    {
      name: 'sinosply-product-storage',
      partialize: (state) => ({ 
        products: state.products,
        categories: state.categories
      })
    }
  )
); 