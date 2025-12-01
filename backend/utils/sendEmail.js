import { Resend } from 'resend';

const sendEmail = async (options) => {
  // Check environment variables and log their status
  console.log('🔧 [sendEmail] Email environment configuration check:', {
    resendApiKeyPresent: !!process.env.RESEND_API_KEY,
    fromEmailConfigured: !!process.env.FROM_EMAIL,
    fromEmail: process.env.FROM_EMAIL || 'orders@sinosply.com',
    fromName: process.env.FROM_NAME || 'Sinosply',
    nodeEnv: process.env.NODE_ENV || 'development',
    domainVerified: true // We assume the domain is verified since you confirmed it
  });

  console.log('📧 [sendEmail] Starting email sending process...', {
    recipient: options.email,
    subject: options.subject,
    hasHtmlContent: !!options.html,
    contentLength: options.html?.length || 0
  });
  
  // Check if Resend API key is available
  const resendApiKey = process.env.RESEND_API_KEY;
  
  if (!resendApiKey) {
    console.error('❌ [sendEmail] No Resend API key found. Email cannot be sent.');
    return {
      success: false,
      error: 'Missing Resend API key configuration',
      provider: 'resend'
    };
  }
  
  try {
    console.log('📧 [sendEmail] Using Resend API for email delivery');
    const resend = new Resend(resendApiKey);
    
    // Use verified domain for sender email
    const from = process.env.FROM_EMAIL 
      ? `${process.env.FROM_NAME || 'Sinosply'} <${process.env.FROM_EMAIL}>`
      : 'Sinosply <orders@sinosply.com>'; // Using verified domain
    
    console.log(`📧 [sendEmail] Sender email: ${from}`);
    console.log(`📧 [sendEmail] Recipient: ${options.email}`);
    
    // Log API key prefix for debugging (never log the entire key)
    const apiKeyPrefix = resendApiKey.substring(0, 5) + '...';
    console.log(`📧 [sendEmail] Using Resend API key: ${apiKeyPrefix}`);
    
    const payload = {
      from,
      to: options.email,
      subject: options.subject,
      html: options.html,
      // Add reply-to if needed
      reply_to: process.env.REPLY_TO_EMAIL || 'support@sinosply.com',
    };
    
    console.log('📧 [sendEmail] Sending email with payload:', {
      from: payload.from,
      to: payload.to,
      subject: payload.subject,
      replyTo: payload.reply_to,
      htmlContentLength: payload.html?.length || 0
    });
    
    // Send the email
    const { data, error } = await resend.emails.send(payload);
    
    if (error) {
      console.error('❌ [sendEmail] Error from Resend API:', {
        error: error.message,
        code: error.statusCode,
        name: error.name
      });
      return {
        success: false,
        error: `Resend API error: ${error.message}`,
        provider: 'resend',
        errorDetails: {
          code: error.statusCode,
          name: error.name
        }
      };
    }
    
    console.log('✅ [sendEmail] Email sent successfully:', {
      id: data?.id,
      to: options.email
    });
    
    return {
      success: true,
      messageId: data?.id,
      provider: 'resend'
    };
  } catch (error) {
    console.error('❌ [sendEmail] Exception sending email:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    return {
      success: false,
      error: `Email sending failed: ${error.message}`,
      provider: 'resend',
      errorDetails: {
        name: error.name,
        stack: error.stack?.split('\n')[0] || 'No stack trace'
      }
    };
  }
};

export default sendEmail; 