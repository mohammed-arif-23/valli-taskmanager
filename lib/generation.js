const mongoose = require('mongoose');
const Task = require('../models/Task');
const TaskTemplate = require('../models/TaskTemplate');
const User = require('../models/User');
const { connectDB } = require('./db');
const { IST_TIMEZONE } = require('./date');
const { zonedTimeToUtc, utcToZonedTime } = require('date-fns-tz');

/**
 * Get IST midnight for a given JS Date (any timezone), returned as a UTC Date object.
 * @param {Date} date - JS Date
 * @returns {Date} UTC instant that corresponds to 00:00 at IST on that calendar day
 */
function getIstMidnightUtc(date) {
  const istDate = utcToZonedTime(date, IST_TIMEZONE);
  const y = istDate.getFullYear();
  const m = istDate.getMonth();
  const d = istDate.getDate();
  const istMidnight = new Date(y, m, d, 0, 0, 0, 0);
  return zonedTimeToUtc(istMidnight, IST_TIMEZONE);
}

/**
 * Compute due_at_utc from an IST calendar day and HH:mm (IST) string
 * @param {Date} istDayUtcMidnight - UTC instant for IST midnight of that day
 * @param {string} hhmm - e.g., "09:30"
 * @returns {Date} due_at_utc
 */
function dueAtUtcFromIstDay(istDayUtcMidnight, hhmm) {
  if (!hhmm) return null;
  const [hh, mm] = hhmm.split(':').map(Number);
  const istMidnight = utcToZonedTime(istDayUtcMidnight, IST_TIMEZONE);
  const istDue = new Date(
    istMidnight.getFullYear(),
    istMidnight.getMonth(),
    istMidnight.getDate(),
    hh,
    mm,
    0,
    0
  );
  return zonedTimeToUtc(istDue, IST_TIMEZONE);
}

async function createTasksFromTemplate(tpl, occurrenceDateUtc, { department_id = null, preview = false, force = false } = {}) {
  let createdCount = 0;
  const appliesToRoles = tpl.applies_to_roles && tpl.applies_to_roles.length > 0 ? tpl.applies_to_roles : ['staff'];

  let users = [];
  const deptId = tpl.department_id || department_id || null;

  if (tpl.assignment_mode === 'each_staff') {
    const userQuery = { role: { $in: appliesToRoles }, is_active: true };
    if (deptId) userQuery.department_id = deptId;
    users = await User.find(userQuery).select('_id department_id');
  }

  const items = Array.isArray(tpl.items) && tpl.items.length > 0
    ? tpl.items.filter((it) => it && it.active !== false)
    : [{
        _id: null,
        title: tpl.title,
        description: tpl.description,
        type: tpl.type,
        priority: tpl.priority,
        default_points: tpl.default_points,
        due_time_ist: tpl.due_time_ist,
        allow_late_submission: tpl.allow_late_submission,
      }];

  async function createOrUpdateTask(payload, dedupeQuery) {
    if (preview) {
      const exists = await Task.findOne(dedupeQuery).select('_id');
      if (exists) return force ? 1 : 0;
      return 1;
    }

    const existing = await Task.findOne(dedupeQuery);
    if (existing) {
      if (force) {
        existing.title = payload.title;
        existing.description = payload.description;
        existing.type = payload.type;
        existing.priority = payload.priority;
        existing.default_points = payload.default_points;
        existing.due_at_utc = payload.due_at_utc;
        existing.allow_late_submission = payload.allow_late_submission;
        await existing.save();
        return 0; 
      }
      return 0;
    }
    await Task.create(payload);
    return 1;
  }

  for (const item of items) {
    const itemDueAtUtc = dueAtUtcFromIstDay(occurrenceDateUtc, item.due_time_ist || tpl.due_time_ist);

    if (tpl.assignment_mode === 'department') {
      const deptForTask = deptId || (users[0] ? users[0].department_id : null);
      if (!deptForTask) continue;

      const dedupeQuery = {
        source_template_id: tpl._id,
        source_template_item_id: item._id || null,
        occurrence_date: occurrenceDateUtc,
        department_id: deptForTask,
        assigned_to: { $size: 0 },
      };

      const payload = {
        title: item.title,
        description: (item.description && String(item.description).trim()) || (tpl.description && String(tpl.description).trim()) || 'Task description',
        type: item.type || tpl.type,
        priority: item.priority || tpl.priority,
        default_points: item.default_points ?? tpl.default_points,
        due_at_utc: itemDueAtUtc || occurrenceDateUtc,
        department_id: deptForTask,
        assigned_to: [],
        recurrence: null,
        allow_late_submission: (item.allow_late_submission ?? tpl.allow_late_submission) || false,
        created_by: tpl.created_by,
        source_template_id: tpl._id,
        source_template_item_id: item._id || null,
        occurrence_date: occurrenceDateUtc,
      };

      createdCount += await createOrUpdateTask(payload, dedupeQuery);
    } else {
      for (const u of users) {
        const dedupeQuery = {
          source_template_id: tpl._id,
          source_template_item_id: item._id || null,
          occurrence_date: occurrenceDateUtc,
          department_id: u.department_id,
          assigned_to: u._id,
        };

        const payload = {
          title: item.title,
          description: (item.description && String(item.description).trim()) || (tpl.description && String(tpl.description).trim()) || 'Task description',
          type: item.type || tpl.type,
          priority: item.priority || tpl.priority,
          default_points: item.default_points ?? tpl.default_points,
          due_at_utc: itemDueAtUtc || occurrenceDateUtc,
          department_id: u.department_id,
          assigned_to: [u._id],
          recurrence: null,
          allow_late_submission: (item.allow_late_submission ?? tpl.allow_late_submission) || false,
          created_by: tpl.created_by,
          source_template_id: tpl._id,
          source_template_item_id: item._id || null,
          occurrence_date: occurrenceDateUtc,
        };

        createdCount += await createOrUpdateTask(payload, dedupeQuery);
      }
    }
  }

  return createdCount;
}

