# Search Rankings Job Queue Migration Guide

## Overview

This migration replaces the batch processing system with a job queue system to solve the 504 timeout issues on Vercel's hobby tier (60-second limit).

## What Changed

### Before (Batch System)

- Processed 6 keywords per batch
- Each batch could take 60+ seconds
- Frequent timeouts due to rate limiting and delays
- Complex batch state management

### After (Job Queue System)

- Processes 1 keyword per job
- Each job completes in ~30-45 seconds
- No timeouts - guaranteed to finish within 60 seconds
- Simple job-based queue management

## New Architecture

### Database Changes

- **New Model**: `RankingJob` - stores individual keyword processing jobs
- **Old Model**: `RankingBatch` - can be removed after migration

### API Changes

- **Same endpoint**: `/api/v1/search-rankings/cron`
- **New actions**:
  - `create` - Creates jobs for all active keywords (completes in <5 seconds)
  - `process` - Processes one job (completes in <60 seconds)
  - `status` - Gets queue status
  - `reset` - Resets stuck jobs

### Processing Flow

1. **Daily Job Creation** (8 AM CT): Creates all jobs instantly
2. **Frequent Processing** (every 2 minutes): Processes one job at a time
3. **Automatic Retry**: Failed jobs retry with exponential backoff
4. **Progress Tracking**: Real-time queue status

## Migration Steps

### 1. Deploy the New Code

The new system is backward compatible and can be deployed immediately.

### 2. Update Vercel Cron Jobs

**Current Cron Jobs** (update these):

```
# Daily batch creation (8 AM CT)
0 13 * * * -> /api/v1/search-rankings/cron?action=create

# Batch processing (every 10 minutes)
*/10 * * * * -> /api/v1/search-rankings/cron?action=process
```

**New Cron Jobs** (recommended):

```
# Daily job creation (8 AM CT) - same as before
0 13 * * * -> /api/v1/search-rankings/cron?action=create

# Job processing (every 2 minutes) - more frequent
*/2 * * * * -> /api/v1/search-rankings/cron?action=process

# Optional: Reset stuck jobs (daily at 9 AM CT)
0 14 * * * -> /api/v1/search-rankings/cron?action=reset
```

### 3. Test the System

Run the test script to verify everything works:

```bash
node scripts/test-job-queue.js
```

### 4. Monitor the Migration

Check the admin panel to monitor:

- Job creation success
- Processing progress
- Queue status
- Any failed jobs

## Benefits

### ✅ Solved Issues

- **No more 504 timeouts** - Each job completes in <60 seconds
- **Reliable processing** - Jobs retry automatically on failure
- **Better monitoring** - Real-time queue status
- **Fault tolerance** - Stuck jobs can be reset

### ✅ Maintained Features

- **Full search depth** - Still searches up to 50 positions
- **Significant change notifications** - Email alerts still work
- **Same data structure** - SearchRanking model unchanged
- **Admin interface compatibility** - Existing UI still works

### ✅ Performance Improvements

- **Faster job creation** - All jobs created in <5 seconds
- **More frequent processing** - Jobs processed every 2 minutes vs 10 minutes
- **Better resource utilization** - No wasted time on delays between keywords

## Processing Speed Comparison

### Old System (Batch)

- 6 keywords per batch, every 10 minutes
- Theoretical: 36 keywords/hour
- Reality: Often failed due to timeouts

### New System (Job Queue)

- 1 keyword per job, every 2 minutes
- Actual: 30 keywords/hour
- Reality: Reliable completion, no timeouts

**Result**: More consistent processing with guaranteed completion.

## Troubleshooting

### Common Issues

**1. Jobs not being created**

- Check if keywords exist: `SearchKeyword.find({ isActive: true })`
- Verify database connection
- Check logs for creation errors

**2. Jobs not being processed**

- Verify cron job is running every 2 minutes
- Check for stuck jobs: `/api/v1/search-rankings/cron?action=reset`
- Monitor queue status: `/api/v1/search-rankings/cron?action=status`

**3. Jobs failing repeatedly**

- Check Google API credentials
- Verify TARGET_DOMAIN environment variable
- Review error messages in job records

### Monitoring Commands

```bash
# Test job creation
curl "https://your-domain.com/api/v1/search-rankings/cron?action=create"

# Test job processing
curl "https://your-domain.com/api/v1/search-rankings/cron?action=process"

# Check queue status
curl "https://your-domain.com/api/v1/search-rankings/cron?action=status"

# Reset stuck jobs
curl "https://your-domain.com/api/v1/search-rankings/cron?action=reset"
```

## Rollback Plan

If issues arise, you can temporarily rollback:

1. **Revert cron jobs** to old batch system
2. **Keep new code** - it's backward compatible
3. **Use old endpoints** until issues are resolved

The old batch processor is still available in `src/utils/batchProcessor.ts`.

## Cleanup (After Successful Migration)

After 1-2 weeks of successful operation:

1. **Remove old batch records**:

   ```javascript
   // In MongoDB
   db.rankingbatches.deleteMany({});
   ```

2. **Remove old batch processor** (optional):

   - Delete `src/utils/batchProcessor.ts`
   - Remove `RankingBatch` model references

3. **Update admin UI** to show job queue status instead of batch status

## Support

If you encounter issues during migration:

1. Check the test script output: `node scripts/test-job-queue.js`
2. Review Vercel function logs
3. Monitor the admin panel for queue status
4. Check database for job records and their status

The new system is designed to be more reliable and easier to debug than the previous batch system.
