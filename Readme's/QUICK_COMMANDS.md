# Quick Commands Reference

## 🚀 Getting Started

### First Time Setup
```bash
# Install dependencies
npm install

# Setup environment
# Copy .env.local and update MongoDB URI

# Test database connection
npm run test-db

# Seed database with sample data
npm run seed
```

### Start Development
```bash
# Terminal 1: Start web server
npm run dev

# Terminal 2: Start background worker
npm run worker
```

### Access Application
- **Web App:** http://localhost:3000
- **Login Page:** http://localhost:3000/login

---

## 🔑 Login Credentials

```bash
# CEO
Email: ceo@hospital.com
Password: password123
→ Redirects to: /ceo

# Administrator
Email: admin@hospital.com
Password: password123
→ Redirects to: /admin

# Reception Staff 1
Email: reception1@hospital.com
Password: password123
→ Redirects to: /

# Reception Staff 2
Email: reception2@hospital.com
Password: password123
→ Redirects to: /

# Pharmacy Staff
Email: pharmacy@hospital.com
Password: password123
→ Redirects to: /
```

---

## 🛠️ Development Commands

### Build & Run
```bash
# Development mode
npm run dev

# Production build
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

### Database
```bash
# Test connection
npm run test-db

# Seed database
npm run seed

# Start worker (auto-archive)
npm run worker
```

### Testing
```bash
# Run tests (when implemented)
npm test

# Run tests in watch mode
npm run test:watch
```

---

## 🧹 Troubleshooting Commands

### Clear Cache
```powershell
# Delete .next folder (Windows PowerShell)
Remove-Item -Recurse -Force .next

# Then restart dev server
npm run dev
```

```bash
# Delete .next folder (Mac/Linux)
rm -rf .next

# Then restart dev server
npm run dev
```

### Fix Dependencies
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Or use npm ci for clean install
npm ci
```

### Check for Issues
```bash
# Check for security vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Check outdated packages
npm outdated
```

---

## 📦 Package Management

### Install New Package
```bash
# Production dependency
npm install <package-name>

# Development dependency
npm install -D <package-name>
```

### Update Packages
```bash
# Update all packages
npm update

# Update specific package
npm update <package-name>
```

### Remove Package
```bash
npm uninstall <package-name>
```

---

## 🐳 Docker Commands

### Build & Run
```bash
# Build and start all services
docker-compose up

# Build and start in background
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild containers
docker-compose up --build
```

### Individual Services
```bash
# Start only app
docker-compose up app

# Start only MongoDB
docker-compose up mongo

# Start only worker
docker-compose up worker
```

---

## 🔍 Debugging Commands

### View Logs
```bash
# View all logs
npm run dev

# View worker logs
npm run worker

# View MongoDB logs (if local)
mongod --dbpath /path/to/data --logpath /path/to/log
```

### Check Ports
```powershell
# Windows: Check if port 3000 is in use
netstat -ano | findstr :3000

# Kill process by PID
taskkill /PID <PID> /F
```

```bash
# Mac/Linux: Check if port 3000 is in use
lsof -i :3000

# Kill process
kill -9 <PID>
```

---

## 📊 Database Commands

### MongoDB Shell
```bash
# Connect to MongoDB
mongosh "mongodb+srv://username:password@cluster.mongodb.net/hospital_tasks"

# Or local MongoDB
mongosh "mongodb://localhost:27017/hospital_tasks"
```

### Common MongoDB Queries
```javascript
// Show all collections
show collections

// Count documents
db.users.countDocuments()
db.tasks.countDocuments()
db.task_submissions.countDocuments()

// Find all users
db.users.find().pretty()

// Find tasks by department
db.tasks.find({ department_id: ObjectId("...") })

// Find archived tasks
db.tasks.find({ is_archived: true })

// Clear all data (CAUTION!)
db.users.deleteMany({})
db.tasks.deleteMany({})
db.task_submissions.deleteMany({})
```

