import { sendRankingChangeNotification } from "../src/utils/emailService.js";

// Test data for ranking changes
const testChanges = [
  {
    keyword: "bounce house rental san antonio",
    previousPosition: 18,
    currentPosition: 15,
    change: 3,
    date: new Date(),
    url: "https://satxbounce.com",
  },
  {
    keyword: "san antonio bounce house rentals",
    previousPosition: 12,
    currentPosition: 8,
    change: 4,
    date: new Date(),
    url: "https://satxbounce.com",
  },
];

async function testEmailService() {
  console.log("🧪 Testing Email Service Configuration");
  console.log("=====================================\n");

  try {
    // Check environment variables
    console.log("1️⃣ Checking environment variables...");

    const senderEmail = process.env.EMAIL;
    const primaryRecipient = process.env.OTHER_EMAIL;
    const secondaryRecipient = process.env.SECOND_EMAIL;
    const sendgridApiKey = process.env.SENDGRID_API_KEY;

    console.log("Environment variables:", {
      EMAIL: senderEmail ? "✅ Set" : "❌ Missing",
      OTHER_EMAIL: primaryRecipient ? "✅ Set" : "❌ Missing",
      SECOND_EMAIL: secondaryRecipient ? "✅ Set" : "❌ Missing",
      SENDGRID_API_KEY: sendgridApiKey ? "✅ Set" : "❌ Missing",
    });

    if (
      !senderEmail ||
      !primaryRecipient ||
      !secondaryRecipient ||
      !sendgridApiKey
    ) {
      throw new Error("Missing required environment variables");
    }

    console.log("\nEmail configuration:");
    console.log(`  From: ${senderEmail}`);
    console.log(`  To: ${primaryRecipient}, ${secondaryRecipient}`);
    console.log("");

    // Test sending ranking change notification
    console.log("2️⃣ Testing ranking change notification...");

    await sendRankingChangeNotification(testChanges);

    console.log("✅ Email test completed successfully!");
    console.log("\nCheck the recipient inboxes for the test email.");
  } catch (error) {
    console.error("❌ Email test failed:", {
      message: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
}

// Run the test
testEmailService();
