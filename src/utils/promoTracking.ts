/**
 * Promo Modal Tracking Utilities
 * Comprehensive tracking for promotional modal interactions
 */

export interface PromoTrackingData {
  promoName: string;
  promoType: string;
  promoImage?: string;
  promoTitle?: string;
  promoDescription?: string;
  displayDelay?: number;
  persistenceDays?: number;
  currentPage?: string;
  timestamp?: Date;
  sessionDuration?: number;
  viewDuration?: number;
}

export interface PromoConversionData extends PromoTrackingData {
  conversionType: "coupon_form" | "package_deals" | "direct_booking";
  conversionValue?: number;
  nextPage?: string;
}

/**
 * Track when a promo modal is displayed to a visitor
 */
export async function trackPromoModalDisplayed(
  data: PromoTrackingData,
): Promise<void> {
  try {
    await trackVisitorInteraction({
      type: "promo_modal_displayed",
      element: "promo_modal",
      page: data.currentPage || window.location.pathname,
      data: {
        promo_name: data.promoName,
        promo_type: data.promoType,
        promo_title: data.promoTitle,
        promo_description: data.promoDescription,
        display_delay_seconds: data.displayDelay,
        persistence_days: data.persistenceDays,
        modal_trigger: "automatic_timer",
        device_type: getDeviceType(),
        viewport_size: getViewportSize(),
        scroll_position: getScrollPosition(),
        time_on_page_before_modal: getTimeOnPage(),
      },
    });

    // Also track as a conversion event for funnel analysis
    await trackVisitorInteraction({
      type: "promo_impression",
      element: "promotional_content",
      page: data.currentPage || window.location.pathname,
      data: {
        promo_campaign: data.promoName,
        impression_type: "modal",
        seasonal_promo: isSeasonalPromo(data.promoName),
      },
    });
  } catch (error) {
    console.error("Error tracking promo modal display:", error);
  }
}

/**
 * Track when a visitor closes the promo modal
 */
export async function trackPromoModalClosed(
  data: PromoTrackingData & {
    closeMethod: "x_button" | "outside_click" | "escape_key";
    viewDuration: number;
  },
): Promise<void> {
  try {
    await trackVisitorInteraction({
      type: "promo_modal_closed",
      element: "promo_modal_close",
      page: data.currentPage || window.location.pathname,
      data: {
        promo_name: data.promoName,
        promo_type: data.promoType,
        close_method: data.closeMethod,
        view_duration_seconds: data.viewDuration,
        engagement_level: calculateEngagementLevel(data.viewDuration),
        dismissed_without_action: true,
        will_show_again_in_days: data.persistenceDays,
      },
    });
  } catch (error) {
    console.error("Error tracking promo modal close:", error);
  }
}

/**
 * Track when a visitor converts through the promo modal
 */
export async function trackPromoModalConversion(
  data: PromoConversionData,
): Promise<void> {
  try {
    await trackVisitorInteraction({
      type: "promo_modal_converted",
      element: "promo_cta_button",
      page: data.currentPage || window.location.pathname,
      data: {
        promo_name: data.promoName,
        promo_type: data.promoType,
        conversion_type: data.conversionType,
        conversion_value: data.conversionValue,
        next_page: data.nextPage,
        view_duration_seconds: data.viewDuration,
        engagement_level: calculateEngagementLevel(data.viewDuration || 0),
        cta_text: "See Package Deals",
      },
    });

    // Track as a conversion event for business analytics
    await trackVisitorInteraction({
      type: "promo_conversion",
      element: "promotional_campaign",
      page: data.currentPage || window.location.pathname,
      data: {
        promo_campaign: data.promoName,
        conversion_funnel_step: "promo_to_coupon_form",
        marketing_attribution: "promotional_modal",
        seasonal_campaign: isSeasonalPromo(data.promoName),
        estimated_value: estimatePromoValue(data.promoType),
      },
    });
  } catch (error) {
    console.error("Error tracking promo modal conversion:", error);
  }
}

/**
 * Track promo modal performance metrics
 */
