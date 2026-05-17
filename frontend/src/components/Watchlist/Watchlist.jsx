import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import './Watchlist.css';

const EMPTY_FORM = { script: '', targetBuy: '', currentPrice: '', note: '' };

export default function Watchlist() {
  const { watchlist, addWatchlistItem, deleteWatchlistItem } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (errors[name]) setErrors(e => ({ ...e, [name]: '' }));
  };

  const handleAdd = () => {
    const errs = {};
    if (!form.script.trim()) errs.script = 'Required';
    if (!form.targetBuy || isNaN(form.targetBuy)) errs.targetBuy = 'Required';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    addWatchlistItem({
      script:       form.script.toUpperCase().trim(),
      targetBuy:    Number(form.targetBuy),
      currentPrice: Number(form.currentPrice) || 0,
      note:         form.note,
    });
    setForm(EMPTY_FORM);
    setShowForm(false);
    setErrors({});
  };

  return (
    <div className="watchlist">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">WATCHLIST</h1>
          <p className="page-subtitle">{watchlist.length} stocks tracked</p>
        </div>
        <button className="add-btn" onClick={() => setShowForm(s => !s)}>
          <span className="add-btn-icon">{showForm ? '−' : '+'}</span>
          {showForm ? 'CANCEL' : 'ADD TO WATCHLIST'}
        </button>
      </div>

      {/* Inline add form */}
      {showForm && (
        <div className="inline-form">
          <div className="inline-form-title">NEW WATCHLIST ENTRY</div>
          <div className="inline-form-fields">
            <div className={`form-field ${errors.script ? 'error' : ''}`}>
              <label className="field-label">SCRIPT</label>
              <input className="field-input" name="script" value={form.script} onChange={handleChange} placeholder="e.g. NIMB" autoFocus/>
              {errors.script && <span className="field-error">{errors.script}</span>}
            </div>
            <div className={`form-field ${errors.targetBuy ? 'error' : ''}`}>
              <label className="field-label">TARGET BUY (NPR)</label>
              <input className="field-input" type="number" name="targetBuy" value={form.targetBuy} onChange={handleChange} placeholder="0.00"/>
              {errors.targetBuy && <span className="field-error">{errors.targetBuy}</span>}
            </div>
            <div className="form-field">
              <label className="field-label">CURRENT PRICE (NPR)</label>
              <input className="field-input" type="number" name="currentPrice" value={form.currentPrice} onChange={handleChange} placeholder="0.00"/>
            </div>
            <div className="form-field wide">
              <label className="field-label">NOTE</label>
              <input className="field-input" name="note" value={form.note} onChange={handleChange} placeholder="Why watching..."/>
            </div>
          </div>
          <div className="inline-form-actions">
            <button className="btn-submit" onClick={handleAdd}>ADD ENTRY</button>
          </div>
        </div>
      )}

      {/* Watchlist cards */}
      <div className="watchlist-grid">
        {watchlist.map(item => {
          const diff = item.currentPrice > 0 ? item.currentPrice - item.targetBuy : null;
          const diffPct = diff !== null ? ((diff / item.targetBuy) * 100).toFixed(1) : null;
          const atTarget = diff !== null && Math.abs(diff) / item.targetBuy < 0.03;

          return (
            <div key={item.id} className={`watch-card ${atTarget ? 'at-target' : ''}`}>
              <div className="watch-top">
                <span className="watch-script">{item.script}</span>
                <div className="watch-actions">
                  {atTarget && <span className="target-badge">NEAR TARGET</span>}
                  <button className="delete-btn" onClick={() => deleteWatchlistItem(item.id)}>✕</button>
                </div>
              </div>

              <div className="watch-prices">
                <div className="price-block">
                  <span className="price-label">TARGET</span>
                  <span className="price-value gold-text">NPR {item.targetBuy.toLocaleString()}</span>
                </div>
                {item.currentPrice > 0 && (
                  <div className="price-block">
                    <span className="price-label">CURRENT</span>
                    <span className="price-value">NPR {item.currentPrice.toLocaleString()}</span>
                  </div>
                )}
                {diff !== null && (
                  <div className="price-block">
                    <span className="price-label">GAP</span>
                    <span className={`price-value ${diff <= 0 ? 'profit-text' : 'loss-text'}`}>
                      {diff >= 0 ? '+' : ''}NPR {diff.toFixed(0)} ({diff >= 0 ? '+' : ''}{diffPct}%)
                    </span>
                  </div>
                )}
              </div>

              {/* Price bar */}
              {item.currentPrice > 0 && (
                <div className="price-bar-wrap">
                  <div className="price-bar-track">
                    <div
                      className={`price-bar-fill ${diff <= 0 ? 'profit' : 'over'}`}
                      style={{ width: `${Math.min(100, (item.targetBuy / item.currentPrice) * 100)}%` }}
                    />
                    <div className="price-bar-target-marker" />
                  </div>
                  <div className="price-bar-labels">
                    <span>0</span><span>TARGET</span><span>CURRENT</span>
                  </div>
                </div>
              )}

              {item.note && <p className="watch-note">"{item.note}"</p>}
            </div>
          );
        })}

        {watchlist.length === 0 && !showForm && (
          <div className="empty-state">
            <span className="empty-icon">◎</span>
            <span>No stocks on watchlist. Add one to track.</span>
          </div>
        )}
      </div>

    </div>
  );
}
