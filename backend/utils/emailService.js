import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Handlebars from 'handlebars';
import sendEmail from './sendEmail.js';

// Get directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const templatesDir = path.join(__dirname, '../templates/emails');

// Register handlebars helpers
Handlebars.registerHelper('multiply', function(a, b) {
  return (parseFloat(a) * parseFloat(b)).toFixed(2);
});

// Add equals helper for comparing values in templates
Handlebars.registerHelper('equals', function(a, b, options) {
  return a === b ? options.fn(this) : options.inverse(this);
});

// Format date helper
Handlebars.registerHelper('formatDate', function(date) {
  if (!date) return '';
  const options = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return new Date(date).toLocaleDateString('en-US', options);
});

// Configure Handlebars for safer usage
Handlebars.registerHelper('safeVal', function(value, defaultValue) {
  return value !== undefined && value !== null ? value : (defaultValue || '');
});

/**
 * Load and compile an email template
 * @param {string} templateName - The name of the template file without extension
 * @returns {Function} - Compiled Handlebars template function
 */
const loadTemplate = (templateName) => {
  try {
    const templatePath = path.join(templatesDir, `${templateName}.html`);
    console.log(`Loading email template: ${templatePath}`);
    
    // Check if the template file exists
    if (!fs.existsSync(templatePath)) {
      console.error(`Email template not found: ${templatePath}`);
      throw new Error(`Email template not found: ${templateName}.html`);
    }
    
    const templateSource = fs.readFileSync(templatePath, 'utf-8');
    console.log(`Template loaded successfully, length: ${templateSource.length} characters`);
    
    // Compile with security settings to avoid prototype access warnings
    return Handlebars.compile(templateSource, {
      strict: false,
      assumeObjects: true,
      noEscape: false,
      preventIndent: true,
      explicitPartialContext: true,
      knownHelpersOnly: false,
      knownHelpers: {
        multiply: true,
        formatDate: true,
        safeVal: true
      }
    });
  } catch (error) {
    console.error(`Error loading template ${templateName}:`, error);
    throw new Error(`Failed to load email template: ${error.message}`);
  }
};

/**
 * Safely format and sanitize order data before template rendering
 */
const sanitizeOrderData = (order) => {
  console.log('Sanitizing order data for email template rendering');
  
  try {
    // Ensure all required properties exist and have valid formats
    const sanitized = {
      orderNumber: order.orderNumber || `ORD-${Date.now()}`,
      customerName: order.customerName || 'Valued Customer',
      trackingNumber: order.trackingNumber || 'N/A',
      shippingMethod: order.shippingMethod || 'Standard Shipping',
      estimatedDelivery: order.estimatedDelivery || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      subtotal: typeof order.subtotal === 'number' ? order.subtotal : 0,
      shipping: typeof order.shipping === 'number' ? order.shipping : 0,
      tax: typeof order.tax === 'number' ? order.tax : 0,
      discount: typeof order.discount === 'number' ? order.discount : 0,
      totalAmount: typeof order.totalAmount === 'number' ? order.totalAmount : 0,
      items: Array.isArray(order.items) ? order.items.map(item => ({
        name: item.name || 'Product',
        price: typeof item.price === 'number' ? item.price : 0,
        quantity: typeof item.quantity === 'number' ? item.quantity : 1,
        image: item.image || 'https://via.placeholder.com/100x100?text=Product',
        variant: {
          color: item.variant?.color || item.color || null,
          size: item.variant?.size || item.size || null
        }
      })) : [],
      shippingAddress: {
        name: order.shippingAddress?.name || order.customerName || 'Customer',
        street: order.shippingAddress?.street || order.shippingAddress?.address1 || 'N/A',
        addressLine2: order.shippingAddress?.addressLine2 || order.shippingAddress?.address2 || null,
        city: order.shippingAddress?.city || 'N/A',
        state: order.shippingAddress?.state || 'N/A',
        zip: order.shippingAddress?.zip || order.shippingAddress?.zipCode || 'N/A',
        country: order.shippingAddress?.country || 'N/A',
        phone: order.shippingAddress?.phone || 'N/A'
      },
      createdAt: order.createdAt || new Date(),
      status: order.status || 'Processing',
      paymentMethod: order.paymentMethod || 'Credit Card',
      receiptId: order.receiptId || `RCP-${Date.now()}`
    };
    
    console.log('Order data sanitized successfully');
    return sanitized;
  } catch (error) {
    console.error('Error sanitizing order data:', error);
    // Return basic data even if sanitization fails
    return {
      orderNumber: order.orderNumber || `ORD-${Date.now()}`,
      customerName: 'Valued Customer',
      items: [],
      shippingAddress: {},
      subtotal: 0,
      tax: 0,
      shipping: 0,
      discount: 0,
      totalAmount: 0
    };
  }
};

