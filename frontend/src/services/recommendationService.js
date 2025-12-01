import apiConfig from '../config/apiConfig';

/**
 * Service for handling AI-powered product recommendations
 */
class RecommendationService {
  /**
   * Get AI-powered similar product recommendations based on current product and user preferences
   * 
   * @param {Object} currentProduct - The product currently being viewed
   * @param {Array} allProducts - All available products to choose from
   * @param {Object} userPreferences - User preferences including search history and viewed products
   * @param {Number} limit - Maximum number of recommendations to return
   * @returns {Promise<Array>} - Array of recommended products
   */
  async getSimilarProductRecommendations(currentProduct, allProducts, userPreferences, limit = 4) {
    try {
      // First try to get AI-powered recommendations from the backend
      const aiRecommendations = await this.getAIRecommendations(
        currentProduct, 
        userPreferences,
        limit
      );
      
      // If AI recommendations are available, return them
      if (aiRecommendations && aiRecommendations.length > 0) {
        console.log('✨ Using AI-powered recommendations');
        
        // Ensure each recommendation has proper image URLs
        const processedRecommendations = aiRecommendations.map(rec => {
          // Find the complete product data from allProducts
          const fullProductData = allProducts.find(p => p._id === rec._id);
          
          if (fullProductData) {
            // Use the full product data but keep the source property
            return {
              ...fullProductData,
              source: rec.source
            };
          }
          
          // If we can't find the full product, ensure it has image data
          return {
            ...rec,
            image: this.extractBestImage(rec)
          };
        });
        
        return processedRecommendations;
      }
      
      // Fallback to local filtering if AI recommendations are not available
      console.log('⚠️ Falling back to local recommendation algorithm');
      return this.getLocalRecommendations(currentProduct, allProducts, userPreferences, limit);
    } catch (error) {
      console.error('Error getting recommendations:', error);
      // Fallback to local recommendations on error
      return this.getLocalRecommendations(currentProduct, allProducts, userPreferences, limit);
    }
  }
  
  /**
   * Get AI-powered recommendations from the backend Gemini API integration
   */
  async getAIRecommendations(currentProduct, userPreferences, limit) {
    try {
      // Prepare data for the AI recommendation request
      const requestData = {
        currentProduct: {
          id: currentProduct._id,
          name: currentProduct.name,
          category: currentProduct.category,
          description: currentProduct.description,
          price: currentProduct.basePrice,
          colors: currentProduct.variants?.map(v => v.colorName) || []
        },
        userPreferences: {
          searchHistory: userPreferences.searchHistory || [],
          viewedProducts: (userPreferences.viewedProducts || []).slice(0, 10).map(p => ({
            id: p._id,
            name: p.name,
            category: p.category
          })),
          categoryPreferences: userPreferences.categoryPreferences || {},
          colorPreferences: userPreferences.colorPreferences || {}
        },
        limit
      };
      
      // Call the backend API to get AI recommendations
      const response = await fetch(`${apiConfig.baseURL}/recommendations/gemini`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.recommendations) {
        // Process recommendations to ensure they have proper image URLs
        const processedRecommendations = data.recommendations.map(rec => ({
          ...rec,
          id: rec._id, // Ensure id is available in both formats
          image: this.extractBestImage(rec),
          source: data.source || 'ai'
        }));
        
        console.log('Processed recommendations:', processedRecommendations);
        return processedRecommendations;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching AI recommendations:', error);
      return [];
    }
  }
  
  /**
   * Get locally generated recommendations as a fallback
   */
  getLocalRecommendations(currentProduct, allProducts, userPreferences, limit) {
    if (!currentProduct || !allProducts || allProducts.length === 0) {
      return [];
    }
    
    // Filter out the current product
    const filteredProducts = allProducts.filter(p => p._id !== currentProduct._id);
    
    // Create a scoring system for products
    const scoredProducts = filteredProducts.map(product => {
      let score = 0;
      
      // Same category is a strong signal (highest priority)
      if (product.category === currentProduct.category) {
        score += 100;
      }
      
      // Check if the product matches user's top category preferences
      const topCategories = this.getTopValues(userPreferences.categoryPreferences || {}, 3);
      if (topCategories.includes(product.category)) {
        score += 50;
      }
      
      // Check if the product has similar price point (within 20%)
      const currentPrice = parseFloat(currentProduct.basePrice);
      const productPrice = parseFloat(product.basePrice);
      if (!isNaN(currentPrice) && !isNaN(productPrice)) {
        const priceDiff = Math.abs(currentPrice - productPrice) / currentPrice;
        if (priceDiff <= 0.2) { // Within 20%
          score += 30;
        }
      }
      
      // Check if the product has colors similar to user preferences
      const userColorPrefs = this.getTopValues(userPreferences.colorPreferences || {}, 5);
      if (product.variants && product.variants.length > 0) {
        for (const variant of product.variants) {
          if (variant.color && userColorPrefs.includes(variant.color)) {
            score += 20;
            break;
          }
        }
      }
      
      // Check if the product matches terms in user's search history
      if (userPreferences.searchHistory && userPreferences.searchHistory.length > 0) {
        const productText = `${product.name} ${product.description || ''} ${product.category || ''}`.toLowerCase();
        
        for (const searchTerm of userPreferences.searchHistory) {
          if (productText.includes(searchTerm.toLowerCase())) {
            score += 15;
            break;
          }
        }
      }
      
      return { 
        product: {
          ...product,
          id: product._id, // Ensure id is available in both formats
          image: this.extractBestImage(product)
        }, 
        score 
      };
    });
    
    // Sort by score (descending) and take the top N
    const recommendations = scoredProducts
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.product);
      
    // Add source property to indicate these are local recommendations
    recommendations.forEach(rec => {
      rec.source = 'local';
    });
    
    return recommendations;
  }
  
  /**
   * Helper function to get top N values from an object based on their values
   */
  getTopValues(obj, limit) {
    return Object.entries(obj)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(entry => entry[0]);
  }
  
  /**
   * Extract the best available image from a product
   */
  extractBestImage(product) {
    // Check for direct image property
    if (product.image) {
      return product.image;
    }
    
    // Check for variant images
    if (product.variants && product.variants.length > 0) {
      // Try to get the first variant's image
      if (product.variants[0].image) {
        return product.variants[0].image;
      }
      
      // Try to get the first image from the first variant's additionalImages
      if (product.variants[0].additionalImages && product.variants[0].additionalImages.length > 0) {
        return product.variants[0].additionalImages[0];
      }
    }
    
    // Return a placeholder if no image is found
    return `https://placehold.co/400x500?text=${encodeURIComponent(product.name || 'Product')}`;
  }
}

export default new RecommendationService(); 