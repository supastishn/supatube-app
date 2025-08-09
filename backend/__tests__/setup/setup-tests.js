const { newDb } = require('pg-mem');
const fs = require('fs');
const path = require('path');

// Create an in-memory database
const mockDb = newDb();

// Apply the schema
const sqlPath = path.join(__dirname, '..', '..', 'database.sql');
const schema = fs.readFileSync(sqlPath, 'utf8');
mockDb.public.none(schema);

// Create a backup of the initial state, so we can restore it before each test
const backup = mockDb.backup();

// Mock the db module to use our in-memory db pool
jest.mock('../../config/db', () => mockDb.adapters.createPg().pool);

// Restore the database before each test to ensure test isolation
beforeEach(() => {
  backup.restore();
});
