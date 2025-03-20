/**
 * Detect device type from user agent string
 * @param userAgent Browser user agent string
 * @returns Device type: "Mobile", "Tablet", or "Desktop"
 */
export function detectDevice(userAgent: string): "Mobile" | "Tablet" | "Desktop" {
    const ua = userAgent.toLowerCase();
    
    // Check for mobile devices
    if (
        /android.*mobile|mobile.*android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)
    ) {
        return "Mobile";
    }
    
    // Check for tablets
    if (
        /ipad|android(?!.*mobile)|tablet|silk|kindle/i.test(ua)
    ) {
        return "Tablet";
    }
    
    // Default to desktop
    return "Desktop";
}

/**
 * Detect browser information from user agent string
 * @param userAgent Browser user agent string
 * @returns Object containing browser name, version, and engine
 */
export function detectBrowser(userAgent: string) {
    // Simple detection logic - would be more comprehensive in production
    const ua = userAgent.toLowerCase();
    let name = "Unknown";
    let version = "Unknown";
    let engine = "Unknown";
    
    if (ua.indexOf("firefox") > -1) {
        name = "Firefox";
        engine = "Gecko";
    } else if (ua.indexOf("edge") > -1 || ua.indexOf("edg/") > -1) {
        name = "Edge";
        engine = "EdgeHTML/Blink";
    } else if (ua.indexOf("chrome") > -1) {
        name = "Chrome";
        engine = "Blink";
    } else if (ua.indexOf("safari") > -1) {
        name = "Safari";
        engine = "WebKit";
    } else if (ua.indexOf("opera") > -1 || ua.indexOf("opr/") > -1) {
        name = "Opera";
        engine = "Blink";
    }
    
    // Extract version (simplified)
    const match = ua.match(new RegExp(`${name.toLowerCase()}\\/(\\d+(\\.\\d+)?)`));
    if (match) version = match[1];
    
    return { name, version, engine };
}

/**
 * Detect operating system information from user agent string
 * @param userAgent Browser user agent string
 * @returns Object containing OS name and version
 */
export function detectOS(userAgent: string) {
    const ua = userAgent.toLowerCase();
    let name = "Unknown";
    let version = "Unknown";
    
    if (ua.indexOf("windows") > -1) {
        name = "Windows";
        if (ua.indexOf("windows nt 10") > -1) version = "10";
        else if (ua.indexOf("windows nt 6.3") > -1) version = "8.1";
        else if (ua.indexOf("windows nt 6.2") > -1) version = "8";
        else if (ua.indexOf("windows nt 6.1") > -1) version = "7";
    } else if (ua.indexOf("macintosh") > -1 || ua.indexOf("mac os x") > -1) {
        name = "macOS";
        const match = ua.match(/mac os x (\d+[._]\d+[._]?\d*)/);
        if (match) version = match[1].replace(/_/g, ".");
    } else if (ua.indexOf("android") > -1) {
        name = "Android";
        const match = ua.match(/android (\d+(\.\d+)*)/);
        if (match) version = match[1];
    } else if (ua.indexOf("ios") > -1 || ua.indexOf("iphone") > -1 || ua.indexOf("ipad") > -1) {
        name = "iOS";
        const match = ua.match(/os (\d+(_\d+)*) like mac os/);
        if (match) version = match[1].replace(/_/g, ".");
    } else if (ua.indexOf("linux") > -1) {
        name = "Linux";
    }
    
    return { name, version };
}
