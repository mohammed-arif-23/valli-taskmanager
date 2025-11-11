require('dotenv').config({ path: '.env.local' });
const Agenda = require('agenda');
const mongoose = require('mongoose');
const Task = require('../models/Task');
const AuditLog = require('../models/AuditLog');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Initialize Agenda
const agenda = new Agenda({
  db: { address: process.env.MONGODB_URI, collection: 'agenda_jobs' },
  processEvery: '1 minute',
});

// Define archive tasks job
agenda.define('archive-tasks', async (job) => {
  console.log('Running archive-tasks job...');

  try {
    const now = new Date();

    // Find tasks that are past due and not archived
    const tasksToArchive = await Task.find({
      due_at_utc: { $lt: now },
      is_archived: false,
    });

    console.log(`Found ${tasksToArchive.length} tasks to archive`);

    for (const task of tasksToArchive) {
      task.is_archived = true;
      task.archived_at = now;
      await task.save();

      // Create audit log
      await AuditLog.create({
        entity_type: 'task',
        entity_id: task._id,
        action: 'auto_archive',
        performed_by: task.created_by,
        metadata: {
          archived_at: now,
          due_at_utc: task.due_at_utc,
        },
        created_at: now,
      });

      console.log(`Archived task: ${task.title}`);
    }

    console.log('Archive-tasks job completed');
  } catch (error) {
    console.error('Error in archive-tasks job:', error);
  }
});

// Start agenda
(async function () {
  await agenda.start();
  console.log('Agenda started');

  // Schedule recurring job - every 5 minutes
  await agenda.every('5 minutes', 'archive-tasks');
  console.log('Scheduled archive-tasks job to run every 5 minutes');
})();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, stopping agenda...');
  await agenda.stop();
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, stopping agenda...');
  await agenda.stop();
  await mongoose.connection.close();
  process.exit(0);
});
