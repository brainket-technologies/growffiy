const WebSocket = require('ws');

const apiKey = "4y7j026qyv9lkacw";
const accessToken = "MHQGgllco1BXOfFejZkLbE2y4QursEuZ";
const wsUrl = `wss://ws.kite.trade?api_key=${apiKey}&access_token=${accessToken}`;

console.log('Connecting to Kite WebSocket:', wsUrl);
const ws = new WebSocket(wsUrl);

ws.on('open', () => {
  console.log('Kite WebSocket connection opened successfully!');
  // Subscribe to a couple of instruments: e.g. TATASTEEL (NSE token 895745) and ASHOKLEY (NSE token 54273)
  const tokens = [895745, 54273];
  
  console.log('Subscribing to tokens:', tokens);
  ws.send(JSON.stringify({
    a: 'subscribe',
    v: tokens
  }));
  ws.send(JSON.stringify({
    a: 'mode',
    v: ['quote', tokens]
  }));
});

ws.on('message', (data) => {
  console.log('Received message, type:', typeof data, 'isBuffer:', Buffer.isBuffer(data), 'length:', data.length);
  if (Buffer.isBuffer(data)) {
    if (data.length < 4) return;
    try {
      const count = data.readUInt16BE(0);
      console.log('Packet count:', count);
      let offset = 2;
      for (let i = 0; i < count; i++) {
        if (offset + 2 > data.length) break;
        const packetLength = data.readUInt16BE(offset);
        offset += 2;
        if (offset + packetLength > data.length) break;
        
        const token = data.readUInt32BE(offset);
        const ltp = data.readUInt32BE(offset + 4) / 100;
        console.log(`Token: ${token}, LTP: ${ltp}, length: ${packetLength}`);
        offset += packetLength;
      }
    } catch (e) {
      console.error('Parsing error:', e);
    }
  }
});

ws.on('error', (err) => {
  console.error('Kite WebSocket error:', err);
});

ws.on('close', (code, reason) => {
  console.log('Kite WebSocket closed:', code, reason?.toString());
  process.exit(0);
});

// Close connection after 8 seconds
setTimeout(() => {
  console.log('Closing connection...');
  ws.close();
}, 8000);
