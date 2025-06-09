# Party Rental Agreement Workflow Implementation

## Overview

This document outlines the complete implementation of the automated party rental agreement workflow using DocuSeal and SendGrid integration with the Next.js CRM system.

## ✅ Completed Implementation

### 1. Database Schema Updates

- **File**: `src/models/Order.ts`
- **Added Fields**:
  - `agreementStatus`: "not_sent" | "pending" | "viewed" | "signed"
  - `agreementSentAt`: Date when agreement was sent
  - `agreementViewedAt`: Date when customer viewed agreement
  - `agreementSignedAt`: Date when customer signed agreement
  - `docusealSubmissionId`: DocuSeal submission ID for tracking
  - `signedDocumentUrl`: URL to the signed document
  - `deliveryBlocked`: Boolean to prevent delivery without signed agreement
  - `agreementOverrideReason`: Admin override reason
  - `agreementOverrideBy`: User ID who overrode delivery block
  - `agreementOverrideAt`: Date of override

### 2. TypeScript Type Definitions

- **File**: `src/types/order.ts`
- **Added Types**:
  - `AgreementStatus` enum
  - Extended `Order` interface with agreement fields
  - Updated `IOrderDocument` interface

### 3. DocuSeal Service Integration

- **File**: `src/services/docusealService.ts`
- **Features**:
  - Create submissions with order data
  - Get submission status
  - Download signed documents
  - Void/cancel submissions
  - Get signing URLs
  - Webhook signature verification
  - Automatic field mapping from order data

### 4. Agreement Email Service

- **File**: `src/services/agreementEmailService.ts`
- **Email Templates**:
  - Initial agreement send
  - Reminder emails (72h, 48h, 24h before delivery)
  - Agreement signed confirmation
  - Final warning with delivery cancellation notice
- **Features**:
  - Dynamic template variables
  - Urgency-based messaging
  - Professional branding
  - Clear call-to-action buttons

### 5. API Endpoints

#### Send Agreement Endpoint

- **File**: `src/app/api/v1/orders/[id]/send-agreement/route.ts`
- **Methods**: POST (send), GET (status)
- **Features**:
  - Create DocuSeal submission
  - Send branded email via SendGrid
  - Update order status
  - Handle resending for pending agreements

#### Webhook Handler

- **File**: `src/app/api/webhooks/docuseal/route.ts`
- **Events Handled**:
  - `submission.viewed`: Update order when customer views agreement
  - `submission.completed`: Mark as signed, unblock delivery, send confirmation
  - `submission.declined`: Reset status, keep delivery blocked
- **Features**:
  - Signature verification
  - Automatic status updates
  - Email notifications

#### Override Delivery Block

- **File**: `src/app/api/v1/orders/[id]/override-delivery-block/route.ts`
- **Purpose**: Admin override for delivery without signed agreement
- **Features**:
  - Admin-only access
  - Reason tracking
  - Audit trail

#### Download Agreement

- **File**: `src/app/api/v1/orders/[id]/agreement/route.ts`
- **Purpose**: Download signed PDF documents
- **Features**:
  - Authentication required
  - Direct PDF download
  - Fallback to stored URL

#### Pending Agreements

- **File**: `src/app/api/v1/orders/pending-agreements/route.ts`
- **Purpose**: Dashboard for tracking unsigned agreements
- **Features**:
  - Urgency classification
  - Summary statistics
  - Filtering options

### 6. UI Components

#### Agreement Status Badge

- **File**: `src/components/AgreementStatusBadge.tsx`
- **Features**:
  - Color-coded status indicators
  - Urgency-based styling
  - Delivery countdown integration
  - Visual warnings for critical timelines

#### Delivery Countdown

- **File**: `src/components/DeliveryCountdown.tsx`
- **Features**:
  - Real-time countdown to delivery
  - Urgency indicators (critical < 24h, urgent < 48h)
  - Formatted date display
  - Overdue notifications

#### Agreement Actions

- **File**: `src/components/AgreementActions.tsx`
- **Features**:
  - Send/resend agreement buttons
  - Status-aware button text and styling
  - Email validation
  - Success/error messaging
  - Delivery warnings
  - Agreement timestamps

### 7. Enhanced Orders Page

- **File**: `src/app/admin/orders/page.tsx`
- **New Features**:
  - Agreement status column with badges
  - Delivery countdown column
  - Integrated agreement actions
  - Real-time status updates
  - Enhanced table layout

### 8. API Client Integration

