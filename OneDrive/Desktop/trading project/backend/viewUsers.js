const sequelize = require('./config/database');
const User = require('./models/User');

async function viewUsers() {
  try {
    await sequelize.authenticate();
    console.log('Database connected!\n');
    
    const users = await User.findAll({
      attributes: ['id', 'email', 'username', 'balance', 'totalInvested', 'portfolioValue', 'createdAt'],
      raw: true
    });

    if (users.length === 0) {
      console.log('No users registered yet.');
    } else {
      console.log('Registered Users:');
      console.table(users);
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

viewUsers();
