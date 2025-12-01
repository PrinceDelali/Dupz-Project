import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';
import ENV from './envLoader.js';

console.log('Direct Passport Setup Starting...');

// Log the environment variables that we're working with
console.log('ENV check in passportSetup:', {
  GOOGLE_ID_EXISTS: !!ENV.GOOGLE_CLIENT_ID,
  GOOGLE_ID_LENGTH: ENV.GOOGLE_CLIENT_ID ? ENV.GOOGLE_CLIENT_ID.length : 0,
  GOOGLE_SECRET_EXISTS: !!ENV.GOOGLE_CLIENT_SECRET,
});

// Configure Google Strategy using our centralized environment variables
if (ENV.GOOGLE_CLIENT_ID && ENV.GOOGLE_CLIENT_SECRET) {
  console.log('Google credentials found from central loader, initializing strategy');
  
  passport.use(
    new GoogleStrategy(
      {
        clientID: ENV.GOOGLE_CLIENT_ID,
        clientSecret: ENV.GOOGLE_CLIENT_SECRET,
        callbackURL: 'http://localhost:5000/api/v1/auth/google/callback'
      },
      async (accessToken, refreshToken, profile, done) => {
        console.log('Google OAuth callback received for:', profile.emails?.[0]?.value);
        
        try {
          let user = await User.findOne({ email: profile.emails?.[0]?.value });
          
          if (user) {
            console.log('Existing user found:', user.id);
            return done(null, user);
          }

          user = await User.create({
            firstName: profile.name?.givenName || 'Google',
            lastName: profile.name?.familyName || 'User',
            email: profile.emails?.[0]?.value,
            password: profile.id + (ENV.JWT_SECRET || 'default-jwt-secret'),
          });

          console.log('New user created:', user.id);
          done(null, user);
        } catch (err) {
          console.error('Error in Google Strategy:', err);
          done(err, null);
        }
      }
    )
  );
  console.log('Google Strategy initialized successfully');
} else {
  console.error('ERROR: Could not find Google credentials in central ENV loader');
  console.error('Available environment keys:', Object.keys(ENV).join(', '));
}

console.log('Passport strategies after setup:', Object.keys(passport._strategies));

export default passport; 