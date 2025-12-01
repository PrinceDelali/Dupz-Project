import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import asyncHandler from '../middleware/async.js';
import ErrorResponse from '../utils/errorResponse.js';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * @desc    Send a contact form message
 * @route   POST /api/v1/contact
 * @access  Public
 */
export const submitContactForm = asyncHandler(async (req, res, next) => {
  const { name, email, phone, subject, message, forwardTo, originalEmail } = req.body;

  // Validate required fields
  if (!name || !email || !subject || !message) {
    return next(new ErrorResponse('Please provide all required fields', 400));
  }

  // Email to send to (use forwardTo if provided, or default to env variable)
  const recipientEmail = forwardTo || process.env.CONTACT_EMAIL || 'kenwynwejones@gmail.com';
  
  try {
    console.log(`Sending contact form to: ${recipientEmail}`);
    
    // Use Resend for sending email
    const { data, error } = await resend.emails.send({
      from: 'Sinosply Contact <onboarding@resend.dev>',
      to: recipientEmail,
      subject: `[CONTACT FORM] ${subject}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${originalEmail || email}</p>
        ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong> ${message}</p>
      `,
      reply_to: email
    });

    if (error) {
      console.error('Resend API error:', error);
      throw new Error('Failed to send email using Resend');
    }

    console.log('Email sent successfully via Resend with ID:', data?.id);

    res.status(200).json({
      success: true,
      message: 'Your message has been sent successfully!',
      data: { id: data?.id }
    });
  } catch (error) {
    console.error('Error sending email:', error);
    
    // Try with Nodemailer as fallback
    try {
      console.log('Attempting to send via Nodemailer fallback...');
      
      // Create a transporter using SMTP or a service like Gmail
      const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD
        }
      });

      // Email content
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@sinosply.com',
        to: recipientEmail,
        subject: `[CONTACT FORM] ${subject}`,
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${originalEmail || email}</p>
          ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong> ${message}</p>
        `,
        replyTo: email
      };

      // Send the email
      await transporter.sendMail(mailOptions);
      
      res.status(200).json({
        success: true,
        message: 'Your message has been sent successfully via fallback!',
      });
    } catch (fallbackError) {
      console.error('Fallback email also failed:', fallbackError);
      return next(new ErrorResponse('Unable to send email at this time. Please try again later.', 500));
    }
  }
});

export default {
  submitContactForm
}; 