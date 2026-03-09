import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Recommendations } from '../components/Recommendations';
import { tradeAPI, newsAPI } from '../services/api';
import './Market.css';

export const Market = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [stocks, setStocks] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [loading, setLoading] = useState(false);
  const [news, setNews] = useState([]);
  const [newsLoading, setNewsLoading] = useState(false);

  useEffect(() => {
    fetchStocks();
    fetchNews();
    const interval = setInterval(fetchStocks, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchStocks = async () => {
    try {
      setLoading(true);
      const response = await tradeAPI.getStocks();
      setStocks(response.data);
    } catch (error) {
      console.error('Failed to fetch stocks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNews = async () => {
    try {
      setNewsLoading(true);
      const response = await newsAPI.getNews();
      setNews(response.data.news);
    } catch (error) {
      console.error('Failed to fetch news:', error);
      // Keep existing news on error
    } finally {
      setNewsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleViewTechnicals = (stock) => {
    setSelectedStock(stock);
  };

  const handleBuyStock = (stock) => {
    navigate('/trade', { state: { selectedStock: stock } });
  };

  const handleRefreshNews = () => {
    fetchNews();
  };

  return (
    <div className="market-wrapper">
      <nav className="market-navbar">
        <div className="navbar-brand">
          <h2>✈️ Fly</h2>
        </div>
        <div className="nav-right">
          <div className="user-balance">
            Balance: <strong>${user?.balance?.toFixed(2)}</strong>
          </div>
          <div className="navbar-menu">
            <button onClick={() => navigate('/dashboard')} className="nav-link">
              Dashboard
            </button>
            <button onClick={() => navigate('/market')} className="nav-link active">
              Market
            </button>
            <button onClick={() => navigate('/trade')} className="nav-link">
              Trade
            </button>
            <button onClick={handleLogout} className="nav-link logout">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="market-container">
        {/* Trending News Section */}
        <div className="trending-section">
          <div className="section-header">
            <div className="header-content">
              <h2>📺 Trending News & Market Updates</h2>
              <p>Latest insights and market movements</p>
            </div>
            <button 
              onClick={handleRefreshNews}
              className="refresh-btn"
              disabled={newsLoading}
              title="Refresh news"
            >
              {newsLoading ? '⟳ Refreshing...' : '🔄 Refresh'}
            </button>
          </div>

          <div className="news-grid">
            {news.length > 0 ? (
              news.map((newsItem) => (
                <div key={newsItem.id} className={`news-card ${newsItem.sentiment}`}>
                  <div className="news-icon">{newsItem.icon}</div>
                  <div className="news-content">
                    <div className="news-badge">{newsItem.date}</div>
                    <h3>{newsItem.title}</h3>
                    <p>{newsItem.description}</p>
                    <div className="news-indicator">
                      <span className="bullish-badge">Bullish 📈</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-news">Loading news...</div>
            )}
          </div>
        </div>

        {/* Top Movers Section */}
        <div className="movers-section">
          <div className="section-header">
            <h2>🔥 Top Performing Stocks</h2>
            <p>Coins and stocks with the highest growth potential</p>
          </div>

          {loading ? (
            <div className="loading-state">Loading market data...</div>
          ) : (
            <div className="stocks-table">
              <div className="table-header">
                <div className="col-symbol">Symbol</div>
                <div className="col-price">Current Price</div>
                <div className="col-change">Change</div>
                <div className="col-change-pct">Change %</div>
                <div className="col-volume">Volume</div>
                <div className="col-action">Action</div>
              </div>

              <div className="table-rows">
                {stocks.map((stock) => (
                  <div key={stock.id} className="table-row">
                    <div className="col-symbol">
                      <div className="stock-name">
                        <span className="symbol">{stock.symbol}</span>
                        <span className="name">{stock.name}</span>
                      </div>
                    </div>
                    <div className="col-price">
                      <span className="price">${stock.currentPrice.toFixed(2)}</span>
                    </div>
                    <div className="col-change">
                      <span className={`change ${stock.change >= 0 ? 'positive' : 'negative'}`}>
                        {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}
                      </span>
                    </div>
                    <div className="col-change-pct">
                      <span className={`change-pct ${stock.changePercent >= 0 ? 'positive' : 'negative'}`}>
                        {stock.changePercent >= 0 ? '📈' : '📉'} {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                      </span>
                    </div>
                    <div className="col-volume">
                      <span className="volume">{(stock.volume / 1000000).toFixed(1)}M</span>
                    </div>
                    <div className="col-action">
                      <button 
                        onClick={() => handleBuyStock(stock)}
                        className="buy-btn"
                      >
                        Buy Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Market Insights */}
        <div className="insights-section">
          <div className="section-header">
            <h2>💡 Market Insights</h2>
          </div>

          <div className="insights-grid">
            <div className="insight-card">
              <div className="insight-icon">📊</div>
              <h4>Strong Uptrend</h4>
              <p>Market showing consistent bullish momentum with average gains of 2.5% weekly</p>
            </div>

            <div className="insight-card">
              <div className="insight-icon">🎯</div>
              <h4>Tech Sector Leading</h4>
              <p>Technology and cloud computing stocks are outperforming with 18% YTD gains</p>
            </div>

            <div className="insight-card">
              <div className="insight-icon">💼</div>
              <h4>Institutional Investment</h4>
              <p>Large funds increasing positions in growth stocks and sustainable energy</p>
            </div>

            <div className="insight-card">
              <div className="insight-icon">🌍</div>
              <h4>Global Expansion</h4>
              <p>Emerging markets showing interest in US tech stocks with record inflows</p>
            </div>
          </div>
        </div>

        {/* AI Recommendations Section */}
        <Recommendations onSelectStock={(stock) => navigate('/trade', { state: { selectedStock: stock } })} />
      </div>
    </div>
  );
};
