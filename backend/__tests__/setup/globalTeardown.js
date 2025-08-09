const fs = require('fs');
const path = require('path');

module.exports = async () => {
  const pidPath = path.join(__dirname, 'server.pid');
  try {
    if (fs.existsSync(pidPath)) {
      const pid = parseInt(fs.readFileSync(pidPath, 'utf8'), 10);
      if (!isNaN(pid)) {
        try { process.kill(pid); } catch {}
      }
      fs.unlinkSync(pidPath);
    }
  } catch {}
};
