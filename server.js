// Server Entry Point
require('dotenv').config();
const app = require('./src/app');
const { pool } = require('./src/config/database');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

console.log('Environment variables:');
console.log('- PORT:', process.env.PORT || '(not set, using 3000)');
console.log('- HOST:', process.env.HOST || '(not set, using 0.0.0.0)');
console.log('- NODE_ENV:', process.env.NODE_ENV || '(not set)');
console.log('- DATABASE_URL:', process.env.DATABASE_URL ? '(set)' : '(NOT SET)');

let isShuttingDown = false;

// Graceful shutdown handler
const shutdown = async (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`${signal} signal received: closing HTTP server`);

  server.close(async () => {
    console.log('HTTP server closed');
    try {
      await pool.end();
      console.log('Database pool closed');
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Start server - bind to 0.0.0.0 for Railway
const server = app.listen(PORT, HOST, () => {
  console.log('=================================');
  console.log('🚀 Server is running!');
  console.log(`📡 Host: ${HOST}`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://${HOST}:${PORT}/health`);
  console.log(`👨‍💼 Admin dashboard: http://${HOST}:${PORT}/admin`);
  console.log('=================================');
});

// Handle server errors
server.on('error', (error) => {
  console.error('❌ Server error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
  }
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
