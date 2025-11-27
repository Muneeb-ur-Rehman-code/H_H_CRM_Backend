interface Config {
  port: number;
  mongoUri: string;
  jwtSecret: string;
  jwtExpire: string | number;  // Changed to accept both types
  nodeEnv: string;
  email: {
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
  };
  urls: {
    clientUrl: string;
    crmUrl: string;
  };
  ceo: {
    email: string;
    password: string;
    name: string;
  };
}

const config: Config = {
  port: parseInt(process.env.PORT || '5000', 10),
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/visa-crm',
  jwtSecret: process.env.JWT_SECRET || 'default-secret-change-this',
  jwtExpire: process.env.JWT_EXPIRE || '7d',  // This is correct as string
  nodeEnv: process.env.NODE_ENV || 'development',
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
    from: process.env.EMAIL_FROM || 'noreply@visaconsultancy.com'
  },
  urls: {
    clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
    crmUrl: process.env.CRM_URL || 'http://localhost:5173'
  },
  ceo: {
    email: process.env.CEO_EMAIL || 'ceo@visaconsultancy.com',
    password: process.env.CEO_PASSWORD || 'Admin@123456',
    name: process.env.CEO_NAME || 'Admin CEO'
  }
};

export default config;