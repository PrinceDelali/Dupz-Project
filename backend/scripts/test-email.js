// Test email sending with Resend
import dotenv from 'dotenv';
import { Resend } from 'resend';
import sendEmail from '../utils/sendEmail.js';

// Load environment variables
dotenv.config();

// Always use Resend's test email for development
const RESEND_TEST_EMAIL = 'kenwynwejones@gmail.com';

// Test direct Resend API use
const testResendDirectly = async () => {
  console.log('Testing direct Resend API...');
  const resendApiKey = process.env.RESEND_API_KEY;
  
  if (!resendApiKey) {
    console.log('❌ No Resend API key found in environment variables.');
    return;
  }
  
  try {
    const resend = new Resend(resendApiKey);
    
    console.log(`Sending email via direct Resend API to ${RESEND_TEST_EMAIL}...`);
    const { data, error } = await resend.emails.send({
      from: 'Acme <onboarding@resend.dev>',
      to: [RESEND_TEST_EMAIL],
      subject: 'Direct Resend API Test',
      html: '<strong>It works! Sent directly using Resend API.</strong>',
    });
    
    if (error) {
      console.error('❌ Direct Resend API Error:', error);
      return;
    }
    
    console.log('✅ Direct Resend API test successful!');
    console.log('Response:', data);
  } catch (error) {
    console.error('❌ Direct Resend API error:', error);
  }
};

// Test our integrated email service
const testEmailService = async () => {
  console.log('\nTesting integrated email service...');
  console.log('Environment check:');
  console.log('- RESEND_API_KEY set:', !!process.env.RESEND_API_KEY);
  console.log('- FROM_EMAIL set:', !!process.env.FROM_EMAIL);
  console.log(`- Using Resend test email: ${RESEND_TEST_EMAIL}`);
  
  try {
    const result = await sendEmail({
      email: RESEND_TEST_EMAIL, // Use Resend's test email
      subject: 'Test Email from Sinosply',
      html: `
        <h1>Test Email</h1>
        <p>This is a test email from Sinosply using the Resend email service.</p>
        <p>If you're seeing this, the email configuration is working properly!</p>
        <p>Email provider: Resend</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
      `
    });
    
    console.log('Email test result:', result);
    
    if (result.success) {
      console.log('✅ Email service test successful!');
      console.log('   Using Resend API for delivery');
    } else {
      console.log('❌ Email service test failed!');
      console.log('Error:', result.error);
    }
  } catch (error) {
    console.error('Unexpected error during test:', error);
  }
};

// Run both tests
(async function() {
  await testResendDirectly();
  await testEmailService();
})(); 