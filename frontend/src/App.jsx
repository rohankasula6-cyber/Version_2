import React, { useState } from 'react';
import './styles/global.css';
import './App.css';

import Sidebar from './components/Sidebar/Sidebar';
import Dashboard from './components/Dashboard/Dashboard';
import Journal from './components/Journal/Journal';
import Investment from './components/Investment/Investment';
import Watchlist from './components/Watchlist/Watchlist';
import Losing from './components/Losing/Losing';
import Login from './components/Login/Login'; // Import your new login page

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(false);
  
  // State to hold the backend data for all components
  const [apiData, setApiData] = useState({
    dashboard: null,
    journal: null,
    investment: null,
    watchlist: null,
    losing: null,
  });

  // This fires immediately when /api/login resolves successfully
  const handleLoginSuccess = async (authResponseData) => {
    setIsAuthenticated(true);
    setIsFetchingData(true);

    try {
      // Execute all background API fetches parallelly to minimize loading lag
      const [dashRes, journalRes, investRes, watchRes, losingRes] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/journal'),
        fetch('/api/investment'),
        fetch('/api/watchlist'),
        fetch('/api/losing')
      ]);

      // Assign payloads to local states safely
      setApiData({
        dashboard: dashRes.ok ? await dashRes.json() : null,
        journal: journalRes.ok ? await journalRes.json() : null,
        investment: investRes.ok ? await investRes.json() : null,
        watchlist: watchRes.ok ? await watchRes.json() : null,
        losing: losingRes.ok ? await losingRes.json() : null,
      });

    } catch (err) {
      console.error("Critical error pulling analytical workspace modules:", err);
    } finally {
      setIsFetchingData(false);
    }
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard':  return <Dashboard data={apiData.dashboard} />;
      case 'journal':    return <Journal data={apiData.journal} />;
      case 'investment': return <Investment data={apiData.investment} />;
      case 'watchlist':  return <Watchlist data={apiData.watchlist} />;
      case 'losing':     return <Losing data={apiData.losing} />;
      default:           return <Dashboard data={apiData.dashboard} />;
    }
  };

  // 1. Gating Scenario: If not logged in, force user into the Login interface
  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // 2. Mid-state Scenario: If logged in but data is fetching, show terminal progress loader
  if (isFetchingData) {
    return (
      <div className="app-shell sync-screen" style={{ justifyContent: 'center', alignItems: 'center', display: 'flex', flexDirection: 'column', color: '#00ff00', fontFamily: 'monospace' }}>
        <div className="scanline-overlay" />
        <h2>SYNCING NODE DATA MODULES...</h2>
        <div className="spinner" style={{ border: '2px solid #00ff00', borderTop: '2px solid transparent', borderRadius: '50%', width: '30px', height: '30px', animation: 'spin 1s linear infinite', marginTop: '15px' }} />
      </div>
    );
  }

  // 3. Complete State: Active dashboard rendered with injected live back-end data props
  return (
    <div className="app-shell">
      <div className="scanline-overlay" />

      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="app-main">
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

        <main className="app-content" key={activeTab}>
          {renderTab()}
        </main>
      </div>
    </div>
  );
}