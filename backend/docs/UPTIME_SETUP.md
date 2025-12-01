# Setting Up UptimeRobot for Sinosply Backend

This guide will help you set up UptimeRobot to monitor your Sinosply backend server and keep it alive on Render's free tier.

## Why UptimeRobot?

Render's free tier spins down your server after 15 minutes of inactivity. UptimeRobot can ping your server every 5 minutes to prevent it from going to sleep, ensuring your application is always responsive.

## Step 1: Create a UptimeRobot Account

1. Go to [UptimeRobot.com](https://uptimerobot.com/) and sign up for a free account
2. Verify your email address

## Step 2: Add a New Monitor

1. Log in to your UptimeRobot dashboard
2. Click on "Add New Monitor"
3. Select "HTTP(s)" as the monitor type
4. Configure the monitor:
   - **Friendly Name**: Sinosply Backend
   - **URL**: https://sinosply-backend.onrender.com/api/v1/uptime/ping
   - **Monitoring Interval**: 5 minutes (the free plan's minimum)
   - **Monitor Type**: HTTP(s)
   - **Alert Contacts**: Select your email or add a new contact

5. Click "Create Monitor"

## Step 3: Verify the Monitor is Working

1. Wait a few minutes for the first check to complete
2. Refresh your UptimeRobot dashboard
3. You should see your monitor with a "Up" status

## Additional Monitoring Endpoints

Your Sinosply backend has several endpoints you can monitor:

- **Basic Health Check**: `https://sinosply-backend.onrender.com/`
- **Uptime Ping**: `https://sinosply-backend.onrender.com/api/v1/uptime/ping`
- **Uptime Status**: `https://sinosply-backend.onrender.com/api/v1/uptime/status`

## Built-in Keep-Alive Functionality

In addition to UptimeRobot, the Sinosply application has built-in keep-alive functionality:

1. **Server-side pinging**: The backend server pings itself every 5 minutes
2. **Client-side pinging**: The frontend application pings the backend every 5 minutes when users have the app open

This dual approach helps ensure maximum uptime for your application.

## Troubleshooting

If your server still goes to sleep:

1. Verify that the UptimeRobot monitor is active and showing "Up" status
2. Check the server logs for any errors in the ping mechanism
3. Consider upgrading to Render's paid tier for guaranteed uptime

## Need Help?

If you need assistance setting up UptimeRobot or have questions about the keep-alive functionality, please contact support or refer to the [UptimeRobot documentation](https://uptimerobot.com/help/). 