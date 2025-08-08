const pool = require('../config/db');
const fs = require('fs').promises;
const path = require('path');

const uploadVideo = async (req, res) => {
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
};

const getAllVideos = async (req, res) => {
    const { userId } = req.query;

    let query = `
        SELECT v.*, u.username as channel,
        (SELECT COUNT(*) FROM likes WHERE video_id = v.id)::int as likes_count
        FROM videos v
        JOIN users u ON v.user_id = u.id
    `;
    const queryParams = [];

    if (userId) {
        query += ' WHERE v.user_id = $1';
        queryParams.push(userId);
    }

    query += ' ORDER BY v.created_at DESC';

    try {
        const result = await pool.query(query, queryParams);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching videos' });
    }
};

const getVideoById = async (req, res) => {
    const { id } = req.params;
    const userId = req.user ? req.user.userId : null;

    try {
        // Use a transaction to safely increment views and fetch video data
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query('UPDATE videos SET views = views + 1 WHERE id = $1', [id]);
            
            const videoQuery = `
                SELECT v.*, u.username as channel,
                (SELECT COUNT(*) FROM likes WHERE video_id = v.id)::int as likes_count,
                ${userId ? 'EXISTS(SELECT 1 FROM likes WHERE video_id = v.id AND user_id = $2)' : 'false'} as user_has_liked
                FROM videos v
                JOIN users u ON v.user_id = u.id
                WHERE v.id = $1
            `;

            const queryParams = [id];
            if (userId) {
                queryParams.push(userId);
            }

            const videoResult = await client.query(videoQuery, queryParams);
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
};

const getCommentsForVideo = async (req, res) => {
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
};

const postComment = async (req, res) => {
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
};

const likeVideo = async (req, res) => {
    const { id: videoId } = req.params;
    const { userId } = req.user;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const likeResult = await client.query(
            'SELECT id FROM likes WHERE video_id = $1 AND user_id = $2',
            [videoId, userId]
        );

        if (likeResult.rows.length > 0) {
            // Like exists, so delete it (unlike)
            await client.query('DELETE FROM likes WHERE id = $1', [likeResult.rows[0].id]);
            await client.query('COMMIT');
            res.status(200).json({ message: 'Like removed' });
        } else {
            // Like does not exist, so add it (like)
            await client.query('INSERT INTO likes (video_id, user_id) VALUES ($1, $2)', [videoId, userId]);
            await client.query('COMMIT');
            res.status(201).json({ message: 'Like added' });
        }
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Error toggling video like' });
    } finally {
        client.release();
    }
};

const updateVideo = async (req, res) => {
    const { id: videoId } = req.params;
    const { userId } = req.user;
    const { title, description } = req.body;

    if (title === undefined && description === undefined) {
        return res.status(400).json({ error: 'At least one field (title or description) is required for update.' });
    }

    try {
        const videoResult = await pool.query('SELECT user_id FROM videos WHERE id = $1', [videoId]);
        if (videoResult.rows.length === 0) {
            return res.status(404).json({ error: 'Video not found' });
        }
        if (videoResult.rows[0].user_id !== userId) {
            return res.status(403).json({ error: 'You are not authorized to update this video' });
        }

        const fieldsToUpdate = [];
        const values = [];
        let paramIndex = 1;

        if (title !== undefined) {
            fieldsToUpdate.push(`title = $${paramIndex++}`);
            values.push(title);
        }

        if (description !== undefined) {
            fieldsToUpdate.push(`description = $${paramIndex++}`);
            values.push(description);
        }
        
        values.push(videoId);

        const query = `UPDATE videos SET ${fieldsToUpdate.join(', ')} WHERE id = $${paramIndex} RETURNING *`;

        const updatedResult = await pool.query(query, values);

        res.json(updatedResult.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error updating video' });
    }
};

const deleteVideo = async (req, res) => {
    const { id: videoId } = req.params;
    const { userId } = req.user;

    try {
        const videoResult = await pool.query('SELECT user_id, video_url, thumbnail_url FROM videos WHERE id = $1', [videoId]);
        if (videoResult.rows.length === 0) {
            return res.status(404).json({ error: 'Video not found' });
        }

        const video = videoResult.rows[0];

        if (video.user_id !== userId) {
            return res.status(403).json({ error: 'You are not authorized to delete this video' });
        }

        // Delete video and thumbnail files
        if (video.video_url) {
            const videoPath = path.resolve(__dirname, '..', 'uploads', path.basename(video.video_url));
            try {
                await fs.unlink(videoPath);
            } catch (err) {
                if (err.code !== 'ENOENT') {
                    console.error(`Error deleting video file ${videoPath}:`, err);
                }
            }
        }
        if (video.thumbnail_url) {
            const thumbnailPath = path.resolve(__dirname, '..', 'uploads', path.basename(video.thumbnail_url));
             try {
                await fs.unlink(thumbnailPath);
            } catch (err) {
                 if (err.code !== 'ENOENT') {
                    console.error(`Error deleting thumbnail file ${thumbnailPath}:`, err);
                 }
            }
        }

        await pool.query('DELETE FROM videos WHERE id = $1', [videoId]);

        res.status(200).json({ message: 'Video deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error deleting video' });
    }
};

module.exports = {
    uploadVideo,
    getAllVideos,
    getVideoById,
    updateVideo,
    deleteVideo,
    getCommentsForVideo,
    postComment,
    likeVideo,
};
