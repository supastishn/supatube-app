const { WebSocketServer } = require('ws');

function setupLiveChat(server) {
  const wss = new WebSocketServer({ server, path: '/ws/live' });
  const rooms = new Map(); // streamKey -> Set of sockets

  function joinRoom(ws, streamKey) {
    if (!rooms.has(streamKey)) rooms.set(streamKey, new Set());
    rooms.get(streamKey).add(ws);
    ws._streamKey = streamKey;
  }
  function leaveRoom(ws) {
    const key = ws._streamKey;
    if (!key) return;
    const set = rooms.get(key);
    if (!set) return;
    set.delete(ws);
    if (set.size === 0) rooms.delete(key);
  }

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const streamKey = url.searchParams.get('key');
    if (!streamKey) {
      ws.close(1008, 'Missing stream key');
      return;
    }
    joinRoom(ws, streamKey);

    ws.on('message', (raw) => {
      let msg;
      try { msg = JSON.parse(raw.toString()); } catch { return; }
      if (!msg || typeof msg.text !== 'string') return;
      // Broadcast to the room
      const payload = JSON.stringify({ text: msg.text.substring(0, 500), ts: Date.now() });
      const conns = rooms.get(streamKey) || new Set();
      for (const client of conns) {
        if (client.readyState === client.OPEN) client.send(payload);
      }
    });

    ws.on('close', () => leaveRoom(ws));
    ws.on('error', () => leaveRoom(ws));
  });

  console.log('Live chat WebSocket ready at /ws/live');
}

module.exports = { setupLiveChat };