async function generateDailyTasks(date = new Date(), { department_id = null, preview = false, force = false, template_id = null } = {}) {
  await connectDB();

  const occurrenceDateUtc = getIstMidnightUtc(date);

  const templateQuery = { active: true, frequency: 'daily' };
  if (department_id) templateQuery.department_id = department_id;
  if (template_id) templateQuery._id = template_id;

  const templates = await TaskTemplate.find(templateQuery);
  let createdCount = 0;

  for (const tpl of templates) {
    createdCount += await createTasksFromTemplate(tpl, occurrenceDateUtc, { department_id, preview, force });
  }

  return { templates: templates.length, created: createdCount, date: occurrenceDateUtc };
}


async function generateRecurringTasks(date = new Date(), { department_id = null, preview = false, force = false, template_id = null } = {}) {
  await connectDB();
  const occurrenceDateUtc = getIstMidnightUtc(date);
  const ist = utcToZonedTime(occurrenceDateUtc, IST_TIMEZONE);
  const weekday = ist.getDay(); // 0-6
  const dayOfMonth = ist.getDate();

  const templateQuery = { active: true };
  if (department_id) templateQuery.department_id = department_id;
  if (template_id) templateQuery._id = template_id;

  const templates = await TaskTemplate.find(templateQuery);
  let createdCount = 0;

  for (const tpl of templates) {
    if (tpl.frequency === 'daily') {
      createdCount += await createTasksFromTemplate(tpl, occurrenceDateUtc, { department_id, preview, force });
    } else if (tpl.frequency === 'weekly') {
      const days = Array.isArray(tpl.days_of_week) ? tpl.days_of_week : [];
      if (days.includes(weekday)) {
        createdCount += await createTasksFromTemplate(tpl, occurrenceDateUtc, { department_id, preview, force });
      }
    } else if (tpl.frequency === 'monthly') {
      if (dayOfMonth === 1) {
        createdCount += await createTasksFromTemplate(tpl, occurrenceDateUtc, { department_id, preview, force });
      }
    }
  }

  return { templates: templates.length, created: createdCount, date: occurrenceDateUtc };
}

module.exports = { generateDailyTasks, generateRecurringTasks, getIstMidnightUtc };
