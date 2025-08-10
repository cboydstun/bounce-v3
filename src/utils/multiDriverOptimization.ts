import { Contact } from "../types/contact";
import { Order } from "../types/order";
import {
  DeliveryTimeSlot,
  OptimizedRoute,
  optimizeRouteForOrders,
} from "./routeOptimization";

/**
 * Interface for multi-route optimization result
 */
export interface MultiRouteResult {
  routes: OptimizedRoute[];
  driverAssignments: Map<string, number>; // orderId -> driverIndex
  totalDistance: number;
  totalDuration: number;
  routeStats: {
    driversUsed: number;
    averageStopsPerDriver: number;
    averageDistancePerDriver: number;
    totalStops: number;
  };
}

/**
 * Driver route colors for visualization
 */
export const DRIVER_COLORS = [
  "#3B82F6", // Blue
  "#EF4444", // Red
  "#10B981", // Green
  "#8B5CF6", // Purple
  "#F59E0B", // Orange
  "#EC4899", // Pink
  "#14B8A6", // Teal
  "#6366F1", // Indigo
  "#EAB308", // Yellow
  "#6B7280", // Gray
];

/**
 * Get driver color by index
 */
export function getDriverColor(driverIndex: number): string {
  return DRIVER_COLORS[driverIndex % DRIVER_COLORS.length];
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c * 1000; // Convert to meters
}

/**
 * Extract coordinates from orders
 */
function extractCoordinates(
  orders: Order[],
): Array<{ order: Order; lat: number; lng: number }> {
  const coordinates: Array<{ order: Order; lat: number; lng: number }> = [];

  // For now, we'll use a simple approach to get coordinates
  // In a real implementation, you'd geocode the addresses
  orders.forEach((order) => {
    // Generate approximate coordinates based on San Antonio area
    // This is a placeholder - in production you'd use actual geocoded coordinates
    const baseLat = 29.4241; // San Antonio center
    const baseLng = -98.4936;

    // Add some variation based on zip code or address
    const zipVariation = order.customerZipCode
      ? (parseInt(order.customerZipCode.slice(-2)) - 50) * 0.001
      : 0;
    const addressVariation = order.customerAddress
      ? ((order.customerAddress.length % 100) - 50) * 0.0005
      : 0;

    coordinates.push({
      order,
      lat: baseLat + zipVariation + addressVariation,
      lng: baseLng + zipVariation - addressVariation,
    });
  });

  return coordinates;
}

/**
 * K-means clustering algorithm for geographic distribution
 */
function kMeansCluster(
  coordinates: Array<{ order: Order; lat: number; lng: number }>,
  k: number,
  maxIterations: number = 100,
): Array<Array<{ order: Order; lat: number; lng: number }>> {
  if (coordinates.length === 0 || k <= 0) {
    return [];
  }

  if (k >= coordinates.length) {
    // If we have more drivers than orders, assign one order per driver
    return coordinates.map((coord) => [coord]);
  }

  // Initialize centroids randomly
  const centroids: Array<{ lat: number; lng: number }> = [];
  for (let i = 0; i < k; i++) {
    const randomIndex = Math.floor(Math.random() * coordinates.length);
    centroids.push({
      lat: coordinates[randomIndex].lat,
      lng: coordinates[randomIndex].lng,
    });
  }

  let clusters: Array<Array<{ order: Order; lat: number; lng: number }>> = [];
  let converged = false;
  let iterations = 0;

  while (!converged && iterations < maxIterations) {
    // Initialize empty clusters
    clusters = Array.from({ length: k }, () => []);

    // Assign each point to the nearest centroid
    coordinates.forEach((coord) => {
      let minDistance = Infinity;
      let closestCluster = 0;

      centroids.forEach((centroid, index) => {
        const distance = calculateDistance(
          coord.lat,
          coord.lng,
          centroid.lat,
          centroid.lng,
        );
        if (distance < minDistance) {
          minDistance = distance;
          closestCluster = index;
        }
      });

      clusters[closestCluster].push(coord);
    });

    // Update centroids
    const newCentroids: Array<{ lat: number; lng: number }> = [];
    let centroidsChanged = false;

    clusters.forEach((cluster, index) => {
      if (cluster.length === 0) {
        // Keep the old centroid if cluster is empty
        newCentroids.push(centroids[index]);
      } else {
        const avgLat =
          cluster.reduce((sum, coord) => sum + coord.lat, 0) / cluster.length;
        const avgLng =
          cluster.reduce((sum, coord) => sum + coord.lng, 0) / cluster.length;

        const oldCentroid = centroids[index];
        if (
          Math.abs(avgLat - oldCentroid.lat) > 0.0001 ||
          Math.abs(avgLng - oldCentroid.lng) > 0.0001
        ) {
          centroidsChanged = true;
        }

        newCentroids.push({ lat: avgLat, lng: avgLng });
      }
    });

    centroids.splice(0, centroids.length, ...newCentroids);
    converged = !centroidsChanged;
    iterations++;
  }

  // Balance clusters to ensure no driver has too many or too few deliveries
  clusters = balanceClusters(clusters, coordinates.length);

  return clusters;
}

/**
 * Balance clusters to ensure fair distribution
 */
