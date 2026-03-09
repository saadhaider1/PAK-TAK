const express = require('express');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Sign up
router.post('/signup', async (req, res) => {
  try {
    const { email, username, password, confirmPassword } = req.body;

    if (!email || !username || !password || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { email: email },
          { username: username }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ error: 'Email already registered' });
      } else {
        return res.status(400).json({ error: 'Username already taken' });
      }
    }

    const user = await User.create({
      email,
      username,
      password
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username },
      process.env.SECRET_KEY,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        balance: user.balance
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    let errorMessage = 'Failed to create account';
    if (error.name === 'SequelizeValidationError') {
      errorMessage = error.errors[0].message;
    } else if (error.name === 'SequelizeUniqueConstraintError') {
      const field = error.fields[0];
      errorMessage = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    }
    res.status(400).json({ error: errorMessage });
  }
});

// Sign in
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await User.findOne({ where: { email } });

    if (!user || !(await user.validatePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username },
      process.env.SECRET_KEY,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Logged in successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        balance: user.balance,
        portfolioValue: user.portfolioValue
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    res.json({
      id: user.id,
      email: user.email,
      username: user.username,
      balance: user.balance,
      portfolioValue: user.portfolioValue,
      totalInvested: user.totalInvested
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
