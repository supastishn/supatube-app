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
        // Determine visibility: request body > user settings default > 'public'
        let visibility = (req.body.visibility || '').toLowerCase();
        if (visibility && !['public','unlisted','private'].includes(visibility)) {
            return res.status(400).json({ error: 'Invalid visibility value' });
        }
        if (!visibility) {
            const settings = await pool.query('SELECT default_upload_visibility FROM user_settings WHERE user_id = $1', [userId]);
            visibility = settings.rowCount ? settings.rows[0].default_upload_visibility : 'public';
        }

        const result = await pool.query(
            'INSERT INTO videos (title, description, user_id, video_url, thumbnail_url, visibility, processing_status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [title.trim(), description || null, userId, videoUrl, thumbnailUrl, visibility, 'processing']
        );
        const video = result.rows[0];
        // Include secure streaming URLs to encourage clients to use them
        video.stream_url = `/api/videos/${video.id}/stream`;
        video.thumbnail_stream_url = `/api/videos/${video.id}/thumbnail`;
        res.status(201).json(video);

        // Notify subscribers about new video
        try {
            const { notifyNewVideoToSubscribers } = require('../services/notificationService');
            notifyNewVideoToSubscribers({ id: video.id, user_id: video.user_id, title: video.title });
        } catch (e) {
            console.error('Failed to send new video notifications:', e);
        }

        // Fire-and-forget enqueue of transcoding job (no await to avoid delaying response)
        try {
            const { enqueueTranscode } = require('../services/transcodeService');
            enqueueTranscode({
                videoId: video.id,
                inputPath: path.resolve(__dirname, '..', 'uploads', path.basename(video.video_url))
            });
        } catch (e) {
            console.error('Failed to enqueue transcode job:', e);
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error uploading video' });
    }
};

