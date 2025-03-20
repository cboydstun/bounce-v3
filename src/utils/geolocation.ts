/**
 * Utility functions for IP geolocation
 */

// Simple in-memory cache to avoid hitting rate limits
interface LocationCache {
  [ip: string]: {
    data: LocationData;
    timestamp: number;
  };
}

// Location data structure
export interface LocationData {
  country: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
}

// Cache expiration time (24 hours in milliseconds)
const CACHE_EXPIRATION = 24 * 60 * 60 * 1000;

// In-memory cache
const locationCache: LocationCache = {};

/**
 * Get location data from IP address
 * Uses IP-API.com for geolocation
 *
 * @param ip IP address to geolocate
 * @returns Location data or null if unable to geolocate
 */
export async function getLocationFromIp(
  ip: string,
): Promise<LocationData | null> {
  // Skip for localhost or invalid IPs
  if (ip === "localhost" || ip === "127.0.0.1" || ip === "unknown" || !ip) {
    return null;
  }

  // Check cache first
  const now = Date.now();
  const cachedData = locationCache[ip];

  if (cachedData && now - cachedData.timestamp < CACHE_EXPIRATION) {
    return cachedData.data;
  }

  try {
    // Fetch from IP-API
    const response = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,country,regionName,city,lat,lon`,
    );
    const data = await response.json();

    if (data.status === "success") {
      const locationData: LocationData = {
        country: data.country,
        region: data.regionName,
        city: data.city,
        latitude: data.lat,
        longitude: data.lon,
      };

      // Store in cache
      locationCache[ip] = {
        data: locationData,
        timestamp: now,
      };

      return locationData;
    }

    return null;
  } catch (error) {
    console.error("Error fetching location data:", error);
    return null;
  }
}

/**
 * Clear the location cache
 * Useful for testing or if you want to force fresh data
 */
export function clearLocationCache(): void {
  Object.keys(locationCache).forEach((key) => {
    delete locationCache[key];
  });
}
