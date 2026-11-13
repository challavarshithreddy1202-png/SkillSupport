import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Routes
import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import goalRoutes from './routes/goalRoutes.js';
import skillGapRoutes from './routes/skillGapRoutes.js';
import roadmapRoutes from './routes/roadmapRoutes.js';
import resourceRoutes from './routes/resourceRoutes.js';
import progressRoutes from './routes/progressRoutes.js';
import assistantRoutes from './routes/assistantRoutes.js';
import systemRoutes from './routes/systemRoutes.js';

import { notFoundHandler, globalErrorHandler } from './middleware/errorHandler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '5mb' }));

// Health / Root check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'SkillSupport API', timestamp: new Date().toISOString() });
});

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/skill-gap', skillGapRoutes);
app.use('/api/roadmaps', roadmapRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/system', systemRoutes);

// Serve static frontend build if client/dist exists
const clientDistPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// 404 & Global Error Handlers for API
app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
