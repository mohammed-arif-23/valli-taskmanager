# CEO CRUD Management Guide

## 🎯 Overview

The CEO panel now has complete CRUD (Create, Read, Update, Delete) operations for managing all system data including users, staff, and tasks.

---

## 🚀 New Features

### 1. User Management (`/ceo/users`)

Complete control over all users in the system.

**Features:**

- ✅ View all users across all departments
- ✅ Create new users (any role)
- ✅ Edit existing users
- ✅ Deactivate users (soft delete)
- ✅ Assign roles and departments
- ✅ Reset passwords

**Roles Available:**

- Reception
- Staff
- Manager
- Administrator
- CEO

### 2. Task Management (`/ceo/tasks`)

Complete control over all tasks in the system.

**Features:**

- ✅ View all tasks across all departments
- ✅ Create new tasks
- ✅ Edit existing tasks
- ✅ Archive tasks
- ✅ Set task properties (type, priority, points, due date)
- ✅ Assign to departments
- ✅ Allow late submissions

**Task Properties:**

- Title & Description
- Type: Primary / Secondary
- Priority: Low / Medium / High
- Points: Any positive number
- Due Date: IST timezone
- Department assignment
- Late submission toggle

### 3. Audit Logs (`/admin/audit`)

View all system activity and changes.

**Features:**

- ✅ View all audit logs
- ✅ Filter by entity type
- ✅ See detailed metadata
- ✅ Track who did what and when

---

## 📁 File Structure

### New API Endpoints (6 files)

```
pages/api/ceo/
├── users/
│   ├── index.js      # GET all users, POST create user
│   └── [id].js       # GET, PATCH, DELETE user
└── tasks/
    ├── index.js      # GET all tasks, POST create task
    └── [id].js       # GET, PATCH, DELETE task
```

### New Pages (2 files)

```
pages/ceo/
├── users.jsx         # User management UI
└── tasks.jsx         # Task management UI
```

### Modified Files (1 file)

```
pages/ceo/
└── index.jsx         # Added management quick actions
```

---

## 🎨 User Interface

### CEO Dashboard (`/ceo`)

**New Management Section:**

```
┌─────────────────────────────────────────────────┐
│  Management Quick Actions                       │
├─────────────────────────────────────────────────┤
│  [👥 Manage Users]  [📋 Manage Tasks]  [📄 Audit]│
└─────────────────────────────────────────────────┘
```

### User Management Page (`/ceo/users`)

```
┌─────────────────────────────────────────────────┐
│  User Management                    [+ Add User]│
├─────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────┐   │
│  │  Create/Edit User Form                  │   │
│  │  • Name                                 │   │
│  │  • Email                                │   │
│  │  • Password                             │   │
│  │  • Role (dropdown)                      │   │
│  │  • Department (dropdown)                │   │
│  │  [Create User] [Cancel]                 │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  User Table:                                    │
│  Name | Email | Role | Department | Status | Actions│
│  ───────────────────────────────────────────── │
│  John | john@ | Staff | Reception | Active | [Edit][Deactivate]│
└─────────────────────────────────────────────────┘
```

### Task Management Page (`/ceo/tasks`)

```
┌─────────────────────────────────────────────────┐
│  Task Management                    [+ Add Task]│
├─────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────┐   │
│  │  Create/Edit Task Form                  │   │
│  │  • Title                                │   │
│  │  • Description                          │   │
│  │  • Type (Primary/Secondary)             │   │
│  │  • Priority (Low/Medium/High)           │   │
│  │  • Points                               │   │
│  │  • Due Date (IST)                       │   │
│  │  • Department                           │   │
│  │  • ☐ Allow Late Submission              │   │
│  │  [Create Task] [Cancel]                 │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  Task Table:                                    │
│  Title | Dept | Type | Priority | Points | Due | Status | Actions│
│  ──────────────────────────────────────────────│
│  Task1 | Rec  | Pri  | High    | 10    | ... | Active | [Edit][Archive]│
└─────────────────────────────────────────────────┘
```

---

## 🔧 API Endpoints

### User Management

#### GET /api/ceo/users

Get all users in the system.

**Response:**

```json
{
  "users": [
    {
      "_id": "...",
      "name": "John Doe",
      "email": "john@hospital.com",
      "role": "reception",
      "department_id": { "_id": "...", "name": "Reception" },
      "is_active": true,
      "created_at": "2025-11-11T..."
    }
  ]
}
```

#### POST /api/ceo/users

