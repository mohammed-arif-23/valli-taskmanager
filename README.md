# Hospital Task Manager

A reception-focused task management web application for hospital staff with point-based scoring, offline capabilities, and comprehensive audit logging.

## Features

- **Task Management**: Create and assign tasks with points, priorities, and due dates
- **Point-Based Scoring**: Configurable rounding policies for partial completions
- **Timezone Aware**: Store UTC, display IST (Asia/Kolkata)
- **Auto-Archive**: Tasks automatically archive after due date
- **Offline PWA**: Submit tasks offline with automatic sync
- **Audit Logging**: Append-only logs for all actions
- **Role-Based Access**: Reception, Staff, Administrator, CEO, Manager roles
- **Reports**: Department-wise completion rates and analytics

## Tech Stack

- **Frontend**: Next.js 14 (Pages Router), React 18, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: MongoDB 6+ (with replica set for transactions)
- **Scheduler**: Agenda.js (MongoDB-backed)
- **Authentication**: JWT with HTTP-only cookies
- **Offline**: IndexedDB, Service Workers

## Prerequisites

- Node.js 18+ 
- MongoDB Atlas account (free tier works) OR MongoDB 6+ locally
- npm or yarn

## Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Database - Use your MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/hospital_tasks?retryWrites=true&w=majority

# Authentication (CHANGE IN PRODUCTION!)
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES=15m
REFRESH_TOKEN_SECRET=your-refresh-secret-change-in-production
REFRESH_TOKEN_EXPIRES=7d

# Application
NODE_ENV=development
PORT=3000
SITE_TZ=Asia/Kolkata
NEXT_PUBLIC_API_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=30
```

## Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Set up MongoDB Atlas:
   - See **SETUP_ATLAS.md** for detailed step-by-step instructions
   - Create a free cluster at https://www.mongodb.com/cloud/atlas
   - Get your connection string
   - Update `MONGODB_URI` in `.env.local` with your Atlas connection string
   - Whitelist your IP address in Atlas Network Access

4. Test your database connection:

```bash
npm run test-db
```

5. Seed the database:

```bash
npm run seed
```

5. Start the development server:

```bash
npm run dev
```

6. Start the background worker (in a separate terminal):

```bash
npm run worker
```

7. Open http://localhost:3000

## Default Login Credentials

After seeding, use these credentials:

- **CEO**: ceo@hospital.com / password123
- **Admin**: admin@hospital.com / password123
- **Reception 1**: reception1@hospital.com / password123
- **Reception 2**: reception2@hospital.com / password123
- **Pharmacy**: pharmacy@hospital.com / password123

## Project Structure

```
my-app/
├── components/          # React components
│   ├── Meter.jsx
│   ├── TaskCard.jsx
│   ├── TaskDetail.jsx
│   ├── SubmissionForm.jsx
│   └── AdminTaskEditor.jsx
├── lib/                 # Utility libraries
│   ├── db.js           # MongoDB connection
│   ├── auth.js         # Authentication middleware
│   ├── date.js         # Timezone utilities
│   ├── points.js       # Points calculation
│   ├── audit.js        # Audit logging
│   ├── validation.js   # Joi schemas
│   ├── rateLimit.js    # Rate limiting
│   └── offlineQueue.js # Offline queue
├── models/             # Mongoose models
│   ├── User.js
│   ├── Department.js
│   ├── Task.js
│   ├── TaskSubmission.js
│   ├── AuditLog.js
│   └── Settings.js
├── pages/              # Next.js pages
│   ├── api/           # API routes
│   ├── admin/         # Admin pages
│   ├── task/          # Task pages
│   ├── index.jsx      # User dashboard
│   └── login.jsx      # Login page
├── public/            # Static assets
│   ├── sw.js         # Service worker
│   └── manifest.json # PWA manifest
├── scripts/           # Utility scripts
│   └── seed.js       # Database seeder
├── styles/            # Global styles
│   └── globals.css
└── worker/            # Background workers
    └── agenda.js     # Agenda scheduler
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh access token

### Tasks (User)
- `GET /api/tasks` - List tasks
- `GET /api/tasks/:id` - Get task details
- `POST /api/tasks/:id/submit` - Submit task
- `GET /api/users/:id/overview` - Get user overview

### Admin
- `POST /api/admin/tasks` - Create task
- `GET /api/admin/tasks` - List all tasks
- `GET /api/admin/tasks/:id` - Get task with all submissions
- `PATCH /api/admin/tasks/:id` - Update task
- `POST /api/admin/tasks/:id/archive` - Archive task
- `POST /api/admin/tasks/bulk` - Bulk create tasks
- `POST /api/admin/submissions/:id/override` - Override submission
- `GET /api/admin/audit` - View audit logs
- `GET /api/admin/settings` - Get settings
- `PATCH /api/admin/settings` - Update settings
- `GET /api/admin/reports/departments` - Department reports
- `GET /api/admin/reports/export` - Export CSV

## Key Features Explained

### Timezone Handling

All dates are stored in UTC in MongoDB. The `lib/date.js` utility converts:
- **Input**: IST → UTC (when admin creates tasks)
- **Display**: UTC → IST (when showing dates to users)

### Points Calculation

Points are calculated based on submission status:
- **Completed**: Full `default_points`
- **Partial**: `Math.ceil(default_points × partial_ratio)` (default 50%)
- **Not Started**: 0 points

The rounding policy is configurable in admin settings.

### Auto-Archive

The Agenda.js worker runs every 5 minutes and archives tasks where:
- `due_at_utc < now()`
- `is_archived = false`

Archived tasks cannot receive submissions unless `allow_late_submission = true`.

### Offline Capabilities

The PWA uses:
- **Service Worker**: Caches static assets and pages
- **IndexedDB**: Stores pending submissions when offline
- **Background Sync**: Automatically syncs when connection restored

### Audit Logging

Every action creates an immutable audit log entry:
- Task create/update/delete
- Submission create
- Admin override
- Settings update
- Auto-archive

Logs include before/after values and are never deleted.

### Optimistic Locking

Tasks and submissions use `row_version` field:
- Incremented on every update
- Checked before updates to prevent conflicts
- Returns 409 error if version mismatch

## Docker Deployment

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - MONGODB_URI=mongodb://mongo:27017/hospital_tasks
    depends_on:
      - mongo
  
  mongo:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    command: --replSet rs0
  
  worker:
    build: .
    command: node worker/agenda.js
    environment:
      - MONGODB_URI=mongodb://mongo:27017/hospital_tasks
    depends_on:
      - mongo

volumes:
  mongo_data:
```

Run with:

```bash
docker-compose up
```

## Troubleshooting

### MongoDB Connection Issues

**For MongoDB Atlas:**
- Ensure your IP is whitelisted in Network Access
- Check your connection string is correct
- Verify username/password are correct

**For Local MongoDB:**
- Transactions require replica set: `mongod --replSet rs0`
- Initialize replica set in mongo shell: `rs.initiate()`

### Worker Not Archiving Tasks

Check that:
1. Worker is running (`npm run worker`)
2. MongoDB connection is successful
3. Tasks have `due_at_utc` in the past

### Offline Sync Not Working

Ensure:
1. Service worker is registered
2. Browser supports IndexedDB
3. Check browser console for errors

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
#   v a l l i - t a s k m a n a g e r  
 #   v a l l i - t a s k m a n a g e r  
 #   v a l l i - t a s k m a n a g e r  
 #   v a l l i - t a s k m a n a g e r  
 