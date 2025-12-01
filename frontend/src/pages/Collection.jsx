import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaLongArrowAltRight } from 'react-icons/fa';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useCollectionsStore } from '../store/collectionsStore';
import { useProductStore } from '../store/productStore';
import CustomerSupportChat from '../components/CustomerSupportChat';
import SEO from '../components/SEO';
import axios from 'axios';
import apiConfig from '../config/apiConfig';
import SinosplyLoader from '../components/ui/SinosplyLoader';

const Collection = () => {
  const { collectionId } = useParams();
  const navigate = useNavigate();
  const { getCollectionById, collections, fetchCollectionsFromAPI } = useCollectionsStore();
  const { products, fetchProductsFromAPI } = useProductStore();
  
  // States
  const [collection, setCollection] = useState(null);
  const [collectionProducts, setCollectionProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVariants, setSelectedVariants] = useState({});
  
  // SEO data
  const [seoData, setSeoData] = useState({
    title: "Collection | Sinosply",
    description: "Explore our curated collection of fashion items.",
    image: null,
    type: "website"
  });

  // Load collection and products
  useEffect(() => {
    const loadCollectionData = async () => {
      setLoading(true);
      console.log(`[Collection] Loading collection with ID: ${collectionId}`);
      
      try {
        // First try to get collection from store
        let currentCollection = getCollectionById(collectionId);
        
        // If not in store, fetch from API directly
        if (!currentCollection) {
          console.log(`[Collection] Collection not found in store, fetching from API`);
          
          try {
            const response = await axios.get(`${apiConfig.baseURL}/collections/${collectionId}`);
            if (response.data.success) {
              currentCollection = response.data.data;
              console.log(`[Collection] Successfully fetched collection: ${currentCollection.name}`);
            } else {
              throw new Error('Collection not found');
            }
          } catch (err) {
            console.error(`[Collection] API error:`, err);
            setError('Collection not found');
            setLoading(false);
            return;
          }
        }
        
        // Set the collection
        setCollection(currentCollection);
        
        // Update SEO data
        setSeoData({
          title: `${currentCollection.name} | Sinosply`,
          description: currentCollection.description || `Explore our ${currentCollection.name} collection.`,
          image: currentCollection.image || null,
          type: "website"
        });
        
        // Make sure we have products loaded
        if (products.length === 0) {
          console.log(`[Collection] No products in store, fetching products`);
          await fetchProductsFromAPI();
        }
        
        // Check if products are already populated in the collection data
        const areProductsPopulated = currentCollection.products && 
                                     currentCollection.products.length > 0 && 
                                     typeof currentCollection.products[0] === 'object' && 
                                     currentCollection.products[0] !== null &&
                                     currentCollection.products[0]._id;

        let finalProducts = [];
        if (areProductsPopulated) {
          console.log(`[Collection] Products are already populated in collection data.`);
          finalProducts = currentCollection.products;
        } else {
          // Fallback to existing logic if products are not populated
          console.log(`[Collection] Products not populated, matching from product store.`);
          
          const collectionProductIds = Array.isArray(currentCollection.products) ? 
            currentCollection.products.map(p => typeof p === 'object' ? p._id : p) : 
            [];
            
          console.log(`[Collection] Collection has ${collectionProductIds.length} associated product IDs`);
          
          finalProducts = products.filter(product => 
            collectionProductIds.includes(product._id)
          );
        }
        
        console.log(`[Collection] Found ${finalProducts.length} matching products`);
        setCollectionProducts(finalProducts);
        
        // Initialize selected variants
        const initialVariants = {};
        finalProducts.forEach(product => {
          initialVariants[product._id] = 0;
        });
        setSelectedVariants(initialVariants);
        
      } catch (err) {
        console.error(`[Collection] Error loading collection data:`, err);
        setError('Error loading collection data');
      } finally {
        setLoading(false);
      }
    };
    
    loadCollectionData();
  }, [collectionId, getCollectionById, products, fetchProductsFromAPI]);

  // Handle color variant selection
  const handleColorSelect = (productId, variantIndex) => {
    setSelectedVariants(prev => ({
      ...prev,
      [productId]: variantIndex
    }));
  };

  // Get product image based on selected variant
  const getProductImage = (product) => {
    if (!product) return null;
    
    const variantIndex = selectedVariants[product._id] || 0;
    const variant = product.variants?.[variantIndex];
    
    // Try to get the best image available
    return variant?.additionalImages?.[0] || 
           variant?.image ||
           product.image ||
           `https://via.placeholder.com/400x500?text=${encodeURIComponent(product.name || 'Product')}`;
  };

  // Handle product click
  const handleProductClick = (product) => {
    const variantIndex = selectedVariants[product._id] || 0;
    navigate(`/product/${product._id}`, { 
      state: { productId: product._id, variantIndex } 
    });
  };
  
  // Render loading state
  if (loading) {
    return <SinosplyLoader />;
  }
  
  // Render error state
  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">{error}</h1>
          <p className="text-lg text-gray-600 mb-8">The collection you're looking for could not be found.</p>
          <Link 
            to="/sinosply-store"
            className="inline-flex items-center px-6 py-3 border-2 border-black hover:bg-black hover:text-white transition-colors duration-300 font-medium"
          >
            Return Home <FaLongArrowAltRight className="ml-2" />
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <SEO {...seoData} />
      <Navbar />

      {/* Collection Banner */}
      <div className="relative w-full h-[50vh] bg-gray-100 overflow-hidden">
        {/* Back Button */}
        <Link 
          to="/sinosply-store" 
          className="absolute top-6 left-6 z-20 bg-white hover:bg-gray-100 text-black p-3 rounded-full shadow-lg transition-all duration-200"
          aria-label="Back to home"
        >
          <FaArrowLeft className="text-lg" />
        </Link>
        
        {collection?.image ? (
          <div className="w-full h-full">
            <img 
              src={collection.image}
              alt={collection.name}
              className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
              onError={(e) => {
                console.log(`[Collection] Failed to load collection banner image`);
                e.target.onerror = null;
                e.target.src = `https://via.placeholder.com/1600x800?text=${encodeURIComponent(collection.name || 'Collection')}`;
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          </div>
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <h1 className="text-3xl text-gray-400 font-light">No Image Available</h1>
          </div>
        )}
        
        <div className="absolute inset-0 flex flex-col justify-end items-center text-center pb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 px-6">{collection?.name || 'Collection'}</h1>
          <p className="text-white text-lg max-w-3xl mx-auto px-6">
            {collection?.description || 'Explore our collection of curated products'}
          </p>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Products</h2>
          <p className="text-gray-600">
            {collectionProducts.length} {collectionProducts.length === 1 ? 'product' : 'products'} in this collection
          </p>
        </div>

        {collectionProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {collectionProducts.map((product) => {
              const variantIndex = selectedVariants[product._id] || 0;
              const variants = product.variants || [];
              const selectedVariant = variants[variantIndex];
              
              // Determine image to display with proper fallbacks
              const imageToUse = getProductImage(product);
              
              return (
                <div 
                  key={product._id} 
                  className="border rounded-lg overflow-hidden hover:shadow-md transition duration-300 cursor-pointer"
                  onClick={() => handleProductClick(product)}
                >
                  <div className="relative">
                    <div className="aspect-[3/4] overflow-hidden">
                      <img
                        src={imageToUse}
                        alt={product.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          console.log(`[Collection] Failed to load product image for ${product.name}`);
                          e.target.onerror = null;
                          e.target.src = `https://via.placeholder.com/400x500?text=${encodeURIComponent(product.name || 'Product')}`;
                        }}
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-base font-medium text-gray-900 truncate">{product.name}</h3>
                      <p className="mt-1 text-sm text-gray-700">
                        {product.salePrice > 0 ? (
                          <>
                            <span className="line-through mr-2">GH₵{product.basePrice?.toFixed(2)}</span>
                            <span className="text-red-600">GH₵{product.salePrice?.toFixed(2)}</span>
                          </>
                        ) : (
                          `GH₵${product.basePrice?.toFixed(2) || '0.00'}`
                        )}
                      </p>
                      
                      {/* Variant color selection */}
                      {variants.length > 0 && (
                        <div className="mt-3 flex gap-1">
                          {variants.map((variant, index) => (
                            <button
                              key={index}
                              className={`w-5 h-5 rounded-full border ${
                                variantIndex === index ? 'ring-2 ring-black ring-offset-1' : 'border-gray-300'
                              }`}
                              style={{ backgroundColor: variant.color || "#000000" }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleColorSelect(product._id, index);
                              }}
                              aria-label={`Select ${variant.color || 'color'} variant`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500 mb-8 max-w-md">
              This collection doesn't have any products yet. Check back later or explore our other collections.
            </p>
            <Link
              to="/collections"
              className="inline-flex items-center px-6 py-3 border-2 border-black hover:bg-black hover:text-white transition-colors duration-300 font-medium"
            >
              Explore Collections <FaLongArrowAltRight className="ml-2" />
            </Link>
          </div>
        )}
      </div>

      <Footer />
      <CustomerSupportChat />
    </div>
  );
};

export default Collection; 