# MongoDB Atlas Setup Guide

## Step 1: Create MongoDB Atlas Account

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up for a free account
3. Create a new project (e.g., "Hospital Task Manager")

## Step 2: Create a Cluster

1. Click "Build a Database"
2. Choose **FREE** tier (M0 Sandbox)
3. Select your preferred cloud provider and region
4. Click "Create Cluster" (takes 3-5 minutes)

## Step 3: Create Database User

1. Go to "Database Access" in left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Set username (e.g., `taskmanager`)
5. Set a strong password (save it!)
6. Set role to "Read and write to any database"
7. Click "Add User"

## Step 4: Whitelist Your IP

1. Go to "Network Access" in left sidebar
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (for development)
   - Or add your specific IP for better security
4. Click "Confirm"

## Step 5: Get Connection String

1. Go back to "Database" (Clusters)
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string (looks like):
   ```
   mongodb+srv://taskmanager:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

## Step 6: Update .env.local

1. Open `my-app/.env.local`
2. Replace `<password>` with your database user password
3. Add database name after `.net/`:
   ```
   MONGODB_URI=mongodb+srv://taskmanager:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/hospital_tasks?retryWrites=true&w=majority
   ```

## Step 7: Test Connection

Run the seed script to test:

```bash
cd my-app
npm run seed
```

You should see:
```
Connected to MongoDB
Created settings
Created departments
Created users
...
Database seeded successfully!
```

## Troubleshooting

### Error: "Authentication failed"
- Check your username and password in the connection string
- Ensure the database user was created correctly

### Error: "Connection timeout"
- Check your IP is whitelisted in Network Access
- Try "Allow Access from Anywhere" temporarily

### Error: "Cannot find module 'dotenv'"
- Run `npm install` in the my-app directory

## Atlas Features (Free Tier)

- ✅ 512 MB storage
- ✅ Shared RAM
- ✅ Replica set enabled (transactions work automatically!)
- ✅ Automatic backups
- ✅ Monitoring dashboard

## Next Steps

Once connected:

1. Seed the database: `npm run seed`
2. Start the app: `npm run dev`
3. Start the worker: `npm run worker`
4. Login at http://localhost:3000 with:
   - Email: `admin@hospital.com`
   - Password: `password123`

Enjoy! 🚀
