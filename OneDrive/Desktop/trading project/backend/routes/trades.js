const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');
const Stock = require('../models/Stock');
const Trade = require('../models/Trade');
const Portfolio = require('../models/Portfolio');

const router = express.Router();

// Get all stocks
router.get('/stocks', async (req, res) => {
  try {
    const stocks = await Stock.findAll();
    res.json(stocks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Buy stock
router.post('/buy', authenticateToken, async (req, res) => {
  try {
    const { symbol, quantity } = req.body;
    const userId = req.user.id;

    const stock = await Stock.findOne({ where: { symbol } });
    if (!stock) {
      return res.status(404).json({ error: 'Stock not found' });
    }

    const user = await User.findByPk(userId);
    const totalCost = stock.currentPrice * quantity;

    if (user.balance < totalCost) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Create trade record
    const trade = await Trade.create({
      userId,
      symbol,
      quantity,
      price: stock.currentPrice,
      type: 'BUY',
      totalAmount: totalCost,
      status: 'COMPLETED'
    });

    // Update user balance
    user.balance -= totalCost;
    user.totalInvested += totalCost;
    await user.save();

    // Update or create portfolio
    const existing = await Portfolio.findOne({
      where: { userId, symbol }
    });

    if (existing) {
      const newAveragePrice = (
        (existing.averagePrice * existing.quantity) +
        (stock.currentPrice * quantity)
      ) / (existing.quantity + quantity);

      existing.quantity += quantity;
      existing.averagePrice = newAveragePrice;
      existing.currentPrice = stock.currentPrice;
      existing.totalValue = existing.quantity * stock.currentPrice;
      existing.gain = existing.totalValue - (existing.quantity * existing.averagePrice);
      existing.gainPercent = (existing.gain / (existing.quantity * existing.averagePrice)) * 100;
      await existing.save();
    } else {
      await Portfolio.create({
        userId,
        symbol,
        quantity,
        averagePrice: stock.currentPrice,
        currentPrice: stock.currentPrice,
        totalValue: totalCost,
        gain: 0,
        gainPercent: 0
      });
    }

    res.status(201).json({
      message: 'Stock purchased successfully',
      trade,
      newBalance: user.balance
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sell stock
router.post('/sell', authenticateToken, async (req, res) => {
  try {
    const { symbol, quantity } = req.body;
    const userId = req.user.id;

    const stock = await Stock.findOne({ where: { symbol } });
    if (!stock) {
      return res.status(404).json({ error: 'Stock not found' });
    }

    const portfolio = await Portfolio.findOne({
      where: { userId, symbol }
    });

    if (!portfolio || portfolio.quantity < quantity) {
      return res.status(400).json({ error: 'Insufficient stock quantity' });
    }

    const user = await User.findByPk(userId);
    const totalRevenue = stock.currentPrice * quantity;

    // Create trade record
    const trade = await Trade.create({
      userId,
      symbol,
      quantity,
      price: stock.currentPrice,
      type: 'SELL',
      totalAmount: totalRevenue,
      status: 'COMPLETED'
    });

    // Update user balance
    user.balance += totalRevenue;
    await user.save();

    // Update portfolio
    portfolio.quantity -= quantity;

    if (portfolio.quantity === 0) {
      await portfolio.destroy();
    } else {
      portfolio.totalValue = portfolio.quantity * stock.currentPrice;
      portfolio.gain = portfolio.totalValue - (portfolio.quantity * portfolio.averagePrice);
      portfolio.gainPercent = (portfolio.gain / (portfolio.quantity * portfolio.averagePrice)) * 100;
      await portfolio.save();
    }

    res.json({
      message: 'Stock sold successfully',
      trade,
      newBalance: user.balance
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user portfolio
router.get('/portfolio', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const portfolio = await Portfolio.findAll({
      where: { userId }
    });

    res.json(portfolio);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get trade history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const trades = await Trade.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']]
    });

    res.json(trades);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
