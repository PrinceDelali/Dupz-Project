/**
 * Welcome email template for new users
 * @param {Object} userData - User data for the email
 * @returns {String} - HTML content for the email
 */
const welcomeEmailTemplate = (userData) => {
  // Extract user data with defaults
  const {
    firstName = 'Valued Customer',
    email = '',
    userId = ''
  } = userData || {};

  // Get current year for footer
  const currentYear = new Date().getFullYear();
  
  // Generate URLs
  const frontendUrl = process.env.FRONTEND_URL || 'https://sinosply.com';
  const storeUrl = `${frontendUrl}/sinosply-stores`;
  const privacyPolicyUrl = `${frontendUrl}/privacy-policy`;
  const termsOfServiceUrl = `${frontendUrl}/terms-of-service`;
  const unsubscribeUrl = `${frontendUrl}/account/preferences?email=${encodeURIComponent(email)}&uid=${userId}`;
  
  // Company address
  const companyAddress = 'Sinosply Inc., Accra, Ghana';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Sinosply</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f9f9f9;
    }
    
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }
    
    .email-header {
      background-color: #000000;
      padding: 30px;
      text-align: center;
    }
    
    .logo {
      width: 180px;
      height: auto;
    }
    
    .email-body {
      padding: 30px;
    }
    
    .hero-image {
      width: 100%;
      height: auto;
      margin-bottom: 20px;
      border-radius: 4px;
    }
    
    h1 {
      color: #000000;
      font-size: 24px;
      font-weight: 700;
      margin-top: 0;
      margin-bottom: 16px;
    }
    
    p {
      margin-top: 0;
      margin-bottom: 16px;
      color: #4b5563;
    }
    
    .button {
      display: inline-block;
      background-color: #000000;
      color: #ffffff !important;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 4px;
      font-weight: 600;
      margin-top: 8px;
      margin-bottom: 8px;
      text-align: center;
    }
    
    .features {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-top: 30px;
      margin-bottom: 30px;
    }
    
    .feature {
      display: flex;
      align-items: flex-start;
      gap: 16px;
    }
    
    .feature-icon {
      width: 40px;
      height: 40px;
      background-color: #f3f4f6;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    
    .feature-content {
      flex: 1;
    }
    
    .feature-title {
      font-weight: 600;
      margin-top: 0;
      margin-bottom: 4px;
    }
    
    .feature-description {
      margin: 0;
      color: #6b7280;
      font-size: 14px;
    }
    
    .divider {
      height: 1px;
      background-color: #e5e7eb;
      margin: 30px 0;
    }
    
    .social-links {
      display: flex;
      justify-content: center;
      gap: 16px;
      margin-top: 30px;
    }
    
    .social-link {
      display: inline-block;
      width: 36px;
      height: 36px;
    }
    
    .footer {
      background-color: #f9fafb;
      padding: 20px 30px;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
    }
    
    .footer p {
      margin: 5px 0;
      color: #6b7280;
    }
    
    .footer a {
      color: #6b7280;
      text-decoration: underline;
    }
    
    @media only screen and (max-width: 600px) {
      .email-body {
        padding: 20px;
      }
      
      h1 {
        font-size: 22px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <img src="https://sinosply.com/logo-white.png" alt="Sinosply Logo" class="logo">
    </div>
    
    <div class="email-body">
      <h1>Welcome to Sinosply, ${firstName}!</h1>
      
      <p>We're thrilled to have you join our global community of fashion enthusiasts. Your account has been successfully created, and you're now ready to explore our exclusive collections.</p>
      
      <img src="https://sinosply.com/welcome-banner.jpg" alt="Welcome to Sinosply" class="hero-image">
      
      <p>As a new member, you now have access to:</p>
      
      <div class="features">
        <div class="feature">
          <div class="feature-icon">🌍</div>
          <div class="feature-content">
            <h3 class="feature-title">Global Fashion Collections</h3>
            <p class="feature-description">Discover unique styles from around the world, curated just for you.</p>
          </div>
        </div>
        
        <div class="feature">
          <div class="feature-icon">🎁</div>
          <div class="feature-content">
            <h3 class="feature-title">Exclusive Offers</h3>
            <p class="feature-description">Get early access to sales, promotions, and limited-edition items.</p>
          </div>
        </div>
        
        <div class="feature">
          <div class="feature-icon">⚡</div>
          <div class="feature-content">
            <h3 class="feature-title">Fast Shipping</h3>
            <p class="feature-description">Enjoy expedited shipping options and real-time order tracking.</p>
          </div>
        </div>
      </div>
      
      <p>Ready to start shopping? Explore our latest collection and find your perfect style:</p>
      
      <div style="text-align: center;">
        <a href="${storeUrl}" class="button">Explore Our Collection</a>
      </div>
      
      <div class="divider"></div>
      
      <p>If you have any questions or need assistance, our customer support team is ready to help. Just reply to this email or contact us at <a href="mailto:support@sinosply.com">support@sinosply.com</a>.</p>
      
      <p>Happy shopping!</p>
      
      <p>The Sinosply Team</p>
      
      <div class="social-links">
        <a href="https://instagram.com/sinosply" class="social-link">
          <img src="https://sinosply.com/instagram-icon.png" alt="Instagram">
        </a>
        <a href="https://facebook.com/sinosply" class="social-link">
          <img src="https://sinosply.com/facebook-icon.png" alt="Facebook">
        </a>
        <a href="https://twitter.com/sinosply" class="social-link">
          <img src="https://sinosply.com/twitter-icon.png" alt="Twitter">
        </a>
      </div>
    </div>
    
    <div class="footer">
      <p>© ${currentYear} Sinosply. All rights reserved.</p>
      <p>${companyAddress}</p>
      <p>
        <a href="${privacyPolicyUrl}">Privacy Policy</a> | 
        <a href="${termsOfServiceUrl}">Terms of Service</a> | 
        <a href="${unsubscribeUrl}">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>`;
};

export default welcomeEmailTemplate; 