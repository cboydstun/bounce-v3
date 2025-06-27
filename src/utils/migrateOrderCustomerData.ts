/**
 * Migration utility to populate customer information in existing orders
 * that have a contactId but missing customer fields
 */

import dbConnect from "@/lib/db/mongoose";
import Order from "@/models/Order";
import Contact from "@/models/Contact";

interface MigrationResult {
  totalOrders: number;
  migratedOrders: number;
  skippedOrders: number;
  errors: Array<{
    orderId: string;
    error: string;
  }>;
}

/**
 * Migrate existing orders to populate customer information from contacts
 * @param dryRun If true, only logs what would be changed without making actual changes
 * @returns Migration result summary
 */
export async function migrateOrderCustomerData(
  dryRun: boolean = true,
): Promise<MigrationResult> {
  await dbConnect();

  const result: MigrationResult = {
    totalOrders: 0,
    migratedOrders: 0,
    skippedOrders: 0,
    errors: [],
  };

  try {
    // Find orders that have a contactId but are missing customer information
    const ordersToMigrate = await Order.find({
      contactId: { $exists: true, $ne: null },
      $or: [
        { customerEmail: { $exists: false } },
        { customerEmail: null },
        { customerEmail: "" },
      ],
    });

    result.totalOrders = ordersToMigrate.length;

    console.log(`Found ${result.totalOrders} orders that need migration`);

    for (const order of ordersToMigrate) {
      try {
        // Fetch the associated contact
        const contact = await Contact.findById(order.contactId);

        if (!contact) {
          console.warn(
            `Contact not found for order ${order.orderNumber} (contactId: ${order.contactId})`,
          );
          result.skippedOrders++;
          continue;
        }

        // Prepare the customer data to populate
        const customerData: any = {};

        // Populate customer information from contact
        if (!order.customerName) {
          customerData.customerName =
            contact.customerName ||
            (contact.email ? contact.email.split("@")[0] : "Customer");
        }

        if (!order.customerEmail) {
          customerData.customerEmail = contact.email;
        }

        if (!order.customerPhone && contact.phone) {
          customerData.customerPhone = contact.phone;
        }

        if (!order.customerAddress && contact.streetAddress) {
          customerData.customerAddress = contact.streetAddress;
        }

        if (!order.customerCity && contact.city) {
          customerData.customerCity = contact.city;
        }

        if (!order.customerState && contact.state) {
          customerData.customerState = contact.state;
        }

        if (!order.customerZipCode && contact.partyZipCode) {
          customerData.customerZipCode = contact.partyZipCode;
        }

        // Also populate delivery and event dates if missing
        if (!order.deliveryDate && contact.deliveryDate) {
          customerData.deliveryDate = contact.deliveryDate;
        }

        if (!order.eventDate && contact.partyDate) {
          customerData.eventDate = contact.partyDate;
        }

        if (Object.keys(customerData).length === 0) {
          console.log(
            `Order ${order.orderNumber} already has all customer data, skipping`,
          );
          result.skippedOrders++;
          continue;
        }

        if (dryRun) {
          console.log(
            `[DRY RUN] Would update order ${order.orderNumber} with:`,
            customerData,
          );
        } else {
          // Actually update the order
          await Order.findByIdAndUpdate(order._id, customerData);
          console.log(
            `Updated order ${order.orderNumber} with customer data from contact`,
          );
        }

        result.migratedOrders++;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.error(
          `Error migrating order ${order.orderNumber}:`,
          errorMessage,
        );
        result.errors.push({
          orderId: order._id?.toString() || "unknown",
          error: errorMessage,
        });
      }
    }

    console.log("\nMigration Summary:");
    console.log(`Total orders found: ${result.totalOrders}`);
    console.log(
      `Orders ${dryRun ? "that would be" : ""} migrated: ${result.migratedOrders}`,
    );
    console.log(`Orders skipped: ${result.skippedOrders}`);
    console.log(`Errors: ${result.errors.length}`);

    if (result.errors.length > 0) {
      console.log("\nErrors encountered:");
      result.errors.forEach(({ orderId, error }) => {
        console.log(`- Order ${orderId}: ${error}`);
      });
    }

    return result;
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}

/**
 * CLI script to run the migration
 * Usage:
 * - Dry run: npx tsx src/utils/migrateOrderCustomerData.ts
 * - Actual migration: npx tsx src/utils/migrateOrderCustomerData.ts --execute
 */
async function runMigration() {
  const args = process.argv.slice(2);
  const execute = args.includes("--execute");
  const dryRun = !execute;

  console.log(`Running migration in ${dryRun ? "DRY RUN" : "EXECUTE"} mode...`);

  try {
    const result = await migrateOrderCustomerData(dryRun);
    console.log("\nMigration completed successfully!");
    if (dryRun) {
      console.log(
        "\nTo actually perform the migration, run with --execute flag",
      );
    }
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

// Run the migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration();
}
