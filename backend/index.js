require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const http = require('http');
const app = require('./app');
const { startLiveServer } = require('./services/liveStreamServer');
const { setupLiveChat } = require('./ws/liveChat');

const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

// Start RTMP/HLS live server
if (process.env.NODE_ENV !== 'test') {
  startLiveServer();
}

// Start WebSocket chat
setupLiveChat(server);

// Start listening only if the script is run directly
if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

// Export the app for testing, and the server for other potential needs
module.exports = { app, server };
