require('dotenv').config();
const express = require('express');
const { Sequelize } = require('sequelize');
const app = express();

app.use(express.json());

// Database connection
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: 'postgres',
});

// Test database connection
sequelize.authenticate()
  .then(() => console.log('Connected to the database'))
  .catch((err) => console.error('Unable to connect to the database:', err));

// Route d'exemple
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Subscription Manager API' });
});

// Start server
app.listen(5000, () => console.log('Server is running on port 5000'));
