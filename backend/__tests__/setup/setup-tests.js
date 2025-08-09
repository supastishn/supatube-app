const { newDb } = require('pg-mem');
const fs = require('fs');
const path = require('path');

// Create an in-memory database
const db = newDb();

// Apply the schema
const sqlPath = path.join(__dirname, '..', '..', 'database.sql');
const schema = fs.readFileSync(sqlPath, 'utf8');
db.public.none(schema);

// Create a backup of the initial state, so we can restore it before each test
const backup = db.backup();

// Mock the db module to use our in-memory db pool
jest.mock('../../config/db', () => db.adapters.createPg().pool);

// Restore the database before each test to ensure test isolation
beforeEach(() => {
  backup.restore();
});
