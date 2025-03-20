"use client"

import React, { useState, useEffect } from 'react';
import { getFingerprint } from "@thumbmarkjs/thumbmarkjs";
import { usePathname } from 'next/navigation';
import { detectBrowser, detectOS } from '@/utils/device';

/**
 * Fingerprint component for visitor tracking
 * This component doesn't render anything visible but tracks visitor information
 * and sends it to the API
 */
function Fingerprint() {
    const [fingerprint, setFingerprint] = useState<string>('');
    const pathname = usePathname();
    
    useEffect(() => {
        const trackVisitor = async () => {
            try {
                // Get fingerprint
                const visitorId = await getFingerprint();
                setFingerprint(visitorId);
                
                // Get additional browser information
                const screenData = {
                    width: window.screen.width,
                    height: window.screen.height,
                    colorDepth: window.screen.colorDepth
                };
                
                const timezoneData = {
                    name: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    offset: new Date().getTimezoneOffset() / -60
                };
                
                const language = navigator.language;
                
                // Get referrer
                const referrer = document.referrer || "Direct";
                
                // Get browser and OS info
                const userAgent = navigator.userAgent;
                const browserInfo = detectBrowser(userAgent);
                const osInfo = detectOS(userAgent);
                
                // Get network info if available
                let networkInfo = {};
                if ('connection' in navigator) {
                    const conn = (navigator as any).connection;
                    if (conn) {
                        networkInfo = {
                            connectionType: conn.type,
                            downlink: conn.downlink,
                            effectiveType: conn.effectiveType
                        };
                    }
                }
                
                // Get hardware info if available
                let hardwareInfo = {};
                if ('hardwareConcurrency' in navigator) {
                    hardwareInfo = {
                        ...hardwareInfo,
                        cpuCores: navigator.hardwareConcurrency
                    };
                }
                
                if ('deviceMemory' in navigator) {
                    hardwareInfo = {
                        ...hardwareInfo,
                        memory: (navigator as any).deviceMemory
                    };
                }
                
                // Send data to API
                await fetch('/api/v1/visitors', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        visitorId,
                        currentPage: pathname,
                        referrer,
                        screen: screenData,
                        timezone: timezoneData,
                        language,
                        browser: browserInfo,
                        os: osInfo,
                        network: networkInfo,
                        hardware: hardwareInfo
                    }),
                });
                
                console.log('Visitor tracked:', visitorId);
            } catch (error) {
                console.error('Error tracking visitor:', error);
            }
        };
        
        // Only track if we're in the browser
        if (typeof window !== 'undefined') {
            trackVisitor();
        }
    }, [pathname]); // Re-run when pathname changes
    
    // Component doesn't render anything visible
    return null;
}

export default Fingerprint;
