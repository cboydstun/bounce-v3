import { EmailData } from "./emailService";
import { GOOGLE_REVIEW_LINK, EMAIL_SIGNATURE } from "@/config/constants";

export interface KudosEmailRequest {
  customerName: string;
  customerEmail: string;
  eventDate: string;
  rentalItems: string[];
  positiveComment1: string;
  positiveComment2: string;
  positiveComment3: string;
}

export interface KudosEmailResponse {
  subject: string;
  content: string;
  htmlContent: string;
}

/**
 * Generate a personalized kudos email using Claude API
 * @param request The kudos email request data
 * @returns Promise resolving to the generated email content
 */
export async function generateKudosEmail(
  request: KudosEmailRequest,
): Promise<KudosEmailResponse> {
  const apiKey = process.env.CLAUDE_API_KEY;

  if (!apiKey) {
    throw new Error("Claude API key is not configured");
  }

  // Use Google review link from constants
  const googleReviewLink = GOOGLE_REVIEW_LINK;

  const prompt = `You are a friendly customer service representative for a bounce house rental company. Create a warm, personalized thank you email for a customer who recently had an event.

Customer Details:
- Name: ${request.customerName}
- Email: ${request.customerEmail}
- Event Date: ${request.eventDate}
- Rental Items: ${request.rentalItems.join(", ")}

Positive Comments from Admin:
1. ${request.positiveComment1}
2. ${request.positiveComment2}
3. ${request.positiveComment3}

Instructions:
- Write a warm, genuine thank you email
- Use the customer's name and mention their event date
- Mention the rental items they chose
- Use more than 5 emojis to make it friendly and engaging
- Naturally incorporate all three positive comments into the email
- Express gratitude for choosing our business
- Keep the tone friendly, personal, and authentic
- Make it feel like it's coming from a real person, not a template
- Include a clear call-to-action to leave a 5-star Google review
- Include the Google review link as a button: ${googleReviewLink}
- The email should be 200-300 words
- End with a warm closing and invitation to book again
- IMPORTANT: End the email with exactly this signature (do not modify it):

${EMAIL_SIGNATURE}

Please provide both a subject line and the email content. Format your response as JSON with "subject", "content" (plain text), and "htmlContent" (HTML formatted) fields.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Claude API error:", errorData);
      throw new Error(
        `Claude API error: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();

    if (!data.content || !data.content[0] || !data.content[0].text) {
      throw new Error("Invalid response format from Claude API");
    }

    const claudeResponse = data.content[0].text;

    try {
      // Clean the response - remove any markdown code blocks if present
      let cleanResponse = claudeResponse.trim();

      // Remove markdown code blocks if present
      if (cleanResponse.startsWith("```json")) {
        cleanResponse = cleanResponse
          .replace(/^```json\s*/, "")
          .replace(/\s*```$/, "");
      } else if (cleanResponse.startsWith("```")) {
        cleanResponse = cleanResponse
          .replace(/^```\s*/, "")
          .replace(/\s*```$/, "");
      }

      // Try to parse as JSON
      const parsedResponse = JSON.parse(cleanResponse);

      if (!parsedResponse.subject || !parsedResponse.content) {
        throw new Error("Missing required fields in Claude response");
      }

      // Clean the content to ensure it's plain text
      const cleanContent = cleanContentToText(parsedResponse.content);

      return {
        subject: parsedResponse.subject,
        content: cleanContent,
        htmlContent: parsedResponse.htmlContent || convertToHtml(cleanContent),
      };
    } catch (parseError) {
      // If JSON parsing fails, treat as plain text and extract manually
      console.warn(
        "Failed to parse Claude response as JSON, extracting manually",
      );

      // Extract subject and content from plain text response
      const lines = claudeResponse
        .split("\n")
        .filter((line: string) => line.trim());
      let subject = "Thank You for Choosing Us!";
      let content = claudeResponse;

      // Try to find a subject line
      const subjectMatch = claudeResponse.match(/subject[:\s]*(.+)/i);
      if (subjectMatch) {
        subject = subjectMatch[1].trim().replace(/['"]/g, "");
      }

      return {
        subject,
        content,
        htmlContent: convertToHtml(content),
      };
    }
  } catch (error) {
    console.error("Error generating kudos email:", error);
    throw new Error(
      error instanceof Error
        ? `Failed to generate email: ${error.message}`
        : "Failed to generate email with Claude API",
    );
  }
}

/**
 * Convert plain text content to basic HTML
 * @param text Plain text content
 * @returns HTML formatted content
 */
function convertToHtml(text: string): string {
  return text
    .split("\n\n")
    .map((paragraph) => `<p>${paragraph.trim()}</p>`)
    .join("\n")
    .replace(/\n/g, "<br>");
}

/**
 * Convert HTML content to plain text
 * @param html HTML content
 * @returns Plain text content
 */
function convertHtmlToText(html: string): string {
  return html
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/&nbsp;/g, " ") // Replace non-breaking spaces
    .replace(/&amp;/g, "&") // Replace HTML entities
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .trim();
}

