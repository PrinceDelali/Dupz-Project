/**
 * Order status update email template
 * Generates the HTML for order status update emails
 */
const orderStatusUpdateTemplate = (orderDetails) => {
  // Helper function to get status description
  const getStatusDescription = (status) => {
    switch(status?.toLowerCase()) {
      case 'pending':
        return "Your order has been received and is waiting for payment confirmation.";
      case 'processing':
        return "Your payment has been confirmed, and we're preparing your order.";
      case 'shipped':
        return "Your order has been shipped and is on its way to you!";
      case 'delivered':
        return "Your order has been delivered. We hope you enjoy your purchase!";
      case 'cancelled':
        return "Your order has been cancelled. If you didn't request this, please contact customer support.";
      case 'refunded':
        return "Your order has been refunded. The amount should reflect in your account within 3-5 business days.";
      default:
        return "Your order status has been updated.";
    }
  };

  // Get the appropriate status description
  const statusDescription = getStatusDescription(orderDetails.status);
  
  // Format date helper function
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Create a safe customer name fallback
  const customerName = orderDetails.customerName || orderDetails.customer?.name || 'Valued Customer';
  
  // Generate frontend URL for tracking
  const frontendUrl = process.env.FRONTEND_URL || 'https://sinosply.com';
  const trackingUrl = orderDetails.trackingUrl || 
    `${frontendUrl}/track-order/${orderDetails.orderNumber || orderDetails._id}?source=email`;
  
  // Get current year for copyright
  const currentYear = new Date().getFullYear();
  
  // Conditional status badge class
  const getStatusBadgeClass = (status) => {
    if (!status) return 'status-processing';
    
    switch(status.toLowerCase()) {
      case 'pending': return 'status-pending';
      case 'processing': return 'status-processing';
      case 'shipped': return 'status-shipped';
      case 'delivered': return 'status-delivered';
      case 'cancelled': return 'status-cancelled';
      case 'refunded': return 'status-refunded';
      default: return 'status-processing';
    }
  };
  
  // Return the HTML template with orderDetails inserted
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Sinosply Order Status Update</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

    body {
      font-family: 'Poppins', Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
      color: #333333;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .header {
      background-color: #7c4dff;
      padding: 24px;
      text-align: center;
    }

    .logo {
      max-height: 50px;
      width: auto;
    }

    .content {
      padding: 24px;
    }

    .section {
      margin-bottom: 24px;
    }

    .status-badge {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: 600;
      font-size: 14px;
      letter-spacing: 0.5px;
      text-align: center;
    }
    
    .status-pending {
      background-color: #fff8e1;
      color: #f57c00;
    }
    
    .status-processing {
      background-color: #e8eaf6;
      color: #3f51b5;
    }
    
    .status-shipped {
      background-color: #e3f2fd;
      color: #1976d2;
    }
    
    .status-delivered {
      background-color: #e8f5e9;
      color: #388e3c;
    }
    
    .status-cancelled {
      background-color: #ffebee;
      color: #d32f2f;
    }
    
    .status-refunded {
      background-color: #f5f5f5;
      color: #616161;
    }

    h1, h2, h3 {
      color: #333333;
      margin-top: 0;
    }

    h1 {
      font-size: 22px;
      font-weight: 600;
    }

    h2 {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 16px;
    }

    p {
      margin: 0 0 16px;
      line-height: 1.5;
      font-size: 14px;
    }

    .button {
      display: inline-block;
      background-color: #7c4dff;
      color: white;
      text-decoration: none;
      padding: 10px 20px;
      border-radius: 4px;
      font-weight: 500;
      margin-top: 8px;
    }

    .text-center {
      text-align: center;
    }

    .footer {
      background-color: #f9f9f9;
      padding: 16px 24px;
      text-align: center;
      font-size: 12px;
      color: #666666;
    }

    .footer a {
      color: #7c4dff;
      text-decoration: none;
    }

    @media screen and (max-width: 600px) {
      .content {
        padding: 16px;
      }
    }
  </style>
</head>

<body>
  <div class="email-container">
    <div class="header">
      <img src="https://sinosply.com/assets/logo-light.png" alt="Sinosply" class="logo">
    </div>
    
    <div class="content">
      <div class="section">
        <h1>Your Order Status Has Been Updated</h1>
        <p>Hello ${customerName},</p>
        <p>Your order <strong>#${orderDetails.orderNumber || ''}</strong> has been updated to:</p>
        
        <div style="text-align: center; margin: 24px 0;">
          <span class="status-badge ${getStatusBadgeClass(orderDetails.status)}">
            ${orderDetails.status || 'Processing'}
          </span>
        </div>
        
        <p>${statusDescription}</p>
        
        <div class="section">
          <h2>Order Details</h2>
          <p><strong>Order Number:</strong> #${orderDetails.orderNumber || ''}</p>
          <p><strong>Order Date:</strong> ${formatDate(orderDetails.createdAt || orderDetails.date)}</p>
          ${orderDetails.trackingNumber ? 
            `<p><strong>Tracking Number:</strong> ${orderDetails.trackingNumber}</p>` : ''}
        </div>
        
        ${orderDetails.status && orderDetails.status.toLowerCase() === 'shipped' ? `
        <div class="section">
          <h2>Shipping Information</h2>
          <p>Your order has been shipped and is on its way to you!</p>
          ${orderDetails.estimatedDelivery ? 
            `<p><strong>Estimated Delivery:</strong> ${formatDate(orderDetails.estimatedDelivery)}</p>` : ''}
          ${orderDetails.trackingNumber ? 
            `<p><strong>Track your package using the tracking number:</strong> ${orderDetails.trackingNumber}</p>` : ''}
        </div>
        ` : ''}
        
        <div class="section text-center">
          <a href="${trackingUrl}" class="button">Track Your Order</a>
        </div>
        
        <div class="section">
          <p>If you have any questions about your order, please contact our customer support team.</p>
          <p>Thank you for shopping with Sinosply!</p>
        </div>
      </div>
    </div>
    
    <div class="footer">
      <p>&copy; ${currentYear} Sinosply. All rights reserved.</p>
      <p>
        <a href="${frontendUrl}/contact">Contact Support</a> |
        <a href="${frontendUrl}/privacy-policy">Privacy Policy</a> |
        <a href="${frontendUrl}/terms-of-service">Terms of Service</a>
      </p>
      <p>Sinosply Inc., Accra, Ghana</p>
    </div>
  </div>
</body>
</html>`;
};

export default orderStatusUpdateTemplate; 