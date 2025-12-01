import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In production (like Render), we'll use the environment variables set in the platform
// In development, we'll load from .env file
if (process.env.NODE_ENV !== 'production') {
  console.log('Loading environment from .env file (development mode)');
  dotenv.config({ path: path.join(__dirname, '..', '.env') });
} else {
  console.log('Using environment variables from platform (production mode)');
}

// Create a consolidated ENV object that prioritizes process.env
const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI,
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRE: process.env.JWT_EXPIRE || '30d',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  EMAIL_SERVICE: process.env.EMAIL_SERVICE,
  EMAIL_USERNAME: process.env.EMAIL_USERNAME,
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
  EMAIL_FROM: process.env.EMAIL_FROM,
};

// Log available environment variables (but not their values for security)
console.log('Environment variables loaded:', Object.keys(ENV).join(', '));

export default ENV; 