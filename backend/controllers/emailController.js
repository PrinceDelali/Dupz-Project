import sendEmail from '../utils/sendEmail.js';
import orderConfirmationTemplate from '../templates/orderConfirmationTemplate.js';
import orderStatusUpdateTemplate from '../templates/orderStatusUpdateTemplate.js';
import welcomeEmailTemplate from '../templates/welcomeEmailTemplate.js';

// Send order confirmation email
export const orderConfirmationEmail = async (req, res) => {
  console.log('📧 [emailController] Order confirmation email request received');
  
  try {
    const { email, subject, orderDetails } = req.body;
    
    console.log('📧 [emailController] Email request parameters:', {
      recipient: email,
      subject: subject,
      orderDetails: {
        orderNumber: orderDetails?.orderNumber,
        date: orderDetails?.date,
        customerName: orderDetails?.customer?.name,
        itemCount: orderDetails?.items?.length || 0,
        total: orderDetails?.total,
        paymentMethod: orderDetails?.paymentMethod
      }
    });
    
    // Validate required fields
    if (!email) {
      console.error('❌ [emailController] Missing required field: email');
      return res.status(400).json({
        success: false,
        error: 'Email address is required'
      });
    }
    
    // Generate tracking URL for the email
    const frontendUrl = process.env.FRONTEND_URL || 'https://sinosply.com';
    const trackingUrl = `${frontendUrl}/track-order/${orderDetails.orderNumber || orderDetails.id}?source=email`;
    
    console.log(`📧 [emailController] Generated tracking URL: ${trackingUrl}`);
    
    // Add tracking URL to orderDetails
    const enrichedOrderDetails = {
      ...orderDetails,
      trackingUrl
    };
    
    console.log('📝 [emailController] Generating HTML email content using template');
    
    // Generate HTML email content using the order confirmation template with tracking URL
    const htmlContent = orderConfirmationTemplate(enrichedOrderDetails);
    
    console.log(`📧 [emailController] HTML template generated (${htmlContent.length} characters)`);
    console.log(`📧 [emailController] Sending order confirmation email to ${email}...`);
    
    // Send the email using the sendEmail utility
    const emailResult = await sendEmail({
      email,
      subject: subject || `Your Sinosply Order Confirmation - Order #${orderDetails.orderNumber}`,
      html: htmlContent
    });
    
    if (emailResult.success) {
      console.log(`✅ [emailController] Order confirmation email sent successfully:`, {
        to: email,
        messageId: emailResult.messageId,
        provider: emailResult.provider
      });
      return res.status(200).json({
        success: true,
        message: 'Order confirmation email sent successfully',
        messageId: emailResult.messageId,
        provider: emailResult.provider
      });
    } else {
      console.error('❌ [emailController] Failed to send order confirmation email:', {
        error: emailResult.error,
        provider: emailResult.provider,
        errorDetails: emailResult.errorDetails
      });
      return res.status(500).json({
        success: false,
        error: `Failed to send email: ${emailResult.error}`,
        provider: emailResult.provider
      });
    }
    
  } catch (error) {
    console.error('❌ [emailController] Order confirmation email error:', {
      message: error.message,
      stack: error.stack
    });
    return res.status(500).json({
      success: false,
      error: error.message || 'Error sending order confirmation email'
    });
  }
};

