import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Product from '../models/Product.js';

const router = express.Router();

// Configure Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * @route GET /api/search
 * @desc Search products, services and pages
 * @access Public
 */
router.get('/', async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    // Create a search regex pattern that's case insensitive
    const searchPattern = new RegExp(query, 'i');

    // Search products
    const products = await Product.find({
      $or: [
        { name: searchPattern },
        { description: searchPattern },
        { category: searchPattern },
        { 'tags.name': searchPattern }
      ]
    }).select('name description images category price'); // Select only necessary fields

    // Map products to standardized result format
    const productResults = products.map(product => ({
      id: product._id,
      title: product.name,
      description: product.description,
      type: 'product',
      category: product.category,
      image: product.images && product.images.length > 0 ? product.images[0] : null,
      price: product.price,
      url: `/product/${product._id}`
    }));

    // Define static pages to search (these could come from a database in a real application)
    const pages = [
      {
        id: 'home',
        title: 'Sinosply - Your China Sourcing Partner',
        description: 'We connect businesses with verified manufacturers in China for quality products at competitive prices.',
        content: 'Sinosply is your trusted partner for all your China sourcing needs. We offer end-to-end sourcing solutions, quality control, logistics services, and financial services to make importing from China simple and hassle-free.',
        type: 'page',
        url: '/',
      },
      {
        id: 'services',
        title: 'Sourcing Services',
        description: 'We connect you with verified manufacturers in China, ensuring quality products at competitive prices.',
        content: 'End-to-end solutions to simplify your China sourcing journey. Our core services include sourcing, quality control, shipping & logistics, and financial services. We specialize in matching your business needs with the right manufacturing partners, verifying quality standards, facilitating efficient shipping, and providing favorable payment terms.',
        type: 'page',
        url: '/services',
        image: 'https://images.unsplash.com/photo-1553413077-190dd305871c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&q=80'
      },
      {
        id: 'about',
        title: 'About Sinosply',
        description: 'Your trusted partner for China sourcing and global supply chain solutions',
        content: 'Founded in 2014, Sinosply began with a simple mission: to make sourcing from China accessible, transparent, and hassle-free for businesses of all sizes. We have a dedicated team of professionals with expertise in international trade, quality control, logistics, and supply chain management, ensuring that your sourcing journey is smooth and successful.',
        type: 'page',
        url: '/about',
        image: 'https://images.unsplash.com/photo-1607611439230-fcbf50e42f7c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80'
      },
      {
        id: 'contact',
        title: 'Contact Us',
        description: 'Get in touch with our team for sourcing solutions and inquiries',
        content: 'Contact us for any questions about sourcing from China, quality control, and supply chain management. Our expert team is ready to assist you with your sourcing needs. Reach out via phone, email, or through our contact form and we will get back to you within 24 hours.',
        type: 'page',
        url: '/sinosply-contact'
      },
      {
        id: 'quote',
        title: 'Request a Quote',
        description: 'Get personalized quotes for your product sourcing needs',
        content: 'Tell us what you\'re looking for and we\'ll connect you with the perfect suppliers from China. Submit your requirements including product details, quantity, target price, and timeline. Our team will review your request and provide detailed quotes from qualified manufacturers within 24 hours.',
        type: 'page',
        url: '/quote'
      },
      {
        id: 'products',
        title: 'Explore Our Products',
        description: 'Browse our extensive collection of products sourced directly from Chinese manufacturers',
        content: 'Discover high-quality products across multiple categories including furniture, electronics, home goods, textiles, and more. All our products are sourced directly from verified Chinese manufacturers and undergo strict quality control measures. Filter by category, price range, and manufacturer to find exactly what you need.',
        type: 'page',
        url: '/products'
      }
    ];

    // Search pages
    const pageResults = pages.filter(page => 
      page.title.match(searchPattern) || 
      page.description.match(searchPattern) || 
      page.content.match(searchPattern)
    ).map(({ content, ...page }) => page); // Remove content field from results

    // Combine all results
    const allResults = [...productResults, ...pageResults];

    res.json({ results: allResults });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Server error during search' });
  }
});

/**
 * @route GET /api/search/ai
 * @desc AI-powered search analysis using Gemini
 * @access Public
 */
