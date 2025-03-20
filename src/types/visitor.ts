import { Document } from "mongoose";

export interface IVisitor extends Document {
    visitorId: string; // Unique FingerprintJS ID
    firstVisit: Date;
    lastVisit: Date;
    visitCount: number;
    visitedPages: { url: string; timestamp: Date }[];
    referrer: string;
    userAgent: string;
    device: "Mobile" | "Tablet" | "Desktop";
    ipAddress?: string;
    location?: {
        country: string;
        region: string;
        city: string;
        latitude?: number;
        longitude?: number;
    };
    browser: {
        name: string;
        version: string;
        engine: string;
        isIncognito?: boolean;
    };
    os: {
        name: string;
        version: string;
    };
    screen: {
        width: number;
        height: number;
        colorDepth: number;
    };
    timezone: {
        name: string;
        offset: number;
    };
    language: string;
    hardware: {
        cpuCores?: number;
        memory?: number; // RAM in GB
        gpuVendor?: string;
        gpuRenderer?: string;
    };
    network: {
        connectionType?: string; // WiFi, 4G, 5G, Ethernet
        downlink?: number; // Mbps
        effectiveType?: string; // 'slow-2g', '2g', '3g', '4g'
    };
}
