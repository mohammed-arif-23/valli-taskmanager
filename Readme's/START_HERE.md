# 🚀 START HERE - Hospital Task Manager

## Before You Start

Make sure you have:
- ✅ Node.js 18+ installed
- ✅ MongoDB Atlas account (free tier)

## Step-by-Step Setup

### 1️⃣ Install Dependencies (if not done)

```bash
npm install
```

### 2️⃣ Configure MongoDB Atlas

**Option A: Quick Setup (5 minutes)**
Follow **SETUP_ATLAS.md** for detailed instructions.

**Option B: Already have Atlas?**
Update `.env.local` with your connection string:

```bash
MONGODB_URI=mongodb+srv://username:password@cluster.xxxxx.mongodb.net/hospital_tasks?retryWrites=true&w=majority
```

Replace:
- `username` - your database user
- `password` - your database password  
- `cluster.xxxxx` - your cluster address

### 3️⃣ Test Database Connection

```bash
npm run test-db
```

✅ Should see: "MongoDB connected successfully!"

❌ If it fails, check:
- Connection string is correct
- IP is whitelisted in Atlas
- Username/password are correct

### 4️⃣ Seed the Database

```bash
npm run seed
```

This creates:
- 5 users (CEO, Admin, 2 Reception, 1 Pharmacy)
- 4 departments
- 5 sample tasks
- Default settings

### 5️⃣ Start the Application

**Terminal 1** - Web Server:
```bash
npm run dev
```

**Terminal 2** - Background Worker:
```bash
npm run worker
```

### 6️⃣ Open the App

Go to: **http://localhost:3000**

### 7️⃣ Login

Try these accounts:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@hospital.com | password123 |
| Reception | reception1@hospital.com | password123 |
| CEO | ceo@hospital.com | password123 |

## 🎯 What to Try First

### As Reception Staff (reception1@hospital.com):
1. ✅ View your performance meter
2. ✅ See assigned tasks
3. ✅ Click a task and submit it
4. ✅ Try different statuses (completed/partial/not started)
5. ✅ Watch your points update!

### As Administrator (admin@hospital.com):
1. ✅ Click "Admin Panel"
2. ✅ View department reports
3. ✅ Create a new task
4. ✅ View audit logs

## 🐛 Troubleshooting

### "Cannot find module 'dotenv'"
```bash
npm install
```

### "MongoDB connection failed"
1. Check `.env.local` has correct connection string
2. Verify IP is whitelisted in MongoDB Atlas
3. See **SETUP_ATLAS.md** for help

### "Port 3000 already in use"
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use different port
$env:PORT=3001; npm run dev
```

### App won't start
1. Delete `.next` folder: `Remove-Item -Recurse -Force .next`
2. Reinstall: `npm install`
3. Try again: `npm run dev`

## 📚 Documentation

- **QUICKSTART.md** - 5-minute quick start guide
- **SETUP_ATLAS.md** - MongoDB Atlas setup
- **README.md** - Full documentation
- **package.json** - Available scripts

## 🎉 You're Ready!

Once everything is running:
- Web app: http://localhost:3000
- Login with any account above
- Explore the features!

Need help? Check the troubleshooting sections in the docs above.

Happy task managing! 🚀