const getAllVideos = async (req, res) => {
    const { userId, q, visibility } = req.query;
    const requesterId = req.user ? req.user.userId : null;

    let query = `
        SELECT v.*, u.username as channel,
        (SELECT COUNT(*) FROM likes WHERE video_id = v.id)::int as likes_count
        FROM videos v
        JOIN users u ON v.user_id = u.id
    `;
    const queryParams = [];

    const filters = [];

    if (userId) {
        filters.push(`v.user_id = $${queryParams.length + 1}`);
        queryParams.push(userId);
    }

    if (q) {
        filters.push(`(v.title ILIKE $${queryParams.length + 1} OR v.description ILIKE $${queryParams.length + 1})`);
        queryParams.push(`%${q}%`);
    }

    // Visibility rules:
    // - By default show only public videos (do NOT list unlisted)
    // - If requester is the channel owner (userId === requesterId), allow all visibilities unless explicitly filtered.
    if (userId && requesterId && String(userId) === String(requesterId)) {
        if (visibility && ['public','unlisted','private'].includes(visibility)) {
            filters.push(`v.visibility = $${queryParams.length + 1}`);
            queryParams.push(visibility);
        }
        // else owner's full list across all visibilities
    } else {
        // Not the owner or no userId filter: only public
        filters.push(`v.visibility = 'public'`);
    }

    if (filters.length) {
        query += ' WHERE ' + filters.join(' AND ');
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
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

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

            if (videoResult.rowCount === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Video not found' });
            }

            const video = videoResult.rows[0];

            if (video.visibility === 'private' && video.user_id !== userId) {
                await client.query('ROLLBACK');
                return res.status(403).json({ error: 'This video is private' });
            }

            // Increment views now that we know user is authorized to view
            await client.query('UPDATE videos SET views = views + 1 WHERE id = $1', [id]);
            await client.query('COMMIT');

            video.views++;
            res.json(video);
        } catch (e) {
            await client.query('ROLLBACK');
            throw e; // re-throw to be caught by outer catch
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
        const videoRes = await pool.query('SELECT user_id, visibility, comments_enabled FROM videos WHERE id = $1', [id]);
        if (videoRes.rowCount === 0) return res.status(404).json({ error: 'Video not found' });
        const video = videoRes.rows[0];
        const requesterId = req.user ? req.user.userId : null;
        if (video.visibility === 'private' && video.user_id !== requesterId) {
            return res.status(403).json({ error: 'Comments are private for this video' });
        }

        if (video.comments_enabled === false) {
            return res.json([]);
        }

        const queryParams = [id];
        if (req.user) queryParams.push(req.user.userId);
        const result = await pool.query(
            `SELECT c.*, 
                    u.username,
                    (SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = c.id)::int AS likes_count,
                    ${req.user ? `EXISTS(SELECT 1 FROM comment_likes cl2 WHERE cl2.comment_id = c.id AND cl2.user_id = $2)` : 'false'} AS user_has_liked
             FROM comments c JOIN users u ON c.user_id = u.id
             WHERE c.video_id = $1
             ORDER BY c.created_at ASC`,
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
    const { comment, parentCommentId } = req.body;
    const { userId } = req.user;

    if (!comment || !comment.trim()) {
        return res.status(400).send('Comment is required');
    }

    try {
        const videoRes = await pool.query('SELECT user_id, visibility, comments_enabled, made_for_kids FROM videos WHERE id = $1', [videoId]);
        if (videoRes.rowCount === 0) return res.status(404).json({ error: 'Video not found' });
        const video = videoRes.rows[0];
        if (video.visibility === 'private' && video.user_id !== userId) return res.status(403).json({ error: 'Cannot comment on a private video' });
        if (video.comments_enabled === false) return res.status(403).json({ error: 'Comments disabled' });

        // If replying, ensure parent exists and belongs to same video
        if (parentCommentId) {
            const parent = await pool.query('SELECT id, video_id FROM comments WHERE id = $1', [parentCommentId]);
            if (parent.rowCount === 0) return res.status(400).json({ error: 'Parent comment not found' });
            if (String(parent.rows[0].video_id) !== String(videoId)) return res.status(400).json({ error: 'Parent comment does not belong to this video' });
        }

        const result = await pool.query(
            'INSERT INTO comments (video_id, user_id, parent_comment_id, comment) VALUES ($1, $2, $3, $4) RETURNING *',
            [videoId, userId, parentCommentId || null, comment.trim()]
        );
        const newComment = result.rows[0];

        // Attach username to the new comment for the response
        const userResult = await pool.query('SELECT username FROM users WHERE id = $1', [userId]);
        newComment.username = userResult.rows[0].username;

        // If reply to a comment, notify parent comment author
        if (newComment.parent_comment_id) {
            const parentRes = await pool.query('SELECT id, user_id FROM comments WHERE id = $1', [newComment.parent_comment_id]);
            if (parentRes.rowCount) {
                const parentComment = { ...parentRes.rows[0], video_id: Number(videoId) };
                try {
                    const { notifyCommentReply } = require('../services/notificationService');
                    notifyCommentReply(parentComment, { id: newComment.id, user_id: userId, video_id: Number(videoId), comment: newComment.comment });
                } catch (e) { console.error('Failed to notify comment reply:', e); }
            }
        }

        // Notify video owner of new top-level comment
        if (!newComment.parent_comment_id) {
            try {
                const { notifyNewCommentOnVideo } = require('../services/notificationService');
                notifyNewCommentOnVideo({ id: Number(videoId), user_id: video.user_id }, userId, newComment.id, newComment.comment);
            } catch (e) { console.error('Failed to notify new comment:', e); }
        }

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

        // Ensure video exists
        const exists = await client.query('SELECT 1 FROM videos WHERE id = $1', [videoId]);
        if (exists.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Video not found' });
        }

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
    const { title, description, visibility } = req.body;

    if (title === undefined && description === undefined && visibility === undefined) {
        return res.status(400).json({ error: 'At least one field (title, description, or visibility) is required for update.' });
    }

    if (visibility && !['public','unlisted','private'].includes(visibility)) {
        return res.status(400).json({ error: 'Invalid visibility value' });
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

        if (visibility !== undefined) {
            fieldsToUpdate.push(`visibility = $${paramIndex++}`);
            values.push(visibility);
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

const getMimeFromExt = (filename) => {
    const ext = (filename.split('.').pop() || '').toLowerCase();
    if (['mp4'].includes(ext)) return 'video/mp4';
    if (['webm'].includes(ext)) return 'video/webm';
    if (['ogg', 'ogv'].includes(ext)) return 'video/ogg';
    if (['mov', 'qt'].includes(ext)) return 'video/quicktime';
    if (['jpg','jpeg'].includes(ext)) return 'image/jpeg';
    if (['png'].includes(ext)) return 'image/png';
    if (['webp'].includes(ext)) return 'image/webp';
    return 'application/octet-stream';
};

const streamVideo = async (req, res) => {
    const { id } = req.params;
    const requesterId = req.user ? req.user.userId : null;
    try {
        const result = await pool.query("SELECT id, user_id, video_url, video_480p_url, video_720p_url, video_1080p_url, visibility, processing_status FROM videos WHERE id = $1", [id]);
        if (result.rowCount === 0) return res.status(404).json({ error: 'Video not found' });
        const video = result.rows[0];

        if (video.visibility === 'private' && video.user_id !== requesterId) {
            return res.status(403).json({ error: 'This video is private' });
        }

        if (video.processing_status !== 'ready' && !video.video_480p_url) {
            res.setHeader('Retry-After', '30');
            return res.status(425).json({ error: 'Video is still processing' });
        }

        // Choose best available rendition. If processing, fall back to original.
        let fileUrl = video.video_480p_url || video.video_url;
        const filePath = path.resolve(__dirname, '..', 'uploads', path.basename(fileUrl));
        let stat;
        try {
            stat = await fs.stat(filePath);
        } catch (e) {
            return res.status(404).json({ error: 'File not found' });
        }

        const range = req.headers.range;
        const mime = getMimeFromExt(filePath);
        if (!range) {
            res.writeHead(200, {
                'Content-Length': stat.size,
                'Content-Type': mime,
                'Accept-Ranges': 'bytes',
            });
            require('fs').createReadStream(filePath).pipe(res);
        } else {
            const parts = range.replace(/bytes=/, '').split('-');
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
            if (start >= stat.size || end >= stat.size) {
                res.status(416).set({
                    'Content-Range': `bytes */${stat.size}`,
                }).end();
                return;
            }
            const chunkSize = end - start + 1;
            res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${stat.size}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunkSize,
                'Content-Type': mime,
            });
            require('fs').createReadStream(filePath, { start, end }).pipe(res);
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error streaming video' });
    }
};

const streamThumbnail = async (req, res) => {
    const { id } = req.params;
    const requesterId = req.user ? req.user.userId : null;
    try {
        const result = await pool.query('SELECT id, user_id, thumbnail_url, visibility FROM videos WHERE id = $1', [id]);
        if (result.rowCount === 0) return res.status(404).json({ error: 'Video not found' });
        const video = result.rows[0];
        if (!video.thumbnail_url) return res.status(404).json({ error: 'Thumbnail not available' });
        if (video.visibility === 'private' && video.user_id !== requesterId) {
            return res.status(403).json({ error: 'This thumbnail is private' });
        }
        const filePath = path.resolve(__dirname, '..', 'uploads', path.basename(video.thumbnail_url));
        let stat;
        try {
            stat = await fs.stat(filePath);
        } catch (e) {
            return res.status(404).json({ error: 'File not found' });
        }
        const mime = getMimeFromExt(filePath);
        res.writeHead(200, {
            'Content-Length': stat.size,
            'Content-Type': mime,
            'Cache-Control': 'public, max-age=86400',
        });
        require('fs').createReadStream(filePath).pipe(res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error streaming thumbnail' });
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
    streamVideo,
    streamThumbnail,
};
