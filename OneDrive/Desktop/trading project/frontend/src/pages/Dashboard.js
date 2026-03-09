import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Recommendations } from '../components/Recommendations';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import './Dashboard.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('1w');
  const [chartData, setChartData] = useState(null);
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [walletAddress, setWalletAddress] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletError, setWalletError] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [activeView, setActiveView] = useState('dashboard'); // 'dashboard', 'portfolio', 'assets'

  useEffect(() => {
    generateChartData();
    calculateValues();
    checkWalletConnection();
  }, [selectedPeriod]);

  useEffect(() => {
    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', () => window.location.reload());
      return () => {
        window.ethereum?.removeAllListeners('accountsChanged');
        window.ethereum?.removeAllListeners('chainChanged');
      };
    }
  }, []);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (e) => {
      if (showUserMenu && !e.target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showUserMenu]);

  const checkWalletConnection = async () => {
    try {
      if (!window.ethereum) {
        console.log('MetaMask not detected');
        return;
      }

      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
        setIsConnected(true);
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
    }
  };

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      setWalletAddress(null);
      setIsConnected(false);
    } else {
      setWalletAddress(accounts[0]);
      setIsConnected(true);
    }
  };

  const connectWallet = async () => {
    try {
      setIsConnecting(true);
      setWalletError(null);

      if (!window.ethereum) {
        setWalletError('MetaMask is not installed. Please install it to continue.');
        window.open('https://metamask.io/download.html', '_blank');
        setIsConnecting(false);
        return;
      }

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
        setIsConnected(true);
        setWalletError(null);
      }
    } catch (error) {
      if (error.code === 4001) {
        setWalletError('User rejected the connection');
      } else {
        setWalletError('Failed to connect wallet. Please try again.');
      }
      console.error('Error connecting wallet:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
    setIsConnected(false);
    setWalletError(null);
  };

  const generateChartData = () => {
    const periods = {
      '1h': 60,
      '24h': 24,
      '1w': 7,
      '1m': 30,
      '6m': 26,
      '1y': 52,
    };

    const dataPoints = periods[selectedPeriod];
    const labels = [];
    const prices = [];
    let basePrice = 45000;

    for (let i = dataPoints; i > 0; i--) {
      if (selectedPeriod === '1h') {
        labels.push(`${i}m`);
      } else if (selectedPeriod === '24h') {
        labels.push(`${i}h`);
      } else if (selectedPeriod === '1w') {
        const date = new Date();
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      } else {
        labels.push(`${i}`);
      }

      const change = (Math.random() - 0.48) * basePrice * 0.01;
      basePrice += change;
      prices.push(Math.max(40000, Math.min(50000, basePrice)));
    }

    setChartData({
      labels,
      datasets: [
        {
          label: 'BTC Price',
          data: prices,
          borderColor: '#667eea',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#667eea',
          pointBorderColor: '#1a1a2e',
          pointBorderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 6,
        },
      ],
    });

    setPortfolioValue(basePrice);
  };

  const calculateValues = () => {
    setTotalSpent(45000 * 0.42);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) {
    navigate('/signin');
    return null;
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#b0b0c0',
        borderColor: '#667eea',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: function(context) {
            return '$' + context.parsed.y.toFixed(2);
          }
        }
      },
    },
    scales: {
      y: {
        display: false,
        grid: {
          display: false,
        },
      },
      x: {
        display: false,
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="dashboard">
      {/* Top Navigation */}
      <nav className="dashboard-nav">
        <div className="nav-left">
          <div className="nav-logo">
            <h2>✈️ Fly</h2>
          </div>
          <ul className="nav-menu">
            <li onClick={() => setActiveView('dashboard')} className={`nav-link-btn ${activeView === 'dashboard' ? 'active' : ''}`}>
              <a href="#" className="nav-link">Dashboard</a>
            </li>
            <li onClick={() => navigate('/market')} className="nav-link-btn">
              <a href="#" className="nav-link">Market</a>
            </li>
            <li onClick={() => navigate('/trade')} className="nav-link-btn">
              <a href="#" className="nav-link">Trade</a>
            </li>
            <li onClick={() => setActiveView('portfolio')} className={`nav-link-btn ${activeView === 'portfolio' ? 'active' : ''}`}>
              <a href="#" className="nav-link">Portfolio</a>
            </li>
            <li onClick={() => setActiveView('assets')} className={`nav-link-btn ${activeView === 'assets' ? 'active' : ''}`}>
              <a href="#" className="nav-link">Assets</a>
            </li>
          </ul>
        </div>
        <div className="nav-right">
          <button className="icon-btn notification">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeWidth="2" strokeLinecap="round"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <div className="user-menu-container">
            <button className="icon-btn user" onClick={() => setShowUserMenu(!showUserMenu)}>
              <div className="user-avatar">{user.username?.charAt(0).toUpperCase()}</div>
              <span>{user.username}</span>
            </button>
            {showUserMenu && (
              <div className="user-dropdown-menu">
                <div className="dropdown-item">
                  <span className="user-email">{user.email}</span>
                </div>
                <hr className="dropdown-divider" />
                <button className="dropdown-btn logout-btn" onClick={handleLogout}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 3l-4 4m0-4l4 4m-4-4v8" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="dashboard-content">
        {activeView === 'dashboard' && (
          <>
            {/* Chart Section */}
            <div className="chart-section">
              {/* Controls */}
              <div className="chart-controls">
                <div className="time-periods">
                  {['1h', '24h', '1w', '1m', '6m', '1y'].map((period) => (
                    <button
                      key={period}
                      className={`period-btn ${selectedPeriod === period ? 'active' : ''}`}
                      onClick={() => setSelectedPeriod(period)}
                    >
                      {period}
                    </button>
                  ))}
                </div>
                <div className="action-buttons">
                  <button className="action-btn buy">BUY</button>
                  <button className="action-btn sell">SELL</button>
                  <button className="icon-btn settings">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <circle cx="12" cy="12" r="1" strokeWidth="2"/>
                      <circle cx="12" cy="5" r="1" strokeWidth="2"/>
                      <circle cx="12" cy="19" r="1" strokeWidth="2"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Chart */}
              {chartData && (
                <div className="chart-container">
                  <div className="chart-header">
                    <div className="price-info">
                      <span className="label">BTC</span>
                      <h3>${portfolioValue.toFixed(0)}</h3>
                      <p className="price-change">+$952.88</p>
                    </div>
                  </div>
                  <div className="chart-canvas">
                    <Line data={chartData} options={chartOptions} />
                  </div>
                </div>
              )}
            </div>

            {/* Right Sidebar */}
            <div className="sidebar">
              {/* BTC Card */}
              <div className="balance-card btc">
                <div className="card-header">
                  <div className="currency-info">
                    <div className="currency-icon btc-icon">₿</div>
                    <span className="currency-name">BTC</span>
                  </div>
                  <span className="trade-label">You Buy</span>
                </div>
                <div className="balance-amount">18,959</div>
                <div className="balance-chart">
                  <svg viewBox="0 0 100 30" preserveAspectRatio="none">
                    <polyline points="0,15 5,10 10,12 15,8 20,14 25,10 30,13 35,9 40,15 45,11 50,14 55,10 60,16 65,12 70,14 75,9 80,15 85,11 90,13 95,10 100,14" 
                      fill="none" stroke="#667eea" strokeWidth="1" opacity="0.5"/>
                  </svg>
                </div>
              </div>

              {/* USD Card */}
              <div className="balance-card usd">
                <div className="card-header">
                  <div className="currency-info">
                    <div className="currency-icon usd-icon">$</div>
                    <span className="currency-name">USD</span>
                  </div>
                  <span className="trade-label">You Spend</span>
                </div>
                <div className="balance-amount">10,272</div>
                <div className="balance-chart">
                  <svg viewBox="0 0 100 30" preserveAspectRatio="none">
                    <polyline points="0,15 5,12 10,14 15,10 20,16 25,12 30,15 35,11 40,17 45,13 50,16 55,12 60,18 65,14 70,16 75,11 80,17 85,13 90,15 95,12 100,16"
                      fill="none" stroke="#667eea" strokeWidth="1" opacity="0.5"/>
                  </svg>
                </div>
              </div>

              {/* Primary Action */}
              <button className="primary-btn">
                Buy <span className="primary-btn-symbol">ETH</span>
              </button>

              {/* Wallet Connection Error */}
              {walletError && (
                <div className="wallet-error">
                  {walletError}
                </div>
              )}

              {/* Wallet Connection */}
              {isConnected ? (
                <div className="wallet-connected">
                  <div className="connected-header">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#4caf50' }}>
                      <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12z"/>
                    </svg>
                    <span className="connected-badge">Connected</span>
                  </div>
                  <div className="wallet-address">
                    {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
                  </div>
                  <button 
                    className="disconnect-btn"
                    onClick={disconnectWallet}
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button 
                  className="wallet-btn"
                  onClick={connectWallet}
                  disabled={isConnecting}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12z"/>
                  </svg>
                  {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                </button>
              )}
            </div>

            {/* AI Recommendations Section */}
            <Recommendations onSelectStock={(stock) => navigate('/trade', { state: { selectedStock: stock } })} />
          </>
        )}

        {activeView === 'portfolio' && (
          <div className="portfolio-view">
            <div className="view-header">
              <h2>📊 Portfolio</h2>
              <p>View your holdings and performance</p>
            </div>

            <div className="portfolio-grid">
              <div className="portfolio-card total-value">
                <div className="card-label">Total Portfolio Value</div>
                <div className="card-big-value">${(user?.balance * 2.5 + 15000).toFixed(2)}</div>
                <div className="card-change positive">+$2,450.50 (+12.5%)</div>
              </div>

              <div className="portfolio-card total-invested">
                <div className="card-label">Total Invested</div>
                <div className="card-big-value">${(user?.balance * 1.5).toFixed(2)}</div>
                <div className="card-stat">4 positions</div>
              </div>

              <div className="portfolio-card total-gain">
                <div className="card-label">Total Gains</div>
                <div className="card-big-value positive">+$2,450.50</div>
                <div className="card-change positive">Since start of year</div>
              </div>
            </div>

            <div className="holdings-section">
              <h3>Your Holdings</h3>
              <div className="holdings-table">
                <div className="table-header">
                  <div className="col">Stock</div>
                  <div className="col">Quantity</div>
                  <div className="col">Avg Price</div>
                  <div className="col">Current</div>
                  <div className="col">Gain/Loss</div>
                  <div className="col">Value</div>
                </div>

                <div className="table-rows">
                  {[
                    { symbol: 'AAPL', qty: 50, avgPrice: 150.25, current: 165.80, value: 8290, gain: 773.75 },
                    { symbol: 'GOOGL', qty: 25, avgPrice: 138.50, current: 155.40, value: 3885, gain: 421.75 },
                    { symbol: 'MSFT', qty: 30, avgPrice: 375.00, current: 395.50, value: 11865, gain: 615 },
                    { symbol: 'TSLA', qty: 15, avgPrice: 235.00, current: 258.75, value: 3881.25, gain: 356.25 }
                  ].map((holding) => (
                    <div key={holding.symbol} className="table-row">
                      <div className="col"><strong>{holding.symbol}</strong></div>
                      <div className="col">{holding.qty}</div>
                      <div className="col">${holding.avgPrice.toFixed(2)}</div>
                      <div className="col">${holding.current.toFixed(2)}</div>
                      <div className={`col ${holding.gain >= 0 ? 'positive' : 'negative'}`}>
                        {holding.gain >= 0 ? '+' : ''}{holding.gain.toFixed(2)}
                      </div>
                      <div className="col"><strong>${holding.value.toFixed(2)}</strong></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === 'assets' && (
          <div className="assets-view">
            <div className="view-header">
              <h2>💰 Assets & Account</h2>
              <p>Manage your account balance and assets</p>
            </div>

            <div className="assets-grid">
              <div className="asset-card primary">
                <div className="card-label">Available Balance</div>
                <div className="card-big-value">${user?.balance?.toFixed(2)}</div>
                <button className="card-btn">Withdraw</button>
              </div>

              <div className="asset-card">
                <div className="card-label">Total Assets</div>
                <div className="card-big-value">${(user?.balance * 3.5).toFixed(2)}</div>
                <div className="card-stat">Across all holdings</div>
              </div>

              <div className="asset-card">
                <div className="card-label">Monthly Growth</div>
                <div className="card-big-value positive">+8.5%</div>
                <div className="card-stat">From previous month</div>
              </div>
            </div>

            <div className="account-section">
              <h3>Account Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">Username:</span>
                  <span className="value">{user?.username}</span>
                </div>
                <div className="info-item">
                  <span className="label">Email:</span>
                  <span className="value">{user?.email}</span>
                </div>
                <div className="info-item">
                  <span className="label">Account Status:</span>
                  <span className="value verified">✓ Verified</span>
                </div>
                <div className="info-item">
                  <span className="label">Member Since:</span>
                  <span className="value">January 2024</span>
                </div>
              </div>
            </div>

            <div className="transactions-section">
              <h3>Recent Transactions</h3>
              <div className="transactions-list">
                {[
                  { type: 'buy', stock: 'AAPL', amount: 150, date: 'Today, 2:30 PM', status: 'success' },
                  { type: 'sell', stock: 'GOOGL', amount: 300, date: 'Yesterday, 10:15 AM', status: 'success' },
                  { type: 'deposit', stock: 'USD', amount: 5000, date: '2 days ago', status: 'success' },
                  { type: 'buy', stock: 'MSFT', amount: 200, date: '3 days ago', status: 'success' }
                ].map((tx, idx) => (
                  <div key={idx} className="tx-item">
                    <div className="tx-left">
                      <span className={`tx-icon ${tx.type}`}>
                        {tx.type === 'buy' ? '📈' : tx.type === 'sell' ? '📉' : '💳'}
                      </span>
                      <div className="tx-details">
                        <div className="tx-title">
                          {tx.type === 'buy' ? 'Buy' : tx.type === 'sell' ? 'Sell' : 'Deposit'} {tx.stock}
                        </div>
                        <div className="tx-date">{tx.date}</div>
                      </div>
                    </div>
                    <div className="tx-right">
                      <div className="tx-amount">
                        {tx.type === 'deposit' ? '+' : tx.type === 'buy' ? '-' : '+'} ${tx.amount.toFixed(2)}
                      </div>
                      <span className={`tx-status ${tx.status}`}>✓</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="actions-section">
              <button className="action-btn deposit">💳 Deposit Funds</button>
              <button className="action-btn withdraw">🏦 Withdraw Funds</button>
              <button className="action-btn settings">⚙️ Account Settings</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
