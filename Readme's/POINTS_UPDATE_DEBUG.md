# Points Update Debugging Guide

## Issue
Points are not updating when submission status changes from partial/not_started to completed.

## What Was Fixed

### 1. Fixed Response Bug in Submit API
**File**: `my-app/pages/api/tasks/[id]/submit.js`

Changed:
```javascript
return res.status(200).json({
  submission: submission[0],  // ❌ Wrong - submission is not an array when updating
  ...
});
```

To:
```javascript
return res.status(200).json({
  submission,  // ✅ Correct - submission is the object itself
  ...
});
```

### 2. Added Debug Logging
Added console.log statements to track the update process:
- Old status and points
- New status and points
- Task default points
- Saved submission data

## How to Debug

### Step 1: Check Browser Console
1. Open browser DevTools (F12)
2. Go to Network tab
3. Submit a task with status change
4. Look for the POST request to `/api/tasks/[id]/submit`
5. Check the response - verify `submission.points_awarded` matches expected value

### Step 2: Check Server Logs
When you submit a task, you should see logs like:
```
Updating submission: {
  submissionId: '...',
  oldStatus: 'partial',
  oldPoints: 50,
  newStatus: 'completed',
  newPoints: 100,
  taskDefaultPoints: 100
}
Submission saved: {
  submissionId: '...',
  status: 'completed',
  points_awarded: 100
}
```

### Step 3: Verify Database
Check MongoDB directly:
```javascript
// In MongoDB shell or Compass
db.tasksubmissions.find({ user_id: ObjectId("YOUR_USER_ID") })
```

Look for:
- `status` field matches what you submitted
- `points_awarded` matches the expected calculation

### Step 4: Test Points Calculation
Run the test script:
```bash
cd my-app
node test-points-update.js
```

This verifies the calculation logic is correct.

## Expected Behavior

### Points Calculation Rules
- **Completed**: Full points (e.g., 100 points)
- **Partial**: Half points rounded up (e.g., 50 points for 100 default)
- **Not Started**: 0 points

### Status Change Examples
1. **Partial → Completed**: 50 → 100 points (+50)
2. **Not Started → Completed**: 0 → 100 points (+100)
3. **Not Started → Partial**: 0 → 50 points (+50)
4. **Completed → Partial**: 100 → 50 points (-50)

## Common Issues

### Issue 1: Points Not Updating in UI
**Symptom**: Database shows correct points, but UI shows old points

**Solution**: 
- Clear browser cache
- Hard refresh (Ctrl+Shift+R)
- Check if the page is refetching data after submission

### Issue 2: Points Calculation Wrong
**Symptom**: Points don't match expected values

**Check**:
1. Rounding policy in Settings
2. Task default_points value
3. Run test-points-update.js to verify logic

### Issue 3: Submission Not Saving
**Symptom**: No changes in database

**Check**:
1. Server logs for errors
2. MongoDB connection
3. User authentication token
4. Transaction errors

## Verification Checklist

- [ ] Browser shows correct points in response
- [ ] Server logs show correct calculation
- [ ] Database has updated points_awarded
- [ ] UI refreshes and shows new points
- [ ] Total points in dashboard updates
- [ ] Percentage calculation updates

## Testing Steps

1. **Create a test task** with 100 default points
2. **Submit as "Not Started"** → Should show 0 points
3. **Resubmit as "Partial"** → Should show 50 points
4. **Resubmit as "Completed"** → Should show 100 points
5. **Check dashboard** → Total points should be 100

## Files Modified

1. `my-app/pages/api/tasks/[id]/submit.js` - Fixed response and added logging
2. `my-app/test-points-update.js` - Created test script
3. `my-app/POINTS_UPDATE_DEBUG.md` - This guide

## Next Steps If Still Not Working

1. Share the server logs from a submission
2. Share the network response from browser DevTools
3. Share a screenshot of the MongoDB document
4. Check if there are any middleware or hooks modifying the data
