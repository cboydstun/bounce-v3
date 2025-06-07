# Task Status Update Bug Fix

## Problem Description

The contractor app was experiencing a 400 error when trying to update task status via the "Start Task" button. The error occurred when making a PUT request to `/api/tasks/{taskId}/status`.

### Error Details

```
PUT https://api.slowbill.xyz/api/tasks/6837f9e…/status
Failed to update task status:
{
    "code": "UNKNOWN_ERROR",
    "message": "Request failed with status code 400",
    "statusCode": 0
}
```

## Root Cause Analysis

The issue was a **status value mismatch** between the mobile app and the API server:

### Mobile App Side

- Sends status: `"in_progress"` (lowercase with underscore)
- Uses mobile-friendly status format

### API Server Side

- Expects status: `"In Progress"` (title case with space)
- Valid statuses: `["Assigned", "In Progress", "Completed", "Cancelled"]`
- Uses CRM system format

### The Problem

When the "Start Task" button was clicked, the mobile app sent:

```json
{
  "status": "in_progress",
  "timestamp": "2025-01-06T..."
}
```

But the API validation schema only accepted:

```javascript
status: Joi.string().valid("Assigned", "In Progress", "Completed", "Cancelled");
```

This caused a 400 validation error because `"in_progress"` was not in the allowed list.

## Solution Implementation

### 1. Status Mapping Functions

Added status mapping functions in `useTaskActions.ts`:

```typescript
// Status mapping from mobile app format to API server format
const mapMobileStatusToApiStatus = (mobileStatus: TaskStatus): string => {
  const statusMap: Record<TaskStatus, string> = {
    draft: "Pending",
    published: "Pending",
    assigned: "Assigned",
    accepted: "Assigned",
    in_progress: "In Progress",
    en_route: "In Progress",
    on_site: "In Progress",
    completed: "Completed",
    cancelled: "Cancelled",
    failed: "Cancelled",
  };

  return statusMap[mobileStatus] || mobileStatus;
};

// Status mapping from API server format to mobile app format
const mapApiStatusToMobileStatus = (apiStatus: string): TaskStatus => {
  const statusMap: Record<string, TaskStatus> = {
    Pending: "published",
    Assigned: "assigned",
    "In Progress": "in_progress",
    Completed: "completed",
    Cancelled: "cancelled",
  };

  return (
    statusMap[apiStatus] ||
    (apiStatus.toLowerCase().replace(" ", "_") as TaskStatus)
  );
};
```

### 2. Updated useUpdateTaskStatus Hook

Modified the mutation function to map mobile status to API status:

```typescript
// If online, execute immediately
// Map mobile app status to API server status format
const apiStatus = mapMobileStatusToApiStatus(statusUpdate.status);

const response: ApiResponse<Task> = await apiClient.put(
  `/tasks/${statusUpdate.taskId}/status`,
  {
    status: apiStatus,
    location: statusUpdate.location,
    notes: statusUpdate.notes,
    photos: statusUpdate.photos,
    timestamp: statusUpdate.timestamp,
  },
);
```

### 3. Updated Offline Queue

Also applied status mapping for offline queue operations:

```typescript
// If offline, queue the action
if (!isOnline) {
  // Map mobile app status to API server status format for offline queue
  const apiStatus = mapMobileStatusToApiStatus(statusUpdate.status);

  const actionId = await queueAction({
    type: "task_status_update",
    payload: {
      taskId: statusUpdate.taskId,
      status: apiStatus,
      // ... other fields
    },
    // ... other options
  });
}
```

### 4. Enhanced Error Handling

Improved error handling in `TaskDetails.tsx`:

```typescript
const handleStartTask = async () => {
  try {
    await updateStatusMutation.mutateAsync({
      taskId: id,
      status: "in_progress",
      timestamp: new Date().toISOString(),
    });
    setToastMessage("Task started successfully!");
    setShowToast(true);
  } catch (error) {
    console.error("Failed to start task:", error);
    setToastMessage(
      error instanceof Error
        ? `Failed to start task: ${error.message}`
        : "Failed to start task. Please try again.",
    );
    setShowToast(true);
  }
};
```

## Files Modified

1. **`bounce-contractor-app/src/hooks/tasks/useTaskActions.ts`**

   - Added status mapping functions
   - Updated `useUpdateTaskStatus` hook to use status mapping
   - Updated offline queue to use mapped status

2. **`bounce-contractor-app/src/pages/tasks/TaskDetails.tsx`**
   - Enhanced error handling for task claiming and status updates
   - Improved user feedback with detailed error messages

## Status Mapping Reference

| Mobile App Status | API Server Status |
| ----------------- | ----------------- |
| `draft`           | `Pending`         |
| `published`       | `Pending`         |
| `assigned`        | `Assigned`        |
| `accepted`        | `Assigned`        |
| `in_progress`     | `In Progress`     |
| `en_route`        | `In Progress`     |
| `on_site`         | `In Progress`     |
| `completed`       | `Completed`       |
| `cancelled`       | `Cancelled`       |
| `failed`          | `Cancelled`       |

## Testing

To test the fix:

1. **Claim a Task**: Navigate to available tasks and claim one
2. **Start Task**: Go to task details and click "Start Task"
3. **Verify Status Update**: Check that the task status updates to "in_progress" in the UI
4. **Check API**: Verify the API receives "In Progress" status
5. **Test Offline**: Test the same flow while offline to ensure offline queue works

## Benefits

1. **Backward Compatibility**: API server maintains CRM system format
2. **Mobile App Flexibility**: Mobile app can use user-friendly status names
3. **Offline Support**: Status mapping works for both online and offline operations
4. **Error Handling**: Better user feedback when operations fail
5. **Maintainability**: Clear separation between mobile and API status formats

## Future Considerations

1. **Centralized Mapping**: Consider moving status mapping to a shared utility
2. **Type Safety**: Ensure TypeScript types are updated if new statuses are added
3. **Documentation**: Keep status mapping documentation updated
4. **Testing**: Add unit tests for status mapping functions
