"use client";

import { useState, useEffect, useRef } from "react";
import { getFingerprint } from "@thumbmarkjs/thumbmarkjs";
import { usePathname } from "next/navigation";
import { detectBrowser, detectOS } from "@/utils/device";

/**
 * Fingerprint component for visitor tracking
 * This component doesn't render anything visible but tracks visitor information
 * and sends it to the API with optimized request handling
 */
function Fingerprint() {
  const [fingerprint, setFingerprint] = useState<string>("");
  const pathname = usePathname();
  const trackingInProgress = useRef<boolean>(false);
  const lastTrackedPath = useRef<string>("");

  useEffect(() => {
    const trackVisitor = async () => {
      // Skip tracking on checkout pages to prevent timeout issues
      if (pathname.startsWith("/order")) {
        console.log(
          "Skipping visitor tracking on checkout page to prevent timeouts",
        );
        return;
      }

      // Prevent multiple concurrent tracking requests
      if (trackingInProgress.current) {
        return;
      }

      // Skip if we've already tracked this path recently
      if (lastTrackedPath.current === pathname) {
        return;
      }

      trackingInProgress.current = true;

      try {
        // Check if we already have a visitorId in localStorage
        let visitorId = localStorage.getItem("visitorId");

        if (!visitorId) {
          // Get fingerprint only if we don't have one
          visitorId = await getFingerprint();
          setFingerprint(visitorId);
          // Store in localStorage for conversion tracking
          localStorage.setItem("visitorId", visitorId);
        } else {
          setFingerprint(visitorId);
        }

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

        // Create request payload
        const payload = {
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
        };

        // Send data to API with timeout and retry logic
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

        try {
          const response = await fetch("/api/v1/visitors", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-request-id": `${Date.now()}-${Math.random()}`, // For deduplication
            },
            body: JSON.stringify(payload),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          // Mark this path as tracked
          lastTrackedPath.current = pathname;
        } catch (fetchError) {
          clearTimeout(timeoutId);

          // Store failed request for retry later
          const failedRequest = {
            payload,
            timestamp: Date.now(),
            error:
              fetchError instanceof Error
                ? fetchError.message
                : String(fetchError),
          };

          try {
            const existingFailed = localStorage.getItem(
              "failedVisitorTracking",
            );
            const failedRequests = existingFailed
              ? JSON.parse(existingFailed)
              : [];
            failedRequests.push(failedRequest);

            // Keep only last 10 failed requests
            if (failedRequests.length > 10) {
              failedRequests.splice(0, failedRequests.length - 10);
            }

            localStorage.setItem(
              "failedVisitorTracking",
              JSON.stringify(failedRequests),
            );
          } catch (storageError) {
            console.error(
              "Failed to store failed tracking request:",
              storageError,
            );
          }

          throw fetchError;
        }
      } catch (error) {
        console.error("Error tracking visitor:", error);
      } finally {
        trackingInProgress.current = false;
      }
    };

    // Only track if we're in the browser
    if (typeof window !== "undefined") {
      trackVisitor();
    }
  }, [pathname]); // Re-run when pathname changes

  // Retry failed requests on component mount
  useEffect(() => {
    const retryFailedRequests = async () => {
      try {
        const failedRequests = localStorage.getItem("failedVisitorTracking");
        if (!failedRequests) return;

        const requests = JSON.parse(failedRequests);
        const now = Date.now();
        const validRequests = requests.filter(
          (req: any) => now - req.timestamp < 24 * 60 * 60 * 1000, // Only retry requests less than 24 hours old
        );

        if (validRequests.length === 0) {
          localStorage.removeItem("failedVisitorTracking");
          return;
        }

        // Try to resend the most recent failed request
        const latestRequest = validRequests[validRequests.length - 1];

        const response = await fetch("/api/v1/visitors", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-request-id": `retry-${Date.now()}-${Math.random()}`,
          },
          body: JSON.stringify(latestRequest.payload),
        });

        if (response.ok) {
          // Remove successful request from failed list
          const remainingRequests = validRequests.slice(0, -1);
          if (remainingRequests.length > 0) {
            localStorage.setItem(
              "failedVisitorTracking",
              JSON.stringify(remainingRequests),
            );
          } else {
            localStorage.removeItem("failedVisitorTracking");
          }
        }
      } catch (error) {
        console.error("Error retrying failed visitor tracking:", error);
      }
    };

    // Retry after a short delay to avoid blocking initial page load
    const retryTimeout = setTimeout(retryFailedRequests, 3000);
    return () => clearTimeout(retryTimeout);
  }, []);

  // Component doesn't render anything visible
  return null;
}

export default Fingerprint;
