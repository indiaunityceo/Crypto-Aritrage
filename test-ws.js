const WebSocket = require('ws');
const ws = new WebSocket('wss://stream.binance.com:9443/ws/!ticker@arr');
ws.on('open', () => console.log('spot open'));
ws.on('message', (data) => { console.log('spot msg', data.toString().substring(0, 100)); ws.close(); });
ws.on('error', (e) => console.log('spot err', e));

const fws = new WebSocket('wss://fstream.binance.com/ws/!ticker@arr');
fws.on('open', () => console.log('future open'));
fws.on('message', (data) => { console.log('future msg', data.toString().substring(0, 100)); fws.close(); });
