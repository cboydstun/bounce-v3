import { optimizeRoute } from "../routeOptimization";
import { geocodeAddress } from "../geocoding";
import { getDistanceMatrix } from "../distanceMatrix";
import axios from "axios";

// Mock dependencies
jest.mock("../geocoding");
jest.mock("../distanceMatrix");
jest.mock("axios");

const mockedGeocodeAddress = geocodeAddress as jest.MockedFunction<
  typeof geocodeAddress
>;
const mockedGetDistanceMatrix = getDistanceMatrix as jest.MockedFunction<
  typeof getDistanceMatrix
>;
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("Route Optimization", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should optimize a route with multiple contacts", async () => {
    // Mock data
    const startAddress = "123 Main St, San Antonio, TX";
    const contacts = [
      {
        _id: "1",
        bouncer: "John Doe",
        email: "john@example.com",
        partyDate: new Date("2025-03-25"),
        partyZipCode: "78205",
        streetAddress: "456 Oak St",
        city: "San Antonio",
        state: "TX",
        confirmed: "Confirmed" as const,
        sourcePage: "website",
      },
      {
        _id: "2",
        bouncer: "Jane Smith",
        email: "jane@example.com",
        partyDate: new Date("2025-03-25"),
        partyZipCode: "78210",
        streetAddress: "789 Pine St",
        city: "San Antonio",
        state: "TX",
        confirmed: "Confirmed" as const,
        sourcePage: "website",
      },
    ];

    // Mock geocoding
    mockedGeocodeAddress.mockResolvedValueOnce([-98.4936, 29.4241]); // Start address
    mockedGeocodeAddress.mockResolvedValueOnce([-98.48, 29.43]); // Contact 1
    mockedGeocodeAddress.mockResolvedValueOnce([-98.47, 29.44]); // Contact 2

    // Mock distance matrix
    mockedGetDistanceMatrix.mockResolvedValueOnce({
      distances: [
        [0, 1000, 2000],
        [1000, 0, 1500],
        [2000, 1500, 0],
      ],
      durations: [
        [0, 120, 240],
        [120, 0, 180],
        [240, 180, 0],
      ],
      destinations: [
        { location: [-98.4936, 29.4241] },
        { location: [-98.48, 29.43] },
        { location: [-98.47, 29.44] },
      ],
      sources: [
        { location: [-98.4936, 29.4241] },
        { location: [-98.48, 29.43] },
        { location: [-98.47, 29.44] },
      ],
    });

    // Mock route geometry
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: [
                [-98.4936, 29.4241],
                [-98.48, 29.43],
                [-98.47, 29.44],
              ],
            },
          },
        ],
      },
    });

    // Execute
    const result = await optimizeRoute(contacts, startAddress);

    // Assertions
    expect(mockedGeocodeAddress).toHaveBeenCalledTimes(3);
    expect(mockedGetDistanceMatrix).toHaveBeenCalledTimes(1);
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);

    expect(result).toHaveProperty("deliveryOrder");
    expect(result).toHaveProperty("totalDistance");
    expect(result).toHaveProperty("totalDuration");
    expect(result).toHaveProperty("routeGeometry");

    expect(result.deliveryOrder.length).toBe(2);
    expect(result.totalDistance).toBeGreaterThan(0);
    expect(result.totalDuration).toBeGreaterThan(0);
  });

  it("should handle errors gracefully", async () => {
    // Mock data
    const startAddress = "123 Main St, San Antonio, TX";
    const contacts = [
      {
        _id: "1",
        bouncer: "John Doe",
        email: "john@example.com",
        partyDate: new Date("2025-03-25"),
        partyZipCode: "78205",
        streetAddress: "456 Oak St",
        city: "San Antonio",
        state: "TX",
        confirmed: "Confirmed" as const,
        sourcePage: "website",
      },
    ];

    // Mock geocoding to throw an error
    mockedGeocodeAddress.mockRejectedValueOnce(new Error("Geocoding failed"));

    // Execute and assert
    await expect(optimizeRoute(contacts, startAddress)).rejects.toThrow(
      "Route optimization failed",
    );
  });
});
