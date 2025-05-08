// Script to add the initial keyword "san antonio bounce house rentals" to the database
import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Connect to MongoDB
async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1);
  }
}

// Define the SearchKeyword schema
const SearchKeywordSchema = new mongoose.Schema(
  {
    keyword: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// Create the model
let SearchKeyword;
try {
  // Try to get the model if it already exists
  SearchKeyword = mongoose.model("SearchKeyword");
} catch (error) {
  // Create the model if it doesn't exist
  SearchKeyword = mongoose.model("SearchKeyword", SearchKeywordSchema);
}

// Add the initial keyword
async function addInitialKeyword() {
  try {
    // Check if the keyword already exists
    const existingKeyword = await SearchKeyword.findOne({
      keyword: "san antonio bounce house rentals",
    });

    if (existingKeyword) {
      console.log("Keyword already exists:", existingKeyword);
      return;
    }

    // Create the keyword
    const newKeyword = await SearchKeyword.create({
      keyword: "san antonio bounce house rentals",
      isActive: true,
    });

    console.log("Initial keyword added successfully:", newKeyword);
  } catch (error) {
    console.error("Failed to add initial keyword:", error);
  }
}

// Run the script
async function run() {
  await connectToDatabase();
  await addInitialKeyword();
  mongoose.connection.close();
}

run();
