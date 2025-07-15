#!/usr/bin/env node

/**
 * Script to create an initial admin user
 * Usage: node scripts/create-admin-user.js
 */

const mongoose = require("mongoose");
const bcryptjs = require("bcryptjs");
const readline = require("readline");

// Load environment variables
require("dotenv").config({ path: ".env.local" });

// User schema (simplified version)
const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: false,
    },
    role: {
      type: String,
      enum: ["admin", "customer", "user"],
      default: "customer",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Pre-save hook to hash password
UserSchema.pre("save", async function (next) {
  try {
    if (!this.isModified("password")) return next();
    if (!this.password) {
      return next(new Error("Password is required"));
    }
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(this.password, salt);
    this.password = hashedPassword;
    next();
  } catch (error) {
    return next(error instanceof Error ? error : new Error(String(error)));
  }
});

const User = mongoose.model("User", UserSchema);

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Helper function to ask questions
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

// Helper function to ask for password (hidden input)
function askPassword(question) {
  return new Promise((resolve) => {
    process.stdout.write(question);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding("utf8");

    let password = "";

    process.stdin.on("data", function (char) {
      char = char + "";

      switch (char) {
        case "\n":
        case "\r":
        case "\u0004":
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdout.write("\n");
          resolve(password);
          break;
        case "\u0003":
          process.exit();
          break;
        case "\u007f": // Backspace
          if (password.length > 0) {
            password = password.slice(0, -1);
            process.stdout.write("\b \b");
          }
          break;
        default:
          password += char;
          process.stdout.write("*");
          break;
      }
    });
  });
}

async function createAdminUser() {
  try {
    console.log("🚀 Admin User Creation Script");
    console.log("===============================\n");

    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || process.env.DATABASE_URL;
    if (!mongoUri) {
      throw new Error(
        "MONGODB_URI or DATABASE_URL environment variable is required",
      );
    }

    console.log("Connecting to database...");
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to database\n");

    // Get user input
    const email = await askQuestion("Enter admin email: ");

    if (!email || !email.match(/^\S+@\S+\.\S+$/)) {
      throw new Error("Please provide a valid email address");
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error(`User with email ${email} already exists`);
    }

    const name = await askQuestion("Enter admin name (optional): ");
    const password = await askPassword("Enter admin password: ");
    const confirmPassword = await askPassword("Confirm admin password: ");

    if (!password || password.length < 8) {
      throw new Error("Password must be at least 8 characters long");
    }

    if (password !== confirmPassword) {
      throw new Error("Passwords do not match");
    }

    // Create admin user
    console.log("\nCreating admin user...");
    const adminUser = new User({
      email,
      name: name || undefined,
      password,
      role: "admin",
    });

    await adminUser.save();

    console.log("✅ Admin user created successfully!");
    console.log(`📧 Email: ${email}`);
    console.log(`👤 Name: ${name || "Not provided"}`);
    console.log(`🔑 Role: admin`);
    console.log(
      "\nYou can now login to the admin panel with these credentials.",
    );
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  } finally {
    rl.close();
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from database");
  }
}

// Handle script interruption
process.on("SIGINT", async () => {
  console.log("\n\n⚠️  Script interrupted");
  rl.close();
  await mongoose.disconnect();
  process.exit(0);
});

// Run the script
createAdminUser();
