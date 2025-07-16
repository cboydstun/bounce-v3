import { EmailData } from "./emailService";
import { GOOGLE_REVIEW_LINK, EMAIL_SIGNATURE } from "@/config/constants";
import {
  AIInsight,
  AIAnalysisRequest,
  AIAnalysisResponse,
  SEOChatResponse,
  CompetitiveAnalysis,
  RankingPrediction,
  Anomaly,
  PersonalizedStrategy,
  AIResponseCache,
  CacheConfig,
  AIAnalysisError,
} from "@/types/aiInsights";
import { ReportCard } from "@/types/reportCard";

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
- Example button HTML: <a href="${googleReviewLink}" style="color: blue; text-decoration: underline;">Leave a 5-star review</a>
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

// ============================================================================
// SEO AI ANALYSIS FUNCTIONS
// ============================================================================

// Cache for AI responses to reduce API costs
const aiResponseCache = new Map<string, AIResponseCache>();

// Cache configuration
const cacheConfig: CacheConfig = {
  insights: 3600000, // 1 hour
  summary: 14400000, // 4 hours
  competitive: 7200000, // 2 hours
  predictions: 86400000, // 24 hours
  chat: 1800000, // 30 minutes
};

/**
 * Generate AI-powered SEO insights from report card data
 * @param request Analysis request with report card data
 * @returns Promise resolving to AI insights and analysis
 */
export async function generateSEOInsights(
  request: AIAnalysisRequest,
): Promise<AIAnalysisResponse> {
  const apiKey = process.env.CLAUDE_API_KEY;

  if (!apiKey) {
    throw new Error("Claude API key is not configured");
  }

  // Check cache first
  const cacheKey = generateCacheKey(request);
  const cached = getCachedResponse(cacheKey, request.analysisType);
  if (cached) {
    return cached;
  }

  const prompt = buildSEOAnalysisPrompt(request);

  try {
    const response = await callClaudeAPI(prompt, 3000);
    const parsedResponse = parseClaudeResponse(response);

    // Validate and structure the response
    const insights = validateAndStructureInsights(parsedResponse, request);

    const result: AIAnalysisResponse = {
      insights,
      summary: parsedResponse.summary,
      executiveSummary: parsedResponse.executiveSummary,
      generatedAt: new Date().toISOString(),
      analysisType: request.analysisType,
    };

    // Cache the result
    setCachedResponse(cacheKey, result, request.analysisType);

    return result;
  } catch (error) {
    console.error("Error generating SEO insights:", error);
    const analysisError: AIAnalysisError = {
      code: "API_ERROR",
      message:
        error instanceof Error ? error.message : "Failed to generate insights",
      details: error,
      retryable: true,
    };
    throw new Error(analysisError.message);
  }
}

/**
 * Generate executive summary of SEO performance
 * @param reportCard Report card data
 * @returns Promise resolving to executive summary
 */