router.get('/ai', async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    // Break down search query into individual keywords for more thorough matching
    const keywords = query.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    
    // Create regex patterns for each keyword and the full query
    const fullQueryPattern = new RegExp(query, 'i');
    const keywordPatterns = keywords.map(keyword => new RegExp(`\\b${keyword}\\b`, 'i'));

    // Get products matching any of the keywords or the full query
    const products = await Product.find({
      $or: [
        { name: fullQueryPattern },
        { description: fullQueryPattern },
        { category: fullQueryPattern },
        { 'tags.name': fullQueryPattern },
        ...keywordPatterns.map(pattern => ({ name: pattern })),
        ...keywordPatterns.map(pattern => ({ description: pattern })),
        ...keywordPatterns.map(pattern => ({ category: pattern })),
        ...keywordPatterns.map(pattern => ({ 'tags.name': pattern }))
      ]
    }).select('name description images category price tags specifications variants');
    
    // Score each product based on how many keywords it matches
    const scoredProducts = products.map(product => {
      let score = 0;
      const productText = `${product.name} ${product.description} ${product.category} ${(product.tags || []).map(t => t.name).join(' ')}`.toLowerCase();
      
      // Add points for each matching keyword
      keywords.forEach(keyword => {
        if (productText.includes(keyword)) score += 1;
      });
      
      // Add bonus points for full query match
      if (productText.includes(query.toLowerCase())) score += 3;
      
      return { product, score };
    });
    
    // Sort by score and take top results
    const topProducts = scoredProducts
      .sort((a, b) => b.score - a.score)
      .map(({ product }) => product);

    // Get static pages with expanded content
    const pages = [
      {
        id: 'home',
        title: 'Sinosply - Your China Sourcing Partner',
        description: 'We connect businesses with verified manufacturers in China for quality products at competitive prices.',
        content: 'Sinosply is your trusted partner for all your China sourcing needs. We offer end-to-end sourcing solutions, quality control, logistics services, and financial services to make importing from China simple and hassle-free. Our team has deep expertise in international trade and manufacturing, with an extensive network of verified Chinese suppliers across multiple industries.',
        keywords: ['sourcing', 'china', 'manufacturing', 'import', 'supplier', 'products', 'quality control', 'logistics'],
        type: 'page',
        url: '/',
      },
      {
        id: 'services',
        title: 'Sourcing Services',
        description: 'We connect you with verified manufacturers in China, ensuring quality products at competitive prices.',
        content: 'End-to-end solutions to simplify your China sourcing journey. Our core services include sourcing, quality control, shipping & logistics, and financial services. We specialize in matching your business needs with the right manufacturing partners, verifying quality standards, facilitating efficient shipping, and providing favorable payment terms. Our team conducts factory audits, sample evaluations, and production monitoring to ensure your products meet all specifications and quality standards.',
        keywords: ['sourcing', 'quality control', 'shipping', 'logistics', 'financial services', 'manufacturers', 'factory audits', 'production monitoring'],
        type: 'page',
        url: '/services',
      },
      {
        id: 'about',
        title: 'About Sinosply',
        description: 'Your trusted partner for China sourcing and global supply chain solutions',
        content: 'Founded in 2014, Sinosply began with a simple mission: to make sourcing from China accessible, transparent, and hassle-free for businesses of all sizes. We have a dedicated team of professionals with expertise in international trade, quality control, logistics, and supply chain management, ensuring that your sourcing journey is smooth and successful. Our offices in Guangzhou and Shanghai give us a strategic presence in China\'s manufacturing hubs, allowing us to build strong relationships with verified suppliers and monitor production on-site.',
        keywords: ['sinosply', 'china sourcing', 'supply chain', 'international trade', 'quality control', 'logistics', 'guangzhou', 'shanghai'],
        type: 'page',
        url: '/about',
      },
      {
        id: 'contact',
        title: 'Contact Us',
        description: 'Get in touch with our team for sourcing solutions and inquiries',
        content: 'Contact us for any questions about sourcing from China, quality control, and supply chain management. Our expert team is ready to assist you with your sourcing needs. Reach out via phone, email, or through our contact form and we will get back to you within 24 hours. We provide personalized consultation to understand your business requirements and offer tailored sourcing solutions that align with your goals and budget.',
        keywords: ['contact', 'sourcing', 'quality control', 'supply chain', 'email', 'phone', 'consultation', 'business requirements'],
        type: 'page',
        url: '/sinosply-contact'
      },
      {
        id: 'quote',
        title: 'Request a Quote',
        description: 'Get personalized quotes for your product sourcing needs',
        content: 'Tell us what you\'re looking for and we\'ll connect you with the perfect suppliers from China. Submit your requirements including product details, quantity, target price, and timeline. Our team will review your request and provide detailed quotes from qualified manufacturers within 24 hours. You can also upload specifications, drawings, or reference images to help us better understand your requirements and find the most suitable suppliers for your project.',
        keywords: ['quote', 'sourcing', 'suppliers', 'product details', 'quantity', 'price', 'timeline', 'manufacturers', 'specifications', 'drawings'],
        type: 'page',
        url: '/quote'
      },
      {
        id: 'products',
        title: 'Explore Our Products',
        description: 'Browse our extensive collection of products sourced directly from Chinese manufacturers',
        content: 'Discover high-quality products across multiple categories including furniture, electronics, home goods, textiles, and more. All our products are sourced directly from verified Chinese manufacturers and undergo strict quality control measures. Filter by category, price range, and manufacturer to find exactly what you need. Our product catalog is regularly updated with the latest items from our supplier network, featuring competitive pricing and detailed specifications to help you make informed purchasing decisions.',
        keywords: ['products', 'furniture', 'electronics', 'home goods', 'textiles', 'manufacturers', 'quality control', 'category', 'price', 'specifications'],
        type: 'page',
        url: '/products'
      }
    ];

    // Score each page based on how many keywords it matches
    const scoredPages = pages.map(page => {
      let score = 0;
      const pageText = `${page.title} ${page.description} ${page.content} ${(page.keywords || []).join(' ')}`.toLowerCase();
      
      // Check each keyword
      keywords.forEach(keyword => {
        if (pageText.includes(keyword)) score += 1;
      });
      
      // Add bonus points for full query match
      if (pageText.includes(query.toLowerCase())) score += 3;
      
      // Extra points if keywords are in title or dedicated keywords list
      keywords.forEach(keyword => {
        if (page.title.toLowerCase().includes(keyword)) score += 2;
        if (page.keywords && page.keywords.some(k => k.includes(keyword))) score += 1;
      });
      
      return { page, score };
    });
    
    // Get the highest scoring pages
    const matchingPages = scoredPages
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ page }) => page);

    // Combine all matching content for AI analysis
    const allContent = [
      ...topProducts.map(p => ({ 
        type: 'product', 
        title: p.name, 
        description: p.description,
        category: p.category,
        tags: p.tags?.map(t => t.name) || [],
        specifications: p.specifications || [],
        variants: (p.variants || []).map(v => v.name || '').filter(Boolean)
      })),
      ...matchingPages.map(p => ({ 
        type: 'page', 
        title: p.title, 
        description: p.description, 
        content: p.content,
        keywords: p.keywords || []
      }))
    ];

    // If we have no content to analyze, return a helpful message
    if (allContent.length === 0) {
      return res.json({
        summary: `I couldn't find any results matching "${query}" on Sinosply. Try adjusting your search terms or browse the product categories to find what you're looking for.`,
        analysis: [],
        relatedQueries: [
          'furniture', 
          'sourcing services', 
          'manufacturing', 
          'product sourcing',
          'china import',
          'quality control'
        ]
      });
    }

    // Configure Gemini model - using a more powerful model for better analysis
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Create enhanced prompt for Gemini with all content and the search query
    const prompt = `
      You are a highly detailed AI search assistant for Sinosply, a China sourcing company that connects customers with verified manufacturers.
      
      A user has searched for: "${query}"
      
      The search query has been broken down into these keywords: ${JSON.stringify(keywords)}
      
      Here are the search results found (ranked by relevance):
      ${JSON.stringify(allContent, null, 2)}
      
      I need you to perform an extremely thorough and detailed analysis, ensuring NO relevant keyword or information is missed. Based on these results, please provide:
      
      1. A comprehensive summary of the search results (2-3 sentences)
      2. A detailed analysis of the most relevant items (up to 4 items), including:
         - Item title
         - Relevance rating (Very High, High, Medium, or Low)
         - At least 4 key highlights from the content, being extremely specific
         - Detailed context explaining why this result is relevant to EACH keyword in the query
         - A specific, actionable recommendation based on the search intent
      3. 4-6 highly relevant related search queries the user might be interested in
      4. A section called "Missed Keywords Analysis" that checks if any keywords from the search weren't properly addressed
      
      Format your response as a JSON object with these fields:
      {
        "summary": "string",
        "analysis": [
          {
            "title": "string",
            "relevance": "string", // Very High, High, Medium, or Low
            "highlights": ["string", "string", "string", "string"],
            "context": "string",
            "keywordRelevance": {
              "keyword1": "explanation of relevance to this specific keyword",
              "keyword2": "explanation of relevance to this specific keyword"
              // Include ALL keywords
            },
            "recommendation": "string"
          }
        ],
        "relatedQueries": ["string", "string", "string", "string"],
        "missedKeywordsAnalysis": {
          "missedKeywords": ["string"], // keywords with minimal or no matching content
          "recommendation": "string" // how to modify search to better find these
        }
      }
    `;

    // Generate content with Gemini
    const result = await model.generateContent(prompt);
    const response = result.response;
    
    // Parse the JSON response
    // Sometimes the response might include markdown code blocks, so we need to clean it
    const text = response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('Could not parse AI response');
    }
    
    const jsonResponse = JSON.parse(jsonMatch[0]);

    // Return the AI-enhanced results
    res.json(jsonResponse);

  } catch (error) {
    console.error('AI Search error:', error);
    
    // Provide a fallback response if the AI fails
    res.json({
      summary: `Here are the search results for "${query}" on Sinosply. I found some relevant items that might match what you're looking for.`,
      analysis: [
        {
          title: "Search results",
          relevance: "Medium",
          highlights: [
            `Found results related to "${query}"`,
            "Browse the results to find what matches your needs",
            "Consider refining your search if needed",
            "Our detailed product listings contain specifications and pricing"
          ],
          context: "Our system found some potential matches to your query, but AI analysis couldn't be completed.",
          recommendation: "Please review the regular search results or try a different search term."
        }
      ],
      relatedQueries: ["furniture", "sourcing", "manufacturing", "china import", "quality control", "logistics"],
      missedKeywordsAnalysis: {
        missedKeywords: [],
        recommendation: "Try using more specific terms related to the products or services you're looking for."
      }
    });
  }
});

export default router; 