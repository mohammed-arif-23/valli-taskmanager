# Testing Guide - New Features

## 🚀 Quick Start

1. **Clear cache and restart**:
   ```bash
   # Delete .next folder
   Remove-Item -Recurse -Force .next
   
   # Start dev server
   npm run dev
   
   # In another terminal, start worker
   npm run worker
   ```

2. **Seed database** (if not already done):
   ```bash
   npm run seed
   ```

## 🧪 Test Scenarios

### 1. Test Admin Panel

**Login as Administrator:**
- Email: `admin@hospital.com`
- Password: `password123`

**Expected Behavior:**
- ✅ Should automatically redirect to `/admin`
- ✅ Should see "Admin Panel" header with gradient background
- ✅ Should see 3 quick action cards (Create Task, Manage Tasks, Audit Logs)
- ✅ Should see "Department Staff Performance" table

**Test Staff Table:**
- ✅ Filter by role (Reception, Staff, Manager)
- ✅ Search by name or email
- ✅ See performance percentages with color coding:
  - Red: < 33%
  - Orange: 33-66%
  - Green: > 66%
- ✅ See points breakdown (received/allocated)
- ✅ See submission counts (completed, partial, not started)

**Test Animations:**
- ✅ Cards should fade in on load
- ✅ Table rows should stagger animate
- ✅ Hover effects on cards (lift up)
- ✅ Smooth transitions on all interactions

---

### 2. Test CEO Dashboard

**Login as CEO:**
- Email: `ceo@hospital.com`
- Password: `password123`

**Expected Behavior:**
- ✅ Should automatically redirect to `/ceo`
- ✅ Should see "CEO Dashboard" header with dark gradient
- ✅ Should see department stats cards at top
- ✅ Should see two charts:
  - Pie chart: Completion rates by department
  - Bar chart: Allocated vs Received points

**Test Personal To-Do App:**
1. ✅ Click "+ Add Todo" button
2. ✅ Form should fade in
3. ✅ Fill in:
   - Title: "Review quarterly reports"
   - Priority: High
   - Due Date: Tomorrow
   - Description: "Q4 financial review"
4. ✅ Click "Create Todo"
5. ✅ Todo should appear in list with red badge (high priority)
6. ✅ Click checkbox to mark complete
7. ✅ Title should get strikethrough
8. ✅ Click delete icon to remove
9. ✅ Todo should disappear

**Test Charts:**
- ✅ Pie chart should show all departments
- ✅ Hover over pie slices to see tooltips
- ✅ Bar chart should show comparison
- ✅ Charts should be responsive

---

### 3. Test Staff Dashboard

**Login as Reception Staff:**
- Email: `reception1@hospital.com`
- Password: `password123`

**Expected Behavior:**
- ✅ Should redirect to `/` (main dashboard)
- ✅ Should see gradient header
- ✅ Should see performance meter with color zones
- ✅ Should see "View Archived" button
- ✅ Should see task cards in grid

**Test Performance Meter:**
- ✅ Should show percentage
- ✅ Should show points (received/allocated)
- ✅ Should have animated fill bar
- ✅ Should show color zones (red/orange/green)

**Test Task Cards:**
- ✅ Cards should have border and rounded corners
- ✅ Should show task title, type, priority
- ✅ Should show due date with calendar icon
- ✅ Should show points in magenta color
- ✅ Hover should lift card up
- ✅ Click should navigate to task detail

**Test Archived Tasks:**
1. ✅ Click "View Archived" button
2. ✅ Should navigate to `/archived`
3. ✅ Should see archived tasks (if any)
4. ✅ Should see archive icon in header
5. ✅ Click "Back to Dashboard" to return

---

### 4. Test Login Page

**Test Design:**
- ✅ Should see gradient background
- ✅ Should see circular icon with shield
- ✅ Should see "Hospital Task Manager" title
- ✅ Form fields should have magenta borders
- ✅ Login button should have gradient
- ✅ Demo credentials should be visible

**Test Redirects:**
1. Login as CEO → Should go to `/ceo`
2. Login as Admin → Should go to `/admin`
3. Login as Staff → Should go to `/`

**Test Animations:**
- ✅ Form should scale in on load
- ✅ Fields should fade in with stagger
- ✅ Button should have ripple effect on click
- ✅ Loading spinner should appear during login

---

### 5. Test Task Submission

**Navigate to a Task:**
1. Login as reception staff
2. Click any task card
3. Should see task detail page

