# KeywordManager "Last Checked" Bug Fix

## Problem Summary

The KeywordManager component was displaying incorrect dates in the "Last Checked" column. It was showing the `SearchKeyword.updatedAt` field (when the keyword record was last modified) instead of the actual date when rankings were last checked.

**Example Issue:**

- "bounce house rentals in san antonio" showed June 30th in the keyword manager
- But the ranking history had data for July 20th (the actual last check date)

## Root Cause

The component was using `keyword.updatedAt` which represents when the keyword record was last modified, not when rankings were actually checked. The actual last ranking check date comes from the most recent `SearchRanking.date` for each keyword.

## Solution Implemented

### 1. Updated KeywordManager Props

Added a new optional prop to pass the actual last ranking dates:

```typescript
interface KeywordManagerProps {
  // ... existing props
  lastRankingDates?: Record<string, Date>; // keywordId -> most recent ranking date
}
```

### 2. Updated Display Logic

The component now displays the actual last ranking check date:

```typescript
<td className="px-4 py-4 text-sm text-gray-500">
  {lastRankingDates && lastRankingDates[keyword._id]
    ? formatDate(lastRankingDates[keyword._id])
    : 'Never checked'
  }
</td>
```

### 3. Updated Sorting Logic

Fixed the sorting to use actual last ranking dates when sorting by "Last Checked":

```typescript
} else if (sortField === 'lastChecked') {
  // Use the actual last ranking dates for sorting
  aValue = lastRankingDates?.[a._id] || new Date(0); // Use epoch if never checked
  bValue = lastRankingDates?.[b._id] || new Date(0);
}
```

### 4. Updated Table Header

Fixed the table header to use the correct sort field:

```typescript
<th
  className="..."
  onClick={() => handleSort('lastChecked')}
>
  Last Checked {sortField === 'lastChecked' && (sortDirection === 'asc' ? '↑' : '↓')}
</th>
```

## Parent Component Implementation

The parent component needs to fetch and provide the last ranking dates. Here's how to implement it:

### Step 1: Fetch Last Ranking Dates

```typescript
// In the parent component
const [lastRankingDates, setLastRankingDates] = useState<Record<string, Date>>(
  {},
);

useEffect(() => {
  const fetchLastRankingDates = async () => {
    try {
      // Use the existing SearchRanking.findLatestRankings() method
      const latestRankings = await SearchRanking.findLatestRankings();

      // Create a map of keywordId -> most recent ranking date
      const dateMap: Record<string, Date> = {};
      latestRankings.forEach((ranking) => {
        dateMap[ranking.keywordId.toString()] = ranking.date;
      });

      setLastRankingDates(dateMap);
    } catch (error) {
      console.error("Failed to fetch last ranking dates:", error);
    }
  };

  fetchLastRankingDates();
}, [keywords]); // Refetch when keywords change
```

### Step 2: Pass to KeywordManager

```typescript
<KeywordManager
  keywords={keywords}
  selectedKeywordId={selectedKeywordId}
  onSelectKeyword={setSelectedKeywordId}
  onAddKeyword={handleAddKeyword}
  onDeleteKeyword={handleDeleteKeyword}
  onToggleKeyword={handleToggleKeyword}
  onCheckRanking={handleCheckRanking}
  onBulkCheckRanking={handleBulkCheckRanking}
  isCheckingRanking={isCheckingRanking}
  queueStatus={queueStatus}
  lastRankingDates={lastRankingDates} // Add this prop
/>
```

## Alternative Implementation (API Endpoint)

If you prefer to fetch the data via API endpoint:

### Create API Endpoint

```typescript
// src/app/api/v1/search-rankings/latest/route.ts
import { NextResponse } from "next/server";
import SearchRanking from "@/models/SearchRanking";
import dbConnect from "@/lib/db/mongoose";

export async function GET() {
  try {
    await dbConnect();

    const latestRankings = await SearchRanking.findLatestRankings();

    // Create a map of keywordId -> most recent ranking date
    const lastRankingDates: Record<string, string> = {};
    latestRankings.forEach((ranking) => {
      lastRankingDates[ranking.keywordId.toString()] =
        ranking.date.toISOString();
    });

    return NextResponse.json({ lastRankingDates });
  } catch (error) {
    console.error("Error fetching latest rankings:", error);
    return NextResponse.json(
      { error: "Failed to fetch latest rankings" },
      { status: 500 },
    );
  }
}
```

### Use in Parent Component

```typescript
useEffect(() => {
  const fetchLastRankingDates = async () => {
    try {
      const response = await fetch("/api/v1/search-rankings/latest");
      const data = await response.json();

      // Convert ISO strings back to Date objects
      const dateMap: Record<string, Date> = {};
      Object.entries(data.lastRankingDates).forEach(([keywordId, dateStr]) => {
        dateMap[keywordId] = new Date(dateStr as string);
      });

      setLastRankingDates(dateMap);
    } catch (error) {
      console.error("Failed to fetch last ranking dates:", error);
    }
  };

  fetchLastRankingDates();
}, [keywords]);
```

## Benefits of This Fix

1. **Accurate Information**: Shows actual last ranking check dates instead of keyword modification dates
2. **Better User Experience**: Users can see which keywords need to be checked
3. **Proper Sorting**: Can sort by actual last check date to prioritize stale keywords
4. **Backward Compatible**: The `lastRankingDates` prop is optional, so existing implementations won't break

## Data Flow

1. **SearchRanking.date**: When a ranking check is performed, this field stores the actual check date
2. **SearchRanking.findLatestRankings()**: Aggregates to get the most recent ranking for each keyword
3. **Parent Component**: Fetches this data and creates a map of keywordId → last check date
4. **KeywordManager**: Displays the actual last check date or "Never checked"

## Testing

To verify the fix works:

1. Check a keyword's ranking (this creates a new SearchRanking record with today's date)
2. The KeywordManager should now show today's date in the "Last Checked" column
3. Sort by "Last Checked" to verify sorting works correctly
4. Keywords that have never been checked should show "Never checked"

## Migration Notes

- **Existing Code**: Will continue to work (shows "Never checked" for all keywords)
- **New Implementation**: Requires adding the `lastRankingDates` prop to show actual dates
- **Performance**: The `SearchRanking.findLatestRankings()` method uses MongoDB aggregation for efficiency

This fix ensures that the KeywordManager component displays accurate and useful information about when keywords were actually last checked for rankings.
