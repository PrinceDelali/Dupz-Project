/**
 * Utility script to test social media sharing capabilities
 * 
 * This script can be run in the browser console to verify that
 * our social sharing metadata is correctly configured
 */

const testSocialSharing = async (productId) => {
  console.log('🧪 Running social sharing test...');
  
  if (!productId) {
    // Try to get product ID from current URL
    const pathMatch = window.location.pathname.match(/\/product\/([a-f0-9]+)/i);
    productId = pathMatch ? pathMatch[1] : null;
    
    if (!productId) {
      console.error('❌ No product ID provided or found in URL');
      return;
    }
  }
  
  console.log(`🔍 Testing social sharing for product ID: ${productId}`);
  
  // Test 1: Check if API endpoints are accessible
  try {
    console.log('Test 1: Checking API endpoints...');
    
    // Call metadata endpoint
    const metadataUrl = `https://sinosply-backend.onrender.com/api/v1/seo/generate-metadata?type=product&id=${productId}`;
    const metadataResponse = await fetch(metadataUrl);
    
    if (!metadataResponse.ok) {
      throw new Error(`Metadata endpoint failed: ${metadataResponse.status}`);
    }
    
    const metadataJson = await metadataResponse.json();
    console.log('✅ Metadata endpoint is working', metadataJson);
    
    // Check OG image endpoint
    const ogImageUrl = `https://sinosply-backend.onrender.com/api/v1/seo/og-image/${productId}`;
    const ogImageResponse = await fetch(ogImageUrl);
    
    if (!ogImageResponse.ok) {
      throw new Error(`OG Image endpoint failed: ${ogImageResponse.status}`);
    }
    
    console.log('✅ OG Image endpoint is working');
    
    // Check social preview endpoint
    const previewUrl = `https://sinosply-backend.onrender.com/api/v1/seo/social-preview/${productId}`;
    const previewResponse = await fetch(previewUrl);
    
    if (!previewResponse.ok) {
      throw new Error(`Social preview endpoint failed: ${previewResponse.status}`);
    }
    
    console.log('✅ Social preview endpoint is working');
    
  } catch (error) {
    console.error('❌ API endpoint test failed:', error.message);
  }
  
  // Test 2: Check current page meta tags
  try {
    console.log('Test 2: Checking page meta tags...');
    
    const ogTitle = document.querySelector('meta[property="og:title"]')?.content;
    const ogDesc = document.querySelector('meta[property="og:description"]')?.content;
    const ogImage = document.querySelector('meta[property="og:image"]')?.content;
    const ogType = document.querySelector('meta[property="og:type"]')?.content;
    
    console.log('Open Graph Tags:', {
      title: ogTitle,
      description: ogDesc,
      image: ogImage,
      type: ogType
    });
    
    if (!ogTitle || !ogDesc || !ogImage) {
      console.warn('⚠️ Some Open Graph tags are missing');
    } else {
      console.log('✅ Open Graph tags are present');
    }
    
    // Check product specific tags
    const productPrice = document.querySelector('meta[property="product:price:amount"]')?.content;
    const productCurrency = document.querySelector('meta[property="product:price:currency"]')?.content;
    const productAvailability = document.querySelector('meta[property="product:availability"]')?.content;
    
    console.log('Product Tags:', {
      price: productPrice,
      currency: productCurrency,
      availability: productAvailability
    });
    
    if (!productPrice || !productCurrency) {
      console.warn('⚠️ Some product-specific tags are missing');
    } else {
      console.log('✅ Product-specific tags are present');
    }
    
  } catch (error) {
    console.error('❌ Meta tag test failed:', error.message);
  }
  
  // Test 3: Simulate social crawler
  try {
    console.log('Test 3: Simulating social crawler request...');
    //deploy
    // Determine which domain we're on
    const isMainDomain = window.location.hostname === 'www.sinosply.com' || 
                        window.location.hostname === 'sinosply.com';
    
    // Use appropriate URL based on current domain
    const domain = isMainDomain ? 'https://www.sinosply.com' : 'https://bunnyandwolf.vercel.app';
    const productUrl = `${domain}/product/${productId}`;
    
    console.log(`To fully test, open this URL in the WhatsApp Link Preview Debug Tool:`);
    console.log(`https://providers.chat/whatsapp-link-preview-debugger/?url=${encodeURIComponent(productUrl)}`);
    
    console.log('Or use the Facebook Sharing Debugger:');
    console.log(`https://developers.facebook.com/tools/debug/?q=${encodeURIComponent(productUrl)}`);
    
  } catch (error) {
    console.error('❌ Crawler simulation test failed:', error.message);
  }
  
  console.log('🏁 Social sharing test complete');
};

// Export as window global to use in browser console
window.testSocialSharing = testSocialSharing;

export default testSocialSharing; 