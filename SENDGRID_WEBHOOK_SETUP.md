# SendGrid Webhook Setup Guide

This guide explains how to configure SendGrid webhooks to track email delivery, opens, clicks, and other events for your marketing campaigns.

## 🚨 Bug Fix: Marketing Email Delivery Tracking

**Problem**: The marketing email system showed "Delivered 0 (0.0%)" even though emails were successfully sent and delivered.

**Root Cause**: No webhook endpoint existed to receive delivery status updates from SendGrid.

**Solution**: Complete webhook system implemented with proper event tracking.

## 📧 Webhook Endpoint

The webhook endpoint is now available at:

```
https://your-domain.com/api/v1/marketing/webhooks
```

## 🔧 SendGrid Configuration

### Step 1: Access SendGrid Dashboard

1. Log in to your SendGrid account
2. Navigate to **Settings** → **Mail Settings** → **Event Webhooks**

### Step 2: Create New Webhook

1. Click **Create new webhook**
2. Enter your webhook URL: `https://your-domain.com/api/v1/marketing/webhooks`
3. Select the events you want to track:
   - ✅ **Delivered** (Required for delivery tracking)
   - ✅ **Opened** (For open rate tracking)
   - ✅ **Clicked** (For click rate tracking)
   - ✅ **Bounced** (For bounce tracking)
   - ✅ **Dropped** (For drop tracking)
   - ✅ **Spam Report** (For spam tracking)
   - ✅ **Unsubscribe** (For unsubscribe tracking)

### Step 3: Configure Security (Recommended)

1. Enable **Signed Event Webhook**
2. Generate a verification key
3. Add the verification key to your environment variables:
   ```bash
   SENDGRID_WEBHOOK_SECRET=your_verification_key_here
   ```

### Step 4: Test the Webhook

1. Save the webhook configuration
2. SendGrid will send a test event to verify the endpoint
3. Check your application logs for webhook events

## 🧪 Testing the Webhook

### Manual Testing Endpoint

Use the test endpoint to simulate webhook events:

```bash
POST /api/v1/marketing/test-webhook
```

**Request Body:**

```json
{
  "email": "chrisboydstun@gmail.com",
  "eventType": "delivered"
}
```

**Available Event Types:**

- `delivered` - Email was delivered
- `open` - Email was opened
- `click` - Link in email was clicked
- `bounce` - Email bounced
- `dropped` - Email was dropped
- `spamreport` - Email was marked as spam
- `unsubscribe` - Recipient unsubscribed

### Testing Steps

1. Send a test marketing campaign
2. Use the test webhook endpoint to simulate a "delivered" event
3. Check the campaign analytics to see updated delivery count
4. Verify logs show webhook processing

## 📊 How It Works

### Email Flow

1. **Campaign Created** → Recipients have "pending" status
2. **Email Sent** → Recipients updated to "sent" status
3. **SendGrid Delivers** → Webhook fires with "delivered" event
4. **Webhook Processed** → Recipient status updated to "delivered"
5. **Analytics Updated** → Dashboard shows correct delivery count

### Event Processing

```
SendGrid → Webhook → handleEmailWebhook() → Update Campaign → Save to DB
```

### Status Progression

```
pending → sent → delivered → opened → clicked
                ↓
              failed (if bounce/drop)
                ↓
           unsubscribed (if unsubscribe)
```

## 🔍 Monitoring and Debugging

### Webhook Logs

The webhook endpoint provides comprehensive logging:

```bash
# Successful webhook processing
📧 SENDGRID WEBHOOK RECEIVED: {...}
🔄 PROCESSING EMAIL WEBHOOK EVENTS: {...}
📧 PROCESSING EVENT: {...}
🎯 FOUND CAMPAIGNS: {...}
📊 UPDATING RECIPIENT STATUS: {...}
✅ STATUS UPDATED: sent → delivered
💾 CAMPAIGN SAVED: {...}
✅ WEBHOOK PROCESSING COMPLETE: {...}
```

### Error Handling

```bash
# Common error scenarios
❌ SENDGRID WEBHOOK: Invalid signature
⚠️ NO CAMPAIGNS FOUND for email
⚠️ RECIPIENT NOT FOUND in campaign
ℹ️ DELIVERY EVENT IGNORED: recipient not in 'sent' status
```

### Verification Steps

1. Check webhook endpoint is accessible: `GET /api/v1/marketing/webhooks`
2. Verify SendGrid configuration in dashboard
3. Test with sample data: `POST /api/v1/marketing/test-webhook`
4. Monitor application logs for webhook events
5. Check campaign analytics for updated counts

## 🔒 Security Considerations

### Webhook Signature Verification

- Always use `SENDGRID_WEBHOOK_SECRET` in production
- Webhook signatures are verified using HMAC-SHA256
- Invalid signatures are rejected with 401 status

### Rate Limiting

- Webhooks are processed individually with error handling
- Failed events are logged but don't stop processing other events
- Consider implementing rate limiting for high-volume campaigns

## 🚀 Environment Variables

Add these to your `.env.local` file:

```bash
# Required for sending emails
SENDGRID_API_KEY=your_sendgrid_api_key

# Optional but recommended for webhook security
SENDGRID_WEBHOOK_SECRET=your_webhook_verification_key

# Required for test mode emails
OTHER_EMAIL=admin@yourdomain.com

# Required for unsubscribe links
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

## ✅ Verification Checklist

- [ ] SendGrid webhook configured with correct URL
- [ ] All required events selected (delivered, opened, clicked, etc.)
- [ ] Webhook signature verification enabled (recommended)
- [ ] Environment variables configured
- [ ] Test webhook endpoint working
- [ ] Campaign analytics showing correct delivery counts
- [ ] Logs showing successful webhook processing

## 🎯 Expected Results

After setup, you should see:

- **Delivered count increases** as emails are delivered
- **Open rates tracked** when recipients open emails
- **Click rates tracked** when recipients click links
- **Bounce/failure tracking** for problematic emails
- **Real-time analytics** in the campaign dashboard

The "Delivered 0 (0.0%)" bug should be completely resolved, and you'll have accurate, real-time email tracking for all your marketing campaigns.