**Test Submission Form:**
- ✅ Form should have new design with magenta borders
- ✅ Status dropdown should show icons (✓, ◐, ✗)
- ✅ Points preview should show in gradient box
- ✅ Points should update when status changes

**Test Status Options:**
1. **Completed:**
   - ✅ Should show full points
   - ✅ No reason field required
   
2. **Partial:**
   - ✅ Should show calculated points (Math.ceil(points × 0.5))
   - ✅ No reason field required
   
3. **Not Started:**
   - ✅ Reason field should appear
   - ✅ Should be required
   - ✅ Should show character count (0/200)
   - ✅ Should show 0 points

**Submit Task:**
- ✅ Click "Submit Task" button
- ✅ Should show loading spinner
- ✅ Should show success toast
- ✅ Should redirect back to dashboard
- ✅ Performance meter should update

---

### 6. Test Animations & Micro-Interactions

**Global Animations:**
- ✅ Page transitions should be smooth
- ✅ Cards should fade in on load
- ✅ Lists should stagger animate
- ✅ Hover effects should lift elements
- ✅ Buttons should have ripple on click
- ✅ Forms should have smooth focus states

**Skeleton Loaders:**
1. Logout and login again
2. ✅ Should see skeleton loaders while data loads
3. ✅ Skeletons should pulse/shimmer
4. ✅ Should smoothly transition to real content

**Color Transitions:**
- ✅ All transitions should be smooth (0.3s)
- ✅ Hover states should change colors
- ✅ Focus states should show magenta ring

---

### 7. Test Responsive Design

**Desktop (1920px):**
- ✅ 3 columns for task cards
- ✅ Full width tables
- ✅ Charts side by side

**Tablet (768px):**
- ✅ 2 columns for task cards
- ✅ Horizontal scroll for tables
- ✅ Charts stacked

**Mobile (375px):**
- ✅ 1 column for task cards
- ✅ Horizontal scroll for tables
- ✅ Charts stacked
- ✅ Navigation should be readable

---

## 🎨 Visual Checklist

### Color Scheme:
- ✅ Background: Mint Cream (#eaf2ef)
- ✅ Primary: Quinacridone Magenta (#912f56)
- ✅ Dark: Palatinate (#521945)
- ✅ Text: Dark Purple (#361f27)
- ✅ Gradients used in headers and buttons

### Typography:
- ✅ Headers: Bold, 2xl (24px)
- ✅ Body: Regular, base (16px)
- ✅ Small: Medium, sm (14px)

### Spacing:
- ✅ Cards: p-6 (24px padding)
- ✅ Gaps: gap-6 (24px)
- ✅ Rounded: rounded-xl (12px)

---

## 🐛 Known Issues to Check

1. **Mongoose Warning:**
   - ✅ Should NOT see duplicate index warning
   - Fixed by removing `unique: true` from schema

2. **Build Cache:**
   - ✅ If seeing 404 errors, delete `.next` folder
   - ✅ Restart dev server

3. **Authentication:**
   - ✅ Tokens should persist in localStorage
   - ✅ Refresh should maintain login state

---

## 📊 Performance Checklist

- ✅ Initial page load < 2s
- ✅ Navigation transitions < 300ms
- ✅ API responses < 1s
- ✅ Animations smooth (60fps)
- ✅ No layout shifts
- ✅ Images optimized

---

## ✅ Final Verification

Before considering testing complete:

1. ✅ All 3 user roles tested (CEO, Admin, Staff)
2. ✅ All new pages accessible (/admin, /ceo, /archived)
3. ✅ All animations working
4. ✅ All colors applied correctly
5. ✅ Skeleton loaders showing
6. ✅ Charts rendering (CEO dashboard)
7. ✅ Todo app functional (CEO)
8. ✅ Staff table filtering (Admin)
9. ✅ Task submission working
10. ✅ No console errors

---

## 🎉 Success Criteria

The update is successful if:
- ✅ All role-based redirects work
- ✅ New color scheme applied everywhere
- ✅ All animations smooth and visible
- ✅ CEO dashboard shows charts
- ✅ Admin panel shows staff table
- ✅ Archived page accessible
- ✅ No breaking changes to existing features
- ✅ Mobile responsive maintained
- ✅ Accessibility maintained (ARIA labels, keyboard nav)

---

## 📞 Support

If you encounter issues:
1. Check console for errors
2. Clear `.next` folder and restart
3. Verify MongoDB connection
4. Check all dependencies installed (`npm install`)
5. Ensure worker is running for auto-archive
