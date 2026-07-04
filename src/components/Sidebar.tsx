import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Search, 
  Briefcase, 
  History, 
  Settings,
  Activity,
  ShieldAlert,
  Zap,
  Play
} from 'lucide-react';
import { cn } from '../utils';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Search, label: 'Market Scanner', path: '/scanner' },
  { icon: Play, label: 'Execution Console', path: '/execution' },
  { icon: Briefcase, label: 'Open Positions', path: '/positions' },
  { icon: History, label: 'Trade History', path: '/history' },
  { icon: Activity, label: 'Funding Analytics', path: '/analytics' },
];

const settingItems = [
  { icon: Settings, label: 'API Settings', path: '/settings/api' },
  { icon: ShieldAlert, label: 'Risk Settings', path: '/settings/risk' },
];

export function Sidebar() {
  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen sticky top-0">
      <div className="p-6 flex items-center space-x-3">
        <div className="w-8 h-8 rounded-md bg-indigo-500 flex items-center justify-center">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold text-white tracking-tight">ArbCore<span className="text-indigo-400">.</span></span>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
        <div className="px-4 mb-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Trading</p>
        </div>
        <nav className="space-y-1 px-2 mb-8">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150",
                isActive 
                  ? "bg-indigo-500/10 text-indigo-400" 
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="px-4 mb-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Configuration</p>
        </div>
        <nav className="space-y-1 px-2">
          {settingItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150",
                isActive 
                  ? "bg-indigo-500/10 text-indigo-400" 
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center justify-between p-3 rounded-md bg-slate-800/50 border border-slate-700/50">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-200">System Status</span>
            <span className="text-xs text-emerald-400 flex items-center mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
              All Systems Operational
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
