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
4. [Examples](#examples)

## Order Data Model

The Order model represents a customer's order for bounce house rentals and related services.

### Core Properties

| Property             | Type                         | Description                                  | Required                 |
| -------------------- | ---------------------------- | -------------------------------------------- | ------------------------ |
| `_id`                | `string`                     | MongoDB document ID                          | Auto-generated           |
| `orderNumber`        | `string`                     | Unique order identifier (e.g., BB-2024-0001) | Yes                      |
| `contactId`          | `string`                     | Reference to a Contact document              | No\*                     |
| `customerEmail`      | `string`                     | Customer's email address                     | No\*                     |
| `items`              | `OrderItem[]`                | Array of ordered items                       | Yes                      |
| `subtotal`           | `number`                     | Sum of all item prices                       | Yes                      |
| `taxAmount`          | `number`                     | Tax amount                                   | Yes                      |
| `discountAmount`     | `number`                     | Discount amount                              | Yes (default: 0)         |
| `deliveryFee`        | `number`                     | Delivery fee                                 | Yes (default: $20)       |
| `processingFee`      | `number`                     | Credit card processing fee (3% of subtotal)  | Yes (auto-calculated)    |
| `totalAmount`        | `number`                     | Final amount                                 | Yes                      |
| `depositAmount`      | `number`                     | Initial deposit amount                       | Yes (default: 0)         |
| `balanceDue`         | `number`                     | Remaining balance                            | Yes                      |
| `status`             | `OrderStatus`                | Current order status                         | Yes (default: "Pending") |
| `paymentStatus`      | `PaymentStatus`              | Current payment status                       | Yes (default: "Pending") |
| `paymentMethod`      | `PaymentMethod`              | Method of payment                            | Yes                      |
| `paypalTransactions` | `PayPalTransactionDetails[]` | PayPal transaction details                   | No                       |
| `notes`              | `string`                     | Additional order notes                       | No                       |
| `tasks`              | `string[]`                   | List of tasks associated with the order      | No                       |
| `createdAt`          | `Date`                       | Order creation date                          | Auto-generated           |
| `updatedAt`          | `Date`                       | Order last update date                       | Auto-generated           |

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
  - `processingFee` (calculated as 3% of subtotal)
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
        "transactionId": "PAY-123456789",
        "payerId": "PAYER-123",
        "payerEmail": "customer@example.com",
        "amount": 186.88,
        "currency": "USD",
        "status": "COMPLETED",
        "createdAt": "2024-04-14T15:10:00.000Z"
      }
    ],
    "createdAt": "2024-04-14T15:00:00.000Z",
    "updatedAt": "2024-04-14T15:10:00.000Z"
  }
}
```

## Order Status Flow

The typical flow of an order is as follows:

1. **Pending**: Initial state when an order is created
2. **Processing**: Order is being processed (optional)
3. **Paid**: Payment has been received in full
4. **Confirmed**: Order has been confirmed and scheduled
5. **Cancelled** or **Refunded**: If the order is cancelled or refunded

The payment status follows a similar flow:

1. **Pending**: Initial state when an order is created
2. **Authorized**: Deposit payment has been received
3. **Paid**: Full payment has been received
4. **Failed**: Payment attempt failed
5. **Refunded** or **Partially Refunded**: If the payment is refunded

## Examples

### Creating a New Order

```javascript
// Example: Creating a new order with a contact ID
const createOrder = async (contactId) => {
  const response = await fetch("/api/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contactId,
      items: [
        {
          type: "bouncer",
          name: "Castle Bounce House",
          quantity: 1,
          unitPrice: 150,
          totalPrice: 150,
        },
        {
          type: "extra",
          name: "Generator",
          quantity: 1,
          unitPrice: 50,
          totalPrice: 50,
        },
      ],
      taxAmount: 16.5,
      discountAmount: 0,
      paymentMethod: "paypal",
      notes: "Please deliver before noon",
    }),
  });

  return await response.json();
};

// Example: Creating a new order with direct customer information
const createOrderWithCustomerInfo = async () => {
  const response = await fetch("/api/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      customerName: "John Doe",
      customerEmail: "john@example.com",
      customerPhone: "123-456-7890",
      customerAddress: "123 Main St",
      customerCity: "San Antonio",
      customerState: "TX",
      customerZipCode: "78701",
      items: [
        {
          type: "bouncer",
          name: "Castle Bounce House",
          quantity: 1,
          unitPrice: 150,
          totalPrice: 150,
        },
      ],
      taxAmount: 12.38,
      discountAmount: 0,
      paymentMethod: "paypal",
    }),
  });

  return await response.json();
};
```

### Processing a Payment

```javascript
// Example: Processing a payment for an order
const processPayment = async (orderId, amount) => {
  // Step 1: Initiate payment
  const initiateResponse = await fetch(`/api/v1/orders/${orderId}/payment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount,
    }),
  });

  const paymentInit = await initiateResponse.json();

  // Step 2: In a real implementation, you would redirect to PayPal for payment
  // and then receive a callback with the transaction details

  // Step 3: Record payment transaction
  const recordResponse = await fetch(`/api/v1/orders/${orderId}/payment`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      transactionId: paymentInit.paypalOrderId, // In a real implementation, this would come from PayPal
      payerId: "PAYER-123",
      payerEmail: "customer@example.com",
      amount,
      currency: "USD",
      status: "COMPLETED",
    }),
  });

  return await recordResponse.json();
};
```

### Fetching Orders

```javascript
// Example: Fetching all orders
const fetchOrders = async (token) => {
  const response = await fetch("/api/v1/orders", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return await response.json();
};

// Example: Fetching orders with filters
const fetchFilteredOrders = async (token, filters) => {
  const queryParams = new URLSearchParams();

  if (filters.startDate) queryParams.append("startDate", filters.startDate);
  if (filters.endDate) queryParams.append("endDate", filters.endDate);
  if (filters.status) queryParams.append("status", filters.status);
  if (filters.paymentStatus)
    queryParams.append("paymentStatus", filters.paymentStatus);
  if (filters.contactId) queryParams.append("contactId", filters.contactId);
  if (filters.orderNumber)
    queryParams.append("orderNumber", filters.orderNumber);

  const response = await fetch(`/api/v1/orders?${queryParams.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return await response.json();
};
```

### Updating an Order

```javascript
// Example: Updating an order
const updateOrder = async (orderId, token, updates) => {
  const response = await fetch(`/api/v1/orders/${orderId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });

  return await response.json();
};

// Example: Updating order status
const updateOrderStatus = async (orderId, token, status) => {
  return await updateOrder(orderId, token, { status });
};
```

### Deleting an Order

```javascript
// Example: Deleting an order (admin only)
const deleteOrder = async (orderId, adminToken) => {
  const response = await fetch(`/api/v1/orders/${orderId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  });

  return await response.json();
};
```

This documentation should provide a comprehensive guide for frontend developers to integrate with the Orders API.
