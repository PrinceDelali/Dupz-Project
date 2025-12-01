import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env');

console.log(`Loading environment variables from: ${envPath}`);

// Directly read and parse the .env file
try {
  const envFile = fs.readFileSync(envPath, 'utf8');
  const envVars = envFile.split('\n');
  
  envVars.forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      if (key && value) {
        process.env[key] = value;
      }
    }
  });
  
  console.log('Environment variables loaded successfully');
  console.log('GOOGLE_CLIENT_ID present:', !!process.env.GOOGLE_CLIENT_ID);
  console.log('GOOGLE_CLIENT_SECRET present:', !!process.env.GOOGLE_CLIENT_SECRET);
} catch (err) {
  console.error('Error loading .env file:', err.message);
  console.error('Current working directory:', process.cwd());
}

// Export to verify it's been loaded
export default {
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  FRONTEND_URL: process.env.FRONTEND_URL
}; 