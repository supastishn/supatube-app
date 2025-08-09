const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const morgan = require('morgan');
const apiRoutes = require('./routes');

const app = express();

// --- Middleware ---
app.use(helmet({
  crossOriginEmbedderPolicy: false,
}));
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));
app.use(express.json({ limit: '2mb' }));
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Basic global rate limit to protect the API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Adjust per your scale
  // Tests should not be rate-limited
  skip: () => process.env.NODE_ENV === 'test'
});
app.use('/api/', apiLimiter);

// Serve static files from the 'uploads' directory
const uploadDir = path.join(__dirname, 'uploads');
// Serve uploads with appropriate headers; turn off directory indexing implicitly
app.use('/uploads', express.static(uploadDir, {
  acceptRanges: true,
  setHeaders: (res) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
}));

// --- API Routes ---
app.get('/', (req, res) => {
  res.send('Hello from Express backend for YouTube Clone!');
});

app.use('/api', apiRoutes);

module.exports = app;
