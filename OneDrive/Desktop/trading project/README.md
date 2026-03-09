# Trading App

A full-stack trading application built with Node.js/Express backend and React frontend.

## Features

- 🔐 **Secure Authentication** - Sign up and login with JWT tokens
- 📈 **Live Trading** - Real-time stock trading with live price updates
- 📊 **Portfolio Management** - Track your holdings and portfolio value
- 💰 **Account Dashboard** - Manage your balance and investments
- 📜 **Trade History** - View all your past trades
- 🎯 **Stock Watchlist** - Browse and trade multiple stocks

## Tech Stack

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** SQLite with Sequelize ORM
- **Authentication:** JWT (JSON Web Tokens)
- **Password:** bcryptjs

### Frontend
- **Framework:** React 18
- **Routing:** React Router v6
- **HTTP Client:** Axios
- **Charts:** Chart.js & react-chartjs-2

## Project Structure

```
trading project/
├── backend/
│   ├── models/          # Database models (User, Stock, Trade, Portfolio)
│   ├── routes/          # API routes (auth, trades)
│   ├── middleware/      # Authentication middleware
│   ├── config/          # Database configuration
│   ├── server.js        # Main server file
│   ├── package.json
│   └── .env
│
└── frontend/
    ├── src/
    │   ├── components/   # React components
    │   ├── pages/        # Page components
    │   ├── context/      # Auth context
    │   ├── services/     # API services
    │   ├── App.js
    │   └── index.js
    ├── public/
    │   └── index.html
    └── package.json
```

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (already included):
```
PORT=5000
SECRET_KEY=your_secret_key_change_this_in_production
DB_PATH=./database.sqlite
NODE_ENV=development
```

4. Start the backend server:
```bash
npm start
# or for development with auto-reload:
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The frontend will open at `http://localhost:3000`

## Available API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/signin` - Login user
- `GET /api/auth/me` - Get current user profile

### Trading
- `GET /api/trades/stocks` - Get all available stocks
- `POST /api/trades/buy` - Buy stocks
- `POST /api/trades/sell` - Sell stocks
- `GET /api/trades/portfolio` - Get user portfolio
- `GET /api/trades/history` - Get trade history

## Usage Guide

### 1. Sign Up
- Go to the home page and click "Sign Up"
- Fill in email, username, and password
- You'll get a $10,000 virtual balance to start trading

### 2. Browse Stocks
- Navigate to the "Trade" page
- View all available stocks with live prices
- See price changes and market data

### 3. Buy Stocks
- Click on a stock to select it
- Choose "Buy" action
- Enter the quantity you want to buy
- Confirm the purchase

### 4. Sell Stocks
- Click on a stock in your portfolio
- Choose "Sell" action
- Enter the quantity to sell
- Confirm the sale

### 5. Monitor Portfolio
- Go to Dashboard to view your holdings
- See gains/losses for each position
- Track your total portfolio value
- View complete trade history

## Sample Data

The app comes with pre-loaded stocks:
- AAPL - Apple Inc
- GOOGL - Alphabet Inc
- MSFT - Microsoft Corporation
- AMZN - Amazon.com Inc
- TSLA - Tesla Inc

Each user starts with $10,000 virtual balance.

## Key Features Explained

### Authentication
- Secure JWT-based authentication
- Passwords hashed with bcryptjs
- Protected routes for dashboard and trading

### Portfolio Management
- Automatic portfolio updates on buy/sell
- Real-time gain/loss calculations
- Average price tracking
- Portfolio value updates

### Trade Execution
- Instant trade confirmation
- Balance verification before trades
- Complete trade history tracking
- Trade status management

## Database Schema

### Users
- id, email, username, password, balance, totalInvested, portfolioValue

### Stocks
- id, symbol, name, currentPrice, previousClose, dayHigh, dayLow, volume, change, changePercent

### Trades
- id, userId, symbol, quantity, price, type (BUY/SELL), totalAmount, status, createdAt

### Portfolio
- id, userId, symbol, quantity, averagePrice, currentPrice, totalValue, gain, gainPercent

## Development Tips

### Adding New Features
1. Create components in `frontend/src/components/`
2. Create pages in `frontend/src/pages/`
3. Add API endpoints in `backend/routes/`
4. Update database models in `backend/models/`

### Styling
- Each component has its own CSS file
- Uses CSS Grid and Flexbox for layouts
- Responsive design with media queries

### Testing
Test the app by:
1. Creating an account
2. Trading stocks
3. Checking portfolio updates
4. Verifying trade history
5. Monitoring balance changes

## Future Enhancements

- WebSocket support for real-time price updates
- Advanced charting with candlesticks
- Watchlist feature
- Limit orders and stop losses
- Email notifications
- Two-factor authentication
- Mobile app version

## Troubleshooting

### Backend won't start
- Check if port 5000 is available
- Ensure Node.js is installed
- Delete `database.sqlite` and restart to reset DB

### Frontend won't connect to backend
- Ensure backend is running on port 5000
- Check proxy setting in `frontend/package.json`
- Clear browser cache and cookies

### CORS errors
- Backend CORS is enabled in `server.js`
- Check frontend is accessing correct API URL

## License

This project is open source and available under the MIT License.

## Support

For issues and questions, please refer to the documentation or create an issue in the repository.
