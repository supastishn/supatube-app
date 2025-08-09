const { newDb } = require('pg-mem');
const fs = require('fs');
const path = require('path');

// Mock transcode service to prevent async errors from ffmpeg
jest.mock('../../services/transcodeService', () => ({
  enqueueTranscode: jest.fn(),
}));

// Create an in-memory database
const mockDb = newDb();

// Apply the schema
const sqlPath = path.join(__dirname, '..', '..', 'database.sql');
let schema = fs.readFileSync(sqlPath, 'utf8');
// pg-mem doesn't support triggers for full-text search. Remove them for tests.
schema = schema.replace(/-- index for full-text search[\s\S]+?EXECUTE FUNCTION videos_tsv_update\(\);/, '');
// pg-mem also doesn't support the tsvector type.
schema = schema.replace(/,\s*search_vector tsvector/, '');
// pg-mem may have issues with ON DELETE CASCADE, but it's required for tests to pass.
mockDb.public.none(schema);

// Create a backup of the initial state, so we can restore it before each test
const backup = mockDb.backup();

// Mock the db module to use our in-memory db pool
jest.mock('../../config/db', () => new (mockDb.adapters.createPg().Pool)());

// Restore the database before all tests in a file to ensure a clean slate,
// while allowing sequential tests within a file to build on each other.
beforeAll(() => {
  backup.restore();
});
