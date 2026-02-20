const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const vendorRoutes = require('./routes/vendorRoutes');
const adminRoutes = require('./routes/adminRoutes');
const errorMiddleware = require('./middleware/errorMiddleware');
const env = require('./config/env');

const app = express();
const allowedOrigins = env.clientUrl
  .split(',')
  .map((item) => item.trim().replace(/^['"]|['"]$/g, ''))
  .filter(Boolean)
  .map((item) => {
    if (item === '*') return '*';
    try {
      return new URL(item).origin;
    } catch (error) {
      return item;
    }
  });

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);
app.use(
  cors({
    origin: (origin, callback) => {
      const isGithubPages = origin && /^https:\/\/[a-z0-9-]+\.github\.io$/i.test(origin);
      if (
        !origin ||
        allowedOrigins.includes('*') ||
        allowedOrigins.includes(origin) ||
        isGithubPages
      ) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(mongoSanitize());
app.use(morgan('combined'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'offeyrdeals-server' });
});

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use(errorMiddleware);

module.exports = app;
