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

## Advanced Technical Overview

### System Overview

This project is a role-based, daily-operations task manager optimized for hospital/reception workflows. It combines Next.js API routes with MongoDB via Mongoose, and a CEO/Admin UI to define reusable task templates that generate per-day tasks for departments or staff. It includes analytics, strong auditability, and time zone correctness for IST.

Key pillars:
- Reusable templates to define recurring daily checklists
- Point-scored submissions by staff with offline-tolerant UX
- CEO/Admin tools for generation, governance, and analytics
- Strict RBAC using JWT-based middleware

### Core Architecture

- Next.js (Pages Router) provides both the UI and server-side API under `pages/`.
- MongoDB 6+ with Mongoose models under `models/` encapsulates schema, indexes, and lifecycle hooks.
- Authentication and RBAC are composed via higher-order middleware in `lib/auth.js`.
- Database connections are pooled and cached in `lib/db.js` to avoid reconnect storms during development hot reload.
- Time and date handling centralizes UTC storage and IST display via `lib/date.js` and generation helpers in `lib/generation.js`.
- Background jobs and scheduled automation (e.g., archival or future generators) live under `worker/agenda.js` (Mongo-backed Agenda scheduler).

### Data Models

- `models/TaskTemplate.js`
  - Defines the template entity used to generate daily tasks.
  - Fields include `frequency` (none/daily/weekly/monthly), `due_time_ist`, `assignment_mode` (`each_staff` | `department` | `specific_users`), optional `department_id`, and embedded `items` representing granular checklist lines.
  - Input constraints and HH:mm validations are applied both at template-level and item-level. Several indexes support query patterns across `created_by`, `frequency`, and `department_id`.

- `models/TaskSubmission.js`
  - Captures a staff member’s submission for a generated task.
  - Tracks `status` (`not_started`, `partial`, `completed`, `rejected`), `points_awarded`, evidence links, rejections, and metadata.
  - Indexed on `(user_id, task_id, created_at)` and `(task_id, created_at)` for efficient lookups.

Related models (not opened here) include `models/Task.js`, `models/User.js`, and `models/Department.js`, which connect the daily generated tasks to users and departments for filtering and analytics.

### Authentication and RBAC

- `lib/auth.js`
  - `requireAuth(handler)` verifies a Bearer token using `JWT_SECRET`, decodes user claims into `req.user`, and standardizes error codes (`AUTH_TOKEN_MISSING`, `AUTH_INVALID_TOKEN`, etc.).
  - `requireRole(...roles)` composes authorization on top of authentication, returning 403 with `AUTH_INSUFFICIENT_PERMISSIONS` if the user role is not in the allowed set.
  - Tokens are generated via `generateAccessToken()` and `generateRefreshToken()`; defaults are configured by `JWT_EXPIRES` and `REFRESH_TOKEN_EXPIRES`.

### Database Connectivity

- `lib/db.js`
  - Lazily initializes a singleton Mongoose connection, caches both `conn` and `promise` on `global.mongoose` to remain resilient during API route hot reloads in development.
  - Configures `bufferCommands: false` and a modest `maxPoolSize` to balance throughput and resource usage.

### Template Authoring and Item Editing

- UI entry point: `pages/ceo/templates.jsx`
  - Lists templates from `GET /api/admin/templates`.
  - Uses `AdminTemplateEditor` for top-level template details.
  - Manages embedded checklist `items` in local draft state with inline reorder, duplication, bulk activate/deactivate, and modal editing.

- Item modal: `components/TemplateItemModal.jsx`
  - Provides a focused editor for one checklist item with fields such as `default_points`, `priority`, `due_time_ist`, `allow_late_submission`, and `active`.
  - Enforces simple client-side validation before emitting `onSave`.

- Server-side PATCH normalization: `pages/api/admin/templates/[id].js`
  - Validates cross-field constraints: e.g., daily frequency requires `due_time_ist`; `assignment_mode=department` requires `department_id`; `assignment_mode=specific_users` requires non-empty `specific_user_ids`.
  - Normalizes incoming `items` arrays: defaults `description` to empty string, coerces `''` to `null` for `due_time_ist`, ensures numeric defaults for `default_points`, and sets `active` flag when absent.
  - Audits changes with `createAuditLog()` and returns the updated template.

### Daily Generation and Analytics

- On-demand daily generation is triggered from `pages/ceo/templates.jsx` via `POST /api/admin/tasks/generate-daily` with options for preview and force, optionally scoped to `department_id` or a single `template_id`.
- The generation utility leverages IST midnight boundaries via helpers in `lib/generation.js` (e.g., `getIstMidnightUtc(date)`) to compute the canonical occurrence date for “today”.

