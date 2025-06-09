import { Order } from "@/types/order";
import crypto from "crypto";

export interface DocuSealSubmission {
  id: string;
  status: "pending" | "completed" | "declined" | "expired";
  submitters: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    signing_url?: string;
  }>;
  documents?: Array<{
    id: string;
    url: string;
    filename: string;
  }>;
  created_at: string;
  updated_at: string;
}

export interface DocuSealTemplate {
  id: string;
  name: string;
  fields: Array<{
    name: string;
    type: string;
    required: boolean;
  }>;
}

export interface DocuSealWebhookPayload {
  event_type:
    | "submission.completed"
    | "submission.viewed"
    | "submission.declined";
  data: {
    submission: DocuSealSubmission;
  };
}

/**
 * Service class for interacting with DocuSeal API
 */
export class DocuSealService {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly templateId: string;
  private readonly webhookSecret?: string;

  constructor() {
    this.baseUrl =
      process.env.DOCUSEAL_BASE_URL || "https://sign.slowbill.xyz/api";
    this.apiKey = process.env.DOCUSEAL_API_KEY || "";
    this.templateId = process.env.DOCUSEAL_TEMPLATE_ID || "";
    this.webhookSecret = process.env.DOCUSEAL_WEBHOOK_SECRET;

    if (!this.apiKey) {
      throw new Error("DOCUSEAL_API_KEY environment variable is required");
    }
    if (!this.templateId) {
      throw new Error("DOCUSEAL_TEMPLATE_ID environment variable is required");
    }
  }

  /**
   * Create a new submission for an order
   */
  async createSubmission(order: Order): Promise<DocuSealSubmission> {
    try {
      // Prepare submission data
      const submissionData = {
        template_id: this.templateId,
        send_email: false, // We'll handle email sending ourselves
        submitters: [
          {
            name: order.customerName || "Customer",
            email: order.customerEmail,
            role: "Customer",
          },
        ],
        fields: this.prepareOrderFields(order),
        metadata: {
          order_id: order._id,
          order_number: order.orderNumber,
        },
      };

      const response = await fetch(`${this.baseUrl}/submissions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Token": this.apiKey,
        },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `DocuSeal API error: ${response.status} - ${errorText}`,
        );
      }

      const submission: DocuSealSubmission = await response.json();
      return submission;
    } catch (error) {
      console.error("Error creating DocuSeal submission:", error);
      throw new Error(
        `Failed to create DocuSeal submission: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get submission status by ID
   */
  async getSubmissionStatus(submissionId: string): Promise<DocuSealSubmission> {
    try {
      const response = await fetch(
        `${this.baseUrl}/submissions/${submissionId}`,
        {
          headers: {
            "X-Auth-Token": this.apiKey,
          },
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `DocuSeal API error: ${response.status} - ${errorText}`,
        );
      }

      const submission: DocuSealSubmission = await response.json();
      return submission;
    } catch (error) {
      console.error("Error getting DocuSeal submission status:", error);
      throw new Error(
        `Failed to get submission status: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Download signed document from DocuSeal
   */
  async downloadSignedDocument(submissionId: string): Promise<Buffer | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/submissions/${submissionId}/download`,
        {
          method: "GET",
          headers: {
            "X-Auth-Token": this.apiKey,
            Accept: "application/pdf",
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          `DocuSeal API error: ${response.status} ${response.statusText}`,
        );
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error("Error downloading signed document:", error);
      throw error;
    }
  }

  /**
   * Void/cancel a submission
   */
  async voidSubmission(submissionId: string): Promise<void> {
    try {
      const response = await fetch(
        `${this.baseUrl}/submissions/${submissionId}/void`,
        {
          method: "POST",
          headers: {
            "X-Auth-Token": this.apiKey,
          },
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `DocuSeal API error: ${response.status} - ${errorText}`,
        );
      }
    } catch (error) {
      console.error("Error voiding DocuSeal submission:", error);
      throw new Error(
        `Failed to void submission: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get signing URL for a submission
   */
  async getSigningUrl(
    submissionId: string,
    submitterEmail: string,
  ): Promise<string> {
    try {
      const submission = await this.getSubmissionStatus(submissionId);
      const submitter = submission.submitters.find(
        (s: any) => s.email === submitterEmail,
      );

      if (!submitter || !submitter.signing_url) {
        throw new Error("Signing URL not found for submitter");
      }

      return submitter.signing_url;
    } catch (error) {
      console.error("Error getting signing URL:", error);
      throw new Error(
        `Failed to get signing URL: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Verify webhook signature from DocuSeal
   */
  verifyWebhookSignature(body: string, signature: string): boolean {
    if (!this.webhookSecret) {
      console.warn(
        "No webhook secret configured, skipping signature verification",
      );
      return true; // Allow if no secret is configured
    }

    try {
      const expectedSignature = crypto
        .createHmac("sha256", this.webhookSecret)
        .update(body)
        .digest("hex");

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature),
      );
    } catch (error) {
      console.error("Error verifying webhook signature:", error);
      return false;
    }
  }

  /**
   * Prepare order fields for DocuSeal template
   */
  private prepareOrderFields(order: Order): Record<string, any> {
    // Format items list
    const itemsList = order.items
      .map(
        (item) =>
          `${item.name} (Qty: ${item.quantity}) - $${item.totalPrice.toFixed(2)}`,
      )
      .join("\n");

    // Format delivery address
    const deliveryAddress = [
      order.customerAddress,
      order.customerCity,
      order.customerState,
      order.customerZipCode,
    ]
      .filter(Boolean)
      .join(", ");

    return {
      // Customer Information
      customer_name: order.customerName || "",
      customer_email: order.customerEmail || "",
      customer_phone: order.customerPhone || "",
      customer_address: deliveryAddress,

      // Order Information
      order_number: order.orderNumber,
      order_date: new Date(order.createdAt).toLocaleDateString(),
      event_date: order.eventDate
        ? new Date(order.eventDate).toLocaleDateString()
        : "",
      delivery_date: order.deliveryDate
        ? new Date(order.deliveryDate).toLocaleDateString()
        : "",

      // Rental Items
      rental_items: itemsList,
      subtotal: `$${order.subtotal.toFixed(2)}`,
      tax_amount: `$${order.taxAmount.toFixed(2)}`,
      delivery_fee: `$${order.deliveryFee.toFixed(2)}`,
      processing_fee: `$${order.processingFee.toFixed(2)}`,
      discount_amount:
        order.discountAmount > 0
          ? `-$${order.discountAmount.toFixed(2)}`
          : "$0.00",
      total_amount: `$${order.totalAmount.toFixed(2)}`,

      // Payment Information
      deposit_amount: `$${order.depositAmount.toFixed(2)}`,
      balance_due: `$${order.balanceDue.toFixed(2)}`,
      payment_method: order.paymentMethod,

      // Additional Information
      notes: order.notes || "",

      // Company Information (these should be in your template)
      company_name: "Bounce House Rentals San Antonio",
      company_phone: process.env.COMPANY_PHONE || "",
      company_email: process.env.COMPANY_EMAIL || "",
      company_address: process.env.COMPANY_ADDRESS || "",
    };
  }
}

// Export singleton instance
export const docusealService = new DocuSealService();
