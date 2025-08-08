const NodeMediaServer = require('node-media-server');
const { path: ffprobePath } = require('ffprobe-static');
const ffmpegPath = require('ffmpeg-static');
const pool = require('../config/db');
const crypto = require('crypto');

function generateKey() {
  return crypto.randomBytes(16).toString('hex');
}

async function ensureUserStreamKey(userId) {
  const res = await pool.query('SELECT * FROM live_streams WHERE user_id = $1 ORDER BY id LIMIT 1', [userId]);
  if (res.rowCount > 0) return res.rows[0];
  const key = generateKey();
  const insert = await pool.query(
    `INSERT INTO live_streams (user_id, title, stream_key, status) VALUES ($1, $2, $3, 'offline') RETURNING *`,
    [userId, null, key]
  );
  return insert.rows[0];
}

async function resetUserStreamKey(userId) {
  const key = generateKey();
  const res = await pool.query(
    `INSERT INTO live_streams (user_id, title, stream_key, status)
     VALUES ($1, NULL, $2, 'offline')
     ON CONFLICT (stream_key) DO NOTHING
     RETURNING *`, [userId, key]
  );
  if (res.rowCount > 0) return res.rows[0];
  // Fallback: update existing
  const upd = await pool.query('UPDATE live_streams SET stream_key = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 RETURNING *', [key, userId]);
  if (upd.rowCount > 0) return upd.rows[0];
  return ensureUserStreamKey(userId);
}

let nms;

function startLiveServer() {
  if (nms) return nms;
  const config = {
    rtmp: {
      port: parseInt(process.env.RTMP_PORT || '1935', 10),
      chunk_size: 60000,
      gop_cache: true,
      ping: 30,
      ping_timeout: 60
    },
    http: {
      port: parseInt(process.env.RTMP_HTTP_PORT || '8000', 10),
      allow_origin: '*'
    },
    trans: {
      ffmpeg: ffmpegPath,
      ffprobe: ffprobePath,
      tasks: [
        {
          app: 'live',
          hls: true,
          hlsFlags: '[hls_time=2:hls_list_size=6:hls_flags=delete_segments]'
        }
      ]
    }
  };

  nms = new NodeMediaServer(config);

  nms.on('prePublish', async (id, StreamPath, args) => {
    try {
      // StreamPath like: /live/STREAM_KEY
      const key = StreamPath.split('/').pop();
      const q = await pool.query('SELECT * FROM live_streams WHERE stream_key = $1', [key]);
      if (q.rowCount === 0) {
        nms.getSession(id).reject();
        return;
      }
      const row = q.rows[0];
      const httpPort = config.http.port;
      const origin = process.env.LIVE_ORIGIN || `http://localhost:${httpPort}`;
      const playback = `${origin}/live/${key}.m3u8`;
      await pool.query('UPDATE live_streams SET status = \'live\', playback_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [playback, row.id]);
    } catch (e) { console.error('prePublish error', e); }
  });

  nms.on('donePublish', async (id, StreamPath, args) => {
    try {
      const key = StreamPath.split('/').pop();
      await pool.query('UPDATE live_streams SET status = \'offline\', updated_at = CURRENT_TIMESTAMP WHERE stream_key = $1', [key]);
    } catch (e) { console.error('donePublish error', e); }
  });

  nms.run();
  console.log('NodeMediaServer live streaming started');
  return nms;
}

module.exports = { startLiveServer, ensureUserStreamKey, resetUserStreamKey };
