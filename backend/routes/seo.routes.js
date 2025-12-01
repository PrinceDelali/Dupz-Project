import express from 'express';
import mongoose from 'mongoose';
import Product from '../models/Product.js';

const router = express.Router();

/**
 * @route GET /api/seo/generate-metadata
 * @desc Generate SEO metadata for a specific page/entity
 * @access Public
 */
router.get('/generate-metadata', async (req, res) => {
  try {
    const { type, id, slug } = req.query;
    let metadata = {};
    
    // Generate metadata based on type
    switch(type) {
      case 'product':
        metadata = await generateProductMetadata(id, slug);
        break;
      case 'category':
        metadata = await generateCategoryMetadata(id, slug);
        break;
      case 'collection':
        metadata = await generateCollectionMetadata(id);
        break;
      case 'platform':
        metadata = await generatePlatformMetadata(id);
        break;
      case 'home':
        metadata = generateHomeMetadata();
        break;
      default:
        metadata = generateDefaultMetadata();
    }
    
    return res.status(200).json({ success: true, metadata });
  } catch (error) {
    console.error('Error generating SEO metadata:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to generate metadata',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route GET /api/seo/og-image/:id
 * @desc Generate an Open Graph image for a product that can be directly accessed
 * @access Public
 */
router.get('/og-image/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send('Invalid product ID');
    }
    
    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).send('Product not found');
    }
    
    // Get the primary image URL
    let imageUrl = product.image;
    
    // If there are variants with images, use the first variant's image
    if (product.variants && product.variants.length > 0) {
      if (product.variants[0].image) {
        imageUrl = product.variants[0].image;
      } else if (product.variants[0].additionalImages && product.variants[0].additionalImages.length > 0) {
        imageUrl = product.variants[0].additionalImages[0];
      }
    }
    
    // If we have an image URL, redirect to it
    if (imageUrl) {
      // For remote images, redirect
      if (imageUrl.startsWith('http')) {
        return res.redirect(imageUrl);
      } 
      // For local images, we would need to serve the file,
      // but for simplicity just redirect to a placeholder
      else {
        return res.redirect(`https://placehold.co/1200x630/e2e8f0/1e293b?text=${encodeURIComponent(product.name)}`);
      }
    }
    
    // If no image is available, redirect to a placeholder
    return res.redirect(`https://placehold.co/1200x630/e2e8f0/1e293b?text=${encodeURIComponent(product.name)}`);
    
  } catch (error) {
    console.error('Error generating OG image:', error);
    return res.status(500).send('Internal Server Error');
  }
});

/**
 * @route GET /api/v1/seo/social-preview/:id
 * @desc Special endpoint for social media crawlers - returns HTML with embedded metadata
 * @access Public
 */
