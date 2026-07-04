const fs = require('fs');
let content = fs.readFileSync('src/components/PositionSummaryModal.tsx', 'utf8');

// Add "Charts" to tabs
content = content.replace(
  `useState<'Summary' | 'Arbitrage' | 'Funding' | 'Investment'>('Summary');`,
  `useState<'Summary' | 'Arbitrage' | 'Funding' | 'Investment' | 'Charts'>('Summary');`
);

content = content.replace(
  `(['Summary', 'Arbitrage', 'Funding', 'Investment'] as const).map(tab => (`,
  `(['Summary', 'Arbitrage', 'Funding', 'Investment', 'Charts'] as const).map(tab => (`
);

// Add Charts tab content
const chartsContent = `
          {activeTab === 'Charts' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-950/50 rounded-xl border border-slate-800 p-4 h-80 flex flex-col items-center justify-center">
                  <Activity className="w-12 h-12 text-slate-700 mb-4" />
                  <p className="text-slate-500 font-medium">Real-time Spot & Futures Spread Chart</p>
                  <p className="text-slate-600 text-sm mt-1">Collecting data points...</p>
                </div>
                <div className="bg-slate-950/50 rounded-xl border border-slate-800 p-4 h-80 flex flex-col items-center justify-center">
                  <TrendingUp className="w-12 h-12 text-slate-700 mb-4" />
                  <p className="text-slate-500 font-medium">PnL & Funding Income Curve</p>
                  <p className="text-slate-600 text-sm mt-1">Waiting for initial settlements...</p>
                </div>
              </div>
            </div>
          )}
`;

content = content.replace(
  `{activeTab === 'Investment' && (`,
  chartsContent + `\n          {activeTab === 'Investment' && (`
);

fs.writeFileSync('src/components/PositionSummaryModal.tsx', content);
