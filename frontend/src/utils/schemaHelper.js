/**
 * Generates Product structured data for JSON-LD
 * 
 * @param {Object} product - Product data
 * @param {string} currentUrl - Current page URL
 * @returns {Object} JSON-LD product schema
 */
export const generateProductSchema = (product, currentUrl) => {
  if (!product) return null;
  
  // Format price correctly
  const price = typeof product.price === 'number' 
    ? product.price.toFixed(2) 
    : product.price?.toString().replace(/[^0-9.]/g, '') || '0.00';
  
  // Create base product schema
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: Array.isArray(product.image) ? product.image : [product.image || ''],
    description: product.description || '',
    sku: product.sku || product._id || '',
    mpn: product.mpn || '',
    brand: {
      '@type': 'Brand',
      name: 'Sinosply'
    },
    offers: {
      '@type': 'Offer',
      url: currentUrl,
      priceCurrency: 'GHS',
      price: price,
      priceValidUntil: product.priceValidUntil || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      itemCondition: 'https://schema.org/NewCondition',
      availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'Sinosply'
      }
    }
  };
  
  // Add review data if available
  if (product.reviewCount && product.reviewCount > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: product.avgRating || '0',
      reviewCount: product.reviewCount
    };
  }
  
  // Add individual reviews if available
  if (product.reviews && product.reviews.length > 0) {
    schema.review = product.reviews.map(review => ({
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
      reviewBody: review.text || review.comment || ''
    }));
  }
  
  return schema;
};

/**
 * Generates Organization structured data for JSON-LD
 * 
 * @returns {Object} JSON-LD organization schema
 */
export const generateOrganizationSchema = () => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Sinosply',
    url: 'https://sinosply.com',
    logo: 'https://sinosply.com/logo.png',
    description: 'Connecting businesses with premium Chinese products and suppliers.',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '123 Business Avenue',
      addressLocality: 'Accra',
      addressRegion: 'Greater Accra',
      postalCode: '00233',
      addressCountry: 'GH'
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+233-555-1234',
      contactType: 'customer service',
      availableLanguage: ['English']
    },
    sameAs: [
      'https://facebook.com/sinosply',
      'https://instagram.com/sinosply',
      'https://twitter.com/sinosply',
      'https://linkedin.com/company/sinosply'
    ]
  };
};

/**
 * Generates BreadcrumbList structured data for JSON-LD
 * 
 * @param {Array} items - Breadcrumb items [{name, item}]
 * @returns {Object} JSON-LD breadcrumb schema
 */
export const generateBreadcrumbSchema = (items) => {
  if (!items || !items.length) return null;
  
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.item
    }))
  };
};

/**
 * Generates WebSite structured data for JSON-LD
 * 
 * @returns {Object} JSON-LD website schema
 */
export const generateWebsiteSchema = () => {
  return {
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
};

/**
 * Generates Article structured data for JSON-LD
 * 
 * @param {Object} article - Article data
 * @param {string} currentUrl - Current page URL
 * @returns {Object} JSON-LD article schema
 */
export const generateArticleSchema = (article, currentUrl) => {
  if (!article) return null;
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    image: article.image,
    author: {
      '@type': 'Person',
      name: article.author
    },
    publisher: {
      '@type': 'Organization',
      name: 'Sinosply',
      logo: {
        '@type': 'ImageObject',
        url: 'https://sinosply.com/logo.png'
      }
    },
    datePublished: article.datePublished,
    dateModified: article.dateModified || article.datePublished,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': currentUrl
    },
    description: article.description
  };
}; 