Create a new user.

**Request:**

```json
{
  "name": "Jane Smith",
  "email": "jane@hospital.com",
  "password": "password123",
  "role": "staff",
  "department_id": "691214fd5a3187e142fa2de7"
}
```

**Response:**

```json
{
  "user": {
    "id": "...",
    "name": "Jane Smith",
    "email": "jane@hospital.com",
    "role": "staff",
    "department_id": "..."
  }
}
```

#### PATCH /api/ceo/users/:id

Update an existing user.

**Request:**

```json
{
  "name": "Jane Doe",
  "role": "manager",
  "password": "newpassword123" // Optional
}
```

#### DELETE /api/ceo/users/:id

Deactivate a user (soft delete).

**Response:**

```json
{
  "success": true
}
```

---

### Task Management

#### GET /api/ceo/tasks

Get all tasks in the system.

**Query Parameters:**

- `department_id` - Filter by department
- `is_archived` - Filter by archived status

**Response:**

```json
{
  "tasks": [
    {
      "_id": "...",
      "title": "Review Records",
      "description": "...",
      "type": "primary",
      "priority": "high",
      "default_points": 10,
      "due_at_utc": "2025-11-12T...",
      "department_id": { "_id": "...", "name": "Reception" },
      "is_archived": false
    }
  ]
}
```

#### POST /api/ceo/tasks

Create a new task.

**Request:**

```json
{
  "title": "New Task",
  "description": "Task description",
  "type": "primary",
  "priority": "high",
  "default_points": 10,
  "due_date_ist": "2025-11-15T18:00",
  "department_id": "691214fd5a3187e142fa2de7",
  "allow_late_submission": false
}
```

#### PATCH /api/ceo/tasks/:id

Update an existing task.

**Request:**

```json
{
  "title": "Updated Task",
  "priority": "medium",
  "default_points": 15
}
```

#### DELETE /api/ceo/tasks/:id

Archive a task.

**Response:**

```json
{
  "success": true
}
```

---

## 🎯 Usage Guide

### Creating a New User

1. **Navigate to User Management:**
   - Login as CEO
   - Click "Manage Users" card on dashboard
   - Or go to `/ceo/users`

2. **Click "+ Add User" button**

3. **Fill in the form:**
   - Name: Full name of the user
   - Email: Unique email address
   - Password: Initial password (user can change later)
   - Role: Select from dropdown
   - Department: Select from dropdown

4. **Click "Create User"**

5. **User is created and appears in the table**

### Editing a User

1. **Find the user in the table**

2. **Click "Edit" button**

3. **Form appears with current data**

4. **Modify fields as needed:**
   - Leave password blank to keep current password
   - Change any other field

5. **Click "Update User"**

### Deactivating a User

1. **Find the user in the table**

2. **Click "Deactivate" button**

3. **Confirm the action**

4. **User status changes to "Inactive"**
   - User cannot login
   - Data is preserved
   - Can be reactivated if needed

---

### Creating a New Task

1. **Navigate to Task Management:**
   - Login as CEO
   - Click "Manage Tasks" card on dashboard
   - Or go to `/ceo/tasks`

2. **Click "+ Add Task" button**

3. **Fill in the form:**
   - Title: Task name
   - Description: Detailed description
   - Type: Primary or Secondary
   - Priority: Low, Medium, or High
   - Points: Number of points (e.g., 10)
   - Due Date: Select date and time in IST
   - Department: Select from dropdown
   - Allow Late Submission: Check if needed

4. **Click "Create Task"**

5. **Task is created and appears in the table**

### Editing a Task

1. **Find the task in the table**

2. **Click "Edit" button**

3. **Form appears with current data**

4. **Modify fields as needed**

5. **Click "Update Task"**

### Archiving a Task

1. **Find the task in the table**

2. **Click "Archive" button**

3. **Confirm the action**

4. **Task status changes to "Archived"**
   - No longer appears in active lists
   - Cannot receive new submissions (unless late submission allowed)
   - Data is preserved

---

## 🔒 Security Features

### Authentication

- All endpoints require CEO role
- JWT token validation
- HTTP-only cookies for refresh tokens

### Authorization

- Only CEO can access these endpoints
- Role-based access control (RBAC)
- Audit logging for all actions

### Data Protection

- Passwords are hashed with bcrypt (cost factor 10)
- Soft deletes preserve data
- Audit trail for accountability

### Validation

- Email uniqueness check
- Required field validation
- Data type validation
- Role and department validation

