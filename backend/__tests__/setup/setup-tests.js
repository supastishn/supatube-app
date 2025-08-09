const { newDb } = require('pg-mem');
const fs = require('fs');
const path = require('path');

// Create an in-memory database
const mockDb = newDb();

// Apply the schema
const sqlPath = path.join(__dirname, '..', '..', 'database.sql');
let schema = fs.readFileSync(sqlPath, 'utf8');
// pg-mem doesn't support triggers for full-text search. Remove them for tests.
schema = schema.replace(/-- index for full-text search[\s\S]+?EXECUTE FUNCTION videos_tsv_update\(\);/, '');
mockDb.public.none(schema);

// Create a backup of the initial state, so we can restore it before each test
const backup = mockDb.backup();

// Mock the db module to use our in-memory db pool
jest.mock('../../config/db', () => mockDb.adapters.createPg().pool);

// Restore the database before each test to ensure test isolation
beforeEach(() => {
  backup.restore();
});
