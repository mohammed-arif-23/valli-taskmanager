# Quick Start Guide

Get the Hospital Task Manager running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- MongoDB Atlas account (free) - [Sign up here](https://www.mongodb.com/cloud/atlas)

## Step 1: Install Dependencies

```bash
cd my-app
npm install
```

## Step 2: Set Up MongoDB Atlas

Follow the detailed guide in **SETUP_ATLAS.md** or quick steps:

1. Create free cluster at MongoDB Atlas
2. Create database user
3. Whitelist your IP (or allow all for dev)
4. Copy connection string
5. Update `.env.local`:

```bash
MONGODB_URI=mongodb+srv://username:password@cluster.xxxxx.mongodb.net/hospital_tasks?retryWrites=true&w=majority
```

## Step 3: Test Connection

```bash
npm run test-db
```

You should see: ✅ MongoDB connected successfully!

## Step 4: Seed Database

```bash
npm run seed
```

This creates:
- 5 sample users
- 4 departments  
- 5 sample tasks
- Default settings

## Step 5: Start the Application

**Terminal 1** - Start the web app:
```bash
npm run dev
```

**Terminal 2** - Start the background worker:
```bash
npm run worker
```

## Step 6: Login

Open http://localhost:3000

**Login credentials:**
- **Admin**: admin@hospital.com / password123
- **Reception**: reception1@hospital.com / password123
- **CEO**: ceo@hospital.com / password123

## What to Try

### As Reception Staff (reception1@hospital.com)
1. View your performance meter
2. See assigned tasks
3. Click a task and submit it
4. Try different statuses: completed, partial, not started
5. Watch your points update!

### As Administrator (admin@hospital.com)
1. Click "Admin Panel"
2. View department reports
3. Create a new task
4. Set points, priority, due date
5. View audit logs

## Features to Explore

- ✅ **Offline Mode**: Disconnect internet, submit a task, reconnect to see it sync
- ✅ **Auto-Archive**: Tasks automatically archive after due date (worker runs every 5 min)
- ✅ **Points System**: Completed = full points, Partial = 50% (rounded up), Not Started = 0
- ✅ **Audit Trail**: Every action is logged (check Admin → Audit Logs)
- ✅ **Reports**: Department performance and CSV exports

## Troubleshooting

### "Cannot find module 'dotenv'"
```bash
npm install
```

### "MongoDB connection failed"
- Check `.env.local` has correct connection string
- Verify IP is whitelisted in Atlas
- See SETUP_ATLAS.md for help

### "Conflicting app and page file"
The `app` directory should be deleted. If it exists:
```bash
Remove-Item -Recurse -Force app  # Windows PowerShell
rm -rf app                        # Mac/Linux
```

### Port 3000 already in use
```bash
# Kill the process or use different port
PORT=3001 npm run dev
```

## Next Steps

- Read the full **README.md** for architecture details
- Check **SETUP_ATLAS.md** for MongoDB Atlas setup
- Explore the code in `pages/`, `components/`, and `lib/`
- Customize settings via Admin Panel

## Need Help?

- Check the README.md troubleshooting section
- Review SETUP_ATLAS.md for database issues
- Ensure all environment variables are set in .env.local

Happy task managing! 🎉
