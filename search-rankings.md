# Search Rankings Feature Documentation

This document provides comprehensive documentation for the Search Rankings feature implemented in the SATXBounce admin dashboard.

## Overview

The Search Rankings feature allows administrators to track the website's position in Google search results for specific keywords. It includes functionality for managing keywords, viewing ranking history, analyzing metrics, and comparing against competitors.

## Environment Variables

The feature requires the following environment variables:

```
# Google APIs
GOOGLE_API_KEY=string     # Google API key for the Custom Search API
GOOGLE_CX=string          # Google Custom Search Engine ID
TARGET_DOMAIN=string      # The domain to track (satxbounce.com)
```

## Database Models

### SearchKeyword Model

```typescript
// src/models/SearchKeyword.ts
import mongoose, { Document, Schema } from "mongoose";

export interface ISearchKeywordDocument extends Document {
  keyword: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SearchKeywordSchema = new Schema(
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

const SearchKeyword =
  mongoose.models.SearchKeyword ||
  mongoose.model<ISearchKeywordDocument>("SearchKeyword", SearchKeywordSchema);

export default SearchKeyword;
```

### SearchRanking Model

```typescript
// src/models/SearchRanking.ts
import mongoose, { Document, Schema } from "mongoose";

export interface ISearchRankingDocument extends Document {
  keywordId: mongoose.Types.ObjectId;
  keyword: string;
  date: Date;
  position: number;
  url: string;
  competitors: Array<{
    position: number;
    title: string;
    url: string;
    snippet?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const CompetitorSchema = new Schema(
  {
    position: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    snippet: {
      type: String,
    },
  },
  { _id: false },
);

const SearchRankingSchema = new Schema(
  {
    keywordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SearchKeyword",
      required: true,
    },
    keyword: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    position: {
      type: Number,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    competitors: {
      type: [CompetitorSchema],
      default: [],
    },
  },
  { timestamps: true },
);

// Create a compound index on keywordId and date
SearchRankingSchema.index({ keywordId: 1, date: 1 });

const SearchRanking =
  mongoose.models.SearchRanking ||
  mongoose.model<ISearchRankingDocument>("SearchRanking", SearchRankingSchema);

export default SearchRanking;
```

### Competitor Model

```typescript
// src/models/Competitor.ts
import mongoose, { Document, Schema } from "mongoose";

export interface ICompetitorDocument extends Document {
  name: string;
  url: string;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CompetitorSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// Create a unique compound index on name and url
CompetitorSchema.index({ name: 1, url: 1 }, { unique: true });

// Static method to find active competitors
CompetitorSchema.statics.findActiveCompetitors = function () {
  return this.find({ isActive: true }).sort({ name: 1 });
};

// Export the model
const Competitor =
  mongoose.models.Competitor ||
  mongoose.model<ICompetitorDocument>("Competitor", CompetitorSchema);

export default Competitor;
```

## TypeScript Types

```typescript
// src/types/searchRanking.ts
import { Document, Model } from "mongoose";

// Competitor in search results
export interface Competitor {
  position: number;
  title: string;
  url: string;
  snippet?: string;
}

// Managed competitor (from Competitor model)
export interface ManagedCompetitor {
  _id: string;
  name: string;
  url: string;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchKeyword {
  _id: string;
  keyword: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchRanking {
  _id: string;
  keywordId: string;
  keyword: string;
  date: Date;
  position: number;
  url: string;
  competitors: Competitor[];
  createdAt: Date;
  updatedAt: Date;
}

// Form data interfaces
export interface KeywordFormData {
  keyword: string;
  isActive?: boolean;
}

export interface CompetitorFormData {
  name: string;
  url: string;
  notes?: string;
  isActive?: boolean;
}

export interface RankingChangeNotification {
  keyword: string;
  previousPosition: number;
  currentPosition: number;
  change: number;
  date: Date;
  url: string;
}
```

## API Endpoints

### Keywords Management

#### GET /api/v1/search-rankings/keywords

- Fetches all keywords
- Requires authentication
- Returns a list of keywords sorted alphabetically

