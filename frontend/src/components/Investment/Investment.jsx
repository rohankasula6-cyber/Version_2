import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import AddScriptModal from '../AddScriptModal/AddScriptModal';
import './Investment.css';

export default function Investment() {
  const { scripts, addScript, deleteScript, getPnL } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all'); // all | open | closed
  const [sortBy, setSortBy] = useState('date');

  const filtered = useMemo(() => {
    let list = [...scripts];
    if (filter === 'open')   list = list.filter(s => !s.sellDate);
    if (filter === 'closed') list = list.filter(s => !!s.sellDate);
    if (sortBy === 'date')   list.sort((a, b) => b.boughtDate.localeCompare(a.boughtDate));
    if (sortBy === 'pnl')    list.sort((a, b) => (getPnL(b) || 0) - (getPnL(a) || 0));
    if (sortBy === 'value')  list.sort((a, b) => b.quantity * b.buyAmount - a.quantity * a.buyAmount);
    return list;
  }, [scripts, filter, sortBy, getPnL]);

  const totalInvested = scripts.reduce((s, e) => s + e.quantity * e.buyAmount, 0);

  return (
    <div className="investment">

      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">INVESTMENT TRACKER</h1>
          <p className="page-subtitle">{scripts.length} scripts · NPR {totalInvested.toLocaleString()} invested</p>
        </div>
        <button className="add-btn" onClick={() => setShowModal(true)}>
          <span className="add-btn-icon">+</span>
          ADD SCRIPT
        </button>
      </div>

      {/* Controls */}
      <div className="table-controls">
        <div className="filter-tabs">
          {['all', 'open', 'closed'].map(f => (
            <button
              key={f}
              className={`filter-tab ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="sort-group">
          <span className="sort-label">SORT:</span>
          {[['date','DATE'],['value','VALUE'],['pnl','P&L']].map(([k,v]) => (
            <button
              key={k}
              className={`sort-btn ${sortBy === k ? 'active' : ''}`}
              onClick={() => setSortBy(k)}
            >{v}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>SCRIPT</th>
              <th>SECTOR</th>
              <th>BUY DATE</th>
              <th>SELL DATE</th>
              <th>QTY</th>
              <th>BUY PRICE</th>
              <th>SELL PRICE</th>
              <th>INVESTED</th>
              <th>P&amp;L</th>
              <th>STATUS</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(entry => {
              const invested = entry.quantity * entry.buyAmount;
              const pnl = getPnL(entry);
              const pnlPct = pnl !== null ? ((pnl / invested) * 100).toFixed(1) : null;
              return (
                <tr key={entry.id} className="table-row">
                  <td className="col-script">{entry.script}</td>
                  <td className="col-sector">
                    <span className="sector-badge">{entry.sector}</span>
                  </td>
                  <td className="col-date">{entry.boughtDate}</td>
                  <td className="col-date">{entry.sellDate || '—'}</td>
                  <td>{entry.quantity}</td>
                  <td>NPR {entry.buyAmount.toLocaleString()}</td>
                  <td>{entry.sellAmount > 0 ? `NPR ${entry.sellAmount.toLocaleString()}` : '—'}</td>
                  <td className="gold-text">NPR {invested.toLocaleString()}</td>
                  <td>
                    {pnl !== null ? (
                      <span className={pnl >= 0 ? 'profit-text' : 'loss-text'}>
                        {pnl >= 0 ? '+' : ''}NPR {pnl.toLocaleString()}
                        <span className="pnl-pct"> ({pnl >= 0 ? '+' : ''}{pnlPct}%)</span>
                      </span>
                    ) : '—'}
                  </td>
                  <td>
                    <span className={`status-pill ${entry.sellDate ? 'closed' : 'open'}`}>
                      {entry.sellDate ? 'CLOSED' : 'OPEN'}
                    </span>
                  </td>
                  <td>
                    <button className="delete-btn" onClick={() => deleteScript(entry.id)} title="Remove">✕</button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={11} className="empty-row">No entries found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && <AddScriptModal onClose={() => setShowModal(false)} onAdd={addScript} />}
    </div>
  );
}
