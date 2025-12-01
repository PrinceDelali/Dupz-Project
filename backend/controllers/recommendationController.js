import Product from '../models/Product.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API with API key from environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Get AI-powered product recommendations using Google's Gemini API
 * @route POST /api/recommendations/gemini
 * @access Public
 */
export const getGeminiRecommendations = async (req, res) => {
  try {
    const { currentProduct, userPreferences, limit = 4 } = req.body;
    
    // Validate input
    if (!currentProduct || !currentProduct.id) {
      return res.status(400).json({
        success: false,
        error: 'Current product information is required'
      });
    }
    
    // Get full product details from database
    const product = await Product.findById(currentProduct.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    // Get potential recommendation products (same category + some others)
    const potentialProducts = await Product.find({
      _id: { $ne: currentProduct.id },
      $or: [
        { category: product.category },
        { isFeatured: true }
      ]
    }).limit(20);
    
    if (potentialProducts.length === 0) {
      return res.status(200).json({
        success: true,
        recommendations: []
      });
    }
    
    // If Gemini API key is not configured, fall back to category-based recommendations
    if (!process.env.GEMINI_API_KEY) {
      console.log('GEMINI_API_KEY not configured, falling back to category-based recommendations');
      
      const categoryRecommendations = potentialProducts
        .filter(p => p.category === product.category)
        .slice(0, limit);
        
      return res.status(200).json({
        success: true,
        recommendations: categoryRecommendations,
        source: 'category'
      });
    }
    
    // Prepare data for Gemini API
    const userContext = {
      searchHistory: userPreferences?.searchHistory || [],
      viewedProducts: (userPreferences?.viewedProducts || []).map(p => ({ 
        name: p.name,
        category: p.category
      })),
      categoryPreferences: userPreferences?.categoryPreferences || {},
      colorPreferences: userPreferences?.colorPreferences || {}
    };
    
    const productInfo = {
      id: product._id,
      name: product.name,
      category: product.category,
      description: product.description,
      price: product.basePrice,
      colors: product.variants?.map(v => v.colorName) || []
    };
    
    const potentialProductsData = potentialProducts.map(p => ({
      id: p._id.toString(),
      name: p.name,
      category: p.category,
      description: p.description?.substring(0, 100) || '',
      price: p.basePrice,
      colors: p.variants?.map(v => v.colorName) || [],
      isFeatured: p.isFeatured || false
    }));
    
    // Create prompt for Gemini
    const prompt = `
      You are an AI shopping assistant that recommends products to users based on their preferences and browsing history.
      
      Current product the user is viewing:
      ${JSON.stringify(productInfo)}
      
      User context:
      - Search history: ${JSON.stringify(userContext.searchHistory)}
      - Recently viewed products: ${JSON.stringify(userContext.viewedProducts)}
      - Category preferences: ${JSON.stringify(userContext.categoryPreferences)}
      - Color preferences: ${JSON.stringify(userContext.colorPreferences)}
      
      Available products for recommendation:
      ${JSON.stringify(potentialProductsData)}
      
      Please recommend ${limit} products that this user might be interested in based on the current product they're viewing and their preferences.
      Return your response as a JSON array of product IDs only, like this: ["id1", "id2", "id3", "id4"]
      Only include IDs from the available products list.
    `;
    
    // Call Gemini API
    try {
      // Get the gemini-pro model
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      
      // Generate content
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON array from response
      const jsonMatch = text.match(/\[.*\]/s);
      if (!jsonMatch) {
        throw new Error('Could not parse recommendation IDs from Gemini response');
      }
      
      // Parse the JSON array
      const recommendedIds = JSON.parse(jsonMatch[0]);
      
      // Validate IDs and get full product objects
      const recommendations = [];
      for (const id of recommendedIds) {
        const product = potentialProducts.find(p => p._id.toString() === id);
        if (product) {
          recommendations.push(product);
        }
      }
      
      // If we have fewer recommendations than requested, fill with category-based recommendations
      if (recommendations.length < limit) {
        const remainingCount = limit - recommendations.length;
        const existingIds = recommendations.map(p => p._id.toString());
        
        const additionalProducts = potentialProducts
          .filter(p => !existingIds.includes(p._id.toString()) && p.category === product.category)
          .slice(0, remainingCount);
          
        recommendations.push(...additionalProducts);
      }
      
      // Return recommendations
      return res.status(200).json({
        success: true,
        recommendations,
        source: 'ai'
      });
    } catch (aiError) {
      console.error('Error calling Gemini API:', aiError);
      
      // Fall back to category-based recommendations
      const categoryRecommendations = potentialProducts
        .filter(p => p.category === product.category)
        .slice(0, limit);
        
      return res.status(200).json({
        success: true,
        recommendations: categoryRecommendations,
        source: 'category'
      });
    }
  } catch (error) {
    console.error('Error in recommendation controller:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error generating recommendations'
    });
  }
}; 

 