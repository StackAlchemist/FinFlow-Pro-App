import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import errorHandler from './middlewares/errorHandler';
import logger from './utils/logger';

// Routes will be imported here as we build each week:
// import authRoutes        from './routes/auth.routes';
// import walletRoutes      from './routes/wallet.routes';
// import transactionRoutes from './routes/transaction.routes';
// import payoutRoutes      from './routes/payout.routes';
// import adminRoutes       from './routes/admin.routes';

const createApp = (): Application => {
  const app = express();

  app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  const globalLimiter = rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX) || 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later.' },
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { success: false, message: 'Too many auth attempts, please try again in 15 minutes.' },
  });

  app.use('/api', globalLimiter);
  app.use('/api/v1/auth', authLimiter);

  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined', {
      stream: { write: (msg) => logger.info(msg.trim()) },
    }));
  }

  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      success: true,
      message: 'FinFlow Pro API is running',
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  });

  // app.use('/api/v1/auth',         authRoutes);
  // app.use('/api/v1/wallets',      protect, walletRoutes);
  // app.use('/api/v1/transactions', protect, transactionRoutes);
  // app.use('/api/v1/payouts',      protect, payoutRoutes);
  // app.use('/api/v1/admin',        protect, adminOnly, adminRoutes);

  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      message: `Route not found`,
    });
  });

  app.use(errorHandler);

  return app;
};

export default createApp;