// Order confirmation email template
const orderConfirmationTemplate = (orderDetails) => {
  console.log('📝 [orderConfirmationTemplate] Generating email template with order data:', {
    orderNumber: orderDetails?.orderNumber,
    date: orderDetails?.date,
    customer: {
      name: orderDetails?.customer?.name,
      email: orderDetails?.customer?.email
    },
    itemCount: orderDetails?.items?.length || 0,
    hasShippingAddress: !!orderDetails?.shippingAddress,
    total: orderDetails?.total
  });
  
  // Format date
  const formattedDate = new Date(orderDetails.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Format price with Ghana Cedi symbol
  const formatPrice = (price) => {
    if (typeof price !== 'number') {
      price = parseFloat(price) || 0;
    }
    return `GH₵${price.toFixed(2)}`;
  };
  
  // Use tracking URL from email controller or generate one
  const trackingUrl = orderDetails.trackingUrl || `${process.env.FRONTEND_URL || 'https://sinosply.com'}/track-order/${orderDetails.orderNumber || orderDetails.id}?source=email`;
  
  // Ensure the tracking URL is properly encoded
  const encodedTrackingUrl = encodeURI(trackingUrl);
  
  console.log(`📝 [orderConfirmationTemplate] Using tracking URL: ${encodedTrackingUrl}`);
  
  console.log('📝 [orderConfirmationTemplate] Generating item HTML for', orderDetails?.items?.length || 0, 'items');
  
  // Generate items HTML
  const itemsHtml = orderDetails.items.map((item, index) => {
    console.log(`📝 [orderConfirmationTemplate] Processing item ${index + 1}:`, {
      name: item.name,
      price: item.price,
      quantity: item.quantity
    });
    
    return `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eaeaea;">
        <div style="display: flex; align-items: center;">
          <img src="${item.image || 'https://via.placeholder.com/60x60'}" 
               alt="${item.name}" 
               style="width: 60px; height: 60px; object-fit: cover; margin-right: 10px; border-radius: 4px;">
          <div>
            <p style="font-weight: 500; margin: 0;">${item.name}</p>
            <p style="color: #666; margin: 5px 0 0; font-size: 14px;">
              ${item.colorName ? `Color: ${item.colorName}` : ''}
              ${item.colorName && item.size ? ' | ' : ''}
              ${item.size ? `Size: ${item.size}` : ''}
            </p>
          </div>
        </div>
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eaeaea; text-align: center;">
        ${item.quantity}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eaeaea; text-align: right;">
        ${formatPrice(item.price)}
      </td>
    </tr>
  `}).join('');

  console.log('📝 [orderConfirmationTemplate] Generating shipping address HTML');
  
  // Generate shipping address HTML
  const shippingAddressHtml = orderDetails.shippingAddress ? `
    <p style="margin: 5px 0;">${orderDetails.shippingAddress.street || ''}</p>
    <p style="margin: 5px 0;">${orderDetails.shippingAddress.city || ''}${orderDetails.shippingAddress.state ? ', ' + orderDetails.shippingAddress.state : ''} ${orderDetails.shippingAddress.postalCode || ''}</p>
    <p style="margin: 5px 0;">${orderDetails.shippingAddress.country || ''}</p>
    <p style="margin: 5px 0;">${orderDetails.shippingAddress.phone || ''}</p>
  ` : '<p style="margin: 5px 0;">No shipping address provided</p>';

  console.log('📝 [orderConfirmationTemplate] Assembling final HTML template');
  
  const templateHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation</title>
    </head>
    <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <img src="https://sinosply.com/logo.png" alt="Sinosply" style="width: 120px; margin-bottom: 20px;">
        <h1 style="margin: 0; color: #222; font-size: 24px;">Order Confirmation</h1>
        <p style="margin: 5px 0; color: #666;">Thank you for your order!</p>
      </div>

      <div style="background-color: #f8f8f8; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
        <h2 style="margin: 0 0 15px; font-size: 18px; color: #333;">Order Details</h2>
        <p style="margin: 5px 0;">
          <strong>Order Number:</strong> ${orderDetails.orderNumber}
        </p>
        <p style="margin: 5px 0;">
          <strong>Date:</strong> ${formattedDate}
        </p>
        <p style="margin: 5px 0;">
          <strong>Payment Method:</strong> ${orderDetails.paymentMethod || 'Online Payment'}
        </p>
        <p style="margin: 5px 0;">
          <strong>Shipping Method:</strong> ${orderDetails.shippingMethod || 'Standard Shipping'}
        </p>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
        <thead>
          <tr>
            <th style="padding: 10px; border-bottom: 2px solid #eaeaea; text-align: left;">Item</th>
            <th style="padding: 10px; border-bottom: 2px solid #eaeaea; text-align: center;">Qty</th>
            <th style="padding: 10px; border-bottom: 2px solid #eaeaea; text-align: right;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding: 10px; text-align: right;">
              <strong>Subtotal:</strong>
            </td>
            <td style="padding: 10px; text-align: right;">
              ${formatPrice(orderDetails.subtotal || 0)}
            </td>
          </tr>
          <tr>
            <td colspan="2" style="padding: 10px; text-align: right;">
              <strong>Shipping:</strong>
            </td>
            <td style="padding: 10px; text-align: right;">
              ${formatPrice(orderDetails.shipping || 0)}
            </td>
          </tr>
          <tr>
            <td colspan="2" style="padding: 10px; text-align: right;">
              <strong>Tax:</strong>
            </td>
            <td style="padding: 10px; text-align: right;">
              ${formatPrice(orderDetails.tax || 0)}
            </td>
          </tr>
          ${orderDetails.discount && orderDetails.discount > 0 ? `
          <tr>
            <td colspan="2" style="padding: 10px; text-align: right; color: #2e7d32;">
              <strong>Discount:</strong>
            </td>
            <td style="padding: 10px; text-align: right; color: #2e7d32;">
              -${formatPrice(orderDetails.discount || 0)}
            </td>
          </tr>` : ''}
          <tr>
            <td colspan="2" style="padding: 15px 10px; text-align: right; border-top: 2px solid #eaeaea;">
              <strong style="font-size: 18px;">Total:</strong>
            </td>
            <td style="padding: 15px 10px; text-align: right; border-top: 2px solid #eaeaea;">
              <strong style="font-size: 18px; color: #d32f2f;">${formatPrice(orderDetails.total || 0)}</strong>
            </td>
          </tr>
        </tfoot>
      </table>

      <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
        <div style="width: 48%;">
          <h3 style="margin: 0 0 10px; font-size: 16px;">Shipping Address</h3>
          <div style="background-color: #f8f8f8; border-radius: 8px; padding: 15px;">
            <p style="margin: 5px 0;"><strong>${orderDetails.customer.name || 'Customer'}</strong></p>
            ${shippingAddressHtml}
          </div>
        </div>
        <div style="width: 48%;">
          <h3 style="margin: 0 0 10px; font-size: 16px;">Contact Information</h3>
          <div style="background-color: #f8f8f8; border-radius: 8px; padding: 15px;">
            <p style="margin: 5px 0;"><strong>Email:</strong> ${orderDetails.customer.email || 'Not provided'}</p>
          </div>
        </div>
      </div>

      <!-- Enhanced Track Order Section with Status Indicator -->
      <div style="background-color: #f8f8f8; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 30px;">
        <h3 style="margin: 0 0 15px; font-size: 18px; color: #333;">Track Your Order</h3>
        
        <!-- Simple Status Indicator -->
        <div style="margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; max-width: 400px; margin: 0 auto;">
            <div style="text-align: center; position: relative; flex: 1;">
              <div style="width: 15px; height: 15px; border-radius: 50%; background-color: #4caf50; margin: 0 auto;"></div>
              <p style="margin: 5px 0 0; font-size: 12px; color: #666;">Order Placed</p>
            </div>
            <div style="text-align: center; position: relative; flex: 1;">
              <div style="width: 15px; height: 15px; border-radius: 50%; background-color: #f5f5f5; margin: 0 auto;"></div>
              <p style="margin: 5px 0 0; font-size: 12px; color: #666;">Processing</p>
            </div>
            <div style="text-align: center; position: relative; flex: 1;">
              <div style="width: 15px; height: 15px; border-radius: 50%; background-color: #f5f5f5; margin: 0 auto;"></div>
              <p style="margin: 5px 0 0; font-size: 12px; color: #666;">Shipped</p>
            </div>
            <div style="text-align: center; position: relative; flex: 1;">
              <div style="width: 15px; height: 15px; border-radius: 50%; background-color: #f5f5f5; margin: 0 auto;"></div>
              <p style="margin: 5px 0 0; font-size: 12px; color: #666;">Delivered</p>
            </div>
          </div>
          
          <!-- Progress bar connecting the dots -->
          <div style="height: 3px; background-color: #e0e0e0; max-width: 400px; margin: -17px auto 0; position: relative; z-index: -1;">
            <div style="height: 100%; width: 10%; background-color: #4caf50;"></div>
          </div>
        </div>
        
        <p style="margin: 15px 0; font-size: 14px; color: #666;">Your tracking number: <strong>${orderDetails.trackingNumber || 'Will be assigned soon'}</strong></p>
        
        <!-- Email-client friendly button -->
        <!-- Using table-based button that works better in email clients -->
        <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin: 0 auto;">
          <tr>
            <td align="center" bgcolor="#d32f2f" role="presentation" style="border: none; border-radius: 4px; cursor: pointer; padding: 0px;" valign="middle">
              <a href="${encodedTrackingUrl}" target="_blank" style="background: #d32f2f; color: #ffffff; display: inline-block; font-family: Arial, sans-serif; font-size: 16px; font-weight: bold; line-height: 120%; margin: 0; padding: 12px 24px; text-decoration: none; text-transform: none;">
                Track Package
              </a>
            </td>
          </tr>
        </table>
        
        <!-- Fallback text link in case button doesn't work -->
        <p style="margin-top: 15px; font-size: 12px; color: #666;">
          If the button doesn't work, copy and paste this link into your browser: 
          <br>
          <a href="${encodedTrackingUrl}" style="color: #0066cc; word-break: break-all;">${trackingUrl}</a>
        </p>
      </div>

      <div style="margin-top: 40px; text-align: center;">
        <p style="margin: 5px 0; color: #666;">
          If you have any questions about your order, please contact us at
          <a href="mailto:support@sinosply.com" style="color: #d32f2f;">support@sinosply.com</a>
        </p>
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eaeaea; color: #888; font-size: 14px;">
          <p style="margin: 5px 0;">© ${new Date().getFullYear()} Sinosply. All rights reserved.</p>
          <p style="margin: 5px 0;">www.sinosply.com</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  console.log(`📝 [orderConfirmationTemplate] HTML template generated successfully (${templateHtml.length} characters)`);
  
  return templateHtml;
};

export default orderConfirmationTemplate; 