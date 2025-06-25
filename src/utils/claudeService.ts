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

IMPORTANT: For the htmlContent field, use SIMPLE HTML only:
- Use basic tags like <p>, <br>, <strong>, <em>
- NO inline styles, NO CSS, NO complex formatting
- Keep HTML clean and minimal to avoid JSON parsing issues

Please provide both a subject line and the email content. Format your response as JSON with "subject", "content" (plain text), and "htmlContent" (simple HTML formatted) fields.`;

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
      // Parse the Claude response as JSON
      const parsedResponse = parseClaudeResponse(claudeResponse);

      if (!parsedResponse.subject || !parsedResponse.content) {
        throw new Error("Missing required fields in Claude response");
      }

      // Clean and validate the content
      const cleanContent = cleanTextContent(parsedResponse.content);
      const cleanHtml = parsedResponse.htmlContent
        ? cleanHtmlContent(parsedResponse.htmlContent)
        : convertTextToHtml(cleanContent);

      const result = {
        subject: cleanTextContent(parsedResponse.subject),
        content: cleanContent,
        htmlContent: cleanHtml,
      };

      // Validate the final result
      validateEmailContent(result);

      return result;
    } catch (parseError) {
      console.warn("Failed to parse Claude response as JSON, using fallback");
      return createFallbackKudosEmail(request, claudeResponse);
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
 * Parse Claude's response and extract JSON content
 * @param claudeResponse Raw response from Claude API
 * @returns Parsed JSON object
 */
function parseClaudeResponse(claudeResponse: string): any {
  let cleanResponse = claudeResponse.trim();

  // Remove markdown code block markers
  cleanResponse = cleanResponse.replace(/```json\s*/gi, "");
  cleanResponse = cleanResponse.replace(/```\s*/g, "");

  // Check if response was truncated (common issue with complex HTML)
  if (cleanResponse.endsWith("\\")) {
    console.warn("Claude response appears to be truncated");
    throw new Error("Response truncated");
  }

  // Extract JSON content - look for the outermost JSON object
  const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleanResponse = jsonMatch[0];
  }

  // Try to fix common JSON issues before parsing
  try {
    return JSON.parse(cleanResponse);
  } catch (error) {
    console.warn("Initial JSON parse failed, attempting to fix common issues");

    // Try to fix truncated JSON by finding the last complete field
    let fixedResponse = cleanResponse;

    // If it ends with an incomplete string, try to close it
    if (fixedResponse.match(/[^\\]"[^"]*$/)) {
      // Find the last complete field and truncate there
      const lastCompleteField = fixedResponse.lastIndexOf('",');
      if (lastCompleteField > 0) {
        fixedResponse = fixedResponse.substring(0, lastCompleteField + 1) + "}";
      }
    }

    // Try parsing the fixed version
    try {
      return JSON.parse(fixedResponse);
    } catch (secondError) {
      console.warn("Could not fix JSON, will use fallback");
      throw error; // Throw original error
    }
  }
}

/**
 * Clean text content by removing formatting artifacts
 * @param content Raw text content
 * @returns Clean text content
 */
function cleanTextContent(content: string): string {
  if (!content) return "";

  let cleaned = content.trim();

  // Remove JSON artifacts if present
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

  // Convert HTML to plain text if present
  if (cleaned.includes("<") && cleaned.includes(">")) {
    cleaned = convertHtmlToText(cleaned);
  }

  // Clean up formatting artifacts
  cleaned = cleaned
    .replace(/\*\*(.*?)\*\*/g, "$1") // Remove markdown bold
    .replace(/\*(.*?)\*/g, "$1") // Remove markdown italic
    .replace(/```[\s\S]*?```/g, "") // Remove code blocks
    .replace(/`(.*?)`/g, "$1") // Remove inline code
    .replace(/\\n/g, "\n") // Convert escaped newlines
    .replace(/\\"/g, '"') // Convert escaped quotes
    .replace(/\n{3,}/g, "\n\n") // Replace multiple newlines
    .trim();

  return cleaned;
}

/**
 * Clean HTML content by removing artifacts
 * @param htmlContent Raw HTML content
 * @returns Clean HTML content
 */
function cleanHtmlContent(htmlContent: string): string {
  if (!htmlContent) return "";

  let cleaned = htmlContent.trim();

  // Remove markdown code blocks
  cleaned = cleaned.replace(/```json\s*\n?/gi, "");
  cleaned = cleaned.replace(/```\s*/g, "");

  // Remove JSON structure artifacts
  cleaned = cleaned.replace(/{\s*"[^"]*":\s*"/g, "");
  cleaned = cleaned.replace(/",\s*"[^"]*":\s*"/g, "");
  cleaned = cleaned.replace(/"\s*}/g, "");

  // Convert escaped characters
  cleaned = cleaned.replace(/\\n/g, "\n");
  cleaned = cleaned.replace(/\\"/g, '"');

  return cleaned;
}

/**
 * Convert plain text to HTML
 * @param text Plain text content
 * @returns HTML formatted content
 */
function convertTextToHtml(text: string): string {
  if (!text) return "";

  return text
    .split(/\n\s*\n/) // Split on double newlines (paragraphs)
    .filter((paragraph) => paragraph.trim()) // Remove empty paragraphs
    .map((paragraph) => `<p>${paragraph.trim().replace(/\n/g, "<br>")}</p>`)
    .join("\n");
}

/**
 * Validate email content structure
 * @param emailContent Email content to validate
 * @throws Error if validation fails
 */
function validateEmailContent(emailContent: {
  subject: string;
  content: string;
  htmlContent: string;
}): void {
  const errors: string[] = [];

  if (!emailContent.subject?.trim()) {
    errors.push("Subject is required");
  }

  if (!emailContent.content?.trim()) {
    errors.push("Content is required");
  }

  if (!emailContent.htmlContent?.trim()) {
    errors.push("HTML content is required");
  }

  // Check for JSON artifacts in content
  if (
    emailContent.content.includes('{"subject"') ||
    emailContent.content.includes('"content"')
  ) {
    errors.push("Content contains JSON artifacts");
  }

  if (
    emailContent.htmlContent.includes('{"subject"') ||
    emailContent.htmlContent.includes('"htmlContent"')
  ) {
    errors.push("HTML content contains JSON artifacts");
  }

  if (errors.length > 0) {
    throw new Error(`Email content validation failed: ${errors.join(", ")}`);
  }
}

/**
 * Create fallback kudos email when Claude parsing fails
 * @param request Original request data
 * @param claudeResponse Raw Claude response
 * @returns Fallback email content
 */
function createFallbackKudosEmail(
  request: KudosEmailRequest,
  claudeResponse: string,
): KudosEmailResponse {
  // Extract subject if possible
  const subjectMatch = claudeResponse.match(/subject[:\s]*(.+)/i);
  const subject = subjectMatch
    ? subjectMatch[1].trim().replace(/['"]/g, "")
    : "Thank You for Choosing Us!";

  // Create basic content
  const content = `Hi ${request.customerName}!

Thank you so much for choosing us for your event on ${request.eventDate}! We hope you and your guests had an amazing time with the ${request.rentalItems.join(", ")}.

${request.positiveComment1}

${request.positiveComment2}

${request.positiveComment3}

We'd love to hear about your experience! Please consider leaving us a 5-star review on Google: ${GOOGLE_REVIEW_LINK}

Thanks again for your business, and we hope to serve you again soon!

${EMAIL_SIGNATURE}`;

  return {
    subject,
    content,
    htmlContent: convertTextToHtml(content),
  };
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
 * Clean HTML content that might contain markdown formatting
 * @param htmlContent HTML content that might have markdown artifacts
 * @returns Clean HTML content
 */
function cleanHtmlContentFromMarkdown(htmlContent: string): string {
  let cleaned = htmlContent.trim();

  // Remove any markdown code blocks that might be in HTML
  cleaned = cleaned.replace(/```json\s*\n?/gi, "");
  cleaned = cleaned.replace(/```\s*/g, "");

  // Remove any JSON structure artifacts that might have leaked into HTML
  cleaned = cleaned.replace(/{\s*"[^"]*":\s*"/g, "");
  cleaned = cleaned.replace(/",\s*"[^"]*":\s*"/g, "");
  cleaned = cleaned.replace(/"\s*}/g, "");

  return cleaned;
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

IMPORTANT: For the htmlContent field, use SIMPLE HTML only:
- Use basic tags like <p>, <br>, <strong>, <em>
- NO inline styles, NO CSS, NO complex formatting
- Keep HTML clean and minimal to avoid JSON parsing issues

Please provide both a subject line and the email content. Format your response as JSON with "subject", "content" (plain text), and "htmlContent" (simple HTML formatted) fields.`;

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
        max_tokens: 2000,
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
      // Parse the Claude response as JSON
      const parsedResponse = parseClaudeResponse(claudeResponse);

      if (!parsedResponse.subject || !parsedResponse.content) {
        throw new Error("Missing required fields in Claude response");
      }

      // Clean and validate the content
      const cleanContent = cleanTextContent(parsedResponse.content);
      const cleanHtml = parsedResponse.htmlContent
        ? cleanHtmlContent(parsedResponse.htmlContent)
        : convertTextToHtml(cleanContent);

      const result = {
        subject: cleanTextContent(parsedResponse.subject),
        content: cleanContent,
        htmlContent: cleanHtml,
      };

      // Validate the final result
      validateEmailContent(result);

      return result;
    } catch (parseError) {
      console.warn("Failed to parse Claude response as JSON, using fallback");
      return createFallbackMarketingEmail(request, claudeResponse);
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
 * Create fallback marketing email when Claude parsing fails
 * @param request Original request data
 * @param claudeResponse Raw Claude response
 * @returns Fallback email content
 */
function createFallbackMarketingEmail(
  request: MarketingEmailRequest,
  claudeResponse: string,
): MarketingEmailResponse {
  // Extract subject if possible
  const subjectMatch = claudeResponse.match(/subject[:\s]*(.+)/i);
  const subject = subjectMatch
    ? subjectMatch[1].trim().replace(/['"]/g, "")
    : "Special Offer from Your Bounce House Experts!";

  // Create basic content based on request
  const content = `Hey there!

We have an exciting ${request.campaignType} offer just for you! 🎉

${request.keyMessage}

${request.promotionDetails ? `Here's what we're offering: ${request.promotionDetails}` : ""}

Don't miss out on this amazing opportunity to create unforgettable memories for your family and friends!

${request.callToAction}

${EMAIL_SIGNATURE}`;

  return {
    subject,
    content,
    htmlContent: convertTextToHtml(content),
  };
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
