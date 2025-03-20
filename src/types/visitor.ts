/**
 * Types for visitor tracking and analytics
 */

// Basic visitor information
export interface IVisitor {
    // Basic identification
    _id?: string;
    visitorId: string;
    firstVisit: Date;
    lastVisit: Date;
    visitCount: number;
    
    // Page visits
    visitedPages: {
        url: string;
        timestamp: Date;
        duration?: number;
    }[];
    
    // Referrer information
    referrer: string;
    
    // Session information
    sessions?: {
        startTime: Date;
        endTime?: Date;
        duration?: number;
        bounced: boolean;
        exitPage?: string;
        pagesViewed: number;
    }[];
    
    // Interaction data
    interactions?: {
        type: InteractionType;
        element?: string;
        page: string;
        timestamp: Date;
        data?: Record<string, any>;
    }[];
    
    // Conversion funnel data
    funnelStage?: FunnelStage;
    conversionEvents?: {
        type: ConversionEventType;
        timestamp: Date;
        product?: string;
        completed: boolean;
        value?: number;
    }[];
    
    // Marketing attribution
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmTerm?: string;
    utmContent?: string;
    landingPage?: string;
    
    // Engagement scoring
    engagementScore?: number;
    intentScore?: number;
    lifetimeValue?: number;
    interestCategories?: string[];
    
    // Device information
    userAgent: string;
    device: "Mobile" | "Tablet" | "Desktop";
    ipAddress?: string;
    
    // Location information
    location?: {
        country: string;
        region: string;
        city: string;
        latitude?: number;
        longitude?: number;
    };
    
    // Browser information
    browser: {
        name: string;
        version: string;
        engine: string;
        isIncognito?: boolean;
    };
    
    // OS information
    os: {
        name: string;
        version: string;
    };
    
    // Screen information
    screen: {
        width: number;
        height: number;
        colorDepth: number;
    };
    
    // Timezone information
    timezone: {
        name: string;
        offset: number;
    };
    
    // Language information
    language: string;
    
    // Hardware information
    hardware: {
        cpuCores?: number;
        memory?: number;
        gpuVendor?: string;
        gpuRenderer?: string;
    };
    
    // Network information
    network: {
        connectionType?: string;
        downlink?: number;
        effectiveType?: string;
    };
    
    // Technical performance
    pageLoadTimes?: { 
        url: string; 
        loadTime: number;
        timestamp: Date;
    }[];
    
    clientErrors?: { 
        type: string; 
        message: string; 
        url: string; 
        timestamp: Date;
        stack?: string;
    }[];
}

// Funnel stages
export type FunnelStage = "visitor" | "prospect" | "lead" | "opportunity" | "customer";

// Interaction types
export type InteractionType = 
    | "click" 
    | "scroll" 
    | "form_start" 
    | "form_submit" 
    | "video_play" 
    | "gallery_view" 
    | "product_view" 
    | "price_check";

// Conversion event types
export type ConversionEventType = 
    | "contact_form" 
    | "price_check" 
    | "availability_check" 
    | "booking_started" 
    | "booking_completed";

// Visitor analytics metrics
export interface VisitorEngagementMetrics {
    totalVisitors: number;
    returningVisitors: number;
    averageVisitsPerVisitor: number;
    averagePagesPerVisit: number;
    averageSessionDuration: number;
    bounceRate: number;
    averageReturnTime: number;
}

// Device breakdown
export interface DeviceBreakdown {
    counts: {
        Mobile: number;
        Desktop: number;
        Tablet: number;
    };
    percentages: {
        Mobile: number;
        Desktop: number;
        Tablet: number;
    };
}

// Referrer breakdown
export interface ReferrerBreakdown {
    [source: string]: number;
}

// Popular pages
export interface PopularPage {
    page: string;
    views: number;
    percentage: number;
}

// Time patterns
export interface TimePatterns {
    hourOfDay: number[];
    dayOfWeek: number[];
}

// High intent visitor
export interface HighIntentVisitor {
    _id: string;
    visitorId: string;
    intentScore: number;
    lastVisit: Date;
    interestCategories?: string[];
    visitCount: number;
}

// Suspicious visitor
export interface SuspiciousVisitor {
    _id: string;
    visitorId: string;
    ipAddress?: string;
    suspiciousActivity: string[];
    lastVisit: Date;
}
