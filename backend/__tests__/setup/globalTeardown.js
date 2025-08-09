const pool = require('../../config/db');

module.exports = async () => {
  // The server process is no longer managed by setup/teardown.
  // We should, however, close the database pool to prevent open handles.
  await pool.end();
};