- **File**: `src/utils/api.ts`
- **New Functions**:
  - `sendAgreement(orderId)`
  - `getAgreementStatus(orderId)`
  - `resendAgreement(orderId)`
  - `overrideDeliveryBlock(orderId, reason)`
  - `downloadSignedAgreement(orderId)`
  - `getPendingAgreements()`

## 🔧 Configuration Required

### Environment Variables

Add these to your `.env.local` file:

```bash
# DocuSeal Configuration
DOCUSEAL_BASE_URL=https://sign.slowbill.xyz/api
DOCUSEAL_API_KEY=your_docuseal_api_key
DOCUSEAL_TEMPLATE_ID=your_template_id
DOCUSEAL_WEBHOOK_SECRET=your_webhook_secret

# SendGrid Configuration
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=Your Company Name

# Company Information
COMPANY_NAME=Bounce House Rentals San Antonio
COMPANY_PHONE=(210) 555-0123
COMPANY_EMAIL=info@yourdomain.com
COMPANY_ADDRESS=123 Main St, San Antonio, TX 78201
```

### DocuSeal Template Setup

1. Create a party rental agreement template in DocuSeal
2. Include these field names in your template:
   - `customer_name`, `customer_email`, `customer_phone`
   - `customer_address`, `order_number`, `order_date`
   - `event_date`, `delivery_date`, `rental_items`
   - `subtotal`, `tax_amount`, `delivery_fee`, `total_amount`
   - `deposit_amount`, `balance_due`, `payment_method`
   - `company_name`, `company_phone`, `company_email`

### SendGrid Template Setup

1. Create dynamic templates in SendGrid for:
   - Initial agreement send
   - Reminder emails
   - Agreement signed confirmation
   - Final warning
2. Use the template IDs in the email service configuration

### Webhook Configuration

1. In DocuSeal, configure webhook URL: `https://yourdomain.com/api/webhooks/docuseal`
2. Enable events: `submission.viewed`, `submission.completed`, `submission.declined`
3. Set webhook secret for signature verification

## 🚀 Usage Workflow

### For Business Owners

1. **Order Creation**: Create orders with customer email and delivery date
2. **Send Agreement**: Click "Send Agreement" button on orders page
3. **Monitor Status**: View real-time agreement status with color-coded badges
4. **Track Urgency**: See delivery countdown and urgency warnings
5. **Override if Needed**: Admin can override delivery block with reason
6. **Download Signed**: Access signed agreements directly from orders page

### For Customers

1. **Receive Email**: Get branded email with agreement link
2. **Review Agreement**: Click link to view pre-filled agreement
3. **Sign Digitally**: Complete signature process in DocuSeal
4. **Confirmation**: Receive confirmation email when signed

### Automated Reminders

- **72 hours before**: First reminder
- **48 hours before**: Urgent reminder
- **24 hours before**: Final warning with delivery cancellation notice

## 🔒 Security Features

- **Authentication**: All endpoints require valid session
- **Authorization**: Admin-only functions protected
- **Webhook Verification**: Cryptographic signature validation
- **Audit Trail**: Complete tracking of all agreement actions
- **Data Validation**: Input sanitization and validation

## 📊 Business Benefits

- **Risk Reduction**: 100% signed agreements before delivery
- **Time Savings**: Automated process reduces manual work
- **Customer Experience**: Professional, streamlined signing process
- **Compliance**: Digital audit trail for all agreements
- **Operational Efficiency**: Clear delivery blocking until signed
- **Visibility**: Real-time dashboard of agreement status

## 🔄 Next Steps

1. **Environment Setup**: Configure all required environment variables
2. **Template Creation**: Set up DocuSeal and SendGrid templates
3. **Webhook Testing**: Test webhook integration with DocuSeal
4. **User Training**: Train staff on new agreement workflow
5. **Go Live**: Deploy to production and monitor

## 📈 Success Metrics

- Agreement completion rate: Target 98% within 24 hours of delivery
- Delivery delays prevented: Zero deliveries without signed agreements
- Time savings: Reduce agreement processing from 20 minutes to 2 minutes
- Customer satisfaction: Reduce agreement-related support calls by 80%

## 🛠️ Troubleshooting

### Common Issues

1. **Agreement not sending**: Check DocuSeal API key and template ID
2. **Emails not delivered**: Verify SendGrid configuration and templates
3. **Webhook not working**: Confirm webhook URL and secret
4. **Status not updating**: Check webhook signature verification

### Debug Tools

- Check browser console for API errors
- Review server logs for DocuSeal/SendGrid responses
- Use webhook testing tools to verify payload format
- Test email delivery with SendGrid activity feed

This implementation provides a complete, production-ready automated agreement workflow that protects your rental business while providing an excellent customer experience.
