import React, { createContext, useContext, useState, useEffect } from "react";
// ── Initial mock data ──────────────────────────────────────
const INITIAL_SCRIPTS = [];

const INITIAL_WATCHLIST = [
  {
    id: 1,
    script: "NIMB",
    targetBuy: 340,
    currentPrice: 355,
    note: "Wait for correction",
  },
  {
    id: 2,
    script: "PRVU",
    targetBuy: 420,
    currentPrice: 418,
    note: "Near target",
  },
  {
    id: 3,
    script: "RIDI",
    targetBuy: 210,
    currentPrice: 225,
    note: "Hydro sector play",
  },
];

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [scripts, setScripts] = useState(INITIAL_SCRIPTS);
  const [watchlist, setWatchlist] = useState(INITIAL_WATCHLIST);

  // Fetch portfolio data
  useEffect(() => {
    const token = localStorage.getItem("ms_token");

    fetch("http://localhost:5000/api/portfolio", {
      headers: {
        "x-meroshare-token": token,
      },
    })
      .then((r) => r.json())
      .then((data) => {
        setScripts(data.holdings || []);
      })
      .catch((err) => {
        console.error("Portfolio fetch error:", err);
      });
  }, []);

  // Add a new script entry
  const addScript = (entry) => {
    setScripts((prev) => [...prev, { ...entry, id: Date.now() }]);
  };

  // Delete a script
  const deleteScript = (id) => {
    setScripts((prev) => prev.filter((s) => s.id !== id));
  };

  // Add watchlist item
  const addWatchlistItem = (item) => {
    setWatchlist((prev) => [...prev, { ...item, id: Date.now() }]);
  };

  // Delete watchlist item
  const deleteWatchlistItem = (id) => {
    setWatchlist((prev) => prev.filter((w) => w.id !== id));
  };

  // Profit/Loss helper
  const getPnL = (entry) => {
    const invested = entry.quantity * entry.buyAmount;

    const realised =
      entry.sellAmount > 0 ? entry.quantity * entry.sellAmount : null;

    return realised !== null ? realised - invested : null;
  };

  return (
    <AppContext.Provider
      value={{
        scripts,
        addScript,
        deleteScript,
        watchlist,
        addWatchlistItem,
        deleteWatchlistItem,
        getPnL,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