- CEO daily analytics: `pages/api/ceo/analytics/daily.js`
  - Fetches today’s tasks by `occurrence_date` and optional `department_id`/`template_id`.
  - Computes per-template metrics: `total`, `completed`, `completion_rate`, `overdue`, `not_started`. See grouping by `source_template_id` and completion derivation from `TaskSubmission` statuses.
  - Computes per-staff compliance: tasks relevant to a user are those assigned directly or department-wide; compliance = `completed / total_relevant`.
  - Returns a fast, denormalized payload optimized for dashboard rendering.

### Time and Timezone Strategy

- Store in UTC; display in IST.
- For daily boundaries, use IST midnight to anchor occurrence dates to business expectations (e.g., hospital day). See usages of `getIstMidnightUtc()` in `pages/api/ceo/analytics/daily.js` and generation code.

### API Design Notes

- Authentication and RBAC are composed at export time, e.g.:
  - `export default requireAuth(requireRole('ceo', 'administrator', 'manager')(handler));` in `pages/api/ceo/analytics/daily.js`.
  - This pattern keeps handlers testable and composes concerns orthogonally.
- Admin template endpoints (`pages/api/admin/templates/[id].js`) support `GET`, `PATCH`, and `DELETE` with consistent error shapes and validations. Similar list/create endpoints live under `pages/api/admin/templates/index.js` (not shown here).

### Error Handling, Observability, and Auditability

- All API routes return structured errors `{ error: { code, message } }` where possible.
- Audits are created on template updates and deletes via `lib/audit.js` so that administrative actions are append-only and reviewable.
- Client shows toast notifications and session expiry handling flows.

### Security Considerations

- JWT secrets must be strong in production; rotate regularly.
- Rate limiting via `lib/rateLimit.js` can be applied to sensitive endpoints.
- Validate and sanitize all user-supplied fields; server performs normalization before persistence.

### Performance Considerations

- Critical queries are indexed in Mongoose schemas (e.g., `TaskTemplate` indexes across `frequency`, `active`, and `department_id`; `TaskSubmission` across `(user_id, task_id, created_at)`).
- API responses are tailored to dashboards to avoid N+1 SELECTs and excessive payload sizes.
- DB connections are cached across route invocations in development.

### Frontend UX Notes

- `pages/ceo/templates.jsx` maintains a local `itemsDraft` array to allow multi-edit, reorder, duplicate, and bulk operations atomically before a single `PATCH` save.
- `TemplateItemModal.jsx` centralizes the single-item edit UX and keeps the main table read-only for speed.

## Theoretical Concepts and Reasoning

- RBAC and Least Privilege
  - Restrict powerful operations (generation, deletes, global analytics) to `ceo`, `administrator`, `manager` roles via `requireRole()`.

- Time Semantics and Business Day
  - Daily tasks are scoped by IST business days. Anchoring occurrence at IST midnight avoids daylight drift relative to user expectations. All persistence is UTC for consistency and comparison integrity.

- Idempotency and Safe Re-runs
  - Daily generation endpoints should be designed to be idempotent for a given date and template scope. The `preview` mode lets admins audit intent before write operations.

- Data Normalization vs. Denormalization
  - Templates normalize input (server-side) to avoid schema drift. Analytics denormalizes read responses for fast dashboards, trading some duplication for speed.

- Consistency and Concurrency
  - MongoDB provides document-level atomicity. Where multiple updates are possible (e.g., submissions), optimistic techniques like `row_version` (already described earlier) can be extended to tasks and templates for conflict detection.

- Indexing Strategy
  - Read patterns inform indexes (e.g., queries by day, department, template, and task). Compound and selective indexes reduce scan costs for analytics endpoints.

- Offline-first UX
  - Staff submission flows should tolerate intermittent connectivity. Combine IndexedDB for pending writes and a background sync to replay when online.

## Roadmap and Planned Enhancements

- Pagination of submissions in API and UI for scalability.
- `ViewSubmissionModal` to inspect submission details in-line.
- Department dashboard under `/ceo` with richer KPIs.
- Cron endpoint (or scheduled job) to trigger daily generation for schedulers.
- Leaderboard APIs for department, lifetime, and quarterly performance.
- Heatmap analytics API for temporal density of submissions/completions.

## Local Development Workflow

1. Start MongoDB (or connect to Atlas) and verify with `npm run test-db`.
2. Seed base data with `npm run seed`.
3. Start Next.js dev server `npm run dev`.
4. Optionally run worker `npm run worker` for scheduled jobs.
5. Login as Admin/CEO, create templates, and optionally generate today’s tasks.
6. Use the CEO analytics endpoint `GET /api/ceo/analytics/daily` to verify the metrics pipeline.

## Testing Recommendations

- Unit-test schema validations and normalization (items, frequencies, assignment modes).
- Integration-test API routes with JWT auth and role checks.
- Load-test daily analytics endpoint with realistic task volumes and index coverage.
- E2E test template authoring and item CRUD including reorder and duplicate flows.

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
