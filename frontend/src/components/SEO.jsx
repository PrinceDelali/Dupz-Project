import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * SEO Component for dynamically updating metadata
 * 
 * @param {Object} props
 * @param {string} props.title - Page title
 * @param {string} props.description - Page description
 * @param {string} props.image - Image URL for Open Graph/Twitter
 * @param {string} props.type - Content type (website, article, product)
 * @param {Object} props.product - Product details for product schema
 * @param {Object} props.article - Article details for article schema
 * @param {boolean} props.noindex - Whether to noindex the page
 */
const SEO = ({ 
  title = "Sinosply - Connect to Premium Chinese Products",
  description = "Discover premium products directly from trusted Chinese suppliers with Sinosply. Your reliable partner for business growth and global sourcing.",
  image = "https://sinosply.com/og-image.jpg",
  type = "website",
  product = null,
  article = null,
  noindex = false
}) => {
  const location = useLocation();
  const currentUrl = window.location.origin + location.pathname;
  
  useEffect(() => {
    // Update page title
    document.title = title;
    
    // Update meta tags
    updateMetaTag("name", "description", description);
    updateMetaTag("name", "title", title);
    
    // Update Open Graph tags
    updateMetaTag("property", "og:title", title);
    updateMetaTag("property", "og:description", description);
    updateMetaTag("property", "og:url", currentUrl);
    updateMetaTag("property", "og:type", type);
    updateMetaTag("property", "og:site_name", "Sinosply");
    
    // Handle image properly (could be string or array)
    if (image) {
      // If image is an array, use the first one as the main image
      if (Array.isArray(image) && image.length > 0) {
        updateMetaTag("property", "og:image", image[0]);
        
        // Add additional images if available
        image.forEach((img, index) => {
          if (index > 0) { // Skip first image as it's set above
            updateMetaTag("property", `og:image:0${index + 1}`, img);
          }
        });
      } else {
        // If image is a string, use it directly
        updateMetaTag("property", "og:image", image);
      }
    }
    
    // If it's a product, add product-specific OG tags
    if (type === 'product' && product) {
      updateMetaTag("property", "og:price:amount", product.price);
      updateMetaTag("property", "og:price:currency", "GHS");
      updateMetaTag("property", "product:price:amount", product.price);
      updateMetaTag("property", "product:price:currency", "GHS");
      updateMetaTag("property", "product:availability", product.inStock ? "in stock" : "out of stock");
      updateMetaTag("property", "product:condition", "new");
      updateMetaTag("property", "product:retailer_item_id", product.sku || "");
      
      // Add multiple images if available
      if (product.image && Array.isArray(product.image) && product.image.length > 1) {
        product.image.forEach((img, index) => {
          if (index > 0) { // Skip first image as it's already set above
            updateMetaTag("property", `og:image:0${index + 1}`, img);
          }
        });
      }
    }
    
    // Update Twitter tags
    updateMetaTag("name", "twitter:card", "summary_large_image");
    updateMetaTag("name", "twitter:site", "@sinosply");
    updateMetaTag("name", "twitter:title", title);
    updateMetaTag("name", "twitter:description", description);
    updateMetaTag("name", "twitter:url", currentUrl);
    
    // Handle Twitter image the same way as Open Graph
    if (image) {
      if (Array.isArray(image) && image.length > 0) {
        updateMetaTag("name", "twitter:image", image[0]);
      } else {
        updateMetaTag("name", "twitter:image", image);
      }
    }
    
    // Update canonical link
    const canonicalLink = document.getElementById('canonical-link');
    if (canonicalLink) canonicalLink.href = currentUrl;
    
    // Update robots meta tag
    updateMetaTag("name", "robots", noindex ? "noindex, nofollow" : "index, follow");
    
    // Update structured data
    updateStructuredData(type, product, article);
    
    // Clean up
    return () => {
      // Reset title to default when component unmounts
      document.title = "Sinosply - Connect to Premium Chinese Products";
    };
  }, [title, description, image, type, product, article, currentUrl, noindex]);
  
  // Helper function to update meta tags
  const updateMetaTag = (attribute, attributeValue, content) => {
    // First, try to find an existing tag
    let metaTag = document.querySelector(`meta[${attribute}='${attributeValue}']`);
    
    // If tag exists, update its content
    if (metaTag) {
      metaTag.setAttribute("content", content);
    } else {
      // Otherwise, create a new tag
      metaTag = document.createElement("meta");
      metaTag.setAttribute(attribute, attributeValue);
      metaTag.setAttribute("content", content);
      document.head.appendChild(metaTag);
    }
  };
  
  // Helper function to update structured data
  const updateStructuredData = (type, product, article) => {
    const structuredDataScript = document.getElementById('structured-data');
    
    if (!structuredDataScript) return;
    
    let jsonLD = {};
    
    if (type === "product" && product) {
      // Product schema
      jsonLD = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": product.name,
        "image": product.image,
        "description": product.description,
        "sku": product.sku || "",
        "mpn": product.mpn || "",
        "brand": {
          "@type": "Brand",
          "name": "Sinosply"
        },
        "offers": {
          "@type": "Offer",
          "url": currentUrl,
          "priceCurrency": "GHS",
          "price": product.price,
          "priceValidUntil": product.priceValidUntil || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
          "itemCondition": "https://schema.org/NewCondition",
          "availability": product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          "seller": {
            "@type": "Organization",
            "name": "Sinosply"
          }
        }
      };
      
      // Add review info if available
      if (product.reviews && product.reviews.length > 0) {
        jsonLD.aggregateRating = {
          "@type": "AggregateRating",
          "ratingValue": product.avgRating,
          "reviewCount": product.reviewCount
        };
        
        jsonLD.review = product.reviews.map(review => ({
          "@type": "Review",
          "reviewRating": {
            "@type": "Rating",
            "ratingValue": review.rating,
            "bestRating": "5"
          },
          "author": {
            "@type": "Person",
            "name": review.author
          },
          "reviewBody": review.text
        }));
      }
    } else if (type === "article" && article) {
      // Article schema
      jsonLD = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": article.title,
        "image": article.image,
        "author": {
          "@type": "Person",
          "name": article.author
        },
        "publisher": {
          "@type": "Organization",
          "name": "Sinosply",
          "logo": {
            "@type": "ImageObject",
            "url": "https://sinosply.com/logo.png"
          }
        },
        "datePublished": article.datePublished,
        "dateModified": article.dateModified || article.datePublished,
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": currentUrl
        },
        "description": article.description
      };
    } else {
      // Default organization schema
      jsonLD = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Sinosply",
        "url": "https://sinosply.com",
        "logo": "https://sinosply.com/logo.png",
        "description": "Connecting businesses with premium Chinese products and suppliers.",
        "sameAs": [
          "https://facebook.com/sinosply",
          "https://instagram.com/sinosply",
          "https://twitter.com/sinosply",
          "https://linkedin.com/company/sinosply"
        ]
      };
    }
    
    structuredDataScript.textContent = JSON.stringify(jsonLD);
  };
  
  // This component doesn't render anything
  return null;
};

export default SEO; 