// Send order status update email
export const orderStatusUpdateEmail = async (req, res) => {
  console.log('📧 [emailController] Order status update email request received');
  
  try {
    const { email, orderDetails, previousStatus } = req.body;
    
    // Log the authenticated user (if any) who is sending this email
    const userRole = req.user?.role || 'unauthenticated';
    const userEmail = req.user?.email || 'unknown';
    
    console.log(`📧 [emailController] Status update email request from ${userRole} (${userEmail}):`, {
      recipient: email,
      orderNumber: orderDetails?.orderNumber,
      previousStatus: previousStatus || 'Unknown',
      newStatus: orderDetails?.status,
      timestamp: new Date().toISOString()
    });
    
    // Check authentication
    if (!req.user) {
      console.error('🔒 [emailController] Unauthorized access attempt to send status update email');
      return res.status(401).json({
        success: false,
        error: 'Authentication required to send status update emails'
      });
    }
    
    // Validate required fields
    if (!email) {
      console.error('❌ [emailController] Missing required field: email');
      return res.status(400).json({
        success: false,
        error: 'Email address is required'
      });
    }
    
    if (!orderDetails || !orderDetails.status) {
      console.error('❌ [emailController] Missing required field: orderDetails.status');
      return res.status(400).json({
        success: false,
        error: 'Order status is required'
      });
    }
    
    if (!orderDetails.orderNumber) {
      console.error('❌ [emailController] Missing required field: orderDetails.orderNumber');
      return res.status(400).json({
        success: false,
        error: 'Order number is required'
      });
    }
    
    // Generate tracking URL for the email
    const frontendUrl = process.env.FRONTEND_URL || 'https://sinosply.com';
    const trackingUrl = `${frontendUrl}/track-order/${orderDetails.orderNumber || orderDetails.id}?source=email`;
    
    // Sanitize order details to ensure consistent format
    const sanitizedOrderDetails = {
      _id: orderDetails._id,
      orderNumber: orderDetails.orderNumber,
      status: orderDetails.status,
      customerName: orderDetails.customerName || orderDetails.customer?.name || 'Valued Customer',
      customerEmail: email,
      items: Array.isArray(orderDetails.items) ? orderDetails.items : [],
      totalAmount: parseFloat(orderDetails.totalAmount || 0),
      trackingNumber: orderDetails.trackingNumber || null,
      shippingMethod: orderDetails.shippingMethod || 'Standard',
      shippingAddress: orderDetails.shippingAddress || null,
      estimatedDelivery: orderDetails.estimatedDelivery || null,
      createdAt: orderDetails.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Add tracking URL to orderDetails
    const enrichedOrderDetails = {
      ...sanitizedOrderDetails,
      trackingUrl,
      previousStatus: previousStatus || 'Processing',
      updatedBy: {
        role: req.user.role,
        email: req.user.email,
        id: req.user._id,
        name: `${req.user.firstName} ${req.user.lastName}`.trim()
      }
    };
    
    console.log('📝 [emailController] Generating HTML email content for status update');
    
    // Generate HTML email content using the order status update template
    const htmlContent = orderStatusUpdateTemplate(enrichedOrderDetails);
    
    // Build appropriate subject line based on status
    let subject = `Order #${orderDetails.orderNumber} Status Update`;
    if (orderDetails.status === 'Shipped') {
      subject = `Your Sinosply Order #${orderDetails.orderNumber} Has Been Shipped!`;
    } else if (orderDetails.status === 'Delivered') {
      subject = `Your Sinosply Order #${orderDetails.orderNumber} Has Been Delivered!`;
    } else if (orderDetails.status === 'Cancelled') {
      subject = `Your Sinosply Order #${orderDetails.orderNumber} Has Been Cancelled`;
    } else if (orderDetails.status === 'Processing') {
      subject = `Your Sinosply Order #${orderDetails.orderNumber} Is Now Being Processed`;
    }
    
    console.log(`📧 [emailController] Sending order status update email to ${email}...`);
    
    // Add improved error handling and retry mechanism
    let retryCount = 0;
    const maxRetries = 2;
    let emailResult = null;
    
    while (retryCount <= maxRetries) {
      try {
    // Send the email using the sendEmail utility
        emailResult = await sendEmail({
      email,
      subject,
      html: htmlContent
    });
    
        // If success, break out of retry loop
        if (emailResult.success) break;
        
        // If failed but we have retries left
        retryCount++;
        if (retryCount <= maxRetries) {
          console.log(`📧 [emailController] Retrying email send (attempt ${retryCount}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
        }
      } catch (sendError) {
        console.error(`❌ [emailController] Send attempt ${retryCount+1} failed:`, sendError.message);
        
        retryCount++;
        if (retryCount <= maxRetries) {
          console.log(`📧 [emailController] Retrying after error (attempt ${retryCount}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
        } else {
          throw sendError; // Re-throw if we've exhausted retries
        }
      }
    }
    
    if (emailResult && emailResult.success) {
      console.log(`✅ [emailController] Order status update email sent successfully:`, {
        to: email,
        orderNumber: orderDetails.orderNumber,
        status: orderDetails.status,
        messageId: emailResult.messageId,
        provider: emailResult.provider,
        updatedBy: `${userRole} (${userEmail})`
      });
      
      return res.status(200).json({
        success: true,
        message: 'Order status update email sent successfully',
        messageId: emailResult.messageId,
        provider: emailResult.provider,
        timestamp: new Date().toISOString()
      });
    } else {
      console.error('❌ [emailController] Failed to send order status update email after retries:', {
        error: emailResult?.error || 'Unknown error',
        provider: emailResult?.provider,
        errorDetails: emailResult?.errorDetails
      });
      
      return res.status(500).json({
        success: false,
        error: `Failed to send email: ${emailResult?.error || 'Unknown error'}`,
        provider: emailResult?.provider
      });
    }
    
  } catch (error) {
    console.error('❌ [emailController] Order status update email error:', {
      message: error.message,
      stack: error.stack
    });
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Error sending order status update email'
    });
  }
};

// Send welcome email to new users
export const welcomeEmail = async (req, res) => {
  console.log('📧 [emailController] Welcome email request received');
  
  try {
    const { email, userData } = req.body;
    
    console.log('📧 [emailController] Welcome email request parameters:', {
      recipient: email,
      userData: {
        firstName: userData?.firstName,
        lastName: userData?.lastName,
        userId: userData?.userId || userData?._id
      }
    });
    
    // Validate required fields
    if (!email) {
      console.error('❌ [emailController] Missing required field: email');
      return res.status(400).json({
        success: false,
        error: 'Email address is required'
      });
    }
    
    // Prepare user data for the email template
    const userDataForEmail = {
      ...userData,
      email,
      userId: userData?.userId || userData?._id || ''
    };
    
    console.log('📝 [emailController] Generating HTML email content using welcome template');
    
    // Generate HTML email content using the welcome email template
    const htmlContent = welcomeEmailTemplate(userDataForEmail);
    
    console.log(`📧 [emailController] HTML welcome template generated (${htmlContent.length} characters)`);
    console.log(`📧 [emailController] Sending welcome email to ${email}...`);
    
    // Send the email using the sendEmail utility
    const emailResult = await sendEmail({
      email,
      subject: `Welcome to Sinosply, ${userData.firstName}!`,
      html: htmlContent
    });
    
    if (emailResult.success) {
      console.log(`✅ [emailController] Welcome email sent successfully:`, {
        to: email,
        messageId: emailResult.messageId,
        provider: emailResult.provider
      });
      return res.status(200).json({
        success: true,
        message: 'Welcome email sent successfully',
        messageId: emailResult.messageId,
        provider: emailResult.provider
      });
    } else {
      console.error('❌ [emailController] Failed to send welcome email:', {
        error: emailResult.error,
        provider: emailResult.provider,
        errorDetails: emailResult.errorDetails
      });
      return res.status(500).json({
        success: false,
        error: `Failed to send welcome email: ${emailResult.error}`,
        provider: emailResult.provider
      });
    }
    
  } catch (error) {
    console.error('❌ [emailController] Welcome email error:', {
      message: error.message,
      stack: error.stack
    });
    return res.status(500).json({
      success: false,
      error: error.message || 'Error sending welcome email'
    });
  }
}; 