export async function generateExecutiveSummary(
  reportCard: ReportCard,
): Promise<string> {
  const apiKey = process.env.CLAUDE_API_KEY;

  if (!apiKey) {
    throw new Error("Claude API key is not configured");
  }

  const prompt = `You are an SEO expert creating an executive summary for business stakeholders.

SEO Performance Data:
- Overall Score: ${reportCard.overallScore}/100 (Grade: ${reportCard.overallGrade})
- Total Keywords: ${reportCard.totalKeywords}
- Average Position: ${reportCard.metrics.averagePosition}
- Visibility Score: ${reportCard.metrics.visibilityScore}%
- Keywords in Top 10: ${reportCard.keywordBreakdown.top10}
- Keywords in Top 3: ${reportCard.keywordBreakdown.top3}
- Keywords Not Ranking: ${reportCard.keywordBreakdown.notFound}
- Competitive Score: ${reportCard.metrics.competitiveScore}%
- Growth Score: ${reportCard.metrics.growthScore}%
- Position Trend: ${reportCard.trends.positionTrend}

Top Performers: ${reportCard.topPerformers.map((p) => `${p.keyword} (#${p.position})`).join(", ")}
Needs Attention: ${reportCard.needsAttention.map((k) => `${k.keyword} (${k.issue})`).join(", ")}

Instructions:
- Write a 3-4 paragraph executive summary in business language
- Focus on key achievements, challenges, and strategic recommendations
- Include specific metrics and their business impact
- Highlight competitive positioning and growth opportunities
- End with clear next steps and priorities
- Use professional tone suitable for executives
- Avoid technical SEO jargon

Format as plain text, no JSON needed.`;

  try {
    const response = await callClaudeAPI(prompt, 1500);
    return cleanTextContent(response);
  } catch (error) {
    console.error("Error generating executive summary:", error);
    return createFallbackExecutiveSummary(reportCard);
  }
}

/**
 * Handle natural language queries about SEO data
 * @param userQuery User's question
 * @param reportContext Report card context
 * @returns Promise resolving to chat response
 */
export async function handleSEOChatQuery(
  userQuery: string,
  reportContext: ReportCard,
): Promise<SEOChatResponse> {
  const apiKey = process.env.CLAUDE_API_KEY;

  if (!apiKey) {
    throw new Error("Claude API key is not configured");
  }

  const prompt = `You are an SEO expert assistant helping analyze search ranking performance.

User Question: "${userQuery}"

SEO Report Context:
- Overall Grade: ${reportContext.overallGrade} (${reportContext.overallScore}/100)
- Total Keywords: ${reportContext.totalKeywords}
- Average Position: ${reportContext.metrics.averagePosition}
- Visibility: ${reportContext.metrics.visibilityScore}%
- Top 10 Keywords: ${reportContext.keywordBreakdown.top10}
- Not Ranking: ${reportContext.keywordBreakdown.notFound}
- Position Trend: ${reportContext.trends.positionTrend}
- Competitive Score: ${reportContext.metrics.competitiveScore}%

Top Performers: ${reportContext.topPerformers.map((p) => `${p.keyword} (#${p.position}, ${p.trend})`).join(", ")}
Needs Attention: ${reportContext.needsAttention.map((k) => `${k.keyword} (${k.issue})`).join(", ")}
Competitive Opportunities: ${reportContext.competitorAnalysis.opportunities
    .slice(0, 3)
    .map((o) => `${o.keyword} vs ${o.competitor} (gap: ${o.gap})`)
    .join(", ")}

Instructions:
- Provide a helpful, specific answer referencing the data
- If asking for analysis, provide insights with data backing
- If asking for recommendations, be actionable and specific
- Include relevant metrics and trends
- Suggest 2-3 follow-up questions they might ask
- Keep response conversational but professional
- Reference specific keywords and competitors when relevant

Format response as JSON with:
{
  "message": "Main response text",
  "suggestions": ["Follow-up question 1", "Follow-up question 2"],
  "actionItems": ["Specific action 1", "Specific action 2"],
  "dataReferences": [{"type": "metric", "value": "specific value", "context": "explanation"}]
}`;

  try {
    const response = await callClaudeAPI(prompt, 2000);
    const parsed = parseClaudeResponse(response);

    return {
      message:
        parsed.message ||
        "I'd be happy to help analyze your SEO data. Could you be more specific about what you'd like to know?",
      suggestions: parsed.suggestions || [],
      actionItems: parsed.actionItems || [],
      dataReferences: parsed.dataReferences || [],
    };
  } catch (error) {
    console.error("Error handling SEO chat query:", error);
    return {
      message:
        "I'm having trouble processing your question right now. Please try rephrasing or ask about specific metrics like rankings, competitors, or trends.",
      suggestions: [
        "What are my best performing keywords?",
        "Why might my rankings be declining?",
        "Which competitors should I focus on?",
      ],
    };
  }
}

/**
 * Analyze competitive landscape and generate SWOT analysis
 * @param reportCard Report card data
 * @returns Promise resolving to competitive analysis
 */
export async function analyzeCompetitiveLandscape(
  reportCard: ReportCard,
): Promise<CompetitiveAnalysis> {
  const apiKey = process.env.CLAUDE_API_KEY;

  if (!apiKey) {
    throw new Error("Claude API key is not configured");
  }

  const prompt = `You are an SEO strategist performing competitive analysis.

Our SEO Performance:
- Overall Score: ${reportCard.overallScore}/100
- Keywords Tracked: ${reportCard.totalKeywords}
- Average Position: ${reportCard.metrics.averagePosition}
- Top 10 Keywords: ${reportCard.keywordBreakdown.top10}
- Competitive Score: ${reportCard.metrics.competitiveScore}%
- Outranked Competitors: ${reportCard.competitorAnalysis.outrankedPercentage}%

Competitive Opportunities:
${reportCard.competitorAnalysis.opportunities
  .map(
    (o) =>
      `- ${o.keyword}: We're #${o.yourPosition}, ${o.competitor} is #${o.competitorPosition} (gap: ${o.gap})`,
  )
  .join("\n")}

Top Performing Keywords: ${reportCard.topPerformers.map((p) => `${p.keyword} (#${p.position})`).join(", ")}
Underperforming Keywords: ${reportCard.needsAttention.map((k) => `${k.keyword} (${k.issue})`).join(", ")}

Instructions:
Perform a SWOT analysis and provide strategic recommendations.

Format as JSON:
{
  "marketPosition": "Overall market position summary",
  "strengthAreas": ["Strength 1", "Strength 2", "Strength 3"],
  "weaknessAreas": ["Weakness 1", "Weakness 2", "Weakness 3"],
  "opportunities": [
    {
      "keyword": "keyword name",
      "competitor": "competitor name",
      "gap": number,
      "difficulty": "easy|medium|hard",
      "potentialImpact": "high|medium|low",
      "strategy": "specific strategy"
    }
  ],
  "threats": [
    {
      "keyword": "keyword name",
      "competitor": "competitor name",
      "theirPosition": number,
      "yourPosition": number,
      "urgency": "high|medium|low",
      "mitigation": "mitigation strategy"
    }
  ],
  "swotSummary": "Executive summary of SWOT analysis"
}`;

  try {
    const response = await callClaudeAPI(prompt, 2500);
    const parsed = parseClaudeResponse(response);

    return {
      marketPosition: parsed.marketPosition || "Analysis unavailable",
      strengthAreas: parsed.strengthAreas || [],
      weaknessAreas: parsed.weaknessAreas || [],
      opportunities: parsed.opportunities || [],
      threats: parsed.threats || [],
      swotSummary: parsed.swotSummary || "Competitive analysis completed",
    };
  } catch (error) {
    console.error("Error analyzing competitive landscape:", error);
    return createFallbackCompetitiveAnalysis(reportCard);
  }
}

/**
 * Detect anomalies in ranking data
 * @param historicalData Historical ranking data
 * @returns Promise resolving to detected anomalies
 */
export async function detectRankingAnomalies(
  historicalData: any[],
): Promise<Anomaly[]> {
  const apiKey = process.env.CLAUDE_API_KEY;

  if (!apiKey) {
    throw new Error("Claude API key is not configured");
  }

  if (!historicalData || historicalData.length < 5) {
    return []; // Need sufficient data for anomaly detection
  }

  const prompt = `You are an SEO analyst detecting ranking anomalies.

Historical Ranking Data:
${JSON.stringify(historicalData.slice(-20), null, 2)}

Instructions:
Analyze this data for anomalies such as:
1. Sudden ranking drops (>10 positions)
2. Unusual volatility patterns
3. Competitor movements that might indicate algorithm changes
4. Seasonal vs actual anomalies

For each anomaly found, determine:
- Type and severity
- Possible causes
- Recommended actions
- Confidence level

Format as JSON array:
[
  {
    "id": "unique_id",
    "type": "ranking_drop|ranking_spike|volatility|competitor_movement",
    "severity": "high|medium|low",
    "keyword": "affected keyword",
    "description": "What happened",
    "detectedAt": "ISO date",
    "possibleCauses": ["cause1", "cause2"],
    "recommendedActions": ["action1", "action2"],
    "confidence": 0.8
  }
]`;

  try {
    const response = await callClaudeAPI(prompt, 2000);
    const parsed = parseClaudeResponse(response);

    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Error detecting anomalies:", error);
    return [];
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Call Claude API with error handling and retries
 */
async function callClaudeAPI(
  prompt: string,
  maxTokens: number = 2000,
): Promise<string> {
  const apiKey = process.env.CLAUDE_API_KEY;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
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

  return data.content[0].text;
}

/**
 * Build SEO analysis prompt based on request type
 */
function buildSEOAnalysisPrompt(request: AIAnalysisRequest): string {
  const { reportCard, analysisType } = request;

  const baseContext = `
SEO Performance Report:
- Overall Grade: ${reportCard.overallGrade} (${reportCard.overallScore}/100)
- Total Keywords: ${reportCard.totalKeywords}
- Average Position: ${reportCard.metrics.averagePosition}
- Visibility Score: ${reportCard.metrics.visibilityScore}%
- Consistency Score: ${reportCard.metrics.consistencyScore}%
- Growth Score: ${reportCard.metrics.growthScore}%
- Competitive Score: ${reportCard.metrics.competitiveScore}%

Keyword Breakdown:
- Top 3: ${reportCard.keywordBreakdown.top3}
- Top 10: ${reportCard.keywordBreakdown.top10}
- Top 20: ${reportCard.keywordBreakdown.top20}
- Not Found: ${reportCard.keywordBreakdown.notFound}

Trends: ${reportCard.trends.positionTrend} position, ${reportCard.trends.visibilityTrend} visibility

Top Performers: ${reportCard.topPerformers.map((p) => `${p.keyword} (#${p.position}, ${p.trend})`).join(", ")}
Needs Attention: ${reportCard.needsAttention.map((k) => `${k.keyword} (${k.issue})`).join(", ")}

Competitive Opportunities: ${reportCard.competitorAnalysis.opportunities
    .slice(0, 5)
    .map((o) => `${o.keyword} vs ${o.competitor} (gap: ${o.gap})`)
    .join(", ")}
`;

  switch (analysisType) {
    case "insights":
      return `${baseContext}

You are an SEO expert analyzing this performance data. Generate 5-8 actionable insights.

For each insight, provide:
- Type: opportunity, warning, trend, or recommendation
- Priority: high, medium, or low
- Clear title and detailed message
- Affected keywords
- Specific action items
- Confidence score (0-1)
- Category: ranking, competitive, technical, content, or performance

Focus on:
1. Significant ranking changes and their implications
2. Competitive opportunities with highest ROI
3. Keywords at risk of losing rankings
4. Technical or content improvements needed
5. Trend analysis and predictions

Format as JSON:
{
  "insights": [
    {
      "id": "insight_1",
      "type": "opportunity|warning|trend|recommendation",
      "priority": "high|medium|low",
      "title": "Clear insight title",
      "message": "Detailed explanation with context",
      "affectedKeywords": ["keyword1", "keyword2"],
      "actionItems": ["specific action 1", "specific action 2"],
      "confidenceScore": 0.85,
      "category": "ranking|competitive|technical|content|performance"
    }
  ],
  "summary": "Overall analysis summary"
}`;

    case "summary":
      return `${baseContext}

Generate a comprehensive SEO performance summary for stakeholders.

Include:
1. Executive summary (2-3 paragraphs)
2. Key achievements and wins
3. Areas of concern and risks
4. Strategic recommendations
5. Next steps and priorities

Format as JSON:
{
  "executiveSummary": "Business-focused summary",
  "summary": "Detailed technical summary"
}`;

    default:
      return `${baseContext}

Analyze this SEO data and provide insights and recommendations.`;
  }
}

/**
 * Generate cache key for AI responses
 */
function generateCacheKey(request: AIAnalysisRequest): string {
  const keyData = {
    type: request.analysisType,
    score: request.reportCard.overallScore,
    keywords: request.reportCard.totalKeywords,
    period: request.reportCard.period,
    generatedAt: request.reportCard.generatedAt.split("T")[0], // Date only
  };

  return `seo_ai_${JSON.stringify(keyData)}`;
}

/**
 * Get cached response if valid
 */
function getCachedResponse(
  key: string,
  analysisType: string,
): AIAnalysisResponse | null {
  const cached = aiResponseCache.get(key);
  if (!cached) return null;

  const ttl =
    cacheConfig[analysisType as keyof CacheConfig] || cacheConfig.insights;
  const isExpired = Date.now() - cached.timestamp > ttl;

  if (isExpired) {
    aiResponseCache.delete(key);
    return null;
  }

  return cached.data;
}

/**
 * Cache AI response
 */
function setCachedResponse(
  key: string,
  data: AIAnalysisResponse,
  analysisType: string,
): void {
  const ttl =
    cacheConfig[analysisType as keyof CacheConfig] || cacheConfig.insights;

  aiResponseCache.set(key, {
    key,
    data,
    timestamp: Date.now(),
    ttl,
    analysisType,
  });
}

/**
 * Validate and structure insights from Claude response
 */
function validateAndStructureInsights(
  parsed: any,
  request: AIAnalysisRequest,
): AIInsight[] {
  if (!parsed.insights || !Array.isArray(parsed.insights)) {
    return [];
  }

  return parsed.insights.map((insight: any, index: number) => ({
    id: insight.id || `insight_${Date.now()}_${index}`,
    type: insight.type || "recommendation",
    priority: insight.priority || "medium",
    title: insight.title || "SEO Insight",
    message: insight.message || "Analysis completed",
    affectedKeywords: insight.affectedKeywords || [],
    actionItems: insight.actionItems || [],
    confidenceScore: insight.confidenceScore || 0.7,
    generatedAt: new Date().toISOString(),
    category: insight.category || "performance",
  }));
}

/**
 * Create fallback executive summary
 */
function createFallbackExecutiveSummary(reportCard: ReportCard): string {
  return `SEO Performance Summary

Our current SEO performance shows a ${reportCard.overallGrade} grade with an overall score of ${reportCard.overallScore}/100. We are tracking ${reportCard.totalKeywords} keywords with an average position of ${reportCard.metrics.averagePosition}.

Key highlights include ${reportCard.keywordBreakdown.top10} keywords ranking in the top 10 positions, with ${reportCard.keywordBreakdown.top3} achieving top 3 rankings. Our visibility score of ${reportCard.metrics.visibilityScore}% indicates ${reportCard.metrics.visibilityScore > 70 ? "strong" : "moderate"} search presence.

${reportCard.trends.positionTrend === "improving" ? "Positive momentum is evident with improving position trends." : reportCard.trends.positionTrend === "declining" ? "Attention is needed as position trends are declining." : "Rankings remain stable with consistent performance."}

Priority actions should focus on the ${reportCard.needsAttention.length} keywords requiring attention and capitalizing on ${reportCard.competitorAnalysis.opportunities.length} competitive opportunities identified.`;
}

/**
 * Create fallback competitive analysis
 */
function createFallbackCompetitiveAnalysis(
  reportCard: ReportCard,
): CompetitiveAnalysis {
  return {
    marketPosition: `Currently holding ${reportCard.competitorAnalysis.outrankedPercentage}% competitive advantage with room for improvement`,
    strengthAreas: [
      `${reportCard.keywordBreakdown.top3} keywords in top 3 positions`,
      `${reportCard.metrics.visibilityScore}% visibility score`,
      `${reportCard.trends.positionTrend} position trend`,
    ],
    weaknessAreas: [
      `${reportCard.keywordBreakdown.notFound} keywords not ranking`,
      `${100 - reportCard.competitorAnalysis.outrankedPercentage}% of competitive comparisons lost`,
      `${reportCard.needsAttention.length} keywords needing attention`,
    ],
    opportunities: reportCard.competitorAnalysis.opportunities
      .slice(0, 3)
      .map((o) => ({
        keyword: o.keyword,
        competitor: o.competitor,
        gap: o.gap,
        difficulty: o.gap <= 5 ? "easy" : o.gap <= 15 ? "medium" : "hard",
        potentialImpact: o.gap <= 10 ? "high" : "medium",
        strategy: `Focus on improving content and technical SEO for ${o.keyword}`,
      })),
    threats: [],
    swotSummary:
      "Competitive analysis shows mixed performance with clear opportunities for improvement",
  };
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
