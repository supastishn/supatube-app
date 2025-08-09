const path = require('path');

module.exports = async () => {
  process.env.NODE_ENV = 'test';
  // Default test env values if not provided
  process.env.PORT = process.env.TEST_PORT || '3101';
  process.env.DB_HOST = process.env.TEST_DB_HOST || process.env.DB_HOST || 'localhost';
  process.env.DB_PORT = process.env.TEST_DB_PORT || process.env.DB_PORT || '5432';
  process.env.DB_USER = process.env.TEST_DB_USER || process.env.DB_USER || 'postgres';
  process.env.DB_PASSWORD = process.env.TEST_DB_PASSWORD || process.env.DB_PASSWORD || '';
  process.env.DB_DATABASE = process.env.TEST_DB_DATABASE || 'yt_clone_test';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';
  process.env.CORS_ORIGIN = '*';
  process.env.RTMP_PORT = process.env.RTMP_PORT || '1936';
  process.env.RTMP_HTTP_PORT = process.env.RTMP_HTTP_PORT || '8002';

  // The server is no longer started here. Tests will use the in-memory app instance.
  // The database is now mocked using pg-mem.
};
