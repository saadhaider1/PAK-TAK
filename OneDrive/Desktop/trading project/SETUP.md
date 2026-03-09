# Trading App Setup Guide

## Quick Start

### 1. Start the Backend Server

```bash
cd backend
npm install
npm start
```

Backend will run on: `http://localhost:5000`

### 2. Start the Frontend Server

In a new terminal:

```bash
cd frontend
npm install
npm start
```

Frontend will run on: `http://localhost:3000`

## Default Test Account

You can create your own account or use these credentials:
- Email: test@example.com
- Password: test123

## Key Pages

- **Home:** `http://localhost:3000/` - Landing page
- **Sign Up:** `http://localhost:3000/signup` - Create new account
- **Sign In:** `http://localhost:3000/signin` - Login to existing account
- **Trade:** `http://localhost:3000/trade` - Buy/Sell stocks
- **Dashboard:** `http://localhost:3000/dashboard` - View portfolio and trade history

## Initial Features

✅ User authentication (Sign up/Sign in)
✅ Live stock trading interface
✅ Portfolio management
✅ Trade history tracking
✅ Account dashboard
✅ Real-time balance updates
✅ Gain/loss calculations

## Database

The app uses SQLite database which is automatically created on first run.
Database file: `backend/database.sqlite`

To reset the database, delete the `database.sqlite` file and restart the backend.

## Environment Variables

Backend `.env` file is already configured with defaults. 

For production, update `.env`:
- Change `SECRET_KEY` to a strong random string
- Change `NODE_ENV` to `production`

## Available Stocks for Trading

1. AAPL - Apple Inc - $150.50
2. GOOGL - Alphabet Inc - $140.25
3. MSFT - Microsoft Corporation - $380.00
4. AMZN - Amazon.com Inc - $170.50
5. TSLA - Tesla Inc - $240.75

## Trading Instructions

1. Go to Trade page
2. Click on a stock card to select it
3. View stock details (price, high, low, volume)
4. Choose BUY or SELL action
5. Enter quantity and confirm
6. Check Dashboard for portfolio updates

## Support

For detailed documentation, see README.md in the project root.
