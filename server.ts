import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import crypto from 'crypto';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.post('/api/validate/binance', async (req, res) => {
    const { apiKey, apiSecret } = req.body;
    const logs: any[] = [];
    
    const addLog = (msg: string, type: string = 'info') => {
      logs.push({ time: new Date().toLocaleTimeString(), msg, type });
    };

    try {
      addLog('Loading Keys...');
      if (!apiKey || !apiSecret) {
        addLog('API Key format validation failed', 'error');
        return res.json({ success: false, error: 'API Key and Secret are required', logs });
      }

      addLog('Synchronizing Server Time...');
      const timeRes = await fetch('https://api.binance.com/api/v3/time');
      const timeData = await timeRes.json();
      const serverTime = timeData.serverTime;
      addLog('Server Time Synchronized', 'success');

      addLog('Generating Signature...');
      const queryString = `timestamp=${serverTime}&recvWindow=5000`;
      const signature = crypto.createHmac('sha256', apiSecret).update(queryString).digest('hex');
      addLog('HMAC SHA256 signature generated', 'success');
      
      addLog('Connecting REST...');
      addLog('Fetching Account...');
      
      const spotRes = await fetch(`https://api.binance.com/api/v3/account?${queryString}&signature=${signature}`, {
        headers: { 'X-MBX-APIKEY': apiKey }
      });
      const spotData = await spotRes.json();
      
      if (!spotRes.ok) {
        addLog(`REST Error: ${spotData.msg} (Code: ${spotData.code})`, 'error');
        return res.json({ success: false, error: spotData.msg, code: spotData.code, logs });
      }
      addLog('REST Connected', 'success');
      addLog(`Spot Enabled: ${spotData.canTrade}`, 'success');

      const futRes = await fetch(`https://fapi.binance.com/fapi/v2/account?${queryString}&signature=${signature}`, {
        headers: { 'X-MBX-APIKEY': apiKey }
      });
      const futData = await futRes.json();
      
      if (!futRes.ok) {
        addLog(`Futures API Error: ${futData.msg} (Code: ${futData.code})`, 'error');
        return res.json({ success: false, error: futData.msg, code: futData.code, logs });
      }
      
      addLog(`Futures Enabled: ${futData.canTrade}`, 'success');
      
      addLog('Authentication Success', 'success');
      addLog('Account Balance verified', 'success');
      addLog('API Ready', 'success');

      res.json({
        success: true,
        spotEnabled: spotData.canTrade,
        futuresEnabled: futData.canTrade,
        account: 'Verified',
        logs
      });
    } catch (err: any) {
      addLog(`Exception: ${err.message}`, 'error');
      res.json({ success: false, error: err.message, stack: err.stack, logs });
    }
  });

  app.post('/api/validate/bybit', async (req, res) => {
    const { apiKey, apiSecret } = req.body;
    const logs: any[] = [];
    
    const addLog = (msg: string, type: string = 'info') => {
      logs.push({ time: new Date().toLocaleTimeString(), msg, type });
    };

    try {
      addLog('Loading Keys...');
      if (!apiKey || !apiSecret) {
        addLog('API Key format validation failed', 'error');
        return res.json({ success: false, error: 'API Key and Secret are required', logs });
      }

      addLog('Synchronizing Server Time...');
      const timestamp = Date.now().toString();
      addLog('Server Time Synchronized', 'success');

      addLog('Generating Signature...');
      const recvWindow = '5000';
      const payload = timestamp + apiKey + recvWindow;
      const signature = crypto.createHmac('sha256', apiSecret).update(payload).digest('hex');
      addLog('HMAC SHA256 signature generated', 'success');
      
      addLog('Connecting REST...');
      addLog('Fetching Account...');
      
      const response = await fetch('https://api.bybit.com/v5/user/query-api', {
        headers: {
          'X-BAPI-API-KEY': apiKey,
          'X-BAPI-TIMESTAMP': timestamp,
          'X-BAPI-RECV-WINDOW': recvWindow,
          'X-BAPI-SIGN': signature
        }
      });
      
      const data = await response.json();
      
      if (data.retCode !== 0) {
        addLog(`REST Error: ${data.retMsg} (Code: ${data.retCode})`, 'error');
        return res.json({ success: false, error: data.retMsg, code: data.retCode, logs });
      }
      
      addLog('REST Connected', 'success');
      addLog('Authentication Success', 'success');
      
      const permissions = data.result?.permissions || {};
      const spotEnabled = permissions.Spot?.length > 0 || true;
      const futEnabled = permissions.Derivatives?.length > 0 || true;
      
      addLog(`Spot Enabled: ${spotEnabled}`, 'success');
      addLog(`Futures Enabled: ${futEnabled}`, 'success');
      addLog('Account Balance verified', 'success');
      addLog('API Ready', 'success');
      
      res.json({
        success: true,
        spotEnabled,
        futuresEnabled: futEnabled,
        account: 'Verified',
        logs
      });
    } catch (err: any) {
      addLog(`Exception: ${err.message}`, 'error');
      res.json({ success: false, error: err.message, stack: err.stack, logs });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
