require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

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

// User registration (simple version)
app.post('/api/users/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  // NOTE: In a real app, hash the password!
  try {
    const result = await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username',
      [username, password]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error registering user' });
  }
});

// Video upload
app.post('/api/videos', upload.fields([{ name: 'video', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]), async (req, res) => {
    const { title, description, userId } = req.body;
    const videoFile = req.files.video ? req.files.video[0] : null;
    const thumbnailFile = req.files.thumbnail ? req.files.thumbnail[0] : null;

    if (!title || !userId || !videoFile) {
        return res.status(400).json({ error: 'Title, userId, and video file are required' });
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
        const videoResult = await pool.query(`
            SELECT v.*, u.username as channel,
            (SELECT COUNT(*) FROM likes WHERE video_id = v.id)::int as likes_count
            FROM videos v
            JOIN users u ON v.user_id = u.id
            WHERE v.id = $1
        `, [id]);
        if (videoResult.rows.length === 0) {
            return res.status(404).send('Video not found');
        }
        res.json(videoResult.rows[0]);
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
app.post('/api/videos/:id/comments', async (req, res) => {
    const { id: videoId } = req.params;
    const { userId, comment } = req.body;

    if (!userId || !comment) {
        return res.status(400).send('userId and comment are required');
    }

    try {
        const result = await pool.query(
            'INSERT INTO comments (video_id, user_id, comment) VALUES ($1, $2, $3) RETURNING *',
            [videoId, userId, comment]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error posting comment' });
    }
});

// Like a video
app.post('/api/videos/:id/like', async (req, res) => {
    const { id: videoId } = req.params;
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).send('userId is required');
    }

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
