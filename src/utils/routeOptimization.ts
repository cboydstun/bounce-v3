import { Contact } from "../types/contact";
import { geocodeAddress } from "./geocoding";
import { getDistanceMatrix, Location } from "./distanceMatrix";
import axios from "axios";

/**
 * Interface for a delivery time slot
 */
export interface DeliveryTimeSlot {
  contact: Contact;
  timeBlock: {
    start: Date;
    end: Date;
  };
  travelInfo: {
    duration: number; // in seconds
    distance: number; // in meters
  };
}

/**
 * Interface for optimized route result
 */
export interface OptimizedRoute {
  deliveryOrder: Contact[];
  timeSlots: DeliveryTimeSlot[];
  totalDistance: number; // in meters
  totalDuration: number; // in seconds
  routeGeometry: any; // GeoJSON for the route
  startCoordinates: [number, number]; // Geocoded coordinates of the start address
  returnToStart: boolean; // Whether the route returns to the starting point
  startTime: Date; // The starting time for the first delivery
  endTime: Date; // The estimated end time (return to start)
}

/**
 * Contact with coordinates for route optimization
 */
interface ContactWithCoordinates extends Contact {
  coordinates: [number, number];
}

/**
 * Optimizes a delivery route for a set of contacts
 * @param contacts Array of contacts to deliver to
 * @param startAddress Starting address for the route
 * @param startTime The time to start the first delivery (default: 8:00 AM today)
 * @param returnToStart Whether to return to the starting point (default: true)
 * @returns Promise resolving to optimized route
 */
