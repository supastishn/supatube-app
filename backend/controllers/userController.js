const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const registerUser = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long' });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    const result = await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username',
      [username, hashedPassword]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    if (err.code === '23505') { // unique_violation for username
        return res.status(409).json({ error: 'Username already exists' });
    }
    res.status(500).json({ error: 'Error registering user' });
  }
};

const loginUser = async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }
    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user.id, username: user.username }, process.env.JWT_SECRET, {
            expiresIn: '12h',
            algorithm: 'HS256',
        });

        // Get updated user info including name and avatar_url after registration/login
        const updatedUserRes = await pool.query(
          'SELECT id, username, name, avatar_url FROM users WHERE id = $1', 
          [user.id]
        );
        const updatedUser = updatedUserRes.rows[0];
        res.json({ token, user: updatedUser });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error logging in' });
    }
};

const getUserProfile = async (req, res) => {
    try {
        // req.user is populated by authenticateToken middleware
        const userResult = await pool.query('SELECT id, username, created_at FROM users WHERE id = $1', [req.user.userId]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const subsCount = await pool.query('SELECT COUNT(*)::int AS count FROM subscriptions WHERE channel_id = $1', [req.user.userId]);
        const profile = { ...userResult.rows[0], subscribers: subsCount.rows[0].count };

        res.json(profile);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching user profile' });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getUserProfile
};
