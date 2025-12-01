import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '.env');

console.log(`Testing .env file at: ${envPath}`);
console.log(`File exists: ${fs.existsSync(envPath)}`);

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  console.log('File content (first 100 chars):', content.substring(0, 100));
  
  // Parse and log Google credentials
  const lines = content.split('\n');
  lines.forEach(line => {
    if (line.startsWith('GOOGLE_CLIENT_ID=')) {
      console.log('Found GOOGLE_CLIENT_ID in file');
    }
    if (line.startsWith('GOOGLE_CLIENT_SECRET=')) {
      console.log('Found GOOGLE_CLIENT_SECRET in file');
    }
  });
} 