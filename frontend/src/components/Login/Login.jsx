import React, { useState } from 'react';
import './Login.css'; // Optional: Add styles to match your cyber/terminal layout


const URL = import.meta.env.BACKEND_URL || 'http://localhost:5000';

export default function Login({ onLoginSuccess }) {
  const [clientId, setClientId] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('URL/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, username, password }),
      });

      const data = await response.json();
      console.log("Login response:", data);
      if (response.ok) {
        // Pass credentials or auth token received from server up to App.jsx
        onLoginSuccess(data);
      } else {
        setError(data.message || 'AUTHENTICATION FAILED. INVALID CREDENTIALS.');
      }
    } catch (err) {
      setError('CONNECTION ERROR. UNABLE TO REACH AUTH SERVER.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-overlay">
      <div className="scanline-overlay" />
      <div className="login-card">
        <div className="login-header">
          <h3>SECURE NODE ACCESS</h3>
          <p>ENTER MEROSHARE CREDENTIALS</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>CLIENT ID</label>
            <input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="e.g., 130"
              required
            />
          </div>

          <div className="form-group">
            <label>USERNAME</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
            />
          </div>

          <div className="form-group">
            <label>PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'INITIALIZING SESSION...' : 'CONNECT'}
          </button>
        </form>
      </div>
    </div>
  );
}