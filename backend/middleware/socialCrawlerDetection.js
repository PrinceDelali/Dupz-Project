/**
 * Middleware to detect social media crawlers and bots
 * This helps provide optimized responses for platforms like WhatsApp, Facebook, Twitter, etc.
 */

// List of known social media crawler user agents
const SOCIAL_CRAWLER_AGENTS = [
  'whatsapp',
  'facebookexternalhit',
  'facebot',
  'twitterbot',
  'linkedinbot',
  'telegrambot',
  'slackbot',
  'viberbot',
  'discordbot',
  'pinterest',
  'snapchat',
  'line-bot'
];

// Regex pattern for bot detection
const BOT_PATTERN = /bot|crawler|spider|googlebot|mediapartners|adsbot|slurp|duckduckbot|bingbot|yandex|baidu|archive|facebook/i;

/**
 * Detects if the current request is from a social media crawler or bot
 */
const isSocialCrawler = (req) => {
  const userAgent = req.headers['user-agent'] || '';
  
  // Check if user agent contains any known social crawler strings
  const isSocialMatch = SOCIAL_CRAWLER_AGENTS.some(agent => 
    userAgent.toLowerCase().includes(agent)
  );
  
  // Check if it matches general bot pattern
  const isBotMatch = BOT_PATTERN.test(userAgent);
  
  // Additional check for Facebook crawler
  const isFacebookCrawler = req.headers['x-purpose'] === 'preview' || 
                          Boolean(req.headers['facebook-app-id']);
                          
  // Return true if any of our checks matched
  return isSocialMatch || isBotMatch || isFacebookCrawler;
};

/**
 * Middleware function to detect social media crawlers and handle product page requests
 */
const socialCrawlerDetection = (req, res, next) => {
  // Only process GET requests
  if (req.method !== 'GET') return next();
  
  // Check if this is a social crawler
  if (isSocialCrawler(req)) {
    // Add a flag to the request object
    req.isSocialCrawler = true;
    
    // Check if this is a product page request by URL pattern
    const productPattern = /\/product\/([a-f0-9]+)/i;
    const match = req.originalUrl.match(productPattern);
    
    if (match && match[1]) {
      const productId = match[1];
      const origin = req.headers.origin || '';
      
      // Get the domain to use for redirects (supports multiple domains)
      let redirectDomain;
      if (origin.includes('sinosply.com')) {
        redirectDomain = 'https://www.sinosply.com';
      } else if (origin.includes('bunnyandwolf.vercel.app')) {
        redirectDomain = 'https://bunnyandwolf.vercel.app';
      } else {
        // Default to main domain
        redirectDomain = process.env.FRONTEND_URL || 'https://www.sinosply.com';
      }
      
      // For product pages, redirect to our special social preview endpoint
      // This will handle serving optimized metadata for social media platforms
      if (process.env.NODE_ENV === 'production') {
        // In production, redirect to our dedicated endpoint
        return res.redirect(`/api/v1/seo/social-preview/${productId}`);
      }
    }
  }
  
  // Continue to next middleware for non-crawler requests
  next();
};

export default socialCrawlerDetection; 