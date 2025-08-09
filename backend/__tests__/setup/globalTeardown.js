const pool = require('../../config/db');

module.exports = async () => {
  // We close the database pool to prevent open handles.
  await pool.end();
};