#### POST /api/v1/search-rankings/keywords

- Adds a new keyword to track
- Requires authentication
- Validates that the keyword doesn't already exist
- Returns the newly created keyword

#### GET /api/v1/search-rankings/keywords/[id]

- Fetches a specific keyword by ID
- Requires authentication
- Returns the keyword or 404 if not found

#### PATCH /api/v1/search-rankings/keywords/[id]

- Updates a specific keyword
- Requires authentication
- Can update the keyword text or active status
- Returns the updated keyword

#### DELETE /api/v1/search-rankings/keywords/[id]

- Deletes a specific keyword
- Requires authentication
- Returns success message

### Ranking History

#### GET /api/v1/search-rankings/history

- Fetches ranking history for a specific keyword
- Requires authentication
- Accepts query parameters for keywordId, startDate, and endDate
- Returns a list of rankings sorted by date (newest first)

### Ranking Check

#### POST /api/v1/search-rankings/check

- Manually checks the current ranking for a keyword
- Requires authentication
- Uses the Google Custom Search API to fetch results
- Processes the results to find the target domain's position
- Stores competitors from the search results
- Returns the newly created ranking

### Scheduled Tasks

#### GET /api/v1/search-rankings/cron

- Endpoint for scheduled tasks to check rankings for all active keywords
- Requires a valid cron secret for authentication
- Checks rankings for all active keywords
- Sends email notifications for significant ranking changes

### Competitors Management

#### GET /api/v1/competitors

- Fetches all competitors
- Requires authentication
- Returns a list of competitors sorted by name

#### POST /api/v1/competitors

- Adds a new competitor to track
- Requires authentication
- Validates that the competitor doesn't already exist
- Normalizes the URL (adds https:// if missing)
- Returns the newly created competitor

#### GET /api/v1/competitors/[id]

- Fetches a specific competitor by ID
- Requires authentication
- Returns the competitor or 404 if not found

#### PATCH /api/v1/competitors/[id]

- Updates a specific competitor
- Requires authentication
- Can update name, URL, notes, or active status
- Normalizes the URL (adds https:// if missing)
- Returns the updated competitor

#### DELETE /api/v1/competitors/[id]

- Deletes a specific competitor
- Requires authentication
- Returns success message

## UI Components

### KeywordManager Component

- Displays a list of keywords with their active status
- Allows selecting a keyword to view its ranking data
- Provides a form to add new keywords
- Includes buttons to toggle active status, delete keywords, and check rankings
- Shows loading state during ranking checks

### RankingHistory Component

- Displays a chart of ranking positions over time
- Uses a line chart to visualize ranking trends
- Shows the target domain's position with a highlighted line
- Includes tooltips with detailed information

### RankingMetrics Component

- Displays key metrics about the selected keyword's rankings
- Shows current position, best position, and average position
- Calculates position change over the selected time period
- Uses color-coded indicators for positive/negative changes

### CompetitorAnalysis Component

- Displays analysis of competitors in search results
- Includes a dropdown to select a specific competitor to analyze
- Shows the selected competitor's position and details
- Lists sites ranking above the target domain
- Displays the target domain's position for comparison

### CompetitorManager Component

- Provides a form to add new competitors with name, URL, and notes
- Displays a list of all competitors with their details
- Includes buttons to edit, delete, and toggle active status
- Shows loading state during operations
- Validates input fields

## Pages

### Search Rankings Page

- Main page for the search rankings feature
- Located at `/admin/search-rankings`
- Fetches keywords, rankings, and competitors on load
- Allows selecting a time period for analysis
- Displays KeywordManager, RankingMetrics, RankingHistory, and CompetitorAnalysis components
- Includes a link to the Competitors page

### Competitors Page

- Dedicated page for managing competitors
- Located at `/admin/competitors`
- Fetches competitors on load
- Displays the CompetitorManager component
- Includes an info panel with tips for managing competitors
- Includes a link back to the Search Rankings page

## Utility Functions

### Google Search API

```typescript
// src/utils/googleSearchApi.ts
import axios from "axios";

interface GoogleSearchResult {
  items: Array<{
    title: string;
    link: string;
    snippet?: string;
  }>;
}

export async function searchGoogle(
  keyword: string,
): Promise<GoogleSearchResult> {
  const apiKey = process.env.GOOGLE_API_KEY;
  const cx = process.env.GOOGLE_CX;

  if (!apiKey || !cx) {
    throw new Error("Google API key or CX is missing");
  }

  const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(keyword)}`;

  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error("Error searching Google:", error);
    throw error;
  }
}

