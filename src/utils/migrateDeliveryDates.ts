import { config } from "dotenv";
import { resolve } from "path";
import dbConnect from "@/lib/db/mongoose";
import Order from "@/models/Order";

// Load environment variables
config({ path: resolve(process.cwd(), ".env.local") });

// Utility function to parse delivery date from notes (same as DeliveryCountdown component)
const parseDeliveryDateFromNotes = (notes: string): Date | null => {
  if (!notes) return null;

  // Look for patterns like "Delivery: 2025-08-02 12:00" or "Delivery: 2025-08-02"
  const deliveryRegex =
    /Delivery:\s*(\d{4}-\d{2}-\d{2})(?:\s+(\d{1,2}:\d{2}))?/i;
  const match = notes.match(deliveryRegex);

  if (match) {
    const dateStr = match[1]; // YYYY-MM-DD
    const timeStr = match[2] || "12:00"; // Default to noon if no time specified

    try {
      const parsedDate = new Date(`${dateStr}T${timeStr}:00`);
      // Validate that the date is reasonable (not invalid)
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    } catch (error) {
      console.warn("Failed to parse delivery date from notes:", error);
    }
  }

  return null;
};

export async function migrateDeliveryDates() {
  try {
    await dbConnect();

    console.log("🔄 Starting delivery date migration...");

    // Find all orders that have null deliveryDate but have notes
    const ordersToMigrate = await Order.find({
      $and: [
        {
          $or: [{ deliveryDate: null }, { deliveryDate: { $exists: false } }],
        },
        {
          notes: {
            $exists: true,
            $nin: [null, ""],
          },
        },
      ],
    });

    console.log(`📋 Found ${ordersToMigrate.length} orders to migrate`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const order of ordersToMigrate) {
      const parsedDate = parseDeliveryDateFromNotes(order.notes || "");

      if (parsedDate) {
        // Update the order with the parsed delivery date
        const updateData: any = {
          deliveryDate: parsedDate,
        };

        // Also set eventDate if it's not already set
        if (!order.eventDate || order.eventDate === null) {
          updateData.eventDate = parsedDate;
        }

        await Order.findByIdAndUpdate(order._id, updateData);

        console.log(
          `✅ Migrated ${order.orderNumber}: ${parsedDate.toISOString()}`,
        );
        migratedCount++;
      } else {
        console.log(
          `⚠️ Skipped ${order.orderNumber}: Could not parse delivery date from notes`,
        );
        skippedCount++;
      }
    }

    console.log(`🎉 Migration complete!`);
    console.log(`✅ Migrated: ${migratedCount} orders`);
    console.log(`⚠️ Skipped: ${skippedCount} orders`);

    return {
      total: ordersToMigrate.length,
      migrated: migratedCount,
      skipped: skippedCount,
    };
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

// CLI script runner
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateDeliveryDates()
    .then((result) => {
      console.log("Migration result:", result);
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration error:", error);
      process.exit(1);
    });
}
