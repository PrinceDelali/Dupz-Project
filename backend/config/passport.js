import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';
import { oauthConfig } from './oauth.js';

console.log('Passport Configuration Starting');

passport.serializeUser((user, done) => {
  console.log('Serializing user:', user.id);
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  console.log('Deserializing user:', id);
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    console.error('Error deserializing user:', err);
    done(err, null);
  }
});

// The key issue was here - directly accessing env vars
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  console.log('Google credentials found, initializing strategy');
  
  passport.use(new GoogleStrategy(oauthConfig.google,
    async (accessToken, refreshToken, profile, done) => {
      console.log('Google OAuth callback received for:', profile.emails[0].value);
      
      try {
        let user = await User.findOne({ email: profile.emails[0].value });
        
        if (user) {
          console.log('Existing user found:', user.id);
          return done(null, user);
        }

        user = await User.create({
          firstName: profile.name.givenName,
          lastName: profile.name.familyName,
          email: profile.emails[0].value,
          password: profile.id + process.env.JWT_SECRET,
        });

        console.log('New user created:', user.id);
        done(null, user);
      } catch (err) {
        console.error('Error in Google Strategy:', err);
        done(err, null);
      }
    }
  ));
  console.log('Google Strategy initialized successfully');
} else {
  console.error('Google OAuth credentials missing - Strategy not initialized');
  console.error('GOOGLE_CLIENT_ID present:', !!process.env.GOOGLE_CLIENT_ID);
  console.error('GOOGLE_CLIENT_SECRET present:', !!process.env.GOOGLE_CLIENT_SECRET);
} 