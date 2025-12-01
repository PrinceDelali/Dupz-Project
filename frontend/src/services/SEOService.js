import axios from 'axios';

/**
 * Service for handling SEO-related operations
 */
class SEOService {
  /**
   * Fetches SEO metadata for a specific page/entity
   * 
   * @param {string} type - Type of page (product, category, collection, platform, home)
   * @param {string} id - ID of the entity (if applicable)
   * @param {string} slug - Slug of the entity (if applicable)
   * @returns {Promise<Object>} - SEO metadata object
   */
  async getMetadata(type, id = null, slug = null) {
    try {
      let url = `/api/v1/seo/generate-metadata?type=${type}`;
      
      if (id) url += `&id=${id}`;
      if (slug) url += `&slug=${slug}`;
      
      const response = await axios.get(url);
      
      if (response.data.success) {
        return response.data.metadata;
      }
      
      return this.getDefaultMetadata(type);
    } catch (error) {
      console.error('Error fetching SEO metadata:', error);
      return this.getDefaultMetadata(type);
    }
  }
  
  /**
   * Returns default metadata based on page type
   * 
   * @param {string} type - Page type
   * @returns {Object} - Default metadata
   */
  getDefaultMetadata(type) {
    switch (type) {
      case 'product':
        return {
          title: 'Product | Sinosply',
          description: 'View product details and specifications. Quality assured and fast shipping.',
          image: 'https://sinosply.com/default-product.jpg',
          type: 'product'
        };
      case 'category':
        return {
          title: 'Category | Sinosply',
          description: 'Browse our selection of products in this category. Quality assured and fast shipping.',
          image: 'https://sinosply.com/default-category.jpg',
          type: 'website'
        };
      case 'collection':
        return {
          title: 'Collection | Sinosply',
          description: 'Explore our curated collection of premium products. Limited editions and special offers available.',
          image: 'https://sinosply.com/default-collection.jpg',
          type: 'website'
        };
      case 'platform':
        return {
          title: 'Shop | Sinosply',
          description: 'Discover products from our featured platform. Quality assured and fast shipping.',
          image: 'https://sinosply.com/default-platform.jpg',
          type: 'website'
        };
      default:
        return {
          title: 'Sinosply - Connect to Premium Chinese Products',
          description: 'Discover premium products directly from trusted Chinese suppliers with Sinosply. Your reliable partner for business growth and global sourcing.',
          image: 'https://sinosply.com/og-image.jpg',
          type: 'website'
        };
    }
  }
  
  /**
   * Generates structured data for the page
   * 
   * @param {string} type - Type of structured data (Product, Article, Organization, etc.)
   * @param {Object} data - Data for the structured data
   * @returns {string} - JSON-LD string
   */
  generateStructuredData(type, data) {
    let structuredData = {};
    
    switch (type) {
      case 'Product':
        structuredData = {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: data.name,
          image: data.image,
          description: data.description,
          sku: data.sku || '',
          mpn: data.mpn || '',
          brand: {
            '@type': 'Brand',
            name: 'Sinosply'
          },
          offers: {
            '@type': 'Offer',
            url: data.url,
            priceCurrency: 'GHS',
            price: data.price,
            priceValidUntil: data.priceValidUntil || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
            itemCondition: 'https://schema.org/NewCondition',
            availability: data.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            seller: {
              '@type': 'Organization',
              name: 'Sinosply'
            }
          }
        };
        
        // Add reviews if available
        if (data.reviews && data.reviews.length > 0) {
          structuredData.aggregateRating = {
            '@type': 'AggregateRating',
            ratingValue: data.avgRating,
            reviewCount: data.reviewCount
          };
          
          structuredData.review = data.reviews.map(review => ({
            '@type': 'Review',
            reviewRating: {
              '@type': 'Rating',
              ratingValue: review.rating,
              bestRating: '5'
            },
            author: {
              '@type': 'Person',
              name: review.author
            },
            reviewBody: review.text
          }));
        }
        break;
      
      case 'Organization':
        structuredData = {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'Sinosply',
          url: 'https://sinosply.com',
          logo: 'https://sinosply.com/logo.png',
          description: 'Connecting businesses with premium Chinese products and suppliers.',
          sameAs: [
            'https://facebook.com/sinosply',
            'https://instagram.com/sinosply',
            'https://twitter.com/sinosply',
            'https://linkedin.com/company/sinosply'
          ]
        };
        break;
      
      case 'Article':
        structuredData = {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: data.title,
          image: data.image,
          author: {
            '@type': 'Person',
            name: data.author
          },
          publisher: {
            '@type': 'Organization',
            name: 'Sinosply',
            logo: {
              '@type': 'ImageObject',
              url: 'https://sinosply.com/logo.png'
            }
          },
          datePublished: data.datePublished,
          dateModified: data.dateModified || data.datePublished,
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': data.url
          },
          description: data.description
        };
        break;
      
      default:
        structuredData = {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'Sinosply',
          url: 'https://sinosply.com',
          potentialAction: {
            '@type': 'SearchAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: 'https://sinosply.com/search?q={search_term_string}'
            },
            'query-input': 'required name=search_term_string'
          }
        };
    }
    
    return JSON.stringify(structuredData);
  }
  
  /**
   * Updates meta tags for the current page
   * 
   * @param {string} attribute - Meta attribute (name or property)
   * @param {string} attributeValue - Value of the attribute
   * @param {string} content - Content of the meta tag
   */
  updateMetaTag(attribute, attributeValue, content) {
    // First, try to find an existing tag
    let metaTag = document.querySelector(`meta[${attribute}='${attributeValue}']`);
    
    // If tag exists, update its content
    if (metaTag) {
      metaTag.setAttribute('content', content);
    } else {
      // Otherwise, create a new tag
      metaTag = document.createElement('meta');
      metaTag.setAttribute(attribute, attributeValue);
      metaTag.setAttribute('content', content);
      document.head.appendChild(metaTag);
    }
  }
  
  /**
   * Updates the canonical link
   * 
   * @param {string} url - URL for the canonical link
   */
  updateCanonicalLink(url) {
    const canonicalLink = document.getElementById('canonical-link');
    if (canonicalLink) canonicalLink.href = url;
  }
}

export default new SEOService(); 