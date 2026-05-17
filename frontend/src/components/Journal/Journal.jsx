import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import AddScriptModal from '../AddScriptModal/AddScriptModal';
import './Journal.css';

export default function Journal() {
  const { scripts, addScript, deleteScript, getPnL } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() =>
    scripts
      .filter(s => s.script.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => b.boughtDate.localeCompare(a.boughtDate))
  , [scripts, search]);

  const totalRealised = useMemo(() =>
    scripts.reduce((sum, e) => { const p = getPnL(e); return sum + (p !== null ? p : 0); }, 0)
  , [scripts, getPnL]);

  return (
    <div className="journal">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">TRADE JOURNAL</h1>
          <p className="page-subtitle">
            {scripts.length} entries ·{' '}
            <span className={totalRealised >= 0 ? 'profit-text' : 'loss-text'}>
              {totalRealised >= 0 ? '+' : ''}NPR {totalRealised.toLocaleString()} realised
            </span>
          </p>
        </div>
        <button className="add-btn" onClick={() => setShowModal(true)}>
          <span className="add-btn-icon">+</span>
          LOG TRADE
        </button>
      </div>

      {/* Search */}
      <div className="search-bar">
        <span className="search-icon">⌕</span>
        <input
          className="search-input"
          placeholder="SEARCH SCRIPT..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Journal entries */}
      <div className="journal-entries">
        {filtered.map(entry => {
          const invested = entry.quantity * entry.buyAmount;
          const pnl = getPnL(entry);
          const pnlPct = pnl !== null ? ((pnl / invested) * 100).toFixed(1) : null;
          const isClosed = !!entry.sellDate;

          return (
            <div key={entry.id} className={`journal-card ${isClosed ? 'closed' : 'open'}`}>
              {/* Left accent */}
              <div className={`card-accent ${pnl !== null ? (pnl >= 0 ? 'profit' : 'loss') : 'neutral'}`} />

              <div className="card-body">
                {/* Top row */}
                <div className="card-top">
                  <div className="card-left">
                    <span className="card-script">{entry.script}</span>
                    {entry.sector && <span className="card-sector">{entry.sector}</span>}
                    <span className={`card-status ${isClosed ? 'closed' : 'open'}`}>
                      {isClosed ? 'CLOSED' : 'OPEN'}
                    </span>
                  </div>
                  <div className="card-right">
                    {pnl !== null ? (
                      <div className="card-pnl-block">
                        <span className={`card-pnl ${pnl >= 0 ? 'profit-text' : 'loss-text'}`}>
                          {pnl >= 0 ? '+' : ''}NPR {pnl.toLocaleString()}
                        </span>
                        <span className={`card-pct ${pnl >= 0 ? 'profit-text' : 'loss-text'}`}>
                          {pnl >= 0 ? '▲' : '▼'} {Math.abs(pnlPct)}%
                        </span>
                      </div>
                    ) : (
                      <span className="card-unrealised">UNREALISED</span>
                    )}
                    <button className="delete-btn" onClick={() => deleteScript(entry.id)}>✕</button>
                  </div>
                </div>

                {/* Metrics */}
                <div className="card-metrics">
                  <div className="metric">
                    <span className="metric-label">QTY</span>
                    <span className="metric-value">{entry.quantity}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">BUY PRICE</span>
                    <span className="metric-value">NPR {entry.buyAmount.toLocaleString()}</span>
                  </div>
                  {entry.sellAmount > 0 && (
                    <div className="metric">
                      <span className="metric-label">SELL PRICE</span>
                      <span className="metric-value">NPR {entry.sellAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="metric">
                    <span className="metric-label">INVESTED</span>
                    <span className="metric-value gold-text">NPR {invested.toLocaleString()}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">BUY DATE</span>
                    <span className="metric-value">{entry.boughtDate}</span>
                  </div>
                  {isClosed && (
                    <div className="metric">
                      <span className="metric-label">SELL DATE</span>
                      <span className="metric-value">{entry.sellDate}</span>
                    </div>
                  )}
                  {isClosed && entry.boughtDate && entry.sellDate && (
                    <div className="metric">
                      <span className="metric-label">HOLD DAYS</span>
                      <span className="metric-value">
                        {Math.round((new Date(entry.sellDate) - new Date(entry.boughtDate)) / 86400000)}d
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="empty-state">
            <span className="empty-icon">◎</span>
            <span>No journal entries yet. Log your first trade.</span>
          </div>
        )}
      </div>

      {showModal && <AddScriptModal onClose={() => setShowModal(false)} onAdd={addScript} />}
    </div>
  );
}
