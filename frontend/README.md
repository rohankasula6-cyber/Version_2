# MeroShare Dashboard — React Frontend

A terminal-financial themed dashboard for MeroShare portfolio tracking.

## Setup

```bash
cd meroshare-frontend
npm install
npm start
```

Open http://localhost:3000

## Project Structure

```
src/
├── index.js                    # React entry point
├── App.jsx                     # Root layout (sidebar + header + content)
├── App.css                     # Shell layout styles
├── styles/
│   └── global.css              # CSS variables, base styles, animations
├── context/
│   └── AppContext.jsx           # Global state (scripts, watchlist) + mock data
└── components/
    ├── Sidebar/
    │   ├── Sidebar.jsx          # Navigation sidebar
    │   └── Sidebar.css
    ├── Dashboard/
    │   ├── Dashboard.jsx        # P&L charts, KPI cards, sector breakdown
    │   └── Dashboard.css
    ├── Investment/
    │   ├── Investment.jsx       # Scripts table with filters/sorting
    │   └── Investment.css
    ├── Journal/
    │   ├── Journal.jsx          # Trade journal card view
    │   └── Journal.css
    ├── Watchlist/
    │   ├── Watchlist.jsx        # Watchlist with target price tracking
    │   └── Watchlist.css
    ├── Losing/
    │   ├── Losing.jsx           # Losing positions + loss chart
    │   └── Losing.css
    └── AddScriptModal/
        ├── AddScriptModal.jsx   # Reusable modal for adding trades
        └── AddScriptModal.css
```

## Tabs

| Tab          | Description |
|--------------|-------------|
| **Dashboard**   | KPI cards, monthly P&L area chart, sector breakdown, per-script P&L bars |
| **Investment**  | Full table of all scripts. Filter by open/closed. Sort by date/value/P&L. Add/delete entries |
| **Journal**     | Card-based trade log. Search by script. Shows hold duration, P&L %, sector |
| **Watchlist**   | Price target tracking. Visual gap bar, near-target alert |
| **Losing**      | All closed losing positions ranked by loss. Bar chart. Open positions at risk |

## Backend Integration

Replace mock data in `src/context/AppContext.jsx` with real API calls to your Express server:

```js
// Example: load scripts from your API
const token = localStorage.getItem('ms_token');
const res = await fetch('http://localhost:5000/api/portfolio', {
  headers: { 'x-meroshare-token': token }
});
const data = await res.json();
setScripts(data.holdings);
```

API endpoints available:
- `POST /api/login` → get token
- `GET  /api/portfolio` → holdings
- `GET  /api/shares` → demat shares
- `GET  /api/wacc` → weighted avg cost
- `GET  /api/ipos` → applicable IPOs
