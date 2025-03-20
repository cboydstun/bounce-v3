import mongoose, { Schema, Document } from "mongoose";
import { 
    IVisitor, 
    InteractionType, 
    ConversionEventType, 
    FunnelStage
} from "../types/visitor";

// Define sub-schemas for complex types
const SessionSchema = new Schema({
    startTime: { type: Date, required: true },
    endTime: Date,
    duration: Number, // Time in seconds
    bounced: { type: Boolean, default: false },
    exitPage: String,
    pagesViewed: { type: Number, default: 0 }
}, { _id: false });

const InteractionSchema = new Schema({
    type: { 
        type: String, 
        enum: [
            "click", "scroll", "form_start", "form_submit", 
            "video_play", "gallery_view", "product_view", "price_check"
        ],
        required: true 
    },
    element: String,
    page: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    data: Schema.Types.Mixed
}, { _id: false });

const ConversionEventSchema = new Schema({
    type: { 
        type: String, 
        enum: [
            "contact_form", "price_check", "availability_check", 
            "booking_started", "booking_completed"
        ],
        required: true 
    },
    timestamp: { type: Date, default: Date.now },
    product: String,
    completed: { type: Boolean, default: false },
    value: Number
}, { _id: false });

const PageLoadTimeSchema = new Schema({
    url: { type: String, required: true },
    loadTime: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now }
}, { _id: false });

const ClientErrorSchema = new Schema({
    type: { type: String, required: true },
    message: { type: String, required: true },
    url: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
}, { _id: false });

// Main Visitor Schema
const VisitorSchema = new Schema<IVisitor>({
    // Basic identification
    visitorId: { type: String, unique: true, required: true },
    firstVisit: { type: Date, default: Date.now },
    lastVisit: { type: Date, default: Date.now },
    visitCount: { type: Number, default: 1 },
    
    // Page visits
    visitedPages: [{ 
        url: String, 
        timestamp: { type: Date, default: Date.now },
        duration: Number
    }],
    
    // Referrer information
    referrer: { type: String, default: "Direct" },
    
    // Session information
    sessions: { 
        type: [SessionSchema],
        default: [] 
    },
    
    // Interaction data
    interactions: { 
        type: [InteractionSchema],
        default: [] 
    },
    
    // Conversion funnel data
    funnelStage: { 
        type: String, 
        enum: ["visitor", "prospect", "lead", "opportunity", "customer"],
        default: "visitor"
    },
    conversionEvents: { 
        type: [ConversionEventSchema],
        default: [] 
    },
    
    // Marketing attribution
    utmSource: String,
    utmMedium: String,
    utmCampaign: String,
    utmTerm: String,
    utmContent: String,
    landingPage: String,
    
    // Engagement scoring
    engagementScore: { type: Number, min: 0, max: 100 },
    intentScore: { type: Number, min: 0, max: 100 },
    lifetimeValue: Number,
    interestCategories: [String],
    
    // Device information
    userAgent: String,
    device: { type: String, enum: ["Mobile", "Tablet", "Desktop"] },
    ipAddress: String,
    
    // Location information
    location: {
        country: String,
        region: String,
        city: String,
        latitude: Number,
        longitude: Number
    },
    
    // Browser information
    browser: {
        name: String,
        version: String,
        engine: String,
        isIncognito: Boolean
    },
    
    // OS information
    os: {
        name: String,
        version: String
    },
    
    // Screen information
    screen: {
        width: Number,
        height: Number,
        colorDepth: Number
    },
    
    // Timezone information
    timezone: {
        name: String,
        offset: Number
    },
    
    // Language information
    language: String,
    
    // Hardware information
    hardware: {
        cpuCores: Number,
        memory: Number,
        gpuVendor: String,
        gpuRenderer: String
    },
    
    // Network information
    network: {
        connectionType: String,
        downlink: Number,
        effectiveType: String
    },
    
    // Technical performance
    pageLoadTimes: { 
        type: [PageLoadTimeSchema],
        default: [] 
    },
    
    clientErrors: { 
        type: [ClientErrorSchema],
        default: [] 
    }
}, { timestamps: true });

// Add indexes for common queries
VisitorSchema.index({ visitorId: 1 });
VisitorSchema.index({ lastVisit: -1 });
VisitorSchema.index({ funnelStage: 1 });
VisitorSchema.index({ engagementScore: -1 });
VisitorSchema.index({ intentScore: -1 });
VisitorSchema.index({ "location.country": 1 });
VisitorSchema.index({ device: 1 });
VisitorSchema.index({ utmSource: 1, utmMedium: 1, utmCampaign: 1 });

export default mongoose.models.Visitor || mongoose.model<IVisitor>("Visitor", VisitorSchema);