/**
 * Send order confirmation email to customer
 * @param {Object} order - Order object with all details
 * @param {Object} config - Additional configuration options
 * @returns {Promise} - Email sending result
 */
export const sendOrderConfirmationEmail = async (order, config = {}) => {
  try {
    console.log('Preparing order confirmation email for customer');
    console.log('Order data summary:', {
      orderNumber: order.orderNumber,
      customerEmail: order.customerEmail,
      totalAmount: order.totalAmount,
      items: Array.isArray(order.items) ? order.items.length : 0
    });
    
    if (!order.customerEmail) {
      console.error('Cannot send order confirmation: Missing customer email address');
      return { success: false, error: 'Missing customer email address' };
    }
    
    // Compile template
    const template = loadTemplate('orderConfirmation');
    
    // Parse order data for the template
    const frontendUrl = process.env.FRONTEND_URL || 'https://sinosply.com';
    
    // Format estimated delivery date
    let estimatedDeliveryFormatted = 'Processing';
    if (order.estimatedDelivery) {
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      estimatedDeliveryFormatted = new Date(order.estimatedDelivery).toLocaleDateString('en-US', options);
    }
    
    // Sanitize order data
    const sanitizedOrder = sanitizeOrderData(order);
    
    // Prepare template data
    const templateData = {
      orderNumber: sanitizedOrder.orderNumber,
      customerName: sanitizedOrder.customerName,
      trackingNumber: sanitizedOrder.trackingNumber,
      trackingUrl: `${frontendUrl}/track/${sanitizedOrder.trackingNumber}`,
      supportUrl: `${frontendUrl}/contact`,
      privacyPolicyUrl: `${frontendUrl}/privacy-policy`,
      termsOfServiceUrl: `${frontendUrl}/terms-of-service`,
      shippingAddress: sanitizedOrder.shippingAddress,
      shippingMethod: sanitizedOrder.shippingMethod,
      estimatedDelivery: estimatedDeliveryFormatted,
      items: sanitizedOrder.items,
      subtotal: sanitizedOrder.subtotal.toFixed(2),
      shipping: sanitizedOrder.shipping.toFixed(2),
      tax: sanitizedOrder.tax.toFixed(2),
      discount: sanitizedOrder.discount ? sanitizedOrder.discount.toFixed(2) : null,
      totalAmount: sanitizedOrder.totalAmount.toFixed(2),
      currentYear: new Date().getFullYear(),
      companyAddress: config.companyAddress || 'Sinosply Inc., Accra, Ghana',
      receiptId: sanitizedOrder.receiptId
    };
    
    // Render HTML content
    console.log('Rendering order confirmation email template');
    const html = template(templateData);
    console.log(`Email template rendered successfully, length: ${html.length} characters`);
    
    // Create debug log file for troubleshooting
    if (process.env.NODE_ENV !== 'production') {
      try {
        const debugDir = path.join(__dirname, '../temp/email-debug');
        if (!fs.existsSync(debugDir)) {
          fs.mkdirSync(debugDir, { recursive: true });
        }
        fs.writeFileSync(
          path.join(debugDir, `customer-${sanitizedOrder.orderNumber}.html`), 
          html, 
          'utf8'
        );
        console.log(`Debug email template saved to temp/email-debug/customer-${sanitizedOrder.orderNumber}.html`);
      } catch (err) {
        console.error('Could not save debug email template:', err);
      }
    }
    
    // Send email
    console.log(`Sending order confirmation to customer email: ${order.customerEmail}`);
    const result = await sendEmail({
      email: order.customerEmail,
      subject: `Order Confirmation #${sanitizedOrder.orderNumber}`,
      html
    });
    
    if (result.success) {
      console.log('Order confirmation email sent successfully to customer', order.customerEmail);
      if (result.previewUrl) {
        console.log('Preview URL for email:', result.previewUrl);
      }
    } else {
      console.error('Failed to send customer email:', result.error);
    }
    
    return result;
  } catch (error) {
    console.error('Failed to send order confirmation email:', error);
    return {
      success: false,
      error: `Order confirmation email failed: ${error.message}`,
      stack: error.stack
    };
  }
};

