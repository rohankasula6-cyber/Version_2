import React, { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell, ReferenceLine
} from 'recharts';
import { useApp } from '../../context/AppContext';
import './Dashboard.css';

// ── Custom Tooltip ────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value;
  return (
    <div className="chart-tooltip">
      <div className="tooltip-label">{label}</div>
      <div className={`tooltip-value ${value >= 0 ? 'profit-text' : 'loss-text'}`}>
        {value >= 0 ? '+' : ''}NPR {Number(value).toLocaleString()}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { scripts, getPnL } = useApp();

  // ── KPI cards ────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalInvested = scripts.reduce((s, e) => s + e.quantity * e.buyAmount, 0);
    const realisedPnL   = scripts.reduce((s, e) => {
      const p = getPnL(e);
      return s + (p !== null ? p : 0);
    }, 0);
    const openPositions = scripts.filter(e => !e.sellDate || e.sellDate === '').length;
    const closedTrades  = scripts.filter(e => e.sellDate && e.sellDate !== '').length;
    const winners       = scripts.filter(e => { const p = getPnL(e); return p !== null && p > 0; }).length;
    const winRate       = closedTrades > 0 ? Math.round((winners / closedTrades) * 100) : 0;

    return { totalInvested, realisedPnL, openPositions, closedTrades, winRate };
  }, [scripts, getPnL]);

  // ── Monthly P&L data ─────────────────────────────────────
  const monthlyPnL = useMemo(() => {
    const map = {};
    scripts.forEach(e => {
      const pnl = getPnL(e);
      if (pnl === null || !e.sellDate) return;
      const month = e.sellDate.slice(0, 7); // "YYYY-MM"
      map[month] = (map[month] || 0) + pnl;
    });

    // Fill last 8 months for display
    const months = [];
    const now = new Date();
    for (let i = 7; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      months.push({ month: label, pnl: map[key] || 0, key });
    }
    return months;
  }, [scripts, getPnL]);

  // ── Per-script bar data ──────────────────────────────────
  const scriptBars = useMemo(() =>
    scripts
      .filter(e => e.sellDate)
      .map(e => ({ name: e.script, pnl: getPnL(e) || 0 }))
      .sort((a, b) => b.pnl - a.pnl)
  , [scripts, getPnL]);

  // ── Sector breakdown ─────────────────────────────────────
  const sectorData = useMemo(() => {
    const map = {};
    scripts.forEach(e => {
      const sector = e.sector || 'Other';
      const invested = e.quantity * e.buyAmount;
      map[sector] = (map[sector] || 0) + invested;
    });
    const total = Object.values(map).reduce((a, b) => a + b, 0);
    return Object.entries(map)
      .map(([name, val]) => ({ name, value: val, pct: Math.round((val / total) * 100) }))
      .sort((a, b) => b.value - a.value);
  }, [scripts]);

  const SECTOR_COLORS = ['#f0c040','#22d3a0','#6b8ab0','#f05464','#a78bfa','#34d399','#fb923c'];

  return (
    <div className="dashboard">

      {/* KPI Row */}
      <div className="kpi-row">
        <div className="kpi-card">
          <span className="kpi-label">TOTAL INVESTED</span>
          <span className="kpi-value gold-text">NPR {stats.totalInvested.toLocaleString()}</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">REALISED P&L</span>
          <span className={`kpi-value ${stats.realisedPnL >= 0 ? 'profit-text' : 'loss-text'}`}>
            {stats.realisedPnL >= 0 ? '+' : ''}NPR {stats.realisedPnL.toLocaleString()}
          </span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">OPEN POSITIONS</span>
          <span className="kpi-value">{stats.openPositions}</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">WIN RATE</span>
          <span className={`kpi-value ${stats.winRate >= 50 ? 'profit-text' : 'loss-text'}`}>
            {stats.winRate}%
          </span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">CLOSED TRADES</span>
          <span className="kpi-value">{stats.closedTrades}</span>
        </div>
      </div>

      {/* Charts row */}
      <div className="charts-row">

        {/* Monthly P&L Area Chart */}
        <div className="chart-panel wide">
          <div className="panel-header">
            <span className="panel-title">MONTHLY P&amp;L</span>
            <span className="panel-badge">REALISED</span>
          </div>
          <div className="chart-area">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyPnL} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#22d3a0" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22d3a0" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="lossGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#f05464" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f05464" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d44" vertical={false}/>
                <XAxis dataKey="month" tick={{ fill: '#4a607a', fontSize: 10, fontFamily: 'Space Mono' }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill: '#4a607a', fontSize: 10, fontFamily: 'Space Mono' }} axisLine={false} tickLine={false} tickFormatter={v => `${v > 0 ? '+' : ''}${(v/1000).toFixed(0)}k`}/>
                <ReferenceLine y={0} stroke="#2a3f5f" strokeDasharray="4 4"/>
                <Tooltip content={<CustomTooltip />}/>
                <Area
                  type="monotone"
                  dataKey="pnl"
                  stroke="#22d3a0"
                  strokeWidth={2}
                  fill="url(#profitGrad)"
                  dot={(props) => {
                    const { cx, cy, payload } = props;
                    return (
                      <circle
                        key={payload.key}
                        cx={cx} cy={cy} r={3}
                        fill={payload.pnl >= 0 ? '#22d3a0' : '#f05464'}
                        stroke="none"
                      />
                    );
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sector breakdown */}
        <div className="chart-panel">
          <div className="panel-header">
            <span className="panel-title">SECTOR BREAKDOWN</span>
          </div>
          <div className="sector-list">
            {sectorData.map((s, i) => (
              <div className="sector-row" key={s.name}>
                <div className="sector-name">
                  <span className="sector-dot" style={{ background: SECTOR_COLORS[i % SECTOR_COLORS.length] }} />
                  {s.name}
                </div>
                <div className="sector-bar-wrap">
                  <div className="sector-bar" style={{ width: `${s.pct}%`, background: SECTOR_COLORS[i % SECTOR_COLORS.length] }} />
                </div>
                <div className="sector-pct">{s.pct}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Script P&L bars */}
      {scriptBars.length > 0 && (
        <div className="chart-panel full">
          <div className="panel-header">
            <span className="panel-title">P&amp;L BY SCRIPT</span>
            <span className="panel-badge">CLOSED POSITIONS</span>
          </div>
          <div className="chart-area">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={scriptBars} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d44" horizontal={false}/>
                <XAxis dataKey="name" tick={{ fill: '#4a607a', fontSize: 10, fontFamily: 'Space Mono' }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill: '#4a607a', fontSize: 10, fontFamily: 'Space Mono' }} axisLine={false} tickLine={false}/>
                <ReferenceLine y={0} stroke="#2a3f5f"/>
                <Tooltip content={<CustomTooltip />}/>
                <Bar dataKey="pnl" radius={[3, 3, 0, 0]}>
                  {scriptBars.map((entry, index) => (
                    <Cell key={index} fill={entry.pnl >= 0 ? '#22d3a0' : '#f05464'} opacity={0.85}/>
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

    </div>
  );
}
