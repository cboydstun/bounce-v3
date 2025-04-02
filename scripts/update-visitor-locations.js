/**
 * One-time migration script to update visitor locations
 *
 * This script fetches all visitors from the database, gets location data for each visitor's IP address,
 * and updates the visitor record with the location data.
 *
 * Usage:
 * node scripts/update-visitor-locations.js
 */

import { connect } from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: ".env.local" });

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI;

// Connect to MongoDB
async function connectToDatabase() {
  try {
    await connect(MONGODB_URI);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
}

// Get Visitor model
async function getVisitorModel() {
  try {
    // Dynamic import to avoid ESM/CommonJS issues
    const { default: Visitor } = await import("../src/models/Visitor.js");
    return Visitor;
  } catch (error) {
    console.error("Error importing Visitor model:", error);
    process.exit(1);
  }
}

// IP Geolocation function
async function getLocationFromIp(ip) {
  // Skip for localhost or invalid IPs
  if (ip === "localhost" || ip === "127.0.0.1" || ip === "unknown" || !ip) {
    return null;
  }

  try {
    // Fetch from IP-API
    const response = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,country,regionName,city,lat,lon`,
    );
    const data = await response.json();

    if (data.status === "success") {
      return {
        country: data.country,
        region: data.regionName,
        city: data.city,
        latitude: data.lat,
        longitude: data.lon,
      };
    }

    return null;
  } catch (error) {
    console.error("Error fetching location data:", error);
    return null;
  }
}

// Update visitor locations
async function updateVisitorLocations() {
  try {
    await connectToDatabase();
    const Visitor = await getVisitorModel();

    // Get all visitors without location data
    const visitors = await Visitor.find({
      ipAddress: { $exists: true, $ne: null },
      $or: [
        { location: { $exists: false } },
        { location: null },
        { "location.country": { $exists: false } },
        { "location.country": null },
      ],
    });

    // Process visitors in batches to avoid rate limits (45 requests per minute for IP-API)
    const batchSize = 40;
    const delay = 70 * 1000; // 70 seconds delay between batches

    for (let i = 0; i < visitors.length; i += batchSize) {
      const batch = visitors.slice(i, i + batchSize);
      console.log(
        `Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(visitors.length / batchSize)}`,
      );

      // Process each visitor in the batch
      const promises = batch.map(async (visitor) => {
        try {
          const ipAddress = visitor.ipAddress;

          if (!ipAddress || ipAddress === "unknown") {
            console.log(
              `Skipping visitor ${visitor._id} with invalid IP: ${ipAddress}`,
            );
            return;
          }

          console.log(
            `Getting location for visitor ${visitor._id} with IP: ${ipAddress}`,
          );
          const locationData = await getLocationFromIp(ipAddress);

          if (locationData) {
            console.log(
              `Updating visitor ${visitor._id} with location: ${locationData.city}, ${locationData.region}, ${locationData.country}`,
            );
            visitor.location = locationData;
            await visitor.save();
          } else {
            console.log(
              `No location data found for visitor ${visitor._id} with IP: ${ipAddress}`,
            );
          }
        } catch (error) {
          console.error(`Error updating visitor ${visitor._id}:`, error);
        }
      });

      // Wait for all promises in the batch to resolve
      await Promise.all(promises);

      // If there are more batches to process, wait before continuing
      if (i + batchSize < visitors.length) {
        console.log(
          `Waiting ${delay / 1000} seconds before processing next batch...`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    console.log("Finished updating visitor locations");
    process.exit(0);
  } catch (error) {
    console.error("Error updating visitor locations:", error);
    process.exit(1);
  }
}

// Run the script
updateVisitorLocations();
