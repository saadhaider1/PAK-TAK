import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { tradeAPI } from '../services/api';
import './TradingInterface.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export const TradingInterface = ({ recommendedStock }) => {
  const [stocks, setStocks] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [action, setAction] = useState('BUY');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [chartData, setChartData] = useState(null);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [accountDetails, setAccountDetails] = useState({
    cardHolder: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    accountType: 'credit'
  });

  useEffect(() => {
    fetchStocks();
    const interval = setInterval(fetchStocks, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedStock) {
      generateChartData(selectedStock);
    }
  }, [selectedStock]);

  // When a stock is recommended from the Recommendations component, select it
  useEffect(() => {
    if (recommendedStock && stocks.length > 0) {
      const stock = stocks.find(s => s.symbol === recommendedStock.symbol);
      if (stock) {
        setSelectedStock(stock);
        // Scroll to trading interface
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [recommendedStock, stocks]);

  const fetchStocks = async () => {
    try {
      const response = await tradeAPI.getStocks();
      setStocks(response.data);
      if (!selectedStock && response.data.length > 0) {
        setSelectedStock(response.data[0]);
      } else if (selectedStock) {
        const updated = response.data.find(s => s.symbol === selectedStock.symbol);
        if (updated) setSelectedStock(updated);
      }
    } catch (error) {
      console.error('Failed to fetch stocks:', error);
    }
  };

  const generateChartData = (stock) => {
    const days = 30;
    const labels = [];
    const prices = [];
    let basePrice = stock.currentPrice;

    for (let i = days; i > 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      
      const change = (Math.random() - 0.5) * basePrice * 0.02;
      basePrice += change;
      prices.push(parseFloat(basePrice.toFixed(2)));
    }

    setChartData({
      labels,
      datasets: [
        {
          label: `${stock.symbol} Price (30 days)`,
          data: prices,
          borderColor: '#667eea',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#667eea',
          pointBorderColor: '#1a1a2e',
          pointBorderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 5,
        },
      ],
    });
  };

  const handleTrade = async (e) => {
    e.preventDefault();
    if (!selectedStock || quantity <= 0) {
      setMessage('Please select a stock and enter valid quantity');
      return;
    }

    // Show account details modal for BUY action
    if (action === 'BUY') {
      setShowAccountModal(true);
      return;
    }

    // For SELL, proceed directly
    await executeTrade();
  };

  const executeTrade = async () => {
    setLoading(true);
    try {
      const data = { symbol: selectedStock.symbol, quantity: parseInt(quantity) };
      if (action === 'BUY') {
        await tradeAPI.buyStock(data);
        setMessage(`✓ Successfully bought ${quantity} shares of ${selectedStock.symbol}`);
      } else {
        await tradeAPI.sellStock(data);
        setMessage(`✓ Successfully sold ${quantity} shares of ${selectedStock.symbol}`);
      }
      setQuantity(1);
      setShowAccountModal(false);
      setAccountDetails({
        cardHolder: '',
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        accountType: 'credit'
      });
      fetchStocks();
    } catch (error) {
      setMessage(`✗ ${error.response?.data?.error || 'Trade failed'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAccountDetailsSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!accountDetails.cardHolder || !accountDetails.cardNumber || !accountDetails.expiryDate || !accountDetails.cvv) {
      alert('Please fill in all account details');
      return;
    }

    if (accountDetails.cardNumber.length !== 16) {
      alert('Card number must be 16 digits');
      return;
    }

    if (accountDetails.cvv.length !== 3) {
      alert('CVV must be 3 digits');
      return;
    }

    // Proceed with trade
    await executeTrade();
  };

  const handleAccountInputChange = (e) => {
    const { name, value } = e.target;
    setAccountDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: {
          color: '#b0b0c0',
          font: { size: 12, family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" },
          usePointStyle: true,
          padding: 20,
        },
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
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
          drawBorder: false,
        },
        ticks: {
          color: '#8080a0',
          font: { size: 11 },
          callback: function(value) {
            return '$' + value.toFixed(0);
          }
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#8080a0',
          font: { size: 11 },
        },
      },
    },
  };

  return (
    <div className="trading-interface">
      <div className="trading-container">
        {/* Left Section - Stocks List */}
        <div className="stocks-section">
          <h3>Available Stocks</h3>
          <div className="stocks-grid">
            {stocks.map((stock) => (
              <div
                key={stock.id}
                className={`stock-card ${selectedStock?.id === stock.id ? 'selected' : ''}`}
                onClick={() => setSelectedStock(stock)}
              >
                <div className="stock-header">
                  <div className="stock-symbol">{stock.symbol}</div>
                  <div className={`stock-change ${stock.change >= 0 ? 'up' : 'down'}`}>
                    {stock.change >= 0 ? '+' : ''}{stock.changePercent?.toFixed(2)}%
                  </div>
                </div>
                <div className="stock-name">{stock.name}</div>
                <div className="stock-price">${stock.currentPrice.toFixed(2)}</div>
                <div className="stock-info">
                  <span>H: ${stock.dayHigh?.toFixed(2)}</span>
                  <span>L: ${stock.dayLow?.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Section - Chart & Trading */}
        <div className="chart-section">
          {selectedStock && chartData && (
            <>
              {/* Chart */}
              <div className="chart-container">
                <div className="chart-header">
                  <div className="chart-title">
                    <h3>{selectedStock.symbol}</h3>
                    <p>{selectedStock.name}</p>
                  </div>
                  <div className="chart-stats">
                    <div className="stat">
                      <span className="label">Price</span>
                      <span className="value">${selectedStock.currentPrice.toFixed(2)}</span>
                    </div>
                    <div className="stat">
                      <span className="label">Volume</span>
                      <span className="value">{(selectedStock.volume / 1000000).toFixed(1)}M</span>
                    </div>
                    <div className="stat">
                      <span className="label">Change</span>
                      <span className={`value ${selectedStock.change >= 0 ? 'up' : 'down'}`}>
                        {selectedStock.change >= 0 ? '+' : ''}{selectedStock.change?.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="chart-canvas">
                  <Line data={chartData} options={chartOptions} />
                </div>
              </div>

              {/* Trade Form */}
              <div className="trade-form-container">
                {message && <div className={`trade-message ${message.includes('✓') ? 'success' : 'error'}`}>{message}</div>}
                <form onSubmit={handleTrade}>
                  <div className="form-group">
                    <label>Type</label>
                    <div className="action-buttons">
                      <button
                        type="button"
                        className={`action-btn ${action === 'BUY' ? 'active buy' : ''}`}
                        onClick={() => setAction('BUY')}
                      >
                        BUY
                      </button>
                      <button
                        type="button"
                        className={`action-btn ${action === 'SELL' ? 'active sell' : ''}`}
                        onClick={() => setAction('SELL')}
                      >
                        SELL
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="Enter quantity"
                    />
                  </div>

                  <div className="form-group">
                    <label>Price per Share</label>
                    <input
                      type="text"
                      value={`$${selectedStock.currentPrice.toFixed(2)}`}
                      disabled
                    />
                  </div>

                  <div className="trade-summary">
                    <div className="summary-item">
                      <span>Total Amount:</span>
                      <span className="amount">${(selectedStock.currentPrice * quantity).toFixed(2)}</span>
                    </div>
                  </div>

                  <button type="submit" disabled={loading} className={`trade-btn ${action.toLowerCase()}`}>
                    {loading ? 'Processing...' : `${action} ${selectedStock.symbol}`}
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Account Details Modal */}
      {showAccountModal && (
        <div className="modal-overlay" onClick={() => setShowAccountModal(false)}>
          <div className="account-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>💳 Account Verification</h2>
              <button className="close-btn" onClick={() => setShowAccountModal(false)}>✕</button>
            </div>

            <div className="modal-content">
              <div className="trade-summary-modal">
                <h3>Order Summary</h3>
                <div className="summary-row">
                  <span>Stock:</span>
                  <span className="bold">{selectedStock?.symbol}</span>
                </div>
                <div className="summary-row">
                  <span>Quantity:</span>
                  <span className="bold">{quantity}</span>
                </div>
                <div className="summary-row">
                  <span>Price Per Share:</span>
                  <span className="bold">${selectedStock?.currentPrice.toFixed(2)}</span>
                </div>
                <div className="summary-row total">
                  <span>Total Amount:</span>
                  <span className="bold">${(selectedStock?.currentPrice * quantity).toFixed(2)}</span>
                </div>
              </div>

              <form onSubmit={handleAccountDetailsSubmit} className="account-form">
                <div className="form-section">
                  <h4>Payment Method</h4>
                  
                  <div className="form-group">
                    <label>Account Type</label>
                    <select 
                      name="accountType" 
                      value={accountDetails.accountType}
                      onChange={handleAccountInputChange}
                      className="form-select"
                    >
                      <option value="credit">Credit Card</option>
                      <option value="debit">Debit Card</option>
                      <option value="bank">Bank Account</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Cardholder Name *</label>
                    <input
                      type="text"
                      name="cardHolder"
                      value={accountDetails.cardHolder}
                      onChange={handleAccountInputChange}
                      placeholder="John Doe"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Card Number (16 digits) *</label>
                    <input
                      type="text"
                      name="cardNumber"
                      value={accountDetails.cardNumber}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 16);
                        handleAccountInputChange({ target: { name: 'cardNumber', value: val } });
                      }}
                      placeholder="1234 5678 9012 3456"
                      maxLength="16"
                      className="form-input"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Expiry Date (MM/YY) *</label>
                      <input
                        type="text"
                        name="expiryDate"
                        value={accountDetails.expiryDate}
                        onChange={(e) => {
                          let val = e.target.value.replace(/\D/g, '');
                          if (val.length >= 2) {
                            val = val.slice(0, 2) + '/' + val.slice(2, 4);
                          }
                          handleAccountInputChange({ target: { name: 'expiryDate', value: val } });
                        }}
                        placeholder="MM/YY"
                        maxLength="5"
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label>CVV (3 digits) *</label>
                      <input
                        type="text"
                        name="cvv"
                        value={accountDetails.cvv}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 3);
                          handleAccountInputChange({ target: { name: 'cvv', value: val } });
                        }}
                        placeholder="123"
                        maxLength="3"
                        className="form-input cvv-input"
                      />
                    </div>
                  </div>

                  <div className="info-message">
                    <span>⏒ Your payment information is encrypted and secure</span>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="button" onClick={() => setShowAccountModal(false)} className="btn-cancel">
                    Cancel
                  </button>
                  <button type="submit" disabled={loading} className="btn-confirm">
                    {loading ? '⟳ Processing...' : '✓ Confirm & Buy'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