router.get('/social-preview/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send('Invalid product ID');
    }
    
    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).send('Product not found');
    }
    
    // Generate metadata
    const metadata = await generateProductMetadata(id);
    
    // Get the primary image URL - ensure it's a full URL
    let imageUrl = Array.isArray(metadata.image) ? metadata.image[0] : metadata.image;
    if (!imageUrl.startsWith('http')) {
      const baseUrl = process.env.BACKEND_URL || 'https://sinosply-backend.onrender.com';
      imageUrl = `${baseUrl}/api/v1/seo/og-image/${id}`;
    }
    
    // Create a simple HTML page with all the necessary meta tags for social media
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>${metadata.title}</title>
        <meta name="description" content="${metadata.description}">
        
        <!-- Open Graph / Facebook -->
        <meta property="og:type" content="product">
        <meta property="og:url" content="https://www.sinosply.com/product/${id}">
        <meta property="og:title" content="${metadata.title}">
        <meta property="og:description" content="${metadata.description}">
        <meta property="og:image" content="${imageUrl}">
        <meta property="og:site_name" content="Sinosply">
        
        <!-- Product specific OG tags -->
        <meta property="product:price:amount" content="${metadata.product.price}">
        <meta property="product:price:currency" content="GHS">
        <meta property="product:availability" content="${metadata.product.inStock ? 'in stock' : 'out of stock'}">
        <meta property="product:condition" content="new">
        <meta property="product:retailer_item_id" content="${metadata.product.sku}">
        
        <!-- Twitter -->
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="${metadata.title}">
        <meta name="twitter:description" content="${metadata.description}">
        <meta name="twitter:image" content="${imageUrl}">
        
        <meta http-equiv="refresh" content="0;URL='https://www.sinosply.com/product/${id}'">
      </head>
      <body>
        <h1>${product.name}</h1>
        <p>${product.description || 'No description available.'}</p>
        <p>Price: GH₵${typeof product.basePrice === 'number' ? product.basePrice.toFixed(2) : product.basePrice}</p>
        <p>Redirecting to product page...</p>
      </body>
      </html>
    `;
    
    // Set content type and send the HTML
    res.setHeader('Content-Type', 'text/html');
    return res.send(htmlContent);
    
  } catch (error) {
    console.error('Error generating social preview:', error);
    return res.status(500).send('Internal Server Error');
  }
});

/**
 * Generate metadata for product pages
 */
async function generateProductMetadata(id, slug) {
  try {
    // Find product by ID or slug
    const query = id ? { _id: mongoose.Types.ObjectId(id) } : { slug };
    const product = await Product.findOne(query).populate('reviews');
    
    if (!product) {
      return generateDefaultMetadata();
    }
    
    // Create a reliable server-side image URL using our new endpoint
    const baseUrl = process.env.BACKEND_URL || 'https://sinosply.com';
    const reliableImageUrl = `${baseUrl}/api/v1/seo/og-image/${product._id}`;
    
    // Get primary image as fallback
    const primaryImage = product.variants && product.variants.length > 0
      ? product.variants[0].image || product.variants[0].additionalImages?.[0]
      : product.image;
    
    // Format price
    const formattedPrice = typeof product.basePrice === 'number' 
      ? product.basePrice.toFixed(2) 
      : product.basePrice;
    
    // Get reviews if available
    const reviewsData = product.reviews && product.reviews.length > 0
      ? product.reviews.map(review => ({
          author: `${review.user?.firstName || 'Customer'} ${review.user?.lastName?.charAt(0) || ''}`,
          rating: review.rating,
          text: review.comment
        }))
      : [];
    
    // Calculate average rating
    const avgRating = product.reviews && product.reviews.length > 0
      ? (product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length).toFixed(1)
      : 0;
    
    return {
      title: `${product.name} | Sinosply`,
      description: product.description && product.description.length > 160 
        ? `${product.description.substring(0, 157)}...` 
        : (product.description || `Buy ${product.name} at the best price from Sinosply. Fast shipping and top quality guaranteed.`),
      image: reliableImageUrl,
      type: 'product',
      product: {
        name: product.name,
        image: [reliableImageUrl, primaryImage].filter(Boolean),
        description: product.description,
        price: formattedPrice,
        sku: product._id.toString(),
        inStock: product.stock > 0,
        reviews: reviewsData,
        reviewCount: product.reviews?.length || 0,
        avgRating: avgRating,
        brand: 'Sinosply',
        category: product.category || '',
        color: product.variants && product.variants.length > 0 ? product.variants[0].colorName : ''
      }
    };
  } catch (error) {
    console.error('Error generating product metadata:', error);
    return generateDefaultMetadata();
  }
}

/**
 * Generate metadata for category pages
 */
async function generateCategoryMetadata(id, slug) {
  // Implementation would be similar to product metadata
  // You would query for category data instead
  return {
    title: 'Category Name | Sinosply',
    description: 'Browse our selection of products in this category. Quality assured and fast shipping.',
    image: 'https://sinosply.com/category-image.jpg',
    type: 'website'
  };
}

/**
 * Generate metadata for collection pages
 */
async function generateCollectionMetadata(id) {
  // Implementation would query for collection data
  return {
    title: 'Collection Name | Sinosply',
    description: 'Explore our curated collection of premium products. Limited editions and special offers available.',
    image: 'https://sinosply.com/collection-image.jpg',
    type: 'website'
  };
}

/**
 * Generate metadata for platform pages
 */
async function generatePlatformMetadata(id) {
  // Implementation would query for platform data
  return {
    title: 'Platform Name | Sinosply',
    description: 'Discover products from our featured platform. Quality assured and fast shipping.',
    image: 'https://sinosply.com/platform-image.jpg',
    type: 'website'
  };
}

/**
 * Generate metadata for the home page
 */
function generateHomeMetadata() {
  return {
    title: 'Sinosply - Connect to Premium Chinese Products',
    description: 'Discover premium products directly from trusted Chinese suppliers with Sinosply. Your reliable partner for business growth and global sourcing.',
    image: 'https://sinosply.com/og-image.jpg',
    type: 'website'
  };
}

/**
 * Generate default metadata for pages without specific data
 */
function generateDefaultMetadata() {
  return {
    title: 'Sinosply - Premium Products from China',
    description: 'Sinosply connects you with quality products from trusted Chinese suppliers. Explore our catalog for the best deals.',
    image: 'https://sinosply.com/default-og-image.jpg',
    type: 'website'
  };
}

export default router; 