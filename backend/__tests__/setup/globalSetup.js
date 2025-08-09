const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { Client } = require('pg');

let serverProcess;

async function initDb() {
  const dbConfig = {
    user: process.env.TEST_DB_USER || process.env.DB_USER || 'postgres',
    host: process.env.TEST_DB_HOST || process.env.DB_HOST || 'localhost',
    database: process.env.TEST_DB_DATABASE || 'yt_clone_test',
    password: process.env.TEST_DB_PASSWORD || process.env.DB_PASSWORD || '',
    port: +(process.env.TEST_DB_PORT || process.env.DB_PORT || 5432),
  };

  const client = new Client({ ...dbConfig, database: 'postgres' });
  await client.connect();
  // Create test db if not exists
  const dbName = dbConfig.database;
  const existsRes = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]);
  if (existsRes.rowCount === 0) {
    await client.query(`CREATE DATABASE ${dbName}`);
  }
  await client.end();

  // Apply schema
  const schemaClient = new Client(dbConfig);
  await schemaClient.connect();
  const sqlPath = path.join(__dirname, '..', '..', 'database.sql');
  const schema = fs.readFileSync(sqlPath, 'utf8');
  await schemaClient.query('BEGIN');
  await schemaClient.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  await schemaClient.query(schema);
  await schemaClient.query('COMMIT');
  await schemaClient.end();
}

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

  await initDb();

  // Start server as child process
  const serverPath = path.join(__dirname, '..', '..', 'index.js');
  serverProcess = spawn('node', [serverPath], {
    env: { ...process.env },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  await new Promise((resolve, reject) => {
    let ready = false;
    const onData = (data) => {
      const line = data.toString();
      if (line.includes('Server is running on port')) {
        ready = true;
        cleanup();
        resolve();
      }
    };
    const onErr = (data) => {
      // Allow logs but not crash
      // console.error('server err:', data.toString());
    };
    const cleanup = () => {
      serverProcess.stdout.off('data', onData);
      serverProcess.stderr.off('data', onErr);
    };
    serverProcess.stdout.on('data', onData);
    serverProcess.stderr.on('data', onErr);
    serverProcess.on('error', reject);
    // Fallback timeout
    setTimeout(() => {
      if (!ready) resolve();
    }, 5000);
  });

  // Save pid to a file for teardown
  const pidPath = path.join(__dirname, 'server.pid');
  fs.writeFileSync(pidPath, String(serverProcess.pid));
};
