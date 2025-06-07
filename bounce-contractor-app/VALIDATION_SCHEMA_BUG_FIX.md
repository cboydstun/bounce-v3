# Validation Schema Bug Fix - Multiple Status Support

## Issue Description

**Problem**: The `/my-tasks` API endpoint was rejecting comma-separated status values due to Joi validation schema restrictions.

**Error**:

```
GET /api/tasks/my-tasks?status=Assigned,In+Progress 400 (Bad Request)
"status" must be one of [Assigned, In Progress, Completed, Cancelled]
```

## Root Cause Analysis

The issue was in the **Joi validation schema** in `api-server/src/routes/tasks.ts`. The `myTasksSchema` was only accepting single status values:

```typescript
// BEFORE (Broken)
const myTasksSchema = Joi.object({
  status: Joi.string()
    .valid("Assigned", "In Progress", "Completed", "Cancelled")
    .optional(),
  // ...
});
```

This validation was rejecting the comma-separated string `"Assigned,In Progress"` before it could reach the controller logic.

## Solution Implemented

Updated the validation schema to accept both single status values and comma-separated multiple status values:

```typescript
// AFTER (Fixed)
const myTasksSchema = Joi.object({
  status: Joi.alternatives()
    .try(
      // Single status value
      Joi.string().valid("Assigned", "In Progress", "Completed", "Cancelled"),
      // Comma-separated status values
      Joi.string().custom((value, helpers) => {
        const statuses = value.split(",").map((s: string) => s.trim());
        const validStatuses = [
          "Assigned",
          "In Progress",
          "Completed",
          "Cancelled",
        ];
        const invalidStatuses = statuses.filter(
          (s: string) => !validStatuses.includes(s),
        );

        if (invalidStatuses.length > 0) {
          return helpers.error("any.invalid", {
            value,
            invalidStatuses,
            validStatuses,
          });
        }

        return value;
      }, "comma-separated statuses"),
    )
    .optional(),
  // ...
});
```

## Technical Details

### Validation Flow

1. **Single Status**: `status=Assigned` → Passes first validation rule
2. **Multiple Status**: `status=Assigned,In Progress` → Passes custom validation rule
3. **Invalid Status**: `status=Invalid,Assigned` → Returns detailed error with invalid values

### Custom Validation Logic

- Splits comma-separated string into individual status values
- Trims whitespace from each status
- Validates each status against allowed values
- Returns detailed error if any invalid statuses found
- Maintains backward compatibility with single status requests

### Error Handling

The custom validator provides detailed error information:

```typescript
return helpers.error("any.invalid", {
  value,
  invalidStatuses,
  validStatuses,
});
```

## Files Modified

```
api-server/src/routes/tasks.ts
- Updated myTasksSchema to support comma-separated status values
- Added custom Joi validation for multiple statuses
- Maintained backward compatibility for single status
```

## Testing Scenarios

### Valid Requests

✅ `GET /api/tasks/my-tasks?status=Assigned`
✅ `GET /api/tasks/my-tasks?status=Assigned,In Progress`
✅ `GET /api/tasks/my-tasks?status=Assigned,In Progress,Completed`
✅ `GET /api/tasks/my-tasks` (no status parameter)

### Invalid Requests

❌ `GET /api/tasks/my-tasks?status=Invalid`
❌ `GET /api/tasks/my-tasks?status=Assigned,Invalid`
❌ `GET /api/tasks/my-tasks?status=Invalid,In Progress`

## Complete Fix Chain

This fix completes the multi-layer solution for task visibility:

### 1. Frontend (useTasks.ts)

```typescript
// Send multiple statuses as comma-separated string
const apiStatuses = filters.status.map((status) => convertStatusForAPI(status));
params.status = apiStatuses.join(",");
```

### 2. Validation (routes/tasks.ts) - **THIS FIX**

```typescript
// Accept both single and comma-separated status values
status: Joi.alternatives().try(
  Joi.string().valid(...validStatuses),
  Joi.string().custom(validateCommaSeparatedStatuses),
);
```

### 3. Controller (taskController.ts)

```typescript
// Parse comma-separated statuses into array
const requestedStatuses = status.split(",").map((s) => s.trim());
filters.status = requestedStatuses;
```

### 4. Service (taskService.ts)

```typescript
// Handle array of statuses in MongoDB query
if (Array.isArray(status)) {
  query.status = { $in: status };
} else {
  query.status = status;
}
```

## Deployment Requirements

### Server Restart Required

The API server needs to be restarted to apply the validation schema changes:

```bash
# Development
npm run dev

# Production
pm2 restart bounce-mobile-api
# or
docker restart bounce-api
```

### No Database Changes

This fix only affects validation logic - no database schema changes required.

### No Breaking Changes

The fix maintains full backward compatibility with existing single status requests.

## Verification Steps

1. **Start API server** with updated validation schema
2. **Test single status**: `GET /my-tasks?status=Assigned`
3. **Test multiple status**: `GET /my-tasks?status=Assigned,In Progress`
4. **Verify frontend**: Check that "Active" tab shows both assigned and in-progress tasks
5. **Test error cases**: Verify invalid status values are properly rejected

## Performance Impact

- **Minimal**: Added string parsing for comma-separated values
- **Validation**: Slightly more complex validation logic
- **Memory**: No significant memory impact
- **Database**: No impact on database queries

## Future Enhancements

1. **Array Parameter Support**: Consider supporting array query parameters (`?status[]=Assigned&status[]=In Progress`)
2. **Case Insensitive**: Make status matching case-insensitive
3. **Validation Caching**: Cache validation results for repeated requests
4. **OpenAPI Documentation**: Update API documentation to reflect multiple status support

## Conclusion

This fix resolves the validation layer issue that was preventing the multi-status task filtering from working. Combined with the previous controller and service layer fixes, contractors can now see their tasks properly organized:

- ✅ **Active Tab**: Shows both "assigned" and "in_progress" tasks
- ✅ **Completed Tab**: Shows "completed" tasks
- ✅ **All Tab**: Shows all contractor tasks

The validation schema now properly supports the comma-separated status format while maintaining backward compatibility with single status requests.
