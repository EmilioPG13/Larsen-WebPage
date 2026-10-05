import express from 'express';
import cors from 'cors';
import env from './config/env';

// Import routes
import authRoutes from './routes/auth.routes';
import productsRoutes from './routes/products.routes';
import machinesRoutes from './routes/machines.routes';
import brandsRoutes from './routes/brands.routes';
import leadsRoutes from './routes/leads.routes';
import usersRoutes from './routes/users.routes';
import inventoryRoutes from './routes/inventory.routes';
import catalogRoutes from './routes/catalog.routes';
import cronRoutes from './routes/cron.routes';

const app = express();

// Behind Vercel's proxy the client address is the last hop of X-Forwarded-For.
// Trusting exactly one hop keeps a spoofed header from picking the IP that the
// login throttle sees.
app.set('trust proxy', 1);

// Middleware
const allowedOrigins = env.CORS_ORIGIN.split(',').map(origin => origin.trim());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      // In development, allow localhost on any port
      if (env.NODE_ENV === 'development' && origin.startsWith('http://localhost:')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/machines', machinesRoutes);
app.use('/api/brands', brandsRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/cron', cronRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

export default app;