/**
 * Send new order notification email to admin
 * @param {Object} order - Order object with all details
 * @param {string} adminEmail - Admin email address
 * @param {Object} config - Additional configuration options
 * @returns {Promise} - Email sending result
 */
export const sendAdminOrderNotification = async (order, adminEmail, config = {}) => {
  try {
    console.log('Preparing order notification email for admin');
    
    if (!adminEmail) {
      console.error('Cannot send admin notification: Missing admin email address');
      return { success: false, error: 'Missing admin email address' };
    }
    
    // Compile template
    const template = loadTemplate('adminOrderNotification');
    
    // Parse order data for the template
    const adminDashboardUrl = process.env.ADMIN_DASHBOARD_URL || 'https://admin.sinosply.com';
    
    // Sanitize order data
    const sanitizedOrder = sanitizeOrderData(order);
    
    // Format order date
    const orderDate = new Date(sanitizedOrder.createdAt).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Prepare template data
    const templateData = {
      orderNumber: sanitizedOrder.orderNumber,
      orderDate: orderDate,
      customerName: sanitizedOrder.customerName,
      customerEmail: order.customerEmail || 'Not Provided',
      adminOrderUrl: `${adminDashboardUrl}/orders/${order._id || sanitizedOrder.orderNumber}`,
      shippingAddress: sanitizedOrder.shippingAddress,
      shippingMethod: sanitizedOrder.shippingMethod,
      paymentMethod: sanitizedOrder.paymentMethod,
      status: sanitizedOrder.status,
      items: sanitizedOrder.items,
      subtotal: sanitizedOrder.subtotal.toFixed(2),
      shipping: sanitizedOrder.shipping.toFixed(2),
      tax: sanitizedOrder.tax.toFixed(2),
      discount: sanitizedOrder.discount ? sanitizedOrder.discount.toFixed(2) : null,
      totalAmount: sanitizedOrder.totalAmount.toFixed(2),
      currentYear: new Date().getFullYear(),
      isNewCustomer: config.isNewCustomer || false
    };
    
    // Render HTML content
    console.log('Rendering admin notification email template');
    const html = template(templateData);
    console.log(`Admin email template rendered successfully, length: ${html.length} characters`);
    
    // Create debug log file for troubleshooting
    if (process.env.NODE_ENV !== 'production') {
      try {
        const debugDir = path.join(__dirname, '../temp/email-debug');
        if (!fs.existsSync(debugDir)) {
          fs.mkdirSync(debugDir, { recursive: true });
        }
        fs.writeFileSync(
          path.join(debugDir, `admin-${sanitizedOrder.orderNumber}.html`), 
          html, 
          'utf8'
        );
        console.log(`Debug admin email template saved to temp/email-debug/admin-${sanitizedOrder.orderNumber}.html`);
      } catch (err) {
        console.error('Could not save debug admin email template:', err);
      }
    }
    
    // Send email
    console.log(`Sending order notification to admin email: ${adminEmail}`);
    const result = await sendEmail({
      email: adminEmail,
      subject: `New Order #${sanitizedOrder.orderNumber} - Action Required`,
      html
    });
    
    if (result.success) {
      console.log('Order notification email sent successfully to admin', adminEmail);
      if (result.previewUrl) {
        console.log('Preview URL for admin email:', result.previewUrl);
      }
    } else {
      console.error('Failed to send admin email:', result.error);
    }
    
    return result;
  } catch (error) {
    console.error('Failed to send admin order notification email:', error);
    return {
      success: false,
      error: `Admin notification email failed: ${error.message}`,
      stack: error.stack
    };
  }
};

