import React, { useState } from 'react';
import './styles/global.css';
import './App.css';

import Sidebar from './components/Sidebar/Sidebar';
import Dashboard from './components/Dashboard/Dashboard';
import Journal from './components/Journal/Journal';
import Investment from './components/Investment/Investment';
import Watchlist from './components/Watchlist/Watchlist';
import Losing from './components/Losing/Losing';

const TABS = ['dashboard', 'investment', 'journal', 'watchlist', 'losing'];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard':   return <Dashboard />;
      case 'journal':     return <Journal />;
      case 'investment':  return <Investment />;
      case 'watchlist':   return <Watchlist />;
      case 'losing':      return <Losing />;
      default:            return <Dashboard />;
    }
  };

  return (
    <div className="app-shell">
      {/* Scanline overlay */}
      <div className="scanline-overlay" />

      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="app-main">
        {/* Top header bar */}
        <header className="app-header">
          <div className="header-breadcrumb">
            <span className="header-prefix">MEROSHARE /</span>
            <span className="header-tab">{activeTab.toUpperCase()}</span>
          </div>
          <div className="header-status">
            <span className="status-dot" />
            <span className="status-text">LIVE</span>
            <span className="header-time">{new Date().toLocaleTimeString('en-US', { hour12: false })}</span>
          </div>
        </header>

        {/* Tab content */}
        <main className="app-content" key={activeTab}>
          {renderTab()}
        </main>
      </div>
    </div>
  );
}
