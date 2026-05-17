import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useApp } from '../../context/AppContext';
import './Losing.css';

function LossTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value;
  return (
    <div className="chart-tooltip">
      <div className="tooltip-label">{label}</div>
      <div className="loss-text" style={{ fontFamily: 'Space Mono', fontWeight: 700 }}>
        NPR {Number(value).toLocaleString()} ({payload[0]?.payload?.pct}%)
      </div>
    </div>
  );
}

export default function Losing() {
  const { scripts, getPnL } = useApp();

  // All closed positions with loss
  const losers = useMemo(() =>
    scripts
      .filter(e => e.sellDate)
      .map(e => {
        const pnl = getPnL(e) || 0;
        const invested = e.quantity * e.buyAmount;
        const pct = ((pnl / invested) * 100).toFixed(1);
        return { ...e, pnl, invested, pct };
      })
      .filter(e => e.pnl < 0)
      .sort((a, b) => a.pnl - b.pnl)   // worst first
  , [scripts, getPnL]);

  // All open positions for unrealised loss estimate (if sell < buy)
  const openAtRisk = useMemo(() =>
    scripts
      .filter(e => !e.sellDate)
      .map(e => {
        const invested = e.quantity * e.buyAmount;
        return { ...e, invested };
      })
  , [scripts]);

  const totalLoss = losers.reduce((s, e) => s + e.pnl, 0);
  const worstScript = losers[0];

  const chartData = losers.slice(0, 8).map(e => ({
    name: e.script,
    loss: Math.abs(e.pnl),
    pct: Math.abs(e.pct),
  }));

  return (
    <div className="losing">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title losing-title">LOSING STOCKS</h1>
          <p className="page-subtitle">{losers.length} closed losing positions</p>
        </div>
        {totalLoss < 0 && (
          <div className="total-loss-badge">
            <span className="tl-label">TOTAL REALISED LOSS</span>
            <span className="tl-value">NPR {totalLoss.toLocaleString()}</span>
          </div>
        )}
      </div>

      {losers.length === 0 ? (
        <div className="no-losers">
          <span className="nl-icon">✓</span>
          <span className="nl-title">NO CLOSED LOSING POSITIONS</span>
          <span className="nl-sub">All your realised trades are profitable.</span>
        </div>
      ) : (
        <>
          {/* KPI row */}
          <div className="loss-kpis">
            <div className="loss-kpi">
              <span className="kpi-label">TOTAL LOSSES</span>
              <span className="kpi-value loss-text">NPR {Math.abs(totalLoss).toLocaleString()}</span>
            </div>
            <div className="loss-kpi">
              <span className="kpi-label">LOSING TRADES</span>
              <span className="kpi-value">{losers.length}</span>
            </div>
            {worstScript && (
              <div className="loss-kpi">
                <span className="kpi-label">WORST TRADE</span>
                <span className="kpi-value loss-text">{worstScript.script} ({worstScript.pct}%)</span>
              </div>
            )}
            <div className="loss-kpi">
              <span className="kpi-label">AVG LOSS / TRADE</span>
              <span className="kpi-value loss-text">
                NPR {Math.round(Math.abs(totalLoss) / losers.length).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Bar chart */}
          <div className="loss-chart-panel">
            <div className="panel-header">
              <span className="panel-title">LOSS BREAKDOWN BY SCRIPT</span>
              <span className="panel-badge loss-badge">REALISED LOSS</span>
            </div>
            <div className="chart-area">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2d44" horizontal={true} vertical={false}/>
                  <XAxis dataKey="name" tick={{ fill: '#4a607a', fontSize: 10, fontFamily: 'Space Mono' }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fill: '#4a607a', fontSize: 10, fontFamily: 'Space Mono' }} axisLine={false} tickLine={false}/>
                  <Tooltip content={<LossTooltip />}/>
                  <Bar dataKey="loss" radius={[3, 3, 0, 0]}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill="#f05464" opacity={0.7 + i * 0.04}/>
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Losers table */}
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>RANK</th>
                  <th>SCRIPT</th>
                  <th>SECTOR</th>
                  <th>BUY DATE</th>
                  <th>SELL DATE</th>
                  <th>QTY</th>
                  <th>BUY PRICE</th>
                  <th>SELL PRICE</th>
                  <th>INVESTED</th>
                  <th>LOSS (NPR)</th>
                  <th>LOSS %</th>
                </tr>
              </thead>
              <tbody>
                {losers.map((entry, i) => (
                  <tr key={entry.id} className={`table-row ${i === 0 ? 'worst-row' : ''}`}>
                    <td className="rank-col">
                      <span className={`rank-badge ${i === 0 ? 'rank-worst' : ''}`}>#{i + 1}</span>
                    </td>
                    <td className="col-script">{entry.script}</td>
                    <td><span className="sector-badge">{entry.sector}</span></td>
                    <td className="col-date">{entry.boughtDate}</td>
                    <td className="col-date">{entry.sellDate}</td>
                    <td>{entry.quantity}</td>
                    <td>NPR {entry.buyAmount.toLocaleString()}</td>
                    <td>NPR {entry.sellAmount.toLocaleString()}</td>
                    <td className="gold-text">NPR {entry.invested.toLocaleString()}</td>
                    <td className="loss-text">−NPR {Math.abs(entry.pnl).toLocaleString()}</td>
                    <td>
                      <span className="loss-pct-pill">▼ {Math.abs(entry.pct)}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Open at risk section */}
      {openAtRisk.length > 0 && (
        <div className="at-risk-section">
          <div className="panel-header">
            <span className="panel-title">OPEN POSITIONS AT RISK</span>
            <span className="panel-badge">UNREALISED</span>
          </div>
          <div className="at-risk-list">
            {openAtRisk.map(entry => (
              <div className="risk-row" key={entry.id}>
                <span className="risk-script">{entry.script}</span>
                <span className="risk-sector">{entry.sector}</span>
                <span className="risk-invested">Invested: <b className="gold-text">NPR {entry.invested.toLocaleString()}</b></span>
                <span className="risk-since">Since {entry.boughtDate}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
