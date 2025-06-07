# Task Visibility Bug Fix - "My Tasks" Missing In-Progress Tasks

## Issue Description

**Problem**: Tasks disappeared from the "My Tasks" view after clicking "Start Task". Contractors could not see their active/in-progress tasks.

**User Report**: "BUG! where can I see tasks that have been started? They disappear after I click 'Start Task'"

## Root Cause Analysis

The issue was caused by **incomplete status filtering** in the task retrieval system:

### 1. Frontend Issue (useMyTasks Hook)

**Location**: `bounce-contractor-app/src/hooks/tasks/useTasks.ts`

**Problem**: The hook was only sending the **first status** from the status array instead of all statuses.

```typescript
// BEFORE (Broken)
if (filters?.status) {
  // Only sent first status - ignored "in_progress" when ["assigned", "in_progress"] was passed
  params.status = convertStatusForAPI(filters.status[0]);
}

// AFTER (Fixed)
if (filters?.status && filters.status.length > 0) {
  // Convert all statuses and send as comma-separated string
  const apiStatuses = filters.status.map((status) =>
    convertStatusForAPI(status),
  );
  params.status = apiStatuses.join(",");
}
```

### 2. Backend Controller Issue

**Location**: `api-server/src/controllers/taskController.ts`

**Problem**: The `/api/tasks/my-tasks` endpoint only accepted single status values, not comma-separated multiple statuses.

```typescript
// BEFORE (Broken)
if (status && typeof status === "string") {
  if (validStatuses.includes(status)) {
    filters.status = status; // Single status only
  }
}

// AFTER (Fixed)
if (status && typeof status === "string") {
  // Handle comma-separated statuses
  const requestedStatuses = status.split(",").map((s) => s.trim());
  const invalidStatuses = requestedStatuses.filter(
    (s) => !validStatuses.includes(s),
  );

  if (invalidStatuses.length > 0) {
    return res.status(400).json({ error: "Invalid status value(s)" });
  }

  filters.status = requestedStatuses; // Multiple statuses array
}
```

### 3. Backend Service Issue

**Location**: `api-server/src/services/taskService.ts`

**Problem**: The service layer didn't handle multiple statuses in MongoDB queries.

```typescript
// BEFORE (Broken)
if (status) {
  query.status = status; // Single status only
}

// AFTER (Fixed)
if (status) {
  if (Array.isArray(status)) {
    query.status = { $in: status }; // MongoDB $in operator for multiple values
  } else {
    query.status = status; // Single status (backward compatibility)
  }
}
```

## The Complete Flow

### UI Layer (MyTasks.tsx)

The "Active" tab correctly defines the filter:

```typescript
case "active":
  return {
    status: ["assigned", "in_progress"], // Both statuses needed
  };
```

### API Request Flow

1. **Frontend**: `["assigned", "in_progress"]` → `"Assigned,In Progress"`
2. **Controller**: `"Assigned,In Progress"` → `["Assigned", "In Progress"]`
3. **Service**: `["Assigned", "In Progress"]` → `{ status: { $in: ["Assigned", "In Progress"] } }`
4. **MongoDB**: Returns tasks with either status

## Status Mapping

### Mobile App ↔ API Server

- `"assigned"` ↔ `"Assigned"`
- `"in_progress"` ↔ `"In Progress"`
- `"completed"` ↔ `"Completed"`

## Files Modified

### Frontend Changes

```
bounce-contractor-app/src/hooks/tasks/useTasks.ts
- Fixed useMyTasks hook to send all statuses as comma-separated string
- Updated status conversion logic
```

### Backend Changes

```
api-server/src/controllers/taskController.ts
- Updated getMyTasks to handle comma-separated statuses
- Added validation for multiple status values

api-server/src/services/taskService.ts
- Updated TaskFilters interface: status?: string | string[]
- Modified getContractorTasks to use MongoDB $in operator for multiple statuses
```

## Testing Scenarios

### Before Fix

1. ✅ Claim task → Task appears in "My Tasks" (status: "assigned")
2. ❌ Start task → Task disappears from "My Tasks" (status: "in_progress" not included)
3. ❌ No way to see active tasks

### After Fix

1. ✅ Claim task → Task appears in "My Tasks" Active tab (status: "assigned")
2. ✅ Start task → Task remains in "My Tasks" Active tab (status: "in_progress")
3. ✅ Complete task → Task moves to "Completed" tab (status: "completed")

## Task Organization

The "My Tasks" page now properly organizes tasks:

### Active Tab

- **Assigned tasks**: Ready to start
- **In-progress tasks**: Currently being worked on

### Completed Tab

- **Completed tasks**: Finished tasks

### All Tab

- **All contractor tasks**: Regardless of status

## Error Handling

Added comprehensive validation:

- Invalid status values return 400 error with details
- Backward compatibility for single status requests
- Proper error messages for debugging

## Performance Impact

- **Minimal**: Added string splitting and array operations
- **Database**: Uses efficient MongoDB `$in` operator
- **Caching**: React Query cache properly invalidated

## Future Enhancements

1. **Real-time Updates**: Tasks automatically move between tabs when status changes
2. **Status Indicators**: Visual indicators for task progress
3. **Filtering**: Additional filters within each tab
4. **Sorting**: Sort by priority, date, or payment amount

## Conclusion

The fix ensures contractors can always see their tasks regardless of status:

- ✅ **Assigned tasks**: Visible and ready to start
- ✅ **In-progress tasks**: Visible and accessible for completion
- ✅ **Completed tasks**: Properly archived in completed section

This resolves the critical UX issue where contractors lost track of their active work.