/**
 * Clean and extract plain text content from potentially formatted text
 * @param content Content that might contain HTML, JSON, or other formatting
 * @returns Clean plain text
 */
function cleanContentToText(content: string): string {
  let cleaned = content.trim();

  // If it looks like JSON, try to extract just the text content
  if (cleaned.startsWith("{") && cleaned.endsWith("}")) {
    try {
      const parsed = JSON.parse(cleaned);
      if (parsed.content) {
        cleaned = parsed.content;
      } else if (typeof parsed === "string") {
        cleaned = parsed;
      }
    } catch {
      // If JSON parsing fails, continue with the original content
    }
  }

  // If it contains HTML tags, convert to plain text
  if (cleaned.includes("<") && cleaned.includes(">")) {
    cleaned = convertHtmlToText(cleaned);
  }

  // Clean up any remaining formatting artifacts
  cleaned = cleaned
    .replace(/\*\*(.*?)\*\*/g, "$1") // Remove markdown bold
    .replace(/\*(.*?)\*/g, "$1") // Remove markdown italic
    .replace(/```[\s\S]*?```/g, "") // Remove code blocks
    .replace(/`(.*?)`/g, "$1") // Remove inline code
    .replace(/\n{3,}/g, "\n\n") // Replace multiple newlines with double newlines
    .trim();

  return cleaned;
}

export interface MarketingEmailRequest {
  campaignType: "promotional" | "seasonal" | "product" | "custom";
  targetAudience: string;
  keyMessage: string;
  promotionDetails?: string;
  callToAction: string;
  tone: "friendly" | "professional" | "exciting" | "urgent";
  customerData?: {
    totalRecipients: number;
    hasOrderHistory: boolean;
    commonPreferences: string[];
  };
}

export interface MarketingEmailResponse {
  subject: string;
  content: string;
  htmlContent: string;
}

/**
 * Generate a personalized marketing email using Claude API
 * @param request The marketing email request data
 * @returns Promise resolving to the generated email content
 */
