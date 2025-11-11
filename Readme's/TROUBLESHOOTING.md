# Troubleshooting Guide

## Common Issues & Solutions

### 1. "Cannot find module 'dotenv'" or similar

**Solution:**

```bash
npm install
```

### 2. "MongoDB connection failed"

**Possible causes:**

**A. Wrong connection string**

- Check `.env.local` has correct `MONGODB_URI`
- Format: `mongodb+srv://username:password@cluster.xxxxx.mongodb.net/hospital_tasks?retryWrites=true&w=majority`

**B. IP not whitelisted**

- Go to MongoDB Atlas → Network Access
- Add your IP or use "Allow Access from Anywhere" (for development)

**C. Wrong credentials**

- Verify username and password in connection string
- Check Database Access in Atlas

**Test your connection:**

```bash
npm run test-db
```

### 3. "Conflicting app and page file"

**Solution:**

```bash
# Windows PowerShell
Remove-Item -Recurse -Force app
Remove-Item -Recurse -Force .next

# Mac/Linux
rm -rf app
rm -rf .next

# Then restart
npm run dev
```

### 4. "Port 3000 already in use"

**Solution A - Kill the process:**

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

**Solution B - Use different port:**

```bash
# Windows PowerShell
$env:PORT=3001; npm run dev

# Mac/Linux
PORT=3001 npm run dev
```

### 5. Tailwind CSS / PostCSS errors

**Solution:**

```bash
# Clear cache
Remove-Item -Recurse -Force .next

# Reinstall
npm install

# Restart
npm run dev
```

### 6. "Build Error" or compilation issues

**Solution:**

```bash
# 1. Clear everything
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json

# 2. Reinstall
npm install

# 3. Restart
npm run dev
```

### 7. Worker not archiving tasks

**Check:**

1. Worker is running: `npm run worker`
2. MongoDB connection successful
3. Tasks have `due_at_utc` in the past
4. Check worker terminal for errors

**Test manually:**

```bash
# In worker terminal, you should see:
Running archive-tasks job...
Found X tasks to archive
```

### 8. Login not working

**Check:**

1. Database is seeded: `npm run seed`
2. Using correct credentials:
   - admin@hospital.com / password123
3. Check browser console for errors
4. Check API response in Network tab

### 9. Offline sync not working

**Check:**

1. Service worker registered (check browser DevTools → Application → Service Workers)
2. IndexedDB enabled in browser
3. Check browser console for errors

**Test:**

1. Open app
2. Open DevTools → Network → Set to "Offline"
3. Submit a task
4. Should see "Pending sync" indicator
5. Go back online
6. Should sync automatically

### 10. "Fast Refresh had to perform a full reload"

This is usually harmless but if it persists:

**Solution:**

```bash
# Clear cache
Remove-Item -Recurse -Force .next

# Restart
npm run dev
```

### 11. Seed script fails

**Common causes:**

**A. MongoDB not connected**

```bash
# Test connection first
npm run test-db
```

**B. Database already seeded**

```bash
# Seed script clears existing data
# Just run it again
npm run seed
```

### 12. API returns 401 Unauthorized

**Causes:**

1. Not logged in
2. Token expired (refresh page)
3. Wrong token in localStorage

**Solution:**

```bash
# Clear localStorage and login again
# In browser console:
localStorage.clear()
# Then login again
```

### 13. API returns 403 Forbidden

**Cause:** Insufficient permissions

**Solution:**

- Use admin account for admin features
- Login with: admin@hospital.com / password123

### 14. Tasks not showing up

**Check:**

1. Logged in with correct user
2. Tasks assigned to your department
3. Toggle "Show archived" if looking for old tasks
4. Check browser console for errors

### 15. Points not calculating correctly

**Check:**

1. Settings configured correctly (Admin → Settings)
2. Default rounding policy: 50% for partial
3. Check submission in database

### 16. Audit logs empty

**Cause:** No actions performed yet

**Solution:**

- Create a task
- Submit a task
- Update settings
- Check audit logs again

## Still Having Issues?

### Debug Steps:

1. **Check all terminals:**
   - Terminal 1: `npm run dev` (should show "Ready")
   - Terminal 2: `npm run worker` (should show "Agenda started")

2. **Check browser console:**
   - Open DevTools (F12)
   - Look for errors in Console tab
   - Check Network tab for failed requests

3. **Check environment variables:**

   ```bash
   # Verify .env.local exists and has:
   MONGODB_URI=mongodb+srv://...
   JWT_SECRET=...
   ```

4. **Test database connection:**

   ```bash
   npm run test-db
   ```

5. **Verify installation:**

   ```bash
   node --version  # Should be 18+
   npm --version
   ```

6. **Clean install:**
   ```bash
   Remove-Item -Recurse -Force node_modules
   Remove-Item -Recurse -Force .next
   Remove-Item package-lock.json
   npm install
   npm run dev
   ```

## Getting Help

If you're still stuck:

1. Check the error message carefully
2. Search for the error in this guide
3. Review the relevant documentation:
   - **START_HERE.md** - Setup guide
   - **SETUP_ATLAS.md** - MongoDB Atlas
   - **README.md** - Full documentation

## Quick Reset

Start fresh:

```bash
# 1. Stop all running processes (Ctrl+C)

# 2. Clean everything
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json

# 3. Reinstall
npm install

# 4. Test connection
npm run test-db

# 5. Seed database
npm run seed

# 6. Start app
npm run dev

# 7. Start worker (new terminal)
npm run worker
```

Good luck! 🚀
