require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Department = require('../models/Department');
const User = require('../models/User');
const Task = require('../models/Task');
const Settings = require('../models/Settings');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Department.deleteMany({});
    await User.deleteMany({});
    await Task.deleteMany({});
    await Settings.deleteMany({});
    console.log('Cleared existing data');

    // Create settings
    const settings = await Settings.create({
      _id: 'site_settings',
      rounding_policy: {
        method: 'half_up',
        partial_ratio: 0.5,
      },
      thresholds: {
        red: 33,
        orange: 66,
        green: 100,
      },
      scoring_mode: 'absolute',
    });
    console.log('Created settings');

    // Create departments
    const reception = await Department.create({ name: 'Reception' });
    const pharmacy = await Department.create({ name: 'Pharmacy' });
    const it = await Department.create({ name: 'IT' });
    const admin = await Department.create({ name: 'Administration' });
    console.log('Created departments');

    // Hash password
    const password = await bcrypt.hash('password123', 10);

    // Create users
    const ceo = await User.create({
      name: 'CEO User',
      email: 'ceo@hospital.com',
      password_hash: password,
      role: 'ceo',
      department_id: admin._id,
    });

    const administrator = await User.create({
      name: 'Admin User',
      email: 'admin@hospital.com',
      password_hash: password,
      role: 'administrator',
      department_id: admin._id,
    });

    const receptionStaff1 = await User.create({
      name: 'Reception Staff 1',
      email: 'reception1@hospital.com',
      password_hash: password,
      role: 'reception',
      department_id: reception._id,
    });

    const receptionStaff2 = await User.create({
      name: 'Reception Staff 2',
      email: 'reception2@hospital.com',
      password_hash: password,
      role: 'reception',
      department_id: reception._id,
    });

    const pharmacyStaff = await User.create({
      name: 'Pharmacy Staff',
      email: 'pharmacy@hospital.com',
      password_hash: password,
      role: 'staff',
      department_id: pharmacy._id,
    });

    console.log('Created users');

    // Create sample tasks
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    await Task.create([
      {
        title: 'Review Patient Records',
        description: 'Review and update all patient records for accuracy',
        type: 'primary',
        priority: 'high',
        default_points: 10,
        due_at_utc: tomorrow,
        department_id: reception._id,
        created_by: administrator._id,
      },
      {
        title: 'Answer Phone Calls',
        description: 'Handle incoming phone calls and direct to appropriate departments',
        type: 'primary',
        priority: 'high',
        default_points: 8,
        due_at_utc: tomorrow,
        department_id: reception._id,
        created_by: administrator._id,
      },
      {
        title: 'Update Appointment Schedule',
        description: 'Update the appointment schedule for next week',
        type: 'secondary',
        priority: 'medium',
        default_points: 5,
        due_at_utc: nextWeek,
        department_id: reception._id,
        created_by: administrator._id,
      },
      {
        title: 'Inventory Check',
        description: 'Check and update medication inventory',
        type: 'primary',
        priority: 'high',
        default_points: 10,
        due_at_utc: tomorrow,
        department_id: pharmacy._id,
        created_by: administrator._id,
      },
      {
        title: 'Clean Reception Area',
        description: 'Clean and organize the reception area',
        type: 'secondary',
        priority: 'low',
        default_points: 3,
        due_at_utc: yesterday,
        department_id: reception._id,
        created_by: administrator._id,
        is_archived: true,
        archived_at: now,
      },
    ]);

    console.log('Created sample tasks');

    console.log('\n=== Seed Data Summary ===');
    console.log('Departments:', await Department.countDocuments());
    console.log('Users:', await User.countDocuments());
    console.log('Tasks:', await Task.countDocuments());
    console.log('\n=== Login Credentials ===');
    console.log('CEO: ceo@hospital.com / password123');
    console.log('Admin: admin@hospital.com / password123');
    console.log('Reception 1: reception1@hospital.com / password123');
    console.log('Reception 2: reception2@hospital.com / password123');
    console.log('Pharmacy: pharmacy@hospital.com / password123');

    await mongoose.connection.close();
    console.log('\nDatabase seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();
