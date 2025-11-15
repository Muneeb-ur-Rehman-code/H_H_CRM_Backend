import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { CONSTANTS } from './config/constants';
import config from './config/config';

// Import routes
import authRoutes from './routes/auth.routes';
import ceoRoutes from './routes/ceo.routes';
import consultantRoutes from './routes/consultant.routes';

// Import middleware
import errorHandler from './middleware/error.middleware';

const app: Application = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: [config.urls.clientUrl, config.urls.crmUrl],
    credentials: true
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: CONSTANTS.RATE_LIMIT.WINDOW_MS,
  max: CONSTANTS.RATE_LIMIT.MAX_REQUESTS,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/ceo', ceoRoutes);
app.use('/api/consultant', consultantRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv
  });
});

// API Documentation
app.get('/api', (req, res) => {
  res.status(200).json({
    message: 'Visa CRM API',
    version: '1.0.0',
    endpoints: {
      auth: {
        staffLogin: 'POST /api/auth/staff/login',
        studentLogin: 'POST /api/auth/student/login',
        adminLogin: 'POST /api/auth/admin/login',
        checkEmail: 'POST /api/auth/student/check-email',
        register: 'POST /api/auth/student/register',
        setPassword: 'POST /api/auth/student/set-password',
        verify: 'GET /api/auth/verify'
      },
      ceo: {
        createStaff: 'POST /api/ceo/staff',
        getAllStaff: 'GET /api/ceo/staff',
        updateStaff: 'PUT /api/ceo/staff/:id',
        toggleStatus: 'PATCH /api/ceo/staff/:id/status',
        resetPassword: 'POST /api/ceo/staff/:id/reset-password',
        stats: 'GET /api/ceo/dashboard/stats'
      },
      consultant: {
        addClient: 'POST /api/consultant/potential-clients',
        getClients: 'GET /api/consultant/potential-clients',
        updateClient: 'PUT /api/consultant/potential-clients/:id',
        approveClient: 'POST /api/consultant/potential-clients/:id/approve',
        rejectClient: 'POST /api/consultant/potential-clients/:id/reject',
        getLeads: 'GET /api/consultant/leads'
      }
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use(errorHandler);

export default app;