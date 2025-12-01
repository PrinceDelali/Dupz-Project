// Test script for Resend email service
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { Resend } from 'resend';

// Get directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envPath = path.join(__dirname, '.env');
console.log(`Checking for .env file at: ${envPath}`);

try {
  if (fs.existsSync(envPath)) {
    console.log('Found .env file, loading environment variables');
    dotenv.config({ path: envPath });
  } else {
    console.log('No .env file found, will use environment variables from platform');
    dotenv.config();
  }
} catch (err) {
  console.error('Error checking for .env file:', err.message);
  dotenv.config();
}

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Create a test email
async function sendTestEmail() {
  console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'Found (first 4 chars: ' + process.env.RESEND_API_KEY.slice(0, 4) + '...)' : 'Not found');
  
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to: ['test@example.com'], // Replace with your email
      subject: 'Sinosply Email Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Sinosply Email Test</h1>
          <p>This is a test email from Sinosply using Resend.</p>
          <p>If you're seeing this, the email service is working correctly!</p>
          <hr />
          <p style="color: #666; font-size: 12px;">
            Timestamp: ${new Date().toISOString()}<br>
            Environment: ${process.env.NODE_ENV || 'development'}
          </p>
        </div>
      `,
    });

    console.log('Email sent successfully!');
    console.log('Response:', data);
    
    if (error) {
      console.error('Error details:', error);
      throw new Error(error.message);
    }
    
    return data;
  } catch (error) {
    console.error('Failed to send email:', error.message);
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
    throw error;
  }
}

// Run the test
sendTestEmail()
  .then(() => {
    console.log('Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  }); 