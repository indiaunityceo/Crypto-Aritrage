import fs from 'fs';

let content = fs.readFileSync('src/services/marketData.ts', 'utf8');

const replacement = `
setInterval(() => {
  const store = useMarketDataStore.getState();
  const now = Date.now();
  
  // Funding Settlement Logic
  store.positions.forEach(pos => {
    if (pos.status !== 'Open') return;
    const data = store.marketData[\`\${pos.exchange}-\${pos.symbol}\`];
    if (data && data.nextFundingTime) {
      // Use a hidden property to track the last settled funding timestamp
      const lastSettled = (pos as any)._lastSettledTime || 0;
      
      if (now >= data.nextFundingTime && lastSettled !== data.nextFundingTime) {
         // Calculate funding payment
         const fundingRateDec = data.fundingRate / 100;
         const positionValue = pos.futureSize * data.futurePrice;
         
         // If we are short futures (SELL), we receive funding if rate is positive
         // If we are long futures (BUY), we pay funding if rate is positive
         const fundingPayment = positionValue * fundingRateDec * (pos.futureDirection === 'SELL' ? 1 : -1);
         
         const newEarned = pos.fundingEarned + fundingPayment;
         
         const logType = fundingPayment >= 0 ? 'success' : 'error';
         const logMsg = fundingPayment >= 0 
           ? \`Funding Credited: +\${fundingPayment.toFixed(4)} USDT (Rate: \${data.fundingRate.toFixed(4)}%)\` 
           : \`Funding Debited: \${fundingPayment.toFixed(4)} USDT (Rate: \${data.fundingRate.toFixed(4)}%)\`;
           
         const newLogs = [
           { time: new Date().toLocaleTimeString(), msg: logMsg, type: logType as any },
           { time: new Date().toLocaleTimeString(), msg: 'Funding Event Detected & Settled', type: 'info' as any },
           ...(pos.logs || [])
         ].slice(0, 50); // keep last 50 logs
         
         store.updatePosition(pos.id, { 
           fundingEarned: newEarned,
           logs: newLogs,
           _lastSettledTime: data.nextFundingTime
         } as any);
      }
    }
  });

  Object.keys(store.marketData).forEach(id => {
    calculateDerivedFields(id, store);
  });
}, 1000);
`;

content = content.replace(/setInterval\(\(\) => \{\n  const store = useMarketDataStore\.getState\(\);\n  Object\.keys\(store\.marketData\)\.forEach\(id => \{\n    calculateDerivedFields\(id, store\);\n  \}\);\n\}, 1000\);/g, replacement.trim());

fs.writeFileSync('src/services/marketData.ts', content);
