import mongoose, { Schema, Document } from "mongoose";
import { IVisitor } from "../types/visitor";

const VisitorSchema = new Schema<IVisitor>({
    visitorId: { type: String, unique: true, required: true },
    firstVisit: { type: Date, default: Date.now },
    lastVisit: { type: Date, default: Date.now },
    visitCount: { type: Number, default: 1 },
    visitedPages: [{ url: String, timestamp: { type: Date, default: Date.now } }],
    referrer: { type: String, default: "Direct" },
    userAgent: String,
    device: { type: String, enum: ["Mobile", "Tablet", "Desktop"] },
    ipAddress: String,
    location: {
        country: String,
        region: String,
        city: String,
        latitude: Number,
        longitude: Number
    },
    browser: {
        name: String,
        version: String,
        engine: String,
        isIncognito: Boolean
    },
    os: {
        name: String,
        version: String
    },
    screen: {
        width: Number,
        height: Number,
        colorDepth: Number
    },
    timezone: {
        name: String,
        offset: Number
    },
    language: String,
    hardware: {
        cpuCores: Number,
        memory: Number,
        gpuVendor: String,
        gpuRenderer: String
    },
    network: {
        connectionType: String,
        downlink: Number,
        effectiveType: String
    }
});

export default mongoose.models.Visitor || mongoose.model<IVisitor>("Visitor", VisitorSchema);
