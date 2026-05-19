import React, { useState } from 'react';
import './styles/global.css';
import './App.css';

import Sidebar from './components/Sidebar/Sidebar';
import Dashboard from './components/Dashboard/Dashboard';
import Journal from './components/Journal/Journal';
import Investment from './components/Investment/Investment';
import Watchlist from './components/Watchlist/Watchlist';
import Losing from './components/Losing/Losing';
import Login from './components/Login/Login';

const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

// Helper: authenticated fetch
const authFetch = (path) => {
  const token = localStorage.getItem('token');
  return fetch(`${BASE_URL}${path}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Rehydrate auth from localStorage so refresh doesn't log user out
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!localStorage.getItem('token')
  );
  const [isFetchingData, setIsFetchingData] = useState(false);

  const [apiData, setApiData] = useState({
    profile:   null,
    shares:    null,
    portfolio: null,
    issues:    null,
    wacc:      null,
  });

 const handleLoginSuccess = async (authResponseData) => {
  const { token, user } = authResponseData.data;
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  setIsAuthenticated(true);
  setIsFetchingData(true);

  try {
    // Poll sync/logs until the latest sync finishes (max 30s)
    await waitForSync();

    // Now fetch all data
    // const [profileRes, sharesRes, portfolioRes, issuesRes, waccRes] = await Promise.all([
    //   authFetch('/api/profile'),
    //   authFetch('/api/shares'),
    //   authFetch('/api/portfolio'),
    //   authFetch('/api/issues'),
    //   authFetch('/api/wacc'),
    // ]);

    setApiData({
      profile:   profileRes.ok   ? await profileRes.json()   : null,
      shares:    sharesRes.ok    ? await sharesRes.json()    : null,
      portfolio: portfolioRes.ok ? await portfolioRes.json() : null,
      issues:    issuesRes.ok    ? await issuesRes.json()    : null,
      wacc:      waccRes.ok      ? await waccRes.json()      : null,
    });

  } catch (err) {
    console.error('Failed to fetch data:', err);
  } finally {
    setIsFetchingData(false);
  }
};

// Polls /api/sync/logs every 2s until latest sync is done or timeout
const waitForSync = () => new Promise((resolve) => {
  const MAX_WAIT = 30000;  // 30 seconds max
  const INTERVAL = 2000;   // check every 2s
  const started  = Date.now();

  const check = async () => {
    try {
      const res  = await authFetch('/api/sync/logs?limit=1');
      const json = await res.json();
      const latest = json?.data?.[0];

      // Sync done if a log entry exists that finished after we logged in
      if (latest?.finishedAt) {
        return resolve();
      }
    } catch (_) {}

    if (Date.now() - started >= MAX_WAIT) return resolve(); // timeout — proceed anyway
    setTimeout(check, INTERVAL);
  };

  check();
});

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setApiData({ profile: null, shares: null, portfolio: null, issues: null, wacc: null });
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard':  return <Dashboard  data={apiData.portfolio} shares={apiData.shares} />;
      case 'journal':    return <Journal    data={apiData.wacc} />;
      case 'investment': return <Investment data={apiData.shares} portfolio={apiData.portfolio} />;
      case 'watchlist':  return <Watchlist  data={apiData.issues} />;
      case 'losing':     return <Losing     data={apiData.shares} portfolio={apiData.portfolio} />;
      default:           return <Dashboard  data={apiData.portfolio} shares={apiData.shares} />;
    }
  };

  // 1. Not logged in
  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // 2. Logged in but still loading data
  if (isFetchingData) {
    return (
      <div style={{
        justifyContent: 'center', alignItems: 'center', display: 'flex',
        flexDirection: 'column', color: '#00ff00', fontFamily: 'monospace',
        height: '100vh', background: '#0a0a0a',
      }}>
        <div className="scanline-overlay" />
        <h2>SYNCING NODE DATA MODULES...</h2>
        <div style={{
          border: '2px solid #00ff00', borderTop: '2px solid transparent',
          borderRadius: '50%', width: '30px', height: '30px',
          animation: 'spin 1s linear infinite', marginTop: '15px',
        }} />
      </div>
    );
  }

  // 3. Fully loaded
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
            <span className="header-time">
              {new Date().toLocaleTimeString('en-US', { hour12: false })}
            </span>
            <button
              onClick={handleLogout}
              style={{
                marginLeft: '16px', background: 'transparent',
                border: '1px solid #00ff00', color: '#00ff00',
                fontFamily: 'monospace', cursor: 'pointer', padding: '2px 8px',
                fontSize: '11px',
              }}
            >
              LOGOUT
            </button>
          </div>
        </header>

        <main className="app-content" key={activeTab}>
          {renderTab()}
        </main>
      </div>
    </div>
  );
}