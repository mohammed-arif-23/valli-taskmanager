const bcrypt = require('bcrypt');
const { connectDB } = require('@/lib/db');
const User = require('@/models/User');
const Department = require('@/models/Department');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } });
  }

  try {
    await connectDB();

    const { name, email, password, department_id } = req.body;

    // Validation
    if (!name || !email || !password || !department_id) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'All fields are required',
        },
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid email format',
        },
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Password must be at least 6 characters',
        },
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        error: {
          code: 'USER_EXISTS',
          message: 'Email already registered',
        },
      });
    }

    // Verify department exists
    const department = await Department.findById(department_id);
    if (!department) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid department',
        },
      });
    }

    // Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Create new user with staff role
    const newUser = new User({
      name,
      email: email.toLowerCase(),
      password_hash,
      role: 'staff', // Default role as staff
      department_id,
      is_active: true,
    });

    await newUser.save();

    return res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        department_id: newUser.department_id,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Internal server error',
      },
    });
  }
}
