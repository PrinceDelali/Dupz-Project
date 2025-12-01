# Resend Email Integration Guide

This document provides instructions for setting up Resend as the email service provider for Sinosply.

## Overview

Sinosply uses [Resend](https://resend.com) to send all transactional emails, including:
- Order confirmations to customers
- Order notifications to administrators
- Password reset emails
- Account verification emails

## Setup Instructions

### 1. Create a Resend Account

1. Sign up at [Resend.com](https://resend.com)
2. Verify your email address
3. Create an API key from the Resend dashboard

### 2. Configure Environment Variables

Add the following variables to your `.env` file:

```
# Resend API Key (required)
RESEND_API_KEY=re_your_api_key_here

# Email for free tier testing (only needed for development)
RESEND_VERIFIED_EMAIL=your-email@example.com
```

You can run `node updateEnv.js` to automatically add these variables to your `.env` file.

### 3. Free Tier Limitations

**Important**: With Resend's free tier:
- You can only send to `delivered@resend.dev` (a test address) or your own verified email address
- To send to any other email addresses, you need to verify a domain

### 4. Domain Verification (For Production)

To send emails to any recipient:

1. Add and verify a domain in your Resend dashboard
2. Set up proper DNS records as instructed by Resend
3. Once verified, update your `FROM_EMAIL` environment variable to use an address at your verified domain

Example:
```
FROM_EMAIL=orders@yourdomain.com
FROM_NAME=Sinosply
```

### 5. Testing the Email Configuration

Run the test script to verify your setup:

```
npm run test-email
```

This will send test emails using the Resend API to verify your configuration.

### 6. Troubleshooting

If emails aren't being delivered:

1. Check your Resend dashboard for delivery status and logs
2. Verify your API key is correctly set in the `.env` file
3. If using the free tier, make sure you're sending to `delivered@resend.dev` or your verified email
4. Check application logs for detailed error messages

### 7. Email Templates

Email templates are stored in the `templates/emails` directory and are rendered using Handlebars. 

To modify the email design or content, edit the template files:
- `orderConfirmation.html` - Customer order confirmation
- `adminOrderNotification.html` - Admin notifications for new orders

## Support

If you encounter issues with the Resend integration:
- Check the [Resend documentation](https://resend.com/docs)
- Visit the [Resend API reference](https://resend.com/docs/api-reference/introduction) 