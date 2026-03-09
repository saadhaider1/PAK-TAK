require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const sequelize = require('./config/database');
const User = require('./models/User');
const Stock = require('./models/Stock');
const Trade = require('./models/Trade');
const Portfolio = require('./models/Portfolio');

const authRoutes = require('./routes/auth');
const tradeRoutes = require('./routes/trades');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/trades', tradeRoutes);

// News endpoint
app.get('/api/news', async (req, res) => {
  try {
    const response = await axios.get('https://newsapi.org/v2/everything?q=stock+market&sortBy=publishedAt&language=en', {
      params: { apiKey: 'bc222aa8fba24f8b9710732c4645834c' }
    });
    
    const newsData = response.data.articles.map((article, index) => ({
      id: index,
      title: article.title,
      description: article.description,
      icon: '📰',
      sentiment: 'bullish',
      date: new Date(article.publishedAt).toLocaleDateString()
    }));
    
    res.json({ news: newsData });
  } catch (error) {
    console.error('Error fetching news:', error);
    
    // Fallback to hardcoded news if API fails
    const fallbackNews = [
      {
        id: 1,
        title: 'Tech Stocks Rally on AI Momentum',
        description: 'Apple and Microsoft surge as AI adoption accelerates across enterprises. Experts predict 15% growth in Q2.',
        icon: '📈',
        sentiment: 'bullish',
        date: 'Today'
      },
      {
        id: 2,
        title: 'Market Recovery Stronger Than Expected',
        description: 'S&P 500 reaches new highs with strong corporate earnings. Analysts are bullish on growth stocks.',
        icon: '🚀',
        sentiment: 'bullish',
        date: 'Today'
      },
      {
        id: 3,
        title: 'Cloud Computing Sector Booming',
        description: 'Cloud infrastructure providers report record server demand. Amazon AWS, Microsoft Azure seeing 30%+ YoY growth.',
        icon: '☁️',
        sentiment: 'bullish',
        date: 'Yesterday'
      },
      {
        id: 4,
        title: 'Tesla Eyes New Production High',
        description: 'Tesla announces expanded factory capacity and new vehicle models. Stock expected to gain momentum.',
        icon: '⚡',
        sentiment: 'bullish',
        date: 'Yesterday'
      },
      {
        id: 5,
        title: 'Green Energy Investment Surge',
        description: 'Renewable energy stocks climbing as governments push for clean energy initiatives. Future outlook very positive.',
        icon: '🌱',
        sentiment: 'bullish',
        date: '2 days ago'
      },
      {
        id: 6,
        title: 'Crypto Market Recovery Underway',
        description: 'Bitcoin and Ethereum showing strong recovery signals. Institutional investors returning to digital assets.',
        icon: '💰',
        sentiment: 'bullish',
        date: '2 days ago'
      }
    ];
    
    res.json({ news: fallbackNews });
  }
});

// AI Recommendations endpoint
app.get('/api/recommendations', async (req, res) => {
  try {
    const recommendations = [
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
      },
      {
        id: 7,
        symbol: 'GOOGL',
        name: 'Alphabet Inc',
        type: 'Stock',
        reasoning: 'AI integration in search. Cloud infrastructure growth. YouTube revenue stability. Bard competing well.',
        riskLevel: 'Low',
        expectedReturn: '9-13%',
        confidence: '90%',
        icon: '🔍',
        action: 'BUY',
        price: 140.25,
        trend: 'up'
      },
      {
        id: 8,
        symbol: 'SOL',
        name: 'Solana',
        type: 'Cryptocurrency',
        reasoning: 'Network stability improved. High throughput attracts developers. Community engagement strong. Recovery momentum.',
        riskLevel: 'High',
        expectedReturn: '25-50%',
        confidence: '68%',
        icon: '◎',
        action: 'HOLD',
        price: 45.30,
        trend: 'up'
      }
    ];

    res.json({ recommendations });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Initialize database and add sample data
const initializeDatabase = async () => {
  try {
    await sequelize.sync({ force: false });
    console.log('Database synchronized');

    // Add sample stocks if not exists
    const stockCount = await Stock.count();
    if (stockCount === 0) {
      const sampleStocks = [
        { symbol: 'AAPL', name: 'Apple Inc', currentPrice: 150.50, previousClose: 149.80, dayHigh: 152.00, dayLow: 148.50, volume: 1000000, change: 0.70, changePercent: 0.47 },
        { symbol: 'GOOGL', name: 'Alphabet Inc', currentPrice: 140.25, previousClose: 139.50, dayHigh: 142.00, dayLow: 138.75, volume: 1500000, change: 0.75, changePercent: 0.54 },
        { symbol: 'MSFT', name: 'Microsoft Corporation', currentPrice: 380.00, previousClose: 378.50, dayHigh: 382.50, dayLow: 376.50, volume: 2000000, change: 1.50, changePercent: 0.40 },
        { symbol: 'AMZN', name: 'Amazon.com Inc', currentPrice: 170.50, previousClose: 169.00, dayHigh: 172.00, dayLow: 168.00, volume: 1200000, change: 1.50, changePercent: 0.89 },
        { symbol: 'TSLA', name: 'Tesla Inc', currentPrice: 240.75, previousClose: 235.50, dayHigh: 245.00, dayLow: 234.00, volume: 2500000, change: 5.25, changePercent: 2.23 }
      ];
      
      await Stock.bulkCreate(sampleStocks);
      console.log('Sample stocks added');
    }
  } catch (error) {
    console.error('Database initialization error:', error);
  }
};

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  await initializeDatabase();
  console.log(`Server running on port ${PORT}`);
});
