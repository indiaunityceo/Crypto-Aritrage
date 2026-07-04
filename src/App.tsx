import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Scanner } from './pages/Scanner';
import { Execution } from './pages/Execution';
import { Positions } from './pages/Positions';
import { History } from './pages/History';
import { Settings } from './pages/Settings';
import { RiskSettings } from './pages/RiskSettings';
import { startMarketDataStreams } from './services/marketData';

export default function App() {
  useEffect(() => {
    startMarketDataStreams();
  }, []);

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/scanner" element={<Scanner />} />
          <Route path="/execution" element={<Execution />} />
          <Route path="/positions" element={<Positions />} />
          <Route path="/history" element={<History />} />
          <Route path="/analytics" element={<div className="text-slate-400 p-8 text-center bg-slate-900 rounded-xl border border-slate-800">Advanced analytics module initializing...</div>} />
          <Route path="/settings" element={<Navigate to="/settings/api" />} />
          <Route path="/settings/api" element={<Settings />} />
          <Route path="/settings/risk" element={<RiskSettings />} />
        </Routes>
      </Layout>
    </Router>
  );
}