export function findPositionInResults(
  results: GoogleSearchResult,
  targetDomain: string,
): {
  position: number;
  url: string;
  competitors: Array<{
    position: number;
    title: string;
    url: string;
    snippet?: string;
  }>;
} {
  if (!results.items || results.items.length === 0) {
    return { position: 0, url: "", competitors: [] };
  }

  const normalizedTargetDomain = targetDomain
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "");

  let position = 0;
  let url = "";
  const competitors = [];

  for (let i = 0; i < results.items.length; i++) {
    const item = results.items[i];
    const normalizedLink = item.link
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "");

    // Add to competitors list
    competitors.push({
      position: i + 1,
      title: item.title,
      url: item.link,
      snippet: item.snippet,
    });

    // Check if this is the target domain
    if (normalizedLink.startsWith(normalizedTargetDomain)) {
      position = i + 1;
      url = item.link;
    }
  }

  return { position, url, competitors };
}
```

### Scheduled Tasks

```typescript
// src/utils/scheduledTasks.ts
import { SearchKeyword, SearchRanking } from "@/models";
import { searchGoogle, findPositionInResults } from "./googleSearchApi";
import { sendRankingChangeNotification } from "./emailService";
import dbConnect from "@/lib/db/mongoose";

export async function checkAllRankings(): Promise<{
  success: boolean;
  message: string;
  checkedCount: number;
  notificationsSent: number;
}> {
  await dbConnect();

  // Get all active keywords
  const keywords = await SearchKeyword.find({ isActive: true });

  if (keywords.length === 0) {
    return {
      success: true,
      message: "No active keywords to check",
      checkedCount: 0,
      notificationsSent: 0,
    };
  }

  let checkedCount = 0;
  let notificationsSent = 0;

  // Check each keyword
  for (const keyword of keywords) {
    try {
      // Search Google
      const results = await searchGoogle(keyword.keyword);

      // Find position in results
      const targetDomain = process.env.TARGET_DOMAIN || "";
      const { position, url, competitors } = findPositionInResults(
        results,
        targetDomain,
      );

      // Create new ranking
      const newRanking = await SearchRanking.create({
        keywordId: keyword._id,
        keyword: keyword.keyword,
        date: new Date(),
        position,
        url,
        competitors,
      });

      checkedCount++;

      // Check for significant changes
      const previousRankings = await SearchRanking.find({
        keywordId: keyword._id,
        _id: { $ne: newRanking._id },
      })
        .sort({ date: -1 })
        .limit(1);

      if (previousRankings.length > 0) {
        const previousRanking = previousRankings[0];
        const change = previousRanking.position - position; // Positive = improved, Negative = worsened

        // Send notification for significant changes (more than 3 positions)
        if (Math.abs(change) >= 3) {
          await sendRankingChangeNotification({
            keyword: keyword.keyword,
            previousPosition: previousRanking.position,
            currentPosition: position,
            change,
            date: new Date(),
            url,
          });

          notificationsSent++;
        }
      }
    } catch (error) {
      console.error(
        `Error checking ranking for keyword "${keyword.keyword}":`,
        error,
      );
    }
  }

  return {
    success: true,
    message: `Checked rankings for ${checkedCount} keywords`,
    checkedCount,
    notificationsSent,
  };
}
```

### Email Service

```typescript
// src/utils/emailService.ts
import { RankingChangeNotification } from "@/types/searchRanking";

