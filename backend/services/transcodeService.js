const path = require('path');
const fs = require('fs');
const fsp = require('fs').promises;
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const ffprobePath = require('ffprobe-static').path;
const pool = require('../config/db');

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

// Simple in-memory FIFO queue
const queue = [];
let processing = false;

function enqueueTranscode(job) {
  queue.push(job);
  processNext();
}

async function processNext() {
  if (processing || queue.length === 0) return;
  processing = true;
  const job = queue.shift();
  try {
    await handleJob(job);
  } catch (e) {
    console.error('Transcode job failed', e);
    try {
      if (job && job.videoId) {
        await pool.query("UPDATE videos SET processing_status = 'failed' WHERE id = $1", [job.videoId]);
      }
    } catch (dbErr) {
      console.error('Failed to mark video as failed:', dbErr);
    }
  } finally {
    processing = false;
    // Continue with next job
    if (queue.length) setImmediate(processNext);
  }
}

async function handleJob({ videoId, inputPath }) {
  // Update DB to mark processing in case it wasn't set
  await pool.query("UPDATE videos SET processing_status = 'processing' WHERE id = $1", [videoId]);

  const uploadsDir = path.resolve(__dirname, '..', 'uploads');
  const baseName = path.basename(inputPath, path.extname(inputPath));

  const outputs = [
    { label: '480p', height: 480, vbitrate: '1200k', abitrate: '128k' },
    { label: '720p', height: 720, vbitrate: '3000k', abitrate: '160k' },
    { label: '1080p', height: 1080, vbitrate: '5000k', abitrate: '192k' },
  ];

  const outPaths = {};

  for (const variant of outputs) {
    const outFile = `${baseName}-${variant.label}.mp4`;
    const outFull = path.join(uploadsDir, outFile);
    await transcodeVariant(inputPath, outFull, variant.height, variant.vbitrate, variant.abitrate);
    outPaths[variant.label] = `/uploads/${outFile}`;
  }

  // Clean up original upload if desired to save space; keep it for now
  // Optionally, generate a poster/thumbnail frame if no thumbnail provided


  // Probe duration
  const duration = await probeDuration(inputPath);

  await pool.query(
    `UPDATE videos SET 
      video_480p_url = $1,
      video_720p_url = $2,
      video_1080p_url = $3,
      processing_status = 'ready',
      duration_seconds = COALESCE(duration_seconds, $4)
     WHERE id = $5`,
    [outPaths['480p'], outPaths['720p'], outPaths['1080p'], duration, videoId]
  );
}

function transcodeVariant(input, output, height, vbitrate, abitrate) {
  return new Promise((resolve, reject) => {
    ffmpeg(input)
      .videoCodec('libx264')
      .audioCodec('aac')
      .size(`?x${height}`)
      .outputOptions([
        '-movflags +faststart',
        `-b:v ${vbitrate}`,
        `-maxrate ${vbitrate}`,
        '-bufsize 2M',
        `-b:a ${abitrate}`
      ])
      .format('mp4')
      .on('error', reject)
      .on('end', resolve)
      .save(output);
  });
}

function probeDuration(input) {
  return new Promise((resolve) => {
    ffmpeg.ffprobe(input, (err, data) => {
      if (err) {
        console.error('ffprobe error:', err);
        return resolve(null);
      }
      try {
        const streams = data.streams || [];
        const vs = streams.find(s => s.codec_type === 'video');
        const duration = parseFloat((data.format && data.format.duration) || (vs && vs.duration));
        if (!isFinite(duration)) return resolve(null);
        resolve(Math.round(duration));
      } catch (e) {
        console.error('ffprobe parse error:', e);
        resolve(null);
      }
    });
  });
}

module.exports = { enqueueTranscode };
