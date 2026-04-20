const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const { ensureDatabaseSchema } = require('./config/migrate');

const app = express();

function resolveTrustProxy() {
  const raw = process.env.TRUST_PROXY;
  if (raw == null || raw === '') {
    return 1;
  }

  if (raw === 'true') {
    return 1;
  }

  if (raw === 'false') {
    return 0;
  }

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 1;
}

app.set('trust proxy', resolveTrustProxy());

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/teacher', apiLimiter, require('./routes/teacher'));
app.use('/api/student', apiLimiter, require('./routes/student'));
app.use('/api/documents', apiLimiter, require('./routes/documents'));
app.use('/api/chat', apiLimiter, require('./routes/chat'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 5000;
if (require.main === module) {
  ensureDatabaseSchema()
    .then(() => {
      app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch((err) => {
      console.error('Failed to start server:', err);
      process.exit(1);
    });
}

module.exports = app;
