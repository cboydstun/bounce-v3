# Orders API Documentation

This document provides comprehensive documentation for the Orders system in the Bounce House Rental application. It covers the data model, API endpoints, and usage examples to help frontend developers integrate with the backend.

## Table of Contents

1. [Order Data Model](#order-data-model)
2. [API Endpoints](#api-endpoints)
   - [List Orders](#list-orders)
   - [Create Order](#create-order)
   - [Get Order by ID](#get-order-by-id)
   - [Update Order](#update-order)
   - [Delete Order](#delete-order)
   - [Payment Processing](#payment-processing)
3. [Order Status Flow](#order-status-flow)
4. [Multiple Bouncers Feature](#multiple-bouncers-feature)
5. [Slushy Mixer Feature](#slushy-mixer-feature)
6. [Availability Checking Feature](#availability-checking-feature)
7. [Maximum Daily Bookings Feature](#maximum-daily-bookings-feature)
8. [Examples](#examples)

## Availability Checking Feature

The system includes a real-time availability checking feature that verifies if bounce houses are available on a customer's selected date during the checkout process.

### Key Features

1. **Real-time Availability**: When a customer selects a date in the checkout process, the system automatically checks availability for all bounce houses
2. **Single API Call**: Uses a batch API endpoint to check availability for multiple products in a single request
3. **Visual Indicators**: Unavailable bounce houses are clearly marked and disabled in the selection interface
4. **Automatic Removal**: If a customer has already selected a bounce house and then selects a date when it's unavailable, the item is automatically removed from their order with a notification
5. **Loading States**: The UI displays appropriate loading indicators during availability checks
6. **Error Handling**: Graceful handling of API failures with retry options

### Implementation Details

#### Batch Availability API Endpoint

The system uses a dedicated endpoint for checking availability of multiple products at once:

**Endpoint:** `POST /api/v1/products/batch-availability`

**Request Body:**

```json
{
  "productIds": ["60d21b4667d0d8992e610c85", "60d21b4667d0d8992e610c86"],
  "date": "2024-05-15"
}
```

**Response:**

```json
{
  "60d21b4667d0d8992e610c85": {
    "available": true,
    "product": {
      "name": "Castle Bounce House",
      "slug": "castle-bounce-house",
      "status": "available"
    }
  },
  "60d21b4667d0d8992e610c86": {
    "available": false,
    "product": {
      "name": "Double Lane Waterslide",
      "slug": "double-lane-waterslide",
      "status": "available"
    },
    "reason": "Product is already booked for this date"
  },
  "_meta": {
    "isBlackoutDate": false,
    "dateAtCapacity": false,
    "totalBookings": 2,
    "maxBookings": 6
  }
}
```

#### Availability Check Logic

The availability check performs two validations:

1. **Product Status Check**: Verifies that the product's general status is "available" (not "maintenance", "discontinued", etc.)
2. **Booking Check**: Checks if there are any confirmed bookings for the product on the selected date

A product is considered available only if both checks pass.

#### Client-Side Implementation

The checkout process uses a utility function to check availability:

```typescript
export const checkAvailabilityForProducts = async (
  products: Array<{ _id: string; name: string }>,
  date: string,
): Promise<Record<string, { available: boolean; reason?: string }>> => {
  try {
    // Extract product IDs
    const productIds = products.map((product) => product._id);

    // Make a single API call to the batch endpoint
    const response = await fetch("/api/v1/products/batch-availability", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productIds,
        date,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to check availability");
    }

    // Return the results
    return await response.json();
  } catch (error) {
    console.error("Error checking product availability:", error);
    throw error;
  }
};
```

#### Checkout State Management

The checkout state tracks availability information:

```typescript
availabilityChecks: {
  status: "idle" | "loading" | "success" | "error";
  results: Record<string, { available: boolean; reason?: string }>;
  lastCheckedDate: string | null;
}
```

When a date is selected, the checkout process:

1. Updates the `status` to 'loading'
2. Makes the API call to check availability
3. Updates the `results` with the response data
4. Updates the `status` to 'success' or 'error'
5. Removes any unavailable bounce houses from the order
6. Displays a notification if any items were removed

#### UI Integration

The checkout UI provides visual feedback about availability:

1. **Loading Indicator**: Displayed while the availability check is in progress
2. **Available Products**: Clearly marked with "(Available)" text in the dropdown and a green "Available" badge in the selected bouncers list
3. **Unavailable Products**: Marked as "(Unavailable)" and disabled in the selection dropdown
4. **Error Messages**: Displayed if the availability check fails, with an option to retry
5. **Notifications**: Toast messages inform users when unavailable items are removed from their order

The visual indicators ensure users can easily identify which bounce houses are available on their selected date:

```jsx
// Dropdown option availability indicator
const availabilityText = !available
  ? " (Unavailable)"
  : state.availabilityChecks.status === "success"
    ? " (Available)"
    : "";

// Selected bouncer availability badge
{
  state.availabilityChecks.status === "success" && (
    <span className="inline-block bg-emerald-100 text-emerald-800 text-xs font-medium px-2 py-0.5 rounded">
      Available
    </span>
  );
}
```

### Benefits

1. **Improved User Experience**: Customers immediately know which products are available on their selected date
2. **Reduced Administrative Overhead**: Prevents double-bookings and reduces the need for manual intervention
3. **Efficient API Usage**: Single API call for checking multiple products minimizes network traffic and server load
4. **Real-time Feedback**: Immediate availability information helps customers make informed decisions

## Maximum Daily Bookings Feature

The system includes a maximum daily bookings feature that limits the number of bookings that can be made on a single day, preventing overbooking and ensuring operational capacity is not exceeded.

### Key Features

1. **Configurable Limit**: Administrators can set the maximum number of bookings allowed per day
2. **Real-time Enforcement**: The system checks the booking limit in real-time during the checkout process
3. **Clear User Feedback**: Customers receive clear notifications when a date has reached its booking capacity
4. **Admin Control**: Administrators can adjust the limit as needed through the admin dashboard
5. **Blackout Dates**: Administrators can also set specific blackout dates when no bookings are allowed

### Implementation Details

#### Settings Model

The maximum daily bookings limit is stored in the Settings model:

```typescript
interface ISettingsDocument extends mongoose.Document {
  maxDailyBookings: number;
  blackoutDates: Date[];
}

const SettingsSchema = new Schema<ISettingsDocument, ISettingsModel>({
  maxDailyBookings: {
    type: Number,
    required: true,
    default: 6, // Default to 6 bookings per day
    min: 1,
  },
  blackoutDates: {
    type: [Date],
    default: [],
    index: true,
  },
});
```

#### Availability Check Integration

The maximum daily bookings check is integrated into the batch availability endpoint:

```typescript
// Get the settings including blackout dates and max daily bookings
const settings = await Settings.getSettings();
const maxDailyBookings = settings.maxDailyBookings;

// Get the total number of confirmed bookings for this date
const totalBookingsForDate = await Contact.countDocuments({
  partyDate: {
    $gte: startOfDay,
    $lte: endOfDay,
  },
  confirmed: "Confirmed",
});

// Check if the date has reached its booking limit
const dateAtCapacity = totalBookingsForDate >= maxDailyBookings;

// Add date capacity information to the response
return NextResponse.json({
  ...results,
  _meta: {
    isBlackoutDate: false,
    dateAtCapacity,
    totalBookings: totalBookingsForDate,
    maxBookings: maxDailyBookings,
  },
});
```

#### Admin Dashboard Controls

Administrators can manage the maximum daily bookings and blackout dates through the admin dashboard:

1. **Set Maximum Bookings**: Adjust the maximum number of bookings allowed per day
2. **Add Blackout Dates**: Set specific dates when no bookings are allowed
3. **Remove Blackout Dates**: Remove previously set blackout dates

#### Client-Side Implementation

The checkout process checks if a date is at capacity and displays appropriate messages:

```typescript
// Check if the date is a blackout date or at capacity
if (results._meta && results._meta.isBlackoutDate) {
  setIsDateAtCapacity(true);
  setDateCapacityMessage(
    "This date is unavailable for booking. Please select another date or call 512-210-0194 to inquire about additional availability.",
  );
} else if (results._meta && results._meta.dateAtCapacity) {
  setIsDateAtCapacity(true);
  setDateCapacityMessage(
    `This date has reached its maximum booking capacity (${results._meta.totalBookings}/${results._meta.maxBookings}). Please select another date or call 512-210-0194 to inquire about additional availability.`,
  );
} else {
  setIsDateAtCapacity(false);
  setDateCapacityMessage("");
}
```

The UI displays a clear message when a date is at capacity:

```jsx
{
  isDateAtCapacity && (
    <div className="mt-2 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
      <p className="text-sm">{dateCapacityMessage}</p>
    </div>
  );
}
```

### Benefits

1. **Operational Efficiency**: Ensures the business doesn't overcommit beyond its capacity
2. **Improved Customer Experience**: Prevents disappointment by clearly showing when dates are unavailable
3. **Resource Management**: Helps balance workload across different days
4. **Flexibility**: Administrators can adjust the limit based on staffing levels or seasonal demands
5. **Reduced Administrative Overhead**: Automatically prevents overbooking without manual intervention

## Order Data Model

The Order model represents a customer's order for bounce house rentals and related services.

### Core Properties

| Property             | Type                         | Description                                                      | Required                 |
| -------------------- | ---------------------------- | ---------------------------------------------------------------- | ------------------------ |
| `_id`                | `string`                     | MongoDB document ID                                              | Auto-generated           |
| `orderNumber`        | `string`                     | Unique order identifier (e.g., BB-2024-0001)                     | Yes                      |
| `contactId`          | `string`                     | Reference to a Contact document                                  | No\*                     |
| `customerEmail`      | `string`                     | Customer's email address                                         | No\*                     |
| `items`              | `OrderItem[]`                | Array of ordered items                                           | Yes                      |
| `subtotal`           | `number`                     | Sum of all item prices                                           | Yes                      |
| `taxAmount`          | `number`                     | Tax amount                                                       | Yes                      |
| `discountAmount`     | `number`                     | Discount amount                                                  | Yes (default: 0)         |
| `deliveryFee`        | `number`                     | Delivery fee                                                     | Yes (default: $20)       |
| `processingFee`      | `number`                     | Credit card processing fee (3% of subtotal+tax, for PayPal only) | Yes (auto-calculated)    |
| `totalAmount`        | `number`                     | Final amount                                                     | Yes                      |
| `depositAmount`      | `number`                     | Initial deposit amount                                           | Yes (default: 0)         |
| `balanceDue`         | `number`                     | Remaining balance                                                | Yes                      |
| `status`             | `OrderStatus`                | Current order status                                             | Yes (default: "Pending") |
| `paymentStatus`      | `PaymentStatus`              | Current payment status                                           | Yes (default: "Pending") |
| `paymentMethod`      | `PaymentMethod`              | Method of payment                                                | Yes                      |
| `paypalTransactions` | `PayPalTransactionDetails[]` | PayPal transaction details                                       | No                       |
| `notes`              | `string`                     | Additional order notes                                           | No                       |
| `tasks`              | `string[]`                   | List of tasks associated with the order                          | No                       |
| `createdAt`          | `Date`                       | Order creation date                                              | Auto-generated           |
| `updatedAt`          | `Date`                       | Order last update date                                           | Auto-generated           |

\*Note: Either `contactId` or `customerEmail` must be provided.

### Customer Information

If an order is not associated with a contact (`contactId`), the following customer information can be provided directly:

| Property          | Type     | Description              |
| ----------------- | -------- | ------------------------ |
| `customerName`    | `string` | Customer's name          |
| `customerEmail`   | `string` | Customer's email address |
| `customerPhone`   | `string` | Customer's phone number  |
| `customerAddress` | `string` | Customer's address       |
| `customerCity`    | `string` | Customer's city          |
| `customerState`   | `string` | Customer's state         |
| `customerZipCode` | `string` | Customer's zip code      |

### Order Item

Each order contains one or more items:

| Property      | Type            | Description                                 | Required              |
| ------------- | --------------- | ------------------------------------------- | --------------------- |
| `type`        | `OrderItemType` | Type of item ("bouncer", "extra", "add-on") | Yes                   |
| `name`        | `string`        | Item name                                   | Yes                   |
| `description` | `string`        | Item description                            | No                    |
| `quantity`    | `number`        | Quantity ordered                            | Yes (default: 1)      |
| `unitPrice`   | `number`        | Price per unit                              | Yes                   |
| `totalPrice`  | `number`        | Total price (quantity \* unitPrice)         | Yes (auto-calculated) |

### PayPal Transaction

For orders paid with PayPal, transaction details are stored:

| Property        | Type                      | Description                                 | Required             |
| --------------- | ------------------------- | ------------------------------------------- | -------------------- |
| `transactionId` | `string`                  | PayPal transaction ID                       | Yes                  |
| `payerId`       | `string`                  | PayPal payer ID                             | No                   |
| `payerEmail`    | `string`                  | Payer's email address                       | No                   |
| `amount`        | `number`                  | Transaction amount                          | Yes                  |
| `currency`      | `Currency`                | Transaction currency (only "USD" supported) | Yes (default: "USD") |
| `status`        | `PayPalTransactionStatus` | Transaction status                          | Yes                  |
| `createdAt`     | `Date`                    | Transaction creation date                   | Auto-generated       |
| `updatedAt`     | `Date`                    | Transaction last update date                | No                   |

### Enums

#### OrderStatus

```typescript
type OrderStatus =
  | "Pending" // Initial state when order is created
  | "Processing" // Order is being processed
  | "Paid" // Payment has been received
  | "Confirmed" // Order has been confirmed
  | "Cancelled" // Order has been cancelled
  | "Refunded"; // Order has been refunded
```

#### PaymentStatus

```typescript
type PaymentStatus =
  | "Pending" // Payment not yet initiated
  | "Authorized" // Payment authorized but not captured
  | "Paid" // Payment completed
  | "Failed" // Payment attempt failed
  | "Refunded" // Payment fully refunded
  | "Partially Refunded"; // Payment partially refunded
```

#### PaymentMethod

```typescript
type PaymentMethod = "paypal" | "cash" | "quickbooks" | "free";
```

#### OrderItemType

```typescript
type OrderItemType = "bouncer" | "extra" | "add-on";
```

#### PayPalTransactionStatus

```typescript
type PayPalTransactionStatus =
  | "CREATED" // Transaction created but not completed
  | "SAVED" // Transaction saved for later completion
  | "APPROVED" // Transaction approved but not captured
  | "VOIDED" // Transaction voided
  | "COMPLETED" // Transaction completed successfully
  | "PAYER_ACTION_REQUIRED" // Requires additional payer action
  | "FAILED"; // Transaction failed
```

## API Endpoints

### List Orders

**Endpoint:** `GET /api/v1/orders`

**Authentication:** Required

**Query Parameters:**

| Parameter       | Type            | Description                                               |
| --------------- | --------------- | --------------------------------------------------------- |
| `startDate`     | `string`        | Filter orders created on or after this date (ISO format)  |
| `endDate`       | `string`        | Filter orders created on or before this date (ISO format) |
| `status`        | `OrderStatus`   | Filter orders by status                                   |
| `paymentStatus` | `PaymentStatus` | Filter orders by payment status                           |
| `contactId`     | `string`        | Filter orders by contact ID                               |
| `orderNumber`   | `string`        | Filter orders by order number                             |

**Response:**

```json
{
  "orders": [
    {
      "_id": "60d21b4667d0d8992e610c85",
      "orderNumber": "BB-2024-0001",
      "contactId": "60d21b4667d0d8992e610c84",
      "items": [
        {
          "type": "bouncer",
          "name": "Test Bouncer",
          "quantity": 1,
          "unitPrice": 150,
          "totalPrice": 150
        }
      ],
      "subtotal": 150,
      "taxAmount": 12.38,
      "discountAmount": 0,
      "deliveryFee": 20,
      "processingFee": 4.5,
      "totalAmount": 186.88,
      "depositAmount": 50,
      "balanceDue": 136.88,
      "status": "Pending",
      "paymentStatus": "Pending",
      "paymentMethod": "paypal",
      "createdAt": "2024-04-14T15:00:00.000Z",
      "updatedAt": "2024-04-14T15:00:00.000Z"
    }
  ]
}
```

### Create Order

**Endpoint:** `POST /api/v1/orders`

**Authentication:** Not required

**Request Body:**

```json
{
  "contactId": "60d21b4667d0d8992e610c84",
  // OR customer information if no contactId
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "123-456-7890",
  "customerAddress": "123 Main St",
  "customerCity": "San Antonio",
  "customerState": "TX",
  "customerZipCode": "78701",

  "items": [
    {
      "type": "bouncer",
      "name": "Test Bouncer",
      "quantity": 1,
      "unitPrice": 150,
      "totalPrice": 150
    }
  ],
  "taxAmount": 12.38,
  "discountAmount": 0,
  "paymentMethod": "paypal",
  "notes": "Please deliver before noon"
}
```

**Notes:**

- Either `contactId` or `customerEmail` must be provided
- The following fields are optional and will be calculated if not provided:
  - `subtotal` (calculated from items)
  - `deliveryFee` (defaults to $20)
  - `processingFee` (calculated as 3% of subtotal+tax, rounded to nearest cent, for PayPal payments only)
  - `totalAmount` (calculated from subtotal, taxAmount, deliveryFee, processingFee, and discountAmount)
  - `balanceDue` (calculated from totalAmount and depositAmount)
  - `orderNumber` (auto-generated if not provided)
  - `status` and `paymentStatus` (default to "Pending")

**Response:**

```json
{
  "_id": "60d21b4667d0d8992e610c85",
  "orderNumber": "BB-2024-0001",
  "contactId": "60d21b4667d0d8992e610c84",
  "items": [
    {
      "type": "bouncer",
      "name": "Test Bouncer",
      "quantity": 1,
      "unitPrice": 150,
      "totalPrice": 150
    }
  ],
  "subtotal": 150,
  "taxAmount": 12.38,
  "discountAmount": 0,
  "deliveryFee": 20,
  "processingFee": 4.5,
  "totalAmount": 186.88,
  "depositAmount": 0,
  "balanceDue": 186.88,
  "status": "Pending",
  "paymentStatus": "Pending",
  "paymentMethod": "paypal",
  "notes": "Please deliver before noon",
  "createdAt": "2024-04-14T15:00:00.000Z",
  "updatedAt": "2024-04-14T15:00:00.000Z"
}
```

### Get Order by ID

**Endpoint:** `GET /api/v1/orders/[id]`

**Authentication:** Required

**Response:**

```json
{
  "_id": "60d21b4667d0d8992e610c85",
  "orderNumber": "BB-2024-0001",
  "contactId": "60d21b4667d0d8992e610c84",
  "items": [
    {
      "type": "bouncer",
      "name": "Test Bouncer",
      "quantity": 1,
      "unitPrice": 150,
      "totalPrice": 150
    }
  ],
  "subtotal": 150,
  "taxAmount": 12.38,
  "discountAmount": 0,
  "deliveryFee": 20,
  "processingFee": 4.5,
  "totalAmount": 186.88,
  "depositAmount": 50,
  "balanceDue": 136.88,
  "status": "Pending",
  "paymentStatus": "Pending",
  "paymentMethod": "paypal",
  "createdAt": "2024-04-14T15:00:00.000Z",
  "updatedAt": "2024-04-14T15:00:00.000Z"
}
```

### Update Order

**Endpoint:** `PUT /api/v1/orders/[id]`

**Authentication:** Required

**Request Body:**

```json
{
  "status": "Processing",
  "notes": "Updated order notes"
}
```

**Notes:**

- Only the fields that need to be updated should be included in the request body
- Some status transitions may be restricted (e.g., cannot change from "Refunded" to "Pending")
- If items are updated, subtotal, totalAmount, and balanceDue will be recalculated

**Response:**

```json
{
  "_id": "60d21b4667d0d8992e610c85",
  "orderNumber": "BB-2024-0001",
  "contactId": "60d21b4667d0d8992e610c84",
  "items": [
    {
      "type": "bouncer",
      "name": "Test Bouncer",
      "quantity": 1,
      "unitPrice": 150,
      "totalPrice": 150
    }
  ],
  "subtotal": 150,
  "taxAmount": 12.38,
  "discountAmount": 0,
  "deliveryFee": 20,
  "processingFee": 4.5,
  "totalAmount": 186.88,
  "depositAmount": 50,
  "balanceDue": 136.88,
  "status": "Processing",
  "paymentStatus": "Pending",
  "paymentMethod": "paypal",
  "notes": "Updated order notes",
  "createdAt": "2024-04-14T15:00:00.000Z",
  "updatedAt": "2024-04-14T15:05:00.000Z"
}
```

### Delete Order

**Endpoint:** `DELETE /api/v1/orders/[id]`

**Authentication:** Required (Admin only)

**Restrictions:**

- Cannot delete orders with status "Paid" or "Confirmed"
- Only admin users can delete orders

**Response:**

```json
{
  "message": "Order deleted successfully"
}
```

### Payment Processing

#### Payment Methods

The application supports multiple payment methods:

1. **PayPal**: Online payment processed through PayPal's payment gateway
2. **Cash**: Cash payment collected at the time of delivery
3. **QuickBooks**: Payment processed through QuickBooks (admin-only)
4. **Free**: No payment required (admin-only)

#### Deposit Options

For PayPal payments, customers can choose between:

1. **Full Payment**: Pay the entire amount upfront
2. **Deposit Payment**: Pay a deposit (typically 50% of the total) upfront, with the remaining balance due at delivery

Cash payments are always processed as full payments at the time of delivery.

#### PayPal Integration

The application uses the official PayPal React SDK (`@paypal/react-paypal-js`) for payment processing. This integration provides a seamless checkout experience with both PayPal and credit card payment options.

**Key Components:**

1. **PayPalScriptProvider**: Manages the loading of the PayPal JavaScript SDK
2. **PayPalButtons**: Renders the PayPal Smart Payment Buttons

**Configuration:**

```typescript
// PayPal configuration (src/config/paypal.ts)
export const paypalConfig = {
  clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
  currency: "USD",
  intent: "capture",
  components: "buttons",
};
```

**Implementation in Checkout:**

The PayPal integration is implemented in the Step5_Payment component of the checkout process:

```typescript
<PayPalScriptProvider options={paypalConfig}>
  <PayPalButtons
    style={{
      layout: "vertical",
      color: "gold",
      shape: "rect",
      label: "pay",
      height: 45
    }}
    createOrder={(data, actions) => {
      // For deposit payments, use depositAmount instead of totalAmount
      const paymentAmount = state.depositAmount > 0 ? state.depositAmount : state.totalAmount;

      return actions.order.create({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              value: paymentAmount.toFixed(2),
              currency_code: "USD",
            },
            description: state.depositAmount > 0
              ? "Bounce House Rental - Deposit Payment"
              : "Bounce House Rental - Full Payment",
          },
        ],
        application_context: {
          shipping_preference: "NO_SHIPPING",
          user_action: "PAY_NOW",
        },
      });
    }}
    onApprove={async (data, actions) => {
      const orderDetails = await actions.order.capture();
      // Process successful payment
      handlePaymentSuccess(orderDetails.id);
    }}
    onError={(err) => {
      // Handle payment errors
      handlePaymentError(err);
    }}
  />
</PayPalScriptProvider>
```

**PayPal Payment Flow:**

1. User selects PayPal as payment method
2. User chooses between full payment or deposit payment (if applicable)
3. User clicks the PayPal button
4. PayPal modal opens for payment selection (PayPal account or credit card)
5. User completes payment in the PayPal interface
6. On successful payment, the `onApprove` callback is triggered
7. The application captures the payment and updates the order status
8. The order details are sent to the backend for processing

**Cash Payment Flow:**

1. User selects Cash on Delivery as payment method
2. User completes the order (no online payment required)
3. Order is created with status "Pending" and payment status "Pending"
4. Customer pays in cash at the time of delivery
5. Admin updates the order status after receiving payment

**Processing Fee:**

- For PayPal payments, a 3% processing fee is applied to the subtotal plus tax
- For Cash payments, no processing fee is applied

#### Initiate Payment

**Endpoint:** `POST /api/v1/orders/[id]/payment`

**Authentication:** Not required

**Request Body:**

```json
{
  "amount": 186.88
}
```

**Notes:**

- The amount must match either the total amount or the deposit amount
- This endpoint simulates initiating a PayPal payment and returns a PayPal order ID

**Response:**

```json
{
  "paypalOrderId": "PAY-1234567890",
  "amount": 186.88,
  "currency": "USD",
  "orderNumber": "BB-2024-0001"
}
```

#### Record Payment Transaction

**Endpoint:** `PATCH /api/v1/orders/[id]/payment`

**Authentication:** Not required

**Request Body:**

```json
{
  "transactionId": "PAY-123456789",
  "payerId": "PAYER-123",
  "payerEmail": "customer@example.com",
  "amount": 186.88,
  "currency": "USD",
  "status": "COMPLETED"
}
```

**Notes:**

- This endpoint records a payment transaction and updates the order's payment status
- If the payment is for the full amount, the order status will be updated to "Paid"
- If the payment is for the deposit amount, the payment status will be updated to "Authorized"
- Multiple partial payments can be recorded, and the balance due will be updated accordingly

**Response:**

```json
{
  "message": "Payment transaction recorded successfully",
  "order": {
    "_id": "60d21b4667d0d8992e610c85",
    "orderNumber": "BB-2024-0001",
    "contactId": "60d21b4667d0d8992e610c84",
    "items": [
      {
        "type": "bouncer",
        "name": "Test Bouncer",
        "quantity": 1,
        "unitPrice": 150,
        "totalPrice": 150
      }
    ],
    "subtotal": 150,
    "taxAmount": 12.38,
    "discountAmount": 0,
    "deliveryFee": 20,
    "processingFee": 4.5,
    "totalAmount": 186.88,
    "depositAmount": 50,
    "balanceDue": 0,
    "status": "Paid",
    "paymentStatus": "Paid",
    "paymentMethod": "paypal",
    "paypalTransactions": [
      {
        "transactionId": "PAY-123456789
```
