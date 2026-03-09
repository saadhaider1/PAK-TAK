import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Recommendations } from '../components/Recommendations';
import { TradingInterface } from '../components/TradingInterface';
import './Trade.css';

export const Trade = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [recommendedStock, setRecommendedStock] = React.useState(null);

  // Handle stock selection from navigation state (from Dashboard/Market)
  useEffect(() => {
    if (location.state?.selectedStock) {
      setRecommendedStock({
        symbol: location.state.selectedStock.symbol,
        name: location.state.selectedStock.name,
        currentPrice: location.state.selectedStock.price || 0
      });
    }
  }, [location.state]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSelectStock = (stock) => {
    // Convert recommendation data to trading format
    setRecommendedStock({
      symbol: stock.symbol,
      name: stock.name,
      currentPrice: stock.price || 0
    });
  };

  if (!user) {
    navigate('/signin');
    return null;
  }

  return (
    <div className="trade-wrapper">
      <nav className="trade-navbar">
        <div className="navbar-brand">
          <h2>✈️ Fly</h2>
        </div>
        <div className="nav-right">
          <div className="user-balance">
            Balance: <strong>${user?.balance?.toFixed(2)}</strong>
          </div>
          <div className="navbar-menu">
            <button onClick={() => navigate('/trade')} className="nav-link active">
              Trade
            </button>
            <button onClick={() => navigate('/market')} className="nav-link">
              Market
            </button>
            <button onClick={() => navigate('/dashboard')} className="nav-link">
              Dashboard
            </button>
            <button onClick={handleLogout} className="nav-link logout">
              Logout
            </button>
          </div>
        </div>
      </nav>
      <div className="trade-container">
        <TradingInterface recommendedStock={recommendedStock} />
        <Recommendations onSelectStock={handleSelectStock} />
      </div>
    </div>
  );
};
