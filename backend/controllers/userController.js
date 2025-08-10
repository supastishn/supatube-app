const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const registerUser = async (req, res) => {
  try {
    const { username, password, name } = req.body;
    if (!username || !password || !name) {
      return res.status(400).json({ error: 'Username, name, and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const result = await pool.query(
      'INSERT INTO users (username, password, name) VALUES ($1, $2, $3) RETURNING id, username, name, avatar_url',
      [username, hashedPassword, name]
    );
    const user = result.rows[0];
    
    // Generate token for the new user
    const token = jwt.sign({ userId: user.id, username: user.username }, process.env.JWT_SECRET, {
      expiresIn: '12h',
      algorithm: 'HS256',
    });
    
    // Return both token and user
    res.status(201).json({ token, user });
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

const updateUserProfile = async (req, res) => {
  const userId = req.user.userId;
  const { name, username: newUsername } = req.body;
  
  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      if (name) {
        await client.query(
          'UPDATE users SET name = $1 WHERE id = $2',
          [name, userId]
        );
      }

      if (newUsername) {
        const existing = await client.query(
          'SELECT id FROM users WHERE username = $1 AND id <> $2',
          [newUsername, userId]
        );
        if (existing.rowCount > 0) {
          return res.status(409).json({ error: 'Username already exists' });
        }
        await client.query(
          'UPDATE users SET username = $1 WHERE id = $2',
          [newUsername, userId]
        );
      }

      const result = await client.query(
        'SELECT id, username, name, created_at FROM users WHERE id = $1',
        [userId]
      );
      await client.query('COMMIT');
      res.json(result.rows[0]);
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error updating profile' });
  }
};

const uploadAvatar = async (req, res) => {
  const userId = req.user.userId;
  if (!req.file) {
    return res.status(400).json({ error: 'Avatar file is required' });
  }

  const avatarUrl = `/uploads/${req.file.filename}`;
  try {
    await pool.query(
      'UPDATE users SET avatar_url = $1 WHERE id = $2',
      [avatarUrl, userId]
    );
    res.status(200).json({ avatar_url: avatarUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error updating avatar' });
  }
};

module.exports = {
    registerUser,
    loginUser,
    getUserProfile,
    updateUserProfile,
    uploadAvatar
};