---

## 🎨 Style Commands

### Tailwind CSS
```bash
# Rebuild Tailwind (if needed)
npx tailwindcss -i ./styles/globals.css -o ./styles/output.css --watch
```

### Check CSS
```bash
# Check for unused CSS
npx purgecss --css styles/globals.css --content 'pages/**/*.jsx' 'components/**/*.jsx'
```

---

## 🚀 Deployment Commands

### Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel

# Deploy to production
vercel --prod
```

### Heroku
```bash
# Login to Heroku
heroku login

# Create app
heroku create hospital-task-manager

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

### AWS/DigitalOcean
```bash
# Build for production
npm run build

# Start production server
NODE_ENV=production npm start
```

---

## 📝 Git Commands

### Common Workflow
```bash
# Check status
git status

# Add all changes
git add .

# Commit changes
git commit -m "Description of changes"

# Push to remote
git push origin main

# Pull latest changes
git pull origin main
```

### Branching
```bash
# Create new branch
git checkout -b feature/new-feature

# Switch branch
git checkout main

# Merge branch
git merge feature/new-feature

# Delete branch
git branch -d feature/new-feature
```

---

## 🔐 Environment Variables

### View Current Environment
```bash
# Windows PowerShell
Get-Content .env.local

# Mac/Linux
cat .env.local
```

### Set Environment Variable (Temporary)
```powershell
# Windows PowerShell
$env:NODE_ENV="production"
```

```bash
# Mac/Linux
export NODE_ENV=production
```

---

## 📱 Testing URLs

### Local Development
```
Main Dashboard:     http://localhost:3000/
Login:             http://localhost:3000/login
Admin Panel:       http://localhost:3000/admin
CEO Dashboard:     http://localhost:3000/ceo
Archived Tasks:    http://localhost:3000/archived
Task Detail:       http://localhost:3000/task/[id]
Create Task:       http://localhost:3000/admin/tasks/new
```

### API Endpoints
```
Auth:              http://localhost:3000/api/auth/login
Tasks:             http://localhost:3000/api/tasks
Admin Staff:       http://localhost:3000/api/admin/staff
CEO Departments:   http://localhost:3000/api/ceo/departments
CEO Todos:         http://localhost:3000/api/ceo/todos
```

---

## 🎯 Quick Fixes

### "Cannot find module" Error
```bash
npm install
```

### "Port already in use" Error
```powershell
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### "MongoDB connection failed" Error
```bash
# Check .env.local has correct MONGODB_URI
# Verify IP is whitelisted in MongoDB Atlas
# Test connection
npm run test-db
```

### "401 Unauthorized" Error
```javascript
// Clear localStorage and login again
localStorage.clear()
// Then navigate to /login
```

### Build Errors
```bash
# Clear cache and rebuild
Remove-Item -Recurse -Force .next
npm run dev
```

---

## 📚 Documentation Commands

### Generate Docs (if using JSDoc)
```bash
npx jsdoc -c jsdoc.json
```

### View Package Info
```bash
# View package details
npm info <package-name>

# View installed version
npm list <package-name>
```

---

## 🎉 Quick Start (TL;DR)

```bash
# 1. Install
npm install

# 2. Setup .env.local with MongoDB URI

# 3. Seed database
npm run seed

# 4. Start dev server (Terminal 1)
npm run dev

# 5. Start worker (Terminal 2)
npm run worker

# 6. Open browser
# http://localhost:3000

# 7. Login
# admin@hospital.com / password123
```

---

## 💡 Pro Tips

### Speed Up Development
```bash
# Use --turbo flag (Next.js 13+)
npm run dev -- --turbo

# Skip type checking during dev
npm run dev -- --no-type-check
```

### Monitor Performance
```bash
# Analyze bundle size
npm run build
# Check .next/analyze folder
```

### Quick Database Reset
```bash
# Drop and reseed
npm run seed
```

---

*Keep this file handy for quick reference!*
