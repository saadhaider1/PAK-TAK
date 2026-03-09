import React, { useState, useEffect } from 'react';
import { tradeAPI } from '../services/api';
import './UserDashboard.css';

export const UserDashboard = ({ user }) => {
  const [portfolio, setPortfolio] = useState([]);
  const [tradeHistory, setTradeHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('portfolio');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [portfolioRes, historyRes] = await Promise.all([
        tradeAPI.getPortfolio(),
        tradeAPI.getHistory()
      ]);
      setPortfolio(portfolioRes.data);
      setTradeHistory(historyRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalPortfolioValue = () => {
    return portfolio.reduce((sum, item) => sum + (item.totalValue || 0), 0);
  };

  const calculateTotalGain = () => {
    return portfolio.reduce((sum, item) => sum + (item.gain || 0), 0);
  };

  return (
    <div className="user-dashboard">
      <div className="dashboard-header">
        <h1>Welcome, {user?.username}</h1>
        <button onClick={fetchDashboardData} className="refresh-btn">
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="account-summary">
        <div className="summary-card">
          <div className="summary-label">Available Balance</div>
          <div className="summary-value">${user?.balance?.toFixed(2)}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Portfolio Value</div>
          <div className="summary-value">${calculateTotalPortfolioValue().toFixed(2)}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Total Gain/Loss</div>
          <div className={`summary-value ${calculateTotalGain() >= 0 ? 'positive' : 'negative'}`}>
            ${calculateTotalGain().toFixed(2)}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Total Invested</div>
          <div className="summary-value">${user?.totalInvested?.toFixed(2)}</div>
        </div>
      </div>

      <div className="dashboard-tabs">
        <button
          className={`tab-btn ${activeTab === 'portfolio' ? 'active' : ''}`}
          onClick={() => setActiveTab('portfolio')}
        >
          Portfolio
        </button>
        <button
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Trade History
        </button>
      </div>

      {activeTab === 'portfolio' && (
        <div className="tab-content">
          <h2>My Holdings</h2>
          {portfolio.length === 0 ? (
            <p className="empty-message">No holdings yet. Start trading to build your portfolio.</p>
          ) : (
            <div className="portfolio-table">
              <table>
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Quantity</th>
                    <th>Avg Price</th>
                    <th>Current Price</th>
                    <th>Total Value</th>
                    <th>Gain/Loss</th>
                    <th>Gain %</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.map((holding) => (
                    <tr key={holding.id}>
                      <td className="symbol">{holding.symbol}</td>
                      <td>{holding.quantity}</td>
                      <td>${holding.averagePrice?.toFixed(2)}</td>
                      <td>${holding.currentPrice?.toFixed(2)}</td>
                      <td>${holding.totalValue?.toFixed(2)}</td>
                      <td className={holding.gain >= 0 ? 'positive' : 'negative'}>
                        ${holding.gain?.toFixed(2)}
                      </td>
                      <td className={holding.gainPercent >= 0 ? 'positive' : 'negative'}>
                        {holding.gainPercent?.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="tab-content">
          <h2>Trade History</h2>
          {tradeHistory.length === 0 ? (
            <p className="empty-message">No trade history yet.</p>
          ) : (
            <div className="history-table">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Symbol</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tradeHistory.map((trade) => (
                    <tr key={trade.id}>
                      <td>{new Date(trade.createdAt).toLocaleDateString()}</td>
                      <td className={`trade-type ${trade.type.toLowerCase()}`}>{trade.type}</td>
                      <td className="symbol">{trade.symbol}</td>
                      <td>{trade.quantity}</td>
                      <td>${trade.price?.toFixed(2)}</td>
                      <td>${trade.totalAmount?.toFixed(2)}</td>
                      <td className="status">{trade.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
