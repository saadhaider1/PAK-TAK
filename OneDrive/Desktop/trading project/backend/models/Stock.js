const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Stock = sequelize.define('Stock', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  symbol: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  currentPrice: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  previousClose: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  dayHigh: {
    type: DataTypes.FLOAT
  },
  dayLow: {
    type: DataTypes.FLOAT
  },
  volume: {
    type: DataTypes.BIGINT
  },
  change: {
    type: DataTypes.FLOAT
  },
  changePercent: {
    type: DataTypes.FLOAT
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: false
});

module.exports = Stock;