---

## 📊 Audit Logging

Every action is logged:

### User Actions Logged:

- ✅ User created
- ✅ User updated (with before/after values)
- ✅ User deactivated

### Task Actions Logged:

- ✅ Task created
- ✅ Task updated (with before/after values)
- ✅ Task archived

### Audit Log Fields:

```json
{
  "entity_type": "user",
  "entity_id": "...",
  "action": "create",
  "performed_by": "CEO user ID",
  "metadata": {
    "before": {...},
    "after": {...}
  },
  "created_at": "2025-11-11T..."
}
```

---

## 🎨 Design Features

### Color Scheme

- Consistent with overall application
- Quinacridone Magenta primary color
- Mint Cream background
- Dark Purple text

### Animations

- Fade-in on page load
- Hover lift effects on cards
- Smooth transitions
- Button ripple effects

### Responsive Design

- Works on desktop, tablet, mobile
- Responsive tables with horizontal scroll
- Mobile-friendly forms
- Touch-friendly buttons

### Accessibility

- WCAG 2.1 AA compliant
- Keyboard navigation
- Screen reader friendly
- Clear focus indicators

---

## 🧪 Testing Checklist

### User Management

- [ ] Login as CEO
- [ ] Navigate to /ceo/users
- [ ] Click "+ Add User"
- [ ] Fill form and create user
- [ ] Verify user appears in table
- [ ] Click "Edit" on a user
- [ ] Modify user details
- [ ] Click "Update User"
- [ ] Verify changes saved
- [ ] Click "Deactivate" on a user
- [ ] Verify status changes to "Inactive"

### Task Management

- [ ] Navigate to /ceo/tasks
- [ ] Click "+ Add Task"
- [ ] Fill form and create task
- [ ] Verify task appears in table
- [ ] Click "Edit" on a task
- [ ] Modify task details
- [ ] Click "Update Task"
- [ ] Verify changes saved
- [ ] Click "Archive" on a task
- [ ] Verify status changes to "Archived"

### Audit Logs

- [ ] Navigate to /admin/audit
- [ ] Verify user creation logged
- [ ] Verify user update logged
- [ ] Verify task creation logged
- [ ] Verify task update logged
- [ ] Filter by entity type
- [ ] View detailed metadata

---

## 💡 Best Practices

### When Creating Users:

1. Use strong passwords initially
2. Assign correct role for permissions
3. Assign to appropriate department
4. Verify email is unique
5. Inform user of their credentials

### When Creating Tasks:

1. Write clear, descriptive titles
2. Provide detailed descriptions
3. Set realistic due dates
4. Assign appropriate points
5. Choose correct department
6. Set priority based on urgency

### When Editing:

1. Review current data before changing
2. Update audit logs are automatic
3. Changes take effect immediately
4. Notify affected users if needed

### When Deactivating/Archiving:

1. Confirm action is intentional
2. Data is preserved (soft delete)
3. Can be reversed if needed
4. Audit trail maintained

---

## 🚀 Quick Reference

### Navigation

```
CEO Dashboard → Manage Users → /ceo/users
CEO Dashboard → Manage Tasks → /ceo/tasks
CEO Dashboard → Audit Logs → /admin/audit
```

### Keyboard Shortcuts

- `Tab` - Navigate form fields
- `Enter` - Submit form
- `Esc` - Cancel form (when implemented)

### Status Indicators

- 🟢 Green - Active/Good
- 🔴 Red - Inactive/Archived
- 🟡 Orange - Warning/Medium Priority
- 🔵 Blue - Information

---

## 📞 Support

### Common Issues

**"Email already exists"**

- Each email must be unique
- Check if user already exists
- Use different email address

**"All fields are required"**

- Fill in all required fields (marked with \*)
- Check dropdowns are selected
- Verify date/time is set

**"Access denied"**

- Only CEO role can access
- Verify you're logged in as CEO
- Check token hasn't expired

---

## ✨ Summary

The CEO panel now provides:

- ✅ Complete user management (CRUD)
- ✅ Complete task management (CRUD)
- ✅ User-friendly interfaces
- ✅ Simple, intuitive forms
- ✅ Real-time updates
- ✅ Comprehensive audit logging
- ✅ Professional design
- ✅ Mobile responsive
- ✅ Secure and validated

**The CEO has full control over the entire system!** 🎉

---

_Last Updated: November 11, 2025_
_Version: 3.0.0 - CEO CRUD Management_
