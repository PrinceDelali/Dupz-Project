export const oauthConfig = {
  google: {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'http://sinosply-backend.onrender.com/api/v1/auth/google/callback'
  },
  facebook: {
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: 'http://sinosply-backend.onrender.com/api/v1/auth/facebook/callback'
  },
  github: {
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: 'http://sinosply-backend.onrender.com/api/v1/auth/github/callback'
  },
  twitter: {
    clientID: process.env.TWITTER_CLIENT_ID,
    clientSecret: process.env.TWITTER_CLIENT_SECRET,
    callbackURL: 'http://sinosply-backend.onrender.com/api/v1/auth/twitter/callback'
  },
  apple: {
    clientID: process.env.APPLE_CLIENT_ID,
    clientSecret: process.env.APPLE_CLIENT_SECRET,
    callbackURL: 'http://sinosply-backend.onrender.com/api/v1/auth/apple/callback'
  }
};

// Debug the OAuth config
console.log('OAuth Config Initialized:', {
  googleClientIdPresent: !!oauthConfig.google.clientID,
  googleClientIdLength: oauthConfig.google.clientID?.length || 0,
  googleClientSecretPresent: !!oauthConfig.google.clientSecret,
  googleCallbackURL: oauthConfig.google.callbackURL
}); 