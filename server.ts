import dotenv from 'dotenv';
dotenv.config();

import app from './src/app';
import connectDB from './src/config/database';
import seedCEO from './src/seeders/ceo.seeder';

// Auto-seed CEO function
const initializeSystem = async (): Promise<void> => {
  try {
    // Connect to database
    await connectDB();
    
    // Auto-seed CEO if not exists
    console.log('🌱 Checking for CEO account...');
    await seedCEO();
    
    console.log('✅ System initialization complete');
  } catch (error) {
    console.error('❌ System initialization failed:', error);
    process.exit(1);
  }
};

// Start server
const startServer = async (): Promise<void> => {
  await initializeSystem();
  
  const PORT = process.env.PORT || 5000;
  
  const server = app.listen(PORT, () => {
    console.log(`
      🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}
      📍 Health check: http://localhost:${PORT}/health
      📍 API Docs: http://localhost:${PORT}/api
    `);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err: Error) => {
    console.error(`❌ Unhandled Rejection: ${err.message}`);
    server.close(() => process.exit(1));
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (err: Error) => {
    console.error(`❌ Uncaught Exception: ${err.message}`);
    process.exit(1);
  });
};

startServer();