/**
 * Send order emails to both customer and admins
 * @param {Object} order - Order object with all details
 * @param {Object} options - Additional options for email customization
 * @returns {Promise<Object>} - Results of email sending operations
 */
export const sendOrderEmails = async (order, options = {}) => {
  try {
    console.log('Sending order emails for order:', order.orderNumber);
    
    // Validate required order fields
    if (!order.orderNumber) {
      console.error('Missing order number in email request');
      return { success: false, error: 'Missing order number' };
    }
    
    if (!order.customerEmail) {
      console.warn('Missing customer email address, cannot send customer confirmation');
    }
    
    // Get admin email from environment or fallback
    const adminEmail = process.env.ADMIN_EMAIL || options.adminEmail || 'admin@sinosply.com';
    console.log(`Using admin email address: ${adminEmail}`);
    
    // Prepare email data
    console.log('Order data for emails:', {
      orderNumber: order.orderNumber,
      customerEmail: order.customerEmail,
      shippingAddress: order.shippingAddress ? 'Present' : 'Missing',
      items: Array.isArray(order.items) ? `${order.items.length} items` : 'Not an array',
      totalAmount: order.totalAmount
    });
    
    // Status variables for tracking
    let customerEmailSuccess = false;
    let adminEmailSuccess = false;
    let customerEmailResult = null;
    let adminEmailResult = null;
    
    // If customer email is provided, send customer confirmation
    if (order.customerEmail) {
      try {
        customerEmailResult = await sendOrderConfirmationEmail(order, options);
        customerEmailSuccess = customerEmailResult.success;
      } catch (custErr) {
        console.error('Error sending customer email:', custErr);
        customerEmailResult = { 
          success: false, 
          error: custErr.message, 
          stack: custErr.stack 
        };
      }
    }
    
    // Send admin notification regardless
    try {
      adminEmailResult = await sendAdminOrderNotification(order, adminEmail, options);
      adminEmailSuccess = adminEmailResult.success;
    } catch (adminErr) {
      console.error('Error sending admin email:', adminErr);
      adminEmailResult = { 
        success: false, 
        error: adminErr.message, 
        stack: adminErr.stack 
      };
    }
    
    // Determine overall result
    const overallSuccess = (order.customerEmail ? customerEmailSuccess : true) && adminEmailSuccess;
    
    // Log summary
    console.log(`Email sending summary for order ${order.orderNumber}:`, {
      customerEmailSent: order.customerEmail ? customerEmailSuccess : 'Not attempted (no email)',
      adminEmailSent: adminEmailSuccess,
      overallSuccess
    });
    
    return {
      success: overallSuccess,
      customerEmail: customerEmailResult,
      adminEmail: adminEmailResult
    };
  } catch (error) {
    console.error('Error in sendOrderEmails function:', error);
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }
};

export default {
  sendOrderConfirmationEmail,
  sendAdminOrderNotification,
  sendOrderEmails
}; 