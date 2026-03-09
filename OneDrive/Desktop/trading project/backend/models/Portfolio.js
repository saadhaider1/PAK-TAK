const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Portfolio = sequelize.define('Portfolio', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  symbol: {
    type: DataTypes.STRING,
    allowNull: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  averagePrice: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  currentPrice: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  totalValue: {
    type: DataTypes.FLOAT
  },
  gain: {
    type: DataTypes.FLOAT
  },
  gainPercent: {
    type: DataTypes.FLOAT
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true
});

module.exports = Portfolio;
