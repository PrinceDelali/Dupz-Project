import { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import '../styles/Contact.css';
import apiConfig from '../config/apiConfig';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      // Create the submission data with original email and the forwarding address
      const submissionData = {
        ...formData,
        forwardTo: 'kenwynwejones@gmail.com', // Always send to this verified email
        originalEmail: formData.email // Keep track of the customer's email
      };
      
      console.log('Sending contact form submission to:', `${apiConfig.baseURL}/contact`);
      console.log('Form data:', submissionData);
      
      const response = await axios.post(`${apiConfig.baseURL}/contact`, submissionData);
      
      setStatus({ type: 'success', message: 'Message sent successfully! We will get back to you soon.' });
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      console.error('Contact form submission error:', error);
      
      // For development: try using Resend directly as fallback
      try {
        console.log('Attempting fallback email delivery via Resend...');
        await axios.post('https://api.resend.com/emails', {
          from: 'onboarding@resend.dev',
          to: 'kenwynwejones@gmail.com',
          subject: `[SINOSPLY CONTACT] ${formData.subject}`,
          html: `
            <h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${formData.name}</p>
            <p><strong>Email:</strong> ${formData.email}</p>
            <p><strong>Subject:</strong> ${formData.subject}</p>
            <p><strong>Message:</strong> ${formData.message}</p>
          `
        }, {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_RESEND_API_KEY || 'your-resend-api-key'}`
          }
        });
        
        setStatus({ type: 'success', message: 'Message sent successfully! We will get back to you soon.' });
        setFormData({ name: '', email: '', subject: '', message: '' });
      } catch (fallbackError) {
        console.error('Fallback email delivery failed:', fallbackError);
        setStatus({ 
          type: 'error', 
          message: 'Unable to send your message at this time. Please try again later or contact us directly at support@sinosply.com.'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      className="contact-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="contact-content">
        <div className="contact-info">
          <h1>Get in Touch</h1>
          <p>We'd love to hear from you. Please fill out this form.</p>
          
          <div className="contact-details">
            <div className="contact-item">
              <h3>Email</h3>
              <p>support@sinosply.com</p>
            </div>
            <div className="contact-item">
              <h3>Phone</h3>
              <p>+233 559181818</p>
            </div>
            <div className="contact-item">
              <h3>Address</h3>
              <p>123 Fashion Street<br />New York, NY 10001</p>
            </div>
          </div>
        </div>

        <div className="contact-form">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Your name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="your@email.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="subject">Subject</label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                placeholder="How can we help?"
              />
            </div>

            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                placeholder="Tell us more about your inquiry..."
                rows="5"
              />
            </div>

            {status.message && (
              <div className={`status-message ${status.type}`}>
                {status.message}
              </div>
            )}

            <button 
              type="submit" 
              className="submit-button"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  );
};

export default Contact;
