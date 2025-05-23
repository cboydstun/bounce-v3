"use client";

import { useState, useEffect } from "react";
import { getFingerprint } from "@thumbmarkjs/thumbmarkjs";
import { usePathname } from "next/navigation";
import { detectBrowser, detectOS } from "@/utils/device";

/**
 * Fingerprint component for visitor tracking
 * This component doesn't render anything visible but tracks visitor information
 * and sends it to the API
 */
function Fingerprint() {
  const [fingerprint, setFingerprint] = useState<string>("");
  const pathname = usePathname();

  // Function to get the fingerprint and other visitor data
  // and send it to the API
  console.log(fingerprint);

  useEffect(() => {
    const trackVisitor = async () => {
      try {
        // Get fingerprint
        const visitorId = await getFingerprint();
        setFingerprint(visitorId);

        // Store in localStorage for conversion tracking
        localStorage.setItem("visitorId", visitorId);

        // Get additional browser information
        const screenData = {
          width: window.screen.width,
          height: window.screen.height,
          colorDepth: window.screen.colorDepth,
        };

        const timezoneData = {
          name: Intl.DateTimeFormat().resolvedOptions().timeZone,
          offset: new Date().getTimezoneOffset() / -60,
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
        if ("connection" in navigator) {
          const conn = (navigator as any).connection;
          if (conn) {
            networkInfo = {
              connectionType: conn.type,
              downlink: conn.downlink,
              effectiveType: conn.effectiveType,
            };
          }
        }

        // Get hardware info if available
        let hardwareInfo = {};
        if ("hardwareConcurrency" in navigator) {
          hardwareInfo = {
            ...hardwareInfo,
            cpuCores: navigator.hardwareConcurrency,
          };
        }

        if ("deviceMemory" in navigator) {
          hardwareInfo = {
            ...hardwareInfo,
            memory: (navigator as any).deviceMemory,
          };
        }

        // Get UTM parameters from URL
        const urlParams = new URLSearchParams(window.location.search);
        const utmParams = {
          source: urlParams.get("utm_source"),
          medium: urlParams.get("utm_medium"),
          campaign: urlParams.get("utm_campaign"),
          term: urlParams.get("utm_term"),
          content: urlParams.get("utm_content"),
        };

        // Measure page load time
        const pageLoadTime = performance.timing
          ? performance.timing.loadEventEnd - performance.timing.navigationStart
          : null;

        // Send data to API
        await fetch("/api/v1/visitors", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
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
            hardware: hardwareInfo,
            utmParams: Object.values(utmParams).some((v) => v)
              ? utmParams
              : undefined,
            pageLoadTime:
              pageLoadTime && pageLoadTime > 0 ? pageLoadTime : undefined,
          }),
        });
      } catch (error) {
        console.error("Error tracking visitor:", error);
      }
    };

    // Only track if we're in the browser
    if (typeof window !== "undefined") {
      trackVisitor();
    }
  }, [pathname]); // Re-run when pathname changes

  // Component doesn't render anything visible
  return null;
}

export default Fingerprint;