export async function trackPromoModalMetrics(
  data: PromoTrackingData & {
    action: "impression" | "engagement" | "conversion" | "dismissal";
    metrics: {
      timeToAction?: number;
      scrollDepthBeforeModal?: number;
      previousPageViews?: number;
      sessionDuration?: number;
    };
  },
): Promise<void> {
  try {
    await trackVisitorInteraction({
      type: "promo_modal_metrics",
      element: "promo_analytics",
      page: data.currentPage || window.location.pathname,
      data: {
        promo_name: data.promoName,
        action: data.action,
        time_to_action_seconds: data.metrics.timeToAction,
        scroll_depth_percent: data.metrics.scrollDepthBeforeModal,
        previous_page_views: data.metrics.previousPageViews,
        session_duration_seconds: data.metrics.sessionDuration,
        visitor_segment: determineVisitorSegment(data.metrics),
        promo_relevance_score: calculatePromoRelevance(data),
      },
    });
  } catch (error) {
    console.error("Error tracking promo modal metrics:", error);
  }
}

// Helper functions
function getDeviceType(): string {
  const width = window.innerWidth;
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

function getViewportSize(): string {
  return `${window.innerWidth}x${window.innerHeight}`;
}

function getScrollPosition(): number {
  return Math.round(
    (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100,
  );
}

function getTimeOnPage(): number {
  const navigationStart = performance.timing?.navigationStart || Date.now();
  return Math.round((Date.now() - navigationStart) / 1000);
}

function calculateEngagementLevel(viewDuration: number): string {
  if (viewDuration < 2) return "low";
  if (viewDuration < 10) return "medium";
  if (viewDuration < 30) return "high";
  return "very_high";
}

function isSeasonalPromo(promoName: string): boolean {
  const seasonalKeywords = [
    "christmas",
    "halloween",
    "thanksgiving",
    "easter",
    "valentine",
    "summer",
    "spring",
    "fall",
    "winter",
    "holiday",
    "new year",
    "memorial day",
    "labor day",
    "fourth of july",
    "4th of july",
  ];
  return seasonalKeywords.some((keyword) =>
    promoName.toLowerCase().includes(keyword),
  );
}

function estimatePromoValue(promoType: string): number {
  // Estimate potential value based on promo type
  const promoValues: { [key: string]: number } = {
    discount: 50,
    package_deal: 100,
    seasonal: 75,
    holiday: 80,
    first_time: 60,
    returning_customer: 90,
  };

  return promoValues[promoType.toLowerCase()] || 50;
}

function determineVisitorSegment(metrics: any): string {
  const { previousPageViews = 0, sessionDuration = 0 } = metrics;

  if (previousPageViews === 0) return "new_visitor";
  if (previousPageViews < 3) return "browsing";
  if (sessionDuration > 300) return "engaged"; // 5+ minutes
  return "exploring";
}

function calculatePromoRelevance(data: PromoTrackingData): number {
  // Calculate relevance score based on various factors
  let score = 50; // Base score

  // Seasonal relevance
  if (isSeasonalPromo(data.promoName)) {
    score += 20;
  }

  // Page relevance
  const currentPage = data.currentPage || "";
  if (
    currentPage.includes("/products/") ||
    currentPage.includes("/party-packages/")
  ) {
    score += 15;
  }

  // Time-based relevance
  const hour = new Date().getHours();
  if (hour >= 9 && hour <= 17) {
    // Business hours
    score += 10;
  }

  return Math.min(score, 100);
}

/**
 * Get promo performance analytics
 */
export interface PromoAnalytics {
  totalImpressions: number;
  totalConversions: number;
  conversionRate: number;
  averageViewDuration: number;
  topPerformingPromos: Array<{
    name: string;
    impressions: number;
    conversions: number;
    conversionRate: number;
  }>;
  dismissalReasons: {
    [key: string]: number;
  };
  devicePerformance: {
    mobile: { impressions: number; conversions: number };
    tablet: { impressions: number; conversions: number };
    desktop: { impressions: number; conversions: number };
  };
}

/**
 * Utility to track visitor interaction (wrapper for existing system)
 */
async function trackVisitorInteraction(interaction: {
  type: string;
  element: string;
  page: string;
  data: Record<string, any>;
}): Promise<void> {
  try {
    // Get visitor ID from existing tracking system
    const visitorId = getVisitorId();

    const response = await fetch("/api/v1/visitors", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        visitorId,
        currentPage: interaction.page,
        interaction: {
          type: interaction.type,
          element: interaction.element,
          page: interaction.page,
          data: interaction.data,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error("Error tracking visitor interaction:", error);
  }
}

/**
 * Get or generate visitor ID
 */
function getVisitorId(): string {
  let visitorId = localStorage.getItem("visitorId");
  if (!visitorId) {
    visitorId =
      "visitor_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
    localStorage.setItem("visitorId", visitorId);
  }
  return visitorId;
}