function balanceClusters(
  clusters: Array<Array<{ order: Order; lat: number; lng: number }>>,
  totalOrders: number,
): Array<Array<{ order: Order; lat: number; lng: number }>> {
  const targetSize = Math.floor(totalOrders / clusters.length);
  const remainder = totalOrders % clusters.length;

  // Sort clusters by size (largest first)
  const sortedClusters = clusters
    .map((cluster, index) => ({ cluster, index }))
    .sort((a, b) => b.cluster.length - a.cluster.length);

  // Redistribute orders from oversized clusters to undersized ones
  for (let i = 0; i < sortedClusters.length; i++) {
    const { cluster } = sortedClusters[i];
    const maxAllowed = targetSize + (i < remainder ? 1 : 0);

    while (cluster.length > maxAllowed) {
      // Find the smallest cluster that can accept more orders
      const smallestCluster = sortedClusters
        .slice(i + 1)
        .find(({ cluster: c }) => c.length < targetSize);

      if (smallestCluster) {
        // Move one order from current cluster to smallest cluster
        const orderToMove = cluster.pop();
        if (orderToMove) {
          smallestCluster.cluster.push(orderToMove);
        }
      } else {
        break; // No more clusters can accept orders
      }
    }
  }

  return sortedClusters.map(({ cluster }) => cluster);
}

/**
 * Optimize routes for multiple drivers
 */
export async function optimizeMultiDriverRoutes(
  orders: Order[],
  driverCount: number,
  startAddress: string,
  startTime: Date = new Date(new Date().setHours(8, 0, 0, 0)),
  returnToStart: boolean = true,
): Promise<MultiRouteResult> {
  try {
    // Validate input
    if (driverCount < 1 || driverCount > 10) {
      throw new Error("Driver count must be between 1 and 10");
    }

    if (orders.length === 0) {
      throw new Error("No orders to optimize");
    }

    // If only one driver, use existing single-route optimization
    if (driverCount === 1) {
      const singleRoute = await optimizeRouteForOrders(
        orders,
        startAddress,
        startTime,
        returnToStart,
      );

      const driverAssignments = new Map<string, number>();
      orders.forEach((order) => driverAssignments.set(order._id, 0));

      return {
        routes: [
          {
            ...singleRoute,
            driverIndex: 0,
            routeColor: getDriverColor(0),
          },
        ],
        driverAssignments,
        totalDistance: singleRoute.totalDistance,
        totalDuration: singleRoute.totalDuration,
        routeStats: {
          driversUsed: 1,
          averageStopsPerDriver: orders.length,
          averageDistancePerDriver: singleRoute.totalDistance,
          totalStops: orders.length,
        },
      };
    }

    // Extract coordinates from orders
    const coordinates = extractCoordinates(orders);

    // Cluster orders geographically
    const clusters = kMeansCluster(coordinates, driverCount);

    // Optimize each cluster individually
    const routes: OptimizedRoute[] = [];
    const driverAssignments = new Map<string, number>();
    let totalDistance = 0;
    let totalDuration = 0;

    for (let i = 0; i < clusters.length; i++) {
      const cluster = clusters[i];

      if (cluster.length === 0) {
        // Create empty route for drivers with no deliveries
        const emptyRoute: OptimizedRoute = {
          deliveryOrder: [],
          orders: [],
          timeSlots: [],
          totalDistance: 0,
          totalDuration: 0,
          routeGeometry: null,
          startCoordinates: [0, 0] as [number, number],
          returnToStart: false,
          startTime,
          endTime: startTime,
          driverIndex: i,
          routeColor: getDriverColor(i),
        };
        routes.push(emptyRoute);
        continue;
      }

      // Extract orders from cluster
      const clusterOrders = cluster.map((coord) => coord.order);

      // Optimize route for this cluster
      const optimizedRoute = await optimizeRouteForOrders(
        clusterOrders,
        startAddress,
        startTime,
        returnToStart,
      );

      // Add driver information
      const driverRoute: OptimizedRoute = {
        ...optimizedRoute,
        driverIndex: i,
        routeColor: getDriverColor(i),
      };

      routes.push(driverRoute);

      // Track assignments
      clusterOrders.forEach((order) => {
        driverAssignments.set(order._id, i);
      });

      totalDistance += optimizedRoute.totalDistance;
      totalDuration += optimizedRoute.totalDuration;
    }

    // Calculate statistics
    const nonEmptyRoutes = routes.filter((route) => route.orders.length > 0);
    const routeStats = {
      driversUsed: nonEmptyRoutes.length,
      averageStopsPerDriver:
        nonEmptyRoutes.length > 0 ? orders.length / nonEmptyRoutes.length : 0,
      averageDistancePerDriver:
        nonEmptyRoutes.length > 0 ? totalDistance / nonEmptyRoutes.length : 0,
      totalStops: orders.length,
    };

    return {
      routes,
      driverAssignments,
      totalDistance,
      totalDuration,
      routeStats,
    };
  } catch (error) {
    throw new Error(
      `Multi-driver route optimization failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }
}

/**
 * Rebalance routes after manual changes
 */
export async function rebalanceMultiDriverRoutes(
  currentResult: MultiRouteResult,
  startAddress: string,
  startTime: Date,
  returnToStart: boolean = true,
): Promise<MultiRouteResult> {
  // Extract all orders from current routes
  const allOrders: Order[] = [];
  currentResult.routes.forEach((route) => {
    allOrders.push(...route.orders);
  });

  // Re-optimize with the same driver count
  return optimizeMultiDriverRoutes(
    allOrders,
    currentResult.routes.length,
    startAddress,
    startTime,
    returnToStart,
  );
}
