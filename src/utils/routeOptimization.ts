import { Contact } from '../types/contact';
import { geocodeAddress } from './geocoding';
import { getDistanceMatrix, Location } from './distanceMatrix';
import axios from 'axios';

/**
 * Interface for optimized route result
 */
export interface OptimizedRoute {
    deliveryOrder: Contact[];
    totalDistance: number; // in meters
    totalDuration: number; // in seconds
    routeGeometry: any; // GeoJSON for the route
    startCoordinates: [number, number]; // Geocoded coordinates of the start address
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
 * @returns Promise resolving to optimized route
 */
export async function optimizeRoute(contacts: Contact[], startAddress: string): Promise<OptimizedRoute> {
    try {
        // 1. Geocode the start address
        const startCoords = await geocodeAddress(startAddress);

        // 2. Geocode all contact addresses
        const contactsWithCoords: ContactWithCoordinates[] = [];
        const failedAddresses: { contact: Contact; error: string }[] = [];

        // Process each contact sequentially to better handle errors
        for (const contact of contacts) {
            try {
                const address = `${contact.streetAddress || ''}, ${contact.city || ''}, ${contact.state || ''} ${contact.partyZipCode || ''}`;

                // Skip addresses with insufficient information
                if (!contact.streetAddress || !contact.city) {
                    failedAddresses.push({
                        contact,
                        error: 'Incomplete address information'
                    });
                    continue;
                }

                const coords = await geocodeAddress(address);
                contactsWithCoords.push({ ...contact, coordinates: coords });
            } catch (error) {
                failedAddresses.push({
                    contact,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }

        // If no addresses could be geocoded, throw an error
        if (contactsWithCoords.length === 0) {
            throw new Error(`Could not geocode any addresses. Please check address information.`);
        }

        // Log any failed addresses
        if (failedAddresses.length > 0) {
            console.warn('Some addresses could not be geocoded:', failedAddresses);
        }

        // 3. Create locations array for distance matrix
        const locations: Location[] = [
            { id: 'start', coordinates: startCoords },
            ...contactsWithCoords.map(c => ({
                id: c._id,
                coordinates: c.coordinates
            }))
        ];

        // 4. Get distance matrix
        const matrix = await getDistanceMatrix(locations);

        // 5. Use a greedy algorithm for route optimization
        const optimizedOrder: ContactWithCoordinates[] = [];
        const visited = new Set<string>(['start']);
        let currentLocationIndex = 0;
        let totalDistance = 0;
        let totalDuration = 0;

        while (visited.size <= contacts.length) {
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
            const nextContact = contactsWithCoords.find(c => c._id === nextLocationId);

            if (nextContact) {
                optimizedOrder.push(nextContact);
                totalDistance += minDistance;
                totalDuration += matrix.durations[currentLocationIndex][nextLocationIndex];
            }

            visited.add(nextLocationId);
            currentLocationIndex = nextLocationIndex;
        }

        // 6. Get the route geometry
        const routeCoordinates = [
            startCoords,
            ...optimizedOrder.map(c => c.coordinates)
        ];

        const routeGeometry = await getRouteGeometry(routeCoordinates);

        return {
            deliveryOrder: optimizedOrder,
            totalDistance,
            totalDuration,
            routeGeometry,
            startCoordinates: startCoords
        };
    } catch (error) {
        console.error('Route optimization error:', error);
        throw new Error(`Route optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
        const response = await axios.post('/api/v1/directions', {
            coordinates
        });

        return response.data;
    } catch (error) {
        console.error('Route geometry error:', error);
        if (axios.isAxiosError(error) && error.response) {
            console.error('API response:', error.response.data);
        }
        throw new Error(`Failed to get route geometry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