export async function generateMarketingEmail(
  request: MarketingEmailRequest,
): Promise<MarketingEmailResponse> {
  const apiKey = process.env.CLAUDE_API_KEY;

  if (!apiKey) {
    throw new Error("Claude API key is not configured");
  }

  const prompt = `You are a skilled marketing copywriter for a bounce house rental company. Create an engaging marketing email campaign.

Campaign Details:
- Campaign Type: ${request.campaignType}
- Target Audience: ${request.targetAudience}
- Key Message: ${request.keyMessage}
- Promotion Details: ${request.promotionDetails || "N/A"}
- Call to Action: ${request.callToAction}
- Tone: ${request.tone}

${
  request.customerData
    ? `
Audience Insights:
- Total Recipients: ${request.customerData.totalRecipients}
- Has Order History: ${request.customerData.hasOrderHistory ? "Yes" : "No"}
- Common Preferences: ${request.customerData.commonPreferences.join(", ")}
`
    : ""
}

Instructions:
- Write a compelling marketing email that drives action
- Use an attention-grabbing subject line
- Keep the email concise but persuasive (200-400 words)
- Use the specified tone throughout
- Include 3-5 relevant emojis to make it engaging
- Incorporate the key message naturally
- End with a clear, compelling call-to-action
- Make it feel personal and authentic, not overly salesy
- Focus on benefits to the customer (fun, convenience, memories)
- Include urgency if appropriate for the campaign type
- End with a warm closing and company signature

${EMAIL_SIGNATURE}

Please provide both a subject line and the email content. Format your response as JSON with "subject", "content" (plain text), and "htmlContent" (HTML formatted) fields.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1200,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Claude API error:", errorData);
      throw new Error(
        `Claude API error: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();

    if (!data.content || !data.content[0] || !data.content[0].text) {
      throw new Error("Invalid response format from Claude API");
    }

    const claudeResponse = data.content[0].text;

    try {
      // Clean the response - remove any markdown code blocks if present
      let cleanResponse = claudeResponse.trim();

      // Remove markdown code blocks if present
      if (cleanResponse.startsWith("```json")) {
        cleanResponse = cleanResponse
          .replace(/^```json\s*/, "")
          .replace(/\s*```$/, "");
      } else if (cleanResponse.startsWith("```")) {
        cleanResponse = cleanResponse
          .replace(/^```\s*/, "")
          .replace(/\s*```$/, "");
      }

      // Try to parse as JSON
      const parsedResponse = JSON.parse(cleanResponse);

      if (!parsedResponse.subject || !parsedResponse.content) {
        throw new Error("Missing required fields in Claude response");
      }

      // Clean the content to ensure it's plain text
      const cleanContent = cleanContentToText(parsedResponse.content);

      return {
        subject: parsedResponse.subject,
        content: cleanContent,
        htmlContent: parsedResponse.htmlContent || convertToHtml(cleanContent),
      };
    } catch (parseError) {
      // If JSON parsing fails, treat as plain text and extract manually
      console.warn(
        "Failed to parse Claude response as JSON, extracting manually",
      );

      // Extract subject and content from plain text response
      const lines = claudeResponse
        .split("\n")
        .filter((line: string) => line.trim());
      let subject = "Special Offer from Your Bounce House Experts!";
      let content = claudeResponse;

      // Try to find a subject line
      const subjectMatch = claudeResponse.match(/subject[:\s]*(.+)/i);
      if (subjectMatch) {
        subject = subjectMatch[1].trim().replace(/['"]/g, "");
      }

      return {
        subject,
        content,
        htmlContent: convertToHtml(content),
      };
    }
  } catch (error) {
    console.error("Error generating marketing email:", error);
    throw new Error(
      error instanceof Error
        ? `Failed to generate email: ${error.message}`
        : "Failed to generate email with Claude API",
    );
  }
}

/**
 * Validate marketing email request data
 * @param request The request data to validate
 * @throws Error if validation fails
 */
export function validateMarketingEmailRequest(
  request: MarketingEmailRequest,
): void {
  const errors: string[] = [];

  if (!request.campaignType) {
    errors.push("Campaign type is required");
  }

  if (!request.targetAudience?.trim()) {
    errors.push("Target audience is required");
  } else if (request.targetAudience.length > 200) {
    errors.push("Target audience must be 200 characters or less");
  }

  if (!request.keyMessage?.trim()) {
    errors.push("Key message is required");
  } else if (request.keyMessage.length > 300) {
    errors.push("Key message must be 300 characters or less");
  }

  if (!request.callToAction?.trim()) {
    errors.push("Call to action is required");
  } else if (request.callToAction.length > 100) {
    errors.push("Call to action must be 100 characters or less");
  }

  if (!request.tone) {
    errors.push("Tone is required");
  }

  if (request.promotionDetails && request.promotionDetails.length > 500) {
    errors.push("Promotion details must be 500 characters or less");
  }

  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join(", ")}`);
  }
}

/**
 * Validate kudos email request data
 * @param request The request data to validate
 * @throws Error if validation fails
 */
export function validateKudosEmailRequest(request: KudosEmailRequest): void {
  const errors: string[] = [];

  if (!request.customerName?.trim()) {
    errors.push("Customer name is required");
  }

  if (!request.customerEmail?.trim()) {
    errors.push("Customer email is required");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(request.customerEmail)) {
    errors.push("Invalid email format");
  }

  if (!request.eventDate?.trim()) {
    errors.push("Event date is required");
  }

  if (!request.rentalItems || request.rentalItems.length === 0) {
    errors.push("At least one rental item is required");
  }

  if (!request.positiveComment1?.trim()) {
    errors.push("First positive comment is required");
  } else if (request.positiveComment1.length > 200) {
    errors.push("First positive comment must be 200 characters or less");
  }

  if (!request.positiveComment2?.trim()) {
    errors.push("Second positive comment is required");
  } else if (request.positiveComment2.length > 200) {
    errors.push("Second positive comment must be 200 characters or less");
  }

  if (!request.positiveComment3?.trim()) {
    errors.push("Third positive comment is required");
  } else if (request.positiveComment3.length > 200) {
    errors.push("Third positive comment must be 200 characters or less");
  }

  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join(", ")}`);
  }
}