export async function sendRankingChangeNotification(
  notification: RankingChangeNotification,
): Promise<boolean> {
  try {
    // Implementation depends on your email service provider
    // This could use SendGrid, Mailgun, AWS SES, etc.

    const subject =
      notification.change > 0
        ? `🎉 Ranking improved for "${notification.keyword}"`
        : `⚠️ Ranking dropped for "${notification.keyword}"`;

    const message = `
      <h1>${subject}</h1>
      <p>Keyword: <strong>${notification.keyword}</strong></p>
      <p>Previous position: ${notification.previousPosition}</p>
      <p>Current position: ${notification.currentPosition}</p>
      <p>Change: ${notification.change > 0 ? "+" + notification.change : notification.change}</p>
      <p>Date: ${notification.date.toLocaleDateString()}</p>
      <p>URL: <a href="${notification.url}">${notification.url}</a></p>
    `;

    // Send email logic here

    return true;
  } catch (error) {
    console.error("Error sending ranking change notification:", error);
    return false;
  }
}
```

## Navigation

The Search Rankings feature is integrated into the admin dashboard navigation via the Sidebar component. It includes:

- A "Search Rankings" item in the sidebar
- A "Competitors" item in the sidebar
- Navigation links between the Search Rankings and Competitors pages

## Initialization Script

A script is provided to add an initial keyword to the database:

```javascript
// scripts/add-initial-keyword.js
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
```

## Usage Instructions

### Managing Keywords

1. Navigate to Admin → Search Rankings
2. Use the Keyword Manager panel to:
   - Add new keywords to track
   - Select a keyword to view its ranking data
   - Toggle keywords active/inactive
   - Delete keywords you no longer want to track
   - Manually check rankings for a specific keyword

### Viewing Ranking Data

1. Select a keyword from the Keyword Manager
2. Choose a time period from the dropdown (Last 30 Days, Last 90 Days, Last Year, All Time)
3. View the ranking metrics at the top of the page
4. Examine the ranking history chart to see trends over time
5. Analyze competitors in the Competitor Analysis section

### Managing Competitors

1. Navigate to Admin → Competitors (or click "Manage Competitors" on the Search Rankings page)
2. Use the Competitor Manager to:
   - Add new competitors with their name, URL, and optional notes
   - Edit existing competitors
   - Toggle competitors active/inactive
   - Delete competitors you no longer want to track
3. Return to the Search Rankings page to select competitors in the analysis section

### Automated Ranking Checks

The system automatically checks rankings for all active keywords on a daily basis using the cron endpoint. This can be triggered by:

1. Setting up a cron job on your server
2. Using a service like Vercel Cron
3. Using a third-party service like Uptime Robot to ping the endpoint daily

### Email Notifications

The system sends email notifications for significant ranking changes (more than 3 positions up or down). To receive these notifications:

1. Ensure your email service is properly configured
2. Make sure the automated ranking checks are running
3. The system will automatically detect significant changes and send notifications

## Troubleshooting

### API Key Issues

If rankings are not being checked properly, verify:

- The GOOGLE_API_KEY is valid and has the Custom Search API enabled
- The GOOGLE_CX is correctly configured for your search engine
- The TARGET_DOMAIN is set to your website's domain

### Database Issues

If data is not being saved or retrieved:

- Check your MongoDB connection string
- Verify that the models are properly registered
- Check for any validation errors in the console logs

### UI Issues

If the UI is not displaying correctly:

- Check the browser console for JavaScript errors
- Verify that the API endpoints are returning the expected data
- Check that the components are receiving the correct props

## Future Enhancements

Potential enhancements for the Search Rankings feature:

1. **Advanced Filtering**: Add more filtering options for keywords and rankings
2. **Export Functionality**: Allow exporting ranking data to CSV or PDF
3. **Competitor Tracking Improvements**: Track specific pages on competitor sites
4. **Keyword Suggestions**: Integrate with a keyword suggestion API
5. **SEO Recommendations**: Provide actionable recommendations based on ranking data
6. **Mobile Rankings**: Track rankings specifically for mobile searches
7. **Local Rankings**: Track rankings for specific geographic locations
8. **Integration with Analytics**: Connect with Google Analytics for traffic correlation
