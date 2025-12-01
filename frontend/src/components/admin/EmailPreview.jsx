import React, { useEffect, useState } from 'react';
import { useProductStore } from '../../store/productStore';

/**
 * EmailPreview component - Renders a preview of an email campaign with customizable templates
 * 
 * @param {Object} props
 * @param {string} props.template - Template ID ('default', 'promotional', 'newsletter', 'announcement')
 * @param {string} props.subject - Email subject line
 * @param {string} props.content - HTML content of the email
 * @param {string} props.previewMode - Display mode ('desktop' or 'mobile')
 * @returns {JSX.Element} Email preview component
 */
const EmailPreview = ({ template, subject, content, previewMode = 'desktop' }) => {
  // Get products from the product store
  const { products, fetchProductsFromAPI } = useProductStore();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const isMobile = previewMode === 'mobile';
  
  // Helper function to get the best product image
  const getProductImage = (product) => {
    if (!product) return 'https://via.placeholder.com/400x400?text=Product';
    
    let productImage;
    
    if (product.image) {
      // Direct product image if available
      productImage = product.image;
    } else if (product.variants && product.variants.length > 0) {
      // First variant's image
      if (product.variants[0].image) {
        productImage = product.variants[0].image;
      } 
      // Then check first variant's additional images
      else if (product.variants[0].additionalImages && product.variants[0].additionalImages.length > 0) {
        productImage = product.variants[0].additionalImages[0];
      }
    }
    
    // If no image found, use placeholder with product name
    if (!productImage) {
      productImage = `https://via.placeholder.com/400x400?text=${encodeURIComponent(product.name || 'Product')}`;
    }
    
    return productImage;
  };
  
  // Format price for display
  const formatPrice = (price) => {
    if (typeof price === 'number') {
      return `GH₵ ${price.toFixed(2)}`;
    }
    return price?.toString() || 'GH₵ 0.00';
  };
  
  // Fetch products if needed and select featured ones for the email
  useEffect(() => {
    if (products.length === 0) {
      fetchProductsFromAPI();
    } else {
      // Select featured or highest priced products
      const featured = products
        .filter(p => p.isFeatured || p.stock > 0) // Only in-stock or featured products
        .sort((a, b) => {
          // First prioritize featured products
          if (a.isFeatured && !b.isFeatured) return -1;
          if (!a.isFeatured && b.isFeatured) return 1;
          
          // Then sort by price (highest first)
          const priceA = typeof a.basePrice === 'number' ? a.basePrice : 0;
          const priceB = typeof b.basePrice === 'number' ? b.basePrice : 0;
          return priceB - priceA;
        })
        .slice(0, 3) // Take top 3
        .map(product => ({
          name: product.name,
          price: formatPrice(product.basePrice),
          discount: product.salePrice ? formatPrice(product.basePrice) : null,
          image: getProductImage(product),
          badge: product.isFeatured ? 'Featured' : (product.isNew ? 'New Arrival' : null)
        }));
      
      setFeaturedProducts(featured);
    }
  }, [products, fetchProductsFromAPI]);

  // Date for the email header
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  
  // Enhanced template styles
  const templateStyles = {
    default: {
      headerColor: 'linear-gradient(135deg, #6B46C1, #805AD5)', // Purple gradient
      accentColor: '#6B46C1',
      secondaryColor: '#9F7AEA',
      bgColor: '#F9FAFB',
      textColor: '#111827',
      secondaryTextColor: '#4B5563',
      fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      buttonStyle: {
        backgroundColor: '#6B46C1',
        hoverColor: '#5A32AC',
        textColor: 'white'
      }
    },
    promotional: {
      headerColor: 'linear-gradient(135deg, #F97316, #FDBA74)', // Orange gradient
      accentColor: '#F97316',
      secondaryColor: '#FB923C',
      bgColor: '#FFFBEB',
      textColor: '#7C2D12',
      secondaryTextColor: '#9A3412',
      fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      buttonStyle: {
        backgroundColor: '#F97316',
        hoverColor: '#EA580C',
        textColor: 'white'
      }
    },
    newsletter: {
      headerColor: 'linear-gradient(135deg, #0EA5E9, #38BDF8)', // Blue gradient
      accentColor: '#0EA5E9',
      secondaryColor: '#7DD3FC',
      bgColor: '#F0F9FF',
      textColor: '#075985',
      secondaryTextColor: '#0369A1',
      fontFamily: 'Georgia, "Times New Roman", serif',
      buttonStyle: {
        backgroundColor: '#0EA5E9',
        hoverColor: '#0284C7',
        textColor: 'white'
      }
    },
    announcement: {
      headerColor: 'linear-gradient(135deg, #10B981, #34D399)', // Green gradient
      accentColor: '#10B981',
      secondaryColor: '#6EE7B7',
      bgColor: '#ECFDF5',
      textColor: '#065F46',
      secondaryTextColor: '#047857',
      fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      buttonStyle: {
        backgroundColor: '#10B981',
        hoverColor: '#059669',
        textColor: 'white'
      }
    }
  };
  
  // Get the styles based on selected template
  const currentStyle = templateStyles[template] || templateStyles.default;

  // Product Showcase Component - Now uses real products
  const ProductShowcase = () => {
    // If we have no products yet, show loading state
    if (featuredProducts.length === 0) {
      return (
        <div>
          <h4 style={{
            fontSize: isMobile ? '14px' : '16px',
            fontWeight: 'bold',
            textAlign: 'center',
            margin: isMobile ? '20px 0 15px' : '30px 0 20px',
            color: currentStyle.textColor
          }}>
            Featured Products
          </h4>
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            gap: isMobile ? '12px' : '15px'
          }}>
            {[1, 2].slice(0, isMobile ? 2 : 3).map((_, index) => (
              <div key={index} style={{
                width: isMobile ? '100%' : 'calc(33.33% - 10px)',
                backgroundColor: 'white',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                border: '1px solid #f0f0f0'
              }}>
                <div style={{
                  height: isMobile ? '140px' : '160px',
                  backgroundColor: '#f3f4f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#9ca3af',
                  fontSize: '12px'
                }}>
                  Loading products...
                </div>
                <div style={{padding: '12px'}}>
                  <div style={{
                    height: '14px',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '4px',
                    marginBottom: '10px'
                  }}></div>
                  <div style={{
                    height: '10px',
                    width: '60%',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '4px'
                  }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    // Style for the Buy Now button, optimized for touch
    const buyButtonStyle = {
      backgroundColor: currentStyle.accentColor,
      color: 'white',
      fontSize: '11px',
      fontWeight: 'bold',
      padding: isMobile ? '8px 16px' : '5px 10px',
      borderRadius: '4px',
      textDecoration: 'none',
      display: 'inline-block',
      minWidth: isMobile ? '75px' : 'auto',
      textAlign: 'center',
      boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
      WebkitTapHighlightColor: 'transparent'
    };
    
    return (
      <div>
        <h4 style={{
          fontSize: isMobile ? '14px' : '16px',
          fontWeight: 'bold',
          textAlign: 'center',
          margin: isMobile ? '20px 0 15px' : '30px 0 20px',
          color: currentStyle.textColor
        }}>
          Featured Products
        </h4>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: isMobile ? '12px' : '15px'
        }}>
          {featuredProducts.slice(0, isMobile ? 2 : 3).map((product, index) => (
            <div key={index} style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
              border: '1px solid #f0f0f0',
              marginBottom: isMobile ? '8px' : '0',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{
                position: 'relative',
                paddingTop: isMobile ? '75%' : '70%', /* Aspect ratio */
                overflow: 'hidden'
              }}>
                {product.badge && (
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    left: '0',
                    backgroundColor: currentStyle.accentColor,
                    color: 'white',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    padding: '4px 8px',
                    borderTopRightRadius: '4px',
                    borderBottomRightRadius: '4px',
                    zIndex: 1
                  }}>
                    {product.badge}
                  </div>
                )}
                <img 
                  src={product.image} 
                  alt={product.name}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center'
                  }}
                  loading="lazy"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://via.placeholder.com/400x400?text=${encodeURIComponent(product.name || 'Product')}`;
                  }}
                />
              </div>
              <div style={{
                padding: isMobile ? '12px 10px' : '12px',
                display: 'flex',
                flexDirection: 'column',
                flexGrow: 1,
                justifyContent: 'space-between'
              }}>
                <div style={{
                  fontSize: isMobile ? '13px' : '14px',
                  fontWeight: '600',
                  marginBottom: '6px',
                  color: currentStyle.textColor,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  lineHeight: '1.3',
                  height: isMobile ? '34px' : '36px'
                }}>
                  {product.name}
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: isMobile ? '8px' : '4px'
                }}>
                  <div>
                    <span style={{
                      fontSize: isMobile ? '14px' : '15px',
                      fontWeight: 'bold',
                      color: currentStyle.accentColor,
                      display: 'block'
                    }}>
                      {product.price}
                    </span>
                    {product.discount && (
                      <div style={{
                        fontSize: '12px',
                        textDecoration: 'line-through',
                        color: '#888',
                        marginTop: '2px'
                      }}>
                        {product.discount}
                      </div>
                    )}
                  </div>
                  <a href="#" style={buyButtonStyle}>
                    BUY NOW
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Special Promo component based on template type
  const SpecialPromo = () => {
    if (template === 'promotional') {
      return (
        <div style={{
          backgroundColor: '#FFF7ED',
          border: `2px dashed ${currentStyle.accentColor}`,
          borderRadius: '8px',
          padding: isMobile ? '12px' : '15px',
          textAlign: 'center',
          margin: isMobile ? '20px 0' : '25px 0'
        }}>
          <div style={{
            fontSize: isMobile ? '12px' : '13px',
            fontWeight: '600',
            color: currentStyle.secondaryTextColor,
            marginBottom: '5px'
          }}>
            LIMITED TIME OFFER
          </div>
          <div style={{
            fontSize: isMobile ? '18px' : '22px',
            fontWeight: 'bold',
            color: currentStyle.accentColor,
            marginBottom: '8px'
          }}>
            GET 25% OFF YOUR FIRST ORDER
          </div>
          <div style={{
            backgroundColor: currentStyle.accentColor,
            color: 'white',
            fontWeight: 'bold',
            padding: isMobile ? '6px' : '8px',
            maxWidth: isMobile ? '180px' : '200px',
            margin: '0 auto',
            borderRadius: '4px',
            fontSize: isMobile ? '14px' : '16px',
            letterSpacing: '1px'
          }}>
            CODE: SINOSPLY25
          </div>
          <div style={{
            fontSize: '12px',
            color: currentStyle.secondaryTextColor,
            marginTop: '8px'
          }}>
            Valid until {new Date(Date.now() + 7*24*60*60*1000).toLocaleDateString()}
          </div>
        </div>
      );
    }
    
    if (template === 'announcement') {
      return (
        <div style={{
          backgroundColor: '#ECFDF5',
          borderRadius: '8px',
          padding: isMobile ? '15px' : '20px',
          textAlign: 'center',
          margin: isMobile ? '20px 0' : '25px 0'
        }}>
          <div style={{
            fontSize: isMobile ? '16px' : '18px',
            fontWeight: 'bold',
            color: currentStyle.accentColor,
            marginBottom: '10px'
          }}>
            🎉 NEW COLLECTION LAUNCH 🎉
          </div>
          <div style={{
            fontSize: isMobile ? '13px' : '14px',
            lineHeight: '1.6',
            color: currentStyle.textColor
          }}>
            Explore our latest designs, crafted with premium materials and attention to detail.
          </div>
        </div>
      );
    }
    
    return null;
  };
  
  // Improve CTA button for mobile
  const ctaButtonStyle = {
    background: `linear-gradient(to right, ${currentStyle.accentColor}, ${currentStyle.secondaryColor})`,
    color: 'white',
    padding: isMobile ? '12px 24px' : '14px 28px',
    borderRadius: '6px',
    textDecoration: 'none',
    fontWeight: 'bold',
    display: 'inline-block',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    fontSize: isMobile ? '13px' : '14px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    minWidth: isMobile ? '180px' : '200px',
    WebkitTapHighlightColor: 'transparent'
  };

  // Enhance all link elements to provide visual feedback on mobile
  const linkStyle = {
    color: currentStyle.accentColor,
    textDecoration: 'none',
    margin: isMobile ? '0' : '0 8px',
    padding: isMobile ? '8px 0' : '0', // Increased padding for better touch target
    display: 'block', // Full width on mobile for better touch target
    WebkitTapHighlightColor: 'transparent' // Removes default mobile tap highlight
  };

  // Define a reusable style for social media icons
  const socialIconStyle = (isMobile) => ({
    display: 'inline-block',
    margin: '0 5px',
    width: isMobile ? '40px' : '30px',
    height: isMobile ? '40px' : '30px',
    lineHeight: isMobile ? '40px' : '30px',
    textAlign: 'center',
    backgroundColor: '#f1f1f1',
    borderRadius: '50%',
    color: currentStyle.accentColor,
    textDecoration: 'none',
    fontWeight: 'bold',
    WebkitTapHighlightColor: 'transparent',
    transition: 'background-color 0.2s'
  });

  return (
    <div className={`overflow-auto border rounded-lg ${isMobile ? 'max-w-[100%]' : 'w-full'}`} 
         style={{
           maxHeight: isMobile ? '500px' : '600px',
           WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
           transform: 'translateZ(0)' // Hardware acceleration for smoother scrolling
         }}>
      <div style={{
        backgroundColor: '#f4f4f7', // Light grey background for email body
        fontFamily: currentStyle.fontFamily,
        color: currentStyle.textColor,
        padding: isMobile ? '8px' : '20px',
      }}>
        {/* Email Container */}
        <div style={{
          maxWidth: '100%', // Ensure container doesn't overflow on mobile
          width: isMobile ? '100%' : '600px',
          margin: '0 auto',
          backgroundColor: 'white',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
        }}>
          {/* Email Header */}
          <div style={{
            background: currentStyle.headerColor,
            padding: isMobile ? '20px 15px' : '25px 20px',
            textAlign: 'center',
            position: 'relative'
          }}>
            {/* Logo and Brand */}
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <div style={{
                width: isMobile ? '24px' : '30px',
                height: isMobile ? '24px' : '30px',
                backgroundColor: 'white',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '10px'
              }}>
                <span style={{
                  fontSize: isMobile ? '15px' : '18px',
                  fontWeight: 'bold',
                  color: currentStyle.accentColor
                }}>S</span>
              </div>
              <h2 style={{margin: 0, fontSize: isMobile ? '16px' : '24px', color: 'white'}}>
                SINOSPLY
              </h2>
            </div>
            
            {/* View in Browser Link */}
            <div style={{
              position: 'absolute',
              top: '8px',
              right: '10px',
              fontSize: '10px'
            }}>
              <a href="#" style={{ 
                color: 'rgba(255,255,255,0.7)', 
                textDecoration: 'none',
                padding: isMobile ? '5px' : '0' // Larger tap target on mobile
              }}>
                View in browser
              </a>
            </div>
          </div>
          
          {/* Email Content Section */}
          <div style={{
            padding: isMobile ? '12px' : '25px',
          }}>
            <div style={{
              fontSize: isMobile ? '11px' : '12px',
              color: '#888888',
              marginBottom: isMobile ? '10px' : '15px',
              textAlign: 'right'
            }}>
              {currentDate}
            </div>
            
            {/* Subject Line */}
            <h3 style={{
              borderBottom: `2px solid ${currentStyle.accentColor}`,
              paddingBottom: isMobile ? '8px' : '12px',
              marginBottom: isMobile ? '15px' : '20px',
              color: currentStyle.textColor,
              fontSize: isMobile ? '16px' : '22px'
            }}>
              {subject || "Your Campaign Subject Line"}
            </h3>
            
            {/* Special Promotion Banner based on template */}
            <SpecialPromo />
            
            {/* Email Content */}
            <div style={{
              lineHeight: '1.6',
              fontSize: isMobile ? '13px' : '16px',
              wordWrap: 'break-word',
              overflowWrap: 'break-word'
            }}>
              {content ? (
                <div 
                  dangerouslySetInnerHTML={{ __html: content }} 
                  className="email-content"
                  style={{
                    maxWidth: '100%',
                    overflow: 'hidden'
                  }}
                />
              ) : (
                <p>Your email content will appear here. Start typing in the content area to see your email take shape!</p>
              )}
            </div>
            
            {/* Product Showcase */}
            <ProductShowcase />
            
            {/* Call to Action Button */}
            <div style={{
              textAlign: 'center',
              margin: isMobile ? '20px 0' : '30px 0',
            }}>
              <a href="#" style={ctaButtonStyle}>
                Shop The Collection
              </a>
            </div>
            
            {/* Social Proof */}
            <div style={{
              backgroundColor: '#f9f9f9',
              padding: isMobile ? '12px' : '15px',
              borderRadius: '8px',
              margin: isMobile ? '15px 0' : '20px 0'
            }}>
              <div style={{
                fontWeight: '600',
                marginBottom: isMobile ? '8px' : '10px',
                fontSize: isMobile ? '14px' : '15px',
                textAlign: 'center',
                color: currentStyle.textColor
              }}>
                What Our Customers Say
              </div>
              <p style={{
                margin: '0',
                fontSize: isMobile ? '12px' : '13px',
                fontStyle: 'italic',
                textAlign: 'center',
                color: '#555'
              }}>
                "The quality is amazing and delivery was super fast! Will definitely shop here again."
              </p>
              <div style={{
                textAlign: 'center',
                marginTop: isMobile ? '6px' : '8px',
                fontSize: isMobile ? '11px' : '12px',
                fontWeight: '600',
                color: currentStyle.accentColor
              }}>
                – Sarah T., Accra
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div style={{
            borderTop: '1px solid #eee',
            backgroundColor: '#f9f9f9',
            padding: isMobile ? '15px 10px' : '20px',
            fontSize: isMobile ? '11px' : '12px',
            color: '#666',
            textAlign: 'center',
          }}>
            {/* Social Media Icons */}
            <div style={{ marginBottom: '15px' }}>
              <a href="#" style={socialIconStyle(isMobile)}>f</a>
              <a href="#" style={socialIconStyle(isMobile)}>t</a>
              <a href="#" style={socialIconStyle(isMobile)}>in</a>
              <a href="#" style={socialIconStyle(isMobile)}>ig</a>
            </div>
            
            <p style={{marginBottom: isMobile ? '6px' : '8px'}}>
              &copy; {new Date().getFullYear()} Sinosply. All rights reserved.
            </p>
            <p style={{marginBottom: isMobile ? '10px' : '12px'}}>
              123 Fashion Street, Accra, Ghana
            </p>
            
            <div style={{
              marginBottom: '15px',
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              justifyContent: 'center',
              gap: isMobile ? '8px' : '0'
            }}>
              <a href="#" style={linkStyle}>Unsubscribe</a>
              <a href="#" style={linkStyle}>Privacy Policy</a>
              <a href="#" style={linkStyle}>Contact Us</a>
            </div>
            
            <p style={{
              fontSize: isMobile ? '10px' : '11px', 
              color: '#888', 
              maxWidth: isMobile ? '100%' : '400px', 
              margin: '0 auto'
            }}>
              You received this email because you signed up for updates from Sinosply.
              Please add <strong>hello@sinosply.com</strong> to your contacts to ensure our emails reach your inbox.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailPreview; 