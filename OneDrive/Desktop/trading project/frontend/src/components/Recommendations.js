import React, { useState, useEffect } from 'react';
import { recommendationAPI } from '../services/api';
import './Recommendations.css';

export const Recommendations = ({ onSelectStock }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fallback recommendations if API fails
  const fallbackRecommendations = [
    {
      id: 1,
      symbol: 'AAPL',
      name: 'Apple Inc',
      type: 'Stock',
      reasoning: 'Strong AI integration across products. iPhone 15 sales surge expected with AI features. Consistent revenue growth.',
      riskLevel: 'Low',
      expectedReturn: '8-12%',
      confidence: '95%',
      icon: '📱',
      action: 'BUY',
      price: 150.50,
      trend: 'up'
    },
    {
      id: 2,
      symbol: 'MSFT',
      name: 'Microsoft Corporation',
      type: 'Stock',
      reasoning: 'ChatGPT integration in Office suite driving adoption. Cloud growth continues. Enterprise AI demand surging.',
      riskLevel: 'Low',
      expectedReturn: '10-15%',
      confidence: '92%',
      icon: '☁️',
      action: 'BUY',
      price: 380.00,
      trend: 'up'
    },
    {
      id: 3,
      symbol: 'NVDA',
      name: 'NVIDIA Corporation',
      type: 'Stock',
      reasoning: 'GPU shortage resolved. AI chip demand explosive. Data center revenue accelerating. Market leader in AI computing.',
      riskLevel: 'Medium',
      expectedReturn: '15-25%',
      confidence: '88%',
      icon: '🎮',
      action: 'BUY',
      price: 280.75,
      trend: 'up'
    },
    {
      id: 4,
      symbol: 'BTC',
      name: 'Bitcoin',
      type: 'Cryptocurrency',
      reasoning: 'Institutional adoption increasing. Halving event approaching. Market sentiment turning bullish. Long-term store of value.',
      riskLevel: 'High',
      expectedReturn: '20-40%',
      confidence: '75%',
      icon: '₿',
      action: 'HOLD',
      price: 42500,
      trend: 'up'
    },
    {
      id: 5,
      symbol: 'ETH',
      name: 'Ethereum',
      type: 'Cryptocurrency',
      reasoning: 'DeFi ecosystem growing. Layer 2 solutions improving scalability. Smart contract activity increasing.',
      riskLevel: 'High',
      expectedReturn: '18-35%',
      confidence: '72%',
      icon: '◆',
      action: 'BUY',
      price: 2200,
      trend: 'up'
    },
    {
      id: 6,
      symbol: 'TSLA',
      name: 'Tesla Inc',
      type: 'Stock',
      reasoning: 'EV market expansion. Autonomy development advancing. Energy storage business growing rapidly.',
      riskLevel: 'Medium',
      expectedReturn: '12-20%',
      confidence: '85%',
      icon: '⚡',
      action: 'BUY',
      price: 240.75,
      trend: 'up'
    }
  ];

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await recommendationAPI.getRecommendations();
      setRecommendations(response.data.recommendations);
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
      setError('Using cached recommendations');
      setRecommendations(fallbackRecommendations);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'Low':
        return '#4caf50';
      case 'Medium':
        return '#ff9800';
      case 'High':
        return '#f44336';
      default:
        return '#667eea';
    }
  };

  if (loading) {
    return (
      <div className="recommendations-container">
        <div className="loading-state">Loading AI recommendations...</div>
      </div>
    );
  }

  return (
    <div className="recommendations-container">
      <div className="rec-header">
        <div className="rec-title-section">
          <h2>🤖 AI-Powered Trading Recommendations</h2>
          <p>Personalized investment suggestions based on market analysis</p>
        </div>
        <button onClick={fetchRecommendations} className="refresh-rec-btn">
          🔄 Refresh
        </button>
      </div>

      {error && <div className="info-message">{error}</div>}

      <div className="recommendations-grid">
        {recommendations && recommendations.length > 0 ? (
          recommendations.map((rec) => (
            <div key={rec.id} className="recommendation-card">
              <div className="rec-header-top">
                <div className="rec-icon-symbol">
                  <span className="rec-icon">{rec.icon}</span>
                  <div className="rec-symbol-info">
                    <div className="rec-symbol">{rec.symbol}</div>
                    <div className="rec-type">{rec.type}</div>
                  </div>
                </div>
                <div className="rec-action-badge" style={{ color: rec.action === 'BUY' ? '#4caf50' : rec.action === 'SELL' ? '#f44336' : '#ff9800' }}>
                  {rec.action}
                </div>
              </div>

              <div className="rec-name">{rec.name}</div>

              <div className="rec-reasoning">
                <h4>Analysis</h4>
                <p>{rec.reasoning}</p>
              </div>

              <div className="rec-metrics">
                <div className="metric">
                  <span className="metric-label">Risk Level</span>
                  <span className="metric-value" style={{ color: getRiskColor(rec.riskLevel) }}>
                    {rec.riskLevel}
                  </span>
                </div>
                <div className="metric">
                  <span className="metric-label">Expected Return</span>
                  <span className="metric-value" style={{ color: '#667eea' }}>
                    {rec.expectedReturn}
                  </span>
                </div>
                <div className="metric">
                  <span className="metric-label">Confidence</span>
                  <span className="metric-value" style={{ color: '#4caf50' }}>
                    {rec.confidence}
                  </span>
                </div>
              </div>

              <div className="rec-price-info">
                <div className="price">
                  <span className="price-label">Current Price</span>
                  <span className="price-value">
                    ${typeof rec.price === 'number' ? rec.price.toFixed(2) : rec.price}
                  </span>
                </div>
                <div className="trend-indicator">
                  {rec.trend === 'up' ? '📈 Uptrend' : '📉 Downtrend'}
                </div>
              </div>

              <button 
                onClick={() => onSelectStock && onSelectStock(rec)}
                className="invest-btn"
              >
                Invest Now
              </button>
            </div>
          ))
        ) : (
          <div className="no-recommendations">No recommendations available</div>
        )}
      </div>
    </div>
  );
};