export async function optimizeRoute(
  contacts: Contact[],
  startAddress: string,
  startTime: Date = new Date(new Date().setHours(8, 0, 0, 0)),
  returnToStart: boolean = true,
): Promise<OptimizedRoute> {
  try {
    // 1. Geocode the start address
    const startCoords = await geocodeAddress(startAddress);

    // 2. Geocode all contact addresses
    const contactsWithCoords: ContactWithCoordinates[] = [];
    const failedAddresses: { contact: Contact; error: string }[] = [];

    // Process each contact sequentially to better handle errors
    for (const contact of contacts) {
      try {
        const address = `${contact.streetAddress || ""}, ${contact.city || ""}, ${contact.state || ""} ${contact.partyZipCode || ""}`;

        // Skip addresses with insufficient information
        if (!contact.streetAddress || !contact.city) {
          failedAddresses.push({
            contact,
            error: "Incomplete address information",
          });
          continue;
        }

        const coords = await geocodeAddress(address);
        contactsWithCoords.push({ ...contact, coordinates: coords });
      } catch (error) {
        failedAddresses.push({
          contact,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // If no addresses could be geocoded, throw an error
    if (contactsWithCoords.length === 0) {
      throw new Error(
        `Could not geocode any addresses. Please check address information.`,
      );
    }

    // Log any failed addresses
    if (failedAddresses.length > 0) {
      console.warn("Some addresses could not be geocoded:", failedAddresses);
    }

    // 3. Create locations array for distance matrix
    const locations: Location[] = [
      { id: "start", coordinates: startCoords },
      ...contactsWithCoords.map((c) => ({
        id: c._id,
        coordinates: c.coordinates,
      })),
    ];

    // 4. Get distance matrix
    const matrix = await getDistanceMatrix(locations);

    // 5. Sort contacts by party start time if available
    contactsWithCoords.sort((a, b) => {
      // If both have party start times, sort by that
      if (a.partyStartTime && b.partyStartTime) {
        return a.partyStartTime.localeCompare(b.partyStartTime);
      }
      // If only one has a party start time, prioritize that one
      if (a.partyStartTime) return -1;
      if (b.partyStartTime) return 1;
      // Otherwise, no sorting
      return 0;
    });

    // 6. Use a greedy algorithm for route optimization with time consideration
    const optimizedOrder: ContactWithCoordinates[] = [];
    const timeSlots: DeliveryTimeSlot[] = [];
    const visited = new Set<string>(["start"]);
    let currentLocationIndex = 0;
    let totalDistance = 0;
    let totalDuration = 0;

    while (visited.size <= contactsWithCoords.length) {
      // Find the nearest unvisited location
      let minDistance = Infinity;
      let nextLocationIndex = -1;

      for (let i = 0; i < locations.length; i++) {
        if (!visited.has(locations[i].id)) {
          const distance = matrix.distances[currentLocationIndex][i];
          if (distance < minDistance) {
            minDistance = distance;
            nextLocationIndex = i;
          }
        }
      }

      if (nextLocationIndex === -1) break;

      // Add to route
      const nextLocationId = locations[nextLocationIndex].id;
      const nextContact = contactsWithCoords.find(
        (c) => c._id === nextLocationId,
      );

      if (nextContact) {
        optimizedOrder.push(nextContact);

        // Calculate travel time to this location
        const travelDuration =
          matrix.durations[currentLocationIndex][nextLocationIndex];
        const travelDistance =
          matrix.distances[currentLocationIndex][nextLocationIndex];

        // Fixed one-hour block for this delivery
        const deliveryStartTime = new Date(
          startTime.getTime() + timeSlots.length * 60 * 60 * 1000,
        );
        const deliveryEndTime = new Date(
          deliveryStartTime.getTime() + 60 * 60 * 1000,
        );

        // Add time slot
        timeSlots.push({
          contact: nextContact,
          timeBlock: {
            start: deliveryStartTime,
            end: deliveryEndTime,
          },
          travelInfo: {
            duration: travelDuration,
            distance: travelDistance,
          },
        });

        // Update totals
        totalDistance += travelDistance;
        totalDuration += travelDuration + 60 * 60; // Travel time + 1 hour delivery
      }

      visited.add(nextLocationId);
      currentLocationIndex = nextLocationIndex;
    }

    // 7. Calculate end time based on the last delivery time slot plus return trip if requested
    let returnDistance = 0;
    let returnDuration = 0;

    // End time is after the last delivery time slot
    let endTime =
      timeSlots.length > 0
        ? new Date(timeSlots[timeSlots.length - 1].timeBlock.end.getTime())
        : new Date(startTime.getTime());

    if (returnToStart && optimizedOrder.length > 0) {
      // Get the last location index
      const lastLocationIndex = locations.findIndex(
        (loc) => loc.id === optimizedOrder[optimizedOrder.length - 1]._id,
      );

      // Calculate return trip
      returnDistance = matrix.distances[lastLocationIndex][0]; // Distance to start
      returnDuration = matrix.durations[lastLocationIndex][0]; // Duration to start

      // Update totals
      totalDistance += returnDistance;
      totalDuration += returnDuration;

      // Add return trip time to end time
      endTime = new Date(endTime.getTime() + returnDuration * 1000);
    }

    // 8. Get the route geometry
    const routeCoordinates = returnToStart
      ? [
          startCoords,
          ...optimizedOrder.map((c) => c.coordinates),
          startCoords, // Add start coordinates again for return trip
        ]
      : [startCoords, ...optimizedOrder.map((c) => c.coordinates)];

    const routeGeometry = await getRouteGeometry(routeCoordinates);

    return {
      deliveryOrder: optimizedOrder,
      timeSlots,
      totalDistance,
      totalDuration,
      routeGeometry,
      startCoordinates: startCoords,
      returnToStart,
      startTime,
      endTime,
    };
  } catch (error) {
    // Removed console.error to prevent test pollution
    throw new Error(
      `Route optimization failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Gets the route geometry for a series of coordinates
 * @param coordinates Array of [longitude, latitude] coordinates
 * @returns Promise resolving to route geometry
 */
async function getRouteGeometry(coordinates: [number, number][]): Promise<any> {
  try {
    // Use our API route instead of calling OpenRouteService directly
    const response = await axios.post("/api/v1/directions", {
      coordinates,
    });

    return response.data;
  } catch (error) {
    console.error("Route geometry error:", error);
    if (axios.isAxiosError(error) && error.response) {
      console.error("API response:", error.response.data);
    }
    throw new Error(
      `Failed to get route geometry: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
