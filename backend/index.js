require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3001;

// --- Database Configuration ---
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Authentication Middleware ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.error('JWT verification error:', err);
            return res.sendStatus(403);
        }
        req.user = user;
        next();
    });
};

// --- File Upload Configuration (Multer) ---
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });


// --- API Routes ---
app.get('/', (req, res) => {
  res.send('Hello from Express backend for YouTube Clone!');
});

// User registration
app.post('/api/users/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
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
});

// User login
app.post('/api/users/login', async (req, res) => {
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
            expiresIn: '1d',
        });

        res.json({ token, user: { id: user.id, username: user.username } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error logging in' });
    }
});

// Get current user profile
app.get('/api/users/me', authenticateToken, async (req, res) => {
    try {
        // req.user is populated by authenticateToken middleware
        const userResult = await pool.query('SELECT id, username, created_at FROM users WHERE id = $1', [req.user.userId]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(userResult.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching user profile' });
    }
});

// Video upload
app.post('/api/videos', authenticateToken, upload.fields([{ name: 'video', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]), async (req, res) => {
    const { title, description } = req.body;
    const { userId } = req.user;
    const videoFile = req.files.video ? req.files.video[0] : null;
    const thumbnailFile = req.files.thumbnail ? req.files.thumbnail[0] : null;

    if (!title || !videoFile) {
        return res.status(400).json({ error: 'Title and video file are required' });
    }

    const videoUrl = `/uploads/${videoFile.filename}`;
    const thumbnailUrl = thumbnailFile ? `/uploads/${thumbnailFile.filename}` : null;

    try {
        const result = await pool.query(
            'INSERT INTO videos (title, description, user_id, video_url, thumbnail_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [title, description, userId, videoUrl, thumbnailUrl]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error uploading video' });
    }
});

// Get all videos
app.get('/api/videos', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT v.*, u.username as channel,
            (SELECT COUNT(*) FROM likes WHERE video_id = v.id)::int as likes_count
            FROM videos v
            JOIN users u ON v.user_id = u.id
            ORDER BY v.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching videos' });
    }
});

// Get a single video by ID
app.get('/api/videos/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Use a transaction to safely increment views and fetch video data
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query('UPDATE videos SET views = views + 1 WHERE id = $1', [id]);
            const videoResult = await client.query(`
                SELECT v.*, u.username as channel,
                (SELECT COUNT(*) FROM likes WHERE video_id = v.id)::int as likes_count
                FROM videos v
                JOIN users u ON v.user_id = u.id
                WHERE v.id = $1
            `, [id]);
            await client.query('COMMIT');

            if (videoResult.rows.length === 0) {
                return res.status(404).send('Video not found');
            }
            res.json(videoResult.rows[0]);
        } catch(e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching video' });
    }
});

// Get comments for a video
app.get('/api/videos/:id/comments', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            'SELECT c.*, u.username FROM comments c JOIN users u ON c.user_id = u.id WHERE c.video_id = $1 ORDER BY c.created_at DESC',
            [id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching comments' });
    }
});

// Post a comment to a video
app.post('/api/videos/:id/comments', authenticateToken, async (req, res) => {
    const { id: videoId } = req.params;
    const { comment } = req.body;
    const { userId } = req.user;

    if (!comment) {
        return res.status(400).send('Comment is required');
    }

    try {
        const result = await pool.query(
            'INSERT INTO comments (video_id, user_id, comment) VALUES ($1, $2, $3) RETURNING *',
            [videoId, userId, comment]
        );
        const newComment = result.rows[0];

        // Attach username to the new comment for the response
        const userResult = await pool.query('SELECT username FROM users WHERE id = $1', [userId]);
        newComment.username = userResult.rows[0].username;

        res.status(201).json(newComment);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error posting comment' });
    }
});

// Like a video
app.post('/api/videos/:id/like', authenticateToken, async (req, res) => {
    const { id: videoId } = req.params;
    const { userId } = req.user;

    try {
        // Using ON CONFLICT DO NOTHING to prevent duplicate likes and errors
        await pool.query(
            'INSERT INTO likes (video_id, user_id) VALUES ($1, $2) ON CONFLICT (video_id, user_id) DO NOTHING',
            [videoId, userId]
        );
        res.status(201).send({ message: 'Like added' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error liking video' });
    }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
