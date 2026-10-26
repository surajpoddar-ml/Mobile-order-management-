import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import productRoutes from './routes/productRoutes.js';
import adRoutes from './routes/adRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import rewardRoutes from './routes/rewardRoutes.js';
import stickerRoutes from './routes/stickerRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import { seedDatabase } from './database/seed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded media files statically
const uploadsPath = path.resolve(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/advertisements', adRoutes);
app.use('/api/stickers', stickerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/payments', paymentRoutes);

let dbConnected = false;
let dbError = null;

// Health check endpoint with diagnostic information
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: dbConnected ? 'healthy' : 'database_unavailable',
    database: {
      connected: dbConnected,
      error: dbError || null
    },
    timestamp: new Date().toISOString()
  });
});

// Root endpoint - redirect to frontend if CLIENT_URL is set, or return API status
app.get('/', (req, res) => {
  if (process.env.CLIENT_URL) {
    return res.redirect(process.env.CLIENT_URL);
  }
  res.status(200).json({
    name: 'MWS Eagle Marketplace Backend API',
    status: 'online',
    healthCheck: '/api/health'
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error occurred.'
  });
});

// Start HTTP server immediately so cloud platforms and LiteSpeed can connect
const listenPort = typeof process.env.PORT !== 'undefined' ? process.env.PORT : 5001;
const server = app.listen(listenPort, () => {
  console.log(`===============================================`);
  console.log(` MWS EAGLE — Mobile Parts Marketplace Server`);
  console.log(` Listening on: ${listenPort}`);
  console.log(` Health check: /api/health`);
  console.log(` Media uploads: /uploads`);
  console.log(`===============================================`);

  // Initialize and seed database in background without crashing the web service
  seedDatabase()
    .then(() => {
      dbConnected = true;
      console.log('[DATABASE] MySQL tables initialized and seeded successfully.');
    })
    .catch((err) => {
      dbError = err.message;
      console.error('[DATABASE ERROR] Failed to connect/seed database:', err.message);
      console.error('[DATABASE GUIDE] Ensure DATABASE_URL or DB_HOST, DB_USER, DB_PASSWORD, DB_NAME are set in your hosting dashboard.');
    });
});

export default app;

