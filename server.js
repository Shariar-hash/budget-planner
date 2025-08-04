const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const MONGODB_URI = process.env.REACT_APP_MONGODB_URI || 'mongodb://localhost:27017/budget-planner';
let db;

MongoClient.connect(MONGODB_URI)
.then(client => {
  console.log('Connected to MongoDB');
  db = client.db();
})
.catch(error => {
  console.error('MongoDB connection error:', error);
  console.log('Application cannot start without database connection.');
  process.exit(1);
});

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'budget_planner_jwt_secret_key_2025';

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// User registration
app.post('/api/auth/register', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ 
        error: 'Database connection unavailable. Please try again later.' 
      });
    }

    const { username, password, email } = req.body;

    // Check if user already exists
    const existingUser = await db.collection('users').findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Check if email already exists
    const existingEmail = await db.collection('users').findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = {
      username,
      email,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('users').insertOne(newUser);
    
    // Create JWT token
    const token = jwt.sign(
      { userId: result.insertedId, username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: { id: result.insertedId, username, email }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User login
app.post('/api/auth/login', async (req, res) => {
  try {
    // Check if database is connected
    if (!db) {
      return res.status(503).json({ 
        error: 'Database connection unavailable. Please try again later.'
      });
    }

    const { emailOrUsername, username, password } = req.body;
    
    // Support both new format (emailOrUsername) and old format (username)
    const loginIdentifier = emailOrUsername || username;

    // Find user by username or email
    const user = await db.collection('users').findOne({
      $or: [
        { username: loginIdentifier },
        { email: loginIdentifier }
      ]
    });
    
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user._id, username: user.username, email: user.email }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user transactions
app.get('/api/transactions', authenticateToken, async (req, res) => {
  try {
    const transactions = await db.collection('transactions')
      .find({ userId: req.user.userId })
      .sort({ date: -1 })
      .toArray();
    
    res.json(transactions);
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add transaction
app.post('/api/transactions', authenticateToken, async (req, res) => {
  try {
    const { type, category, amount, description } = req.body;
    
    const newTransaction = {
      userId: req.user.userId,
      type,
      category,
      amount: parseFloat(amount),
      description,
      date: new Date(),
      createdAt: new Date()
    };

    const result = await db.collection('transactions').insertOne(newTransaction);
    
    res.status(201).json({
      message: 'Transaction added successfully',
      transaction: { ...newTransaction, _id: result.insertedId }
    });
  } catch (error) {
    console.error('Add transaction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete transaction
app.delete('/api/transactions/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.collection('transactions').deleteOne({
      _id: new ObjectId(id),
      userId: req.user.userId
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user budgets
app.get('/api/budgets', authenticateToken, async (req, res) => {
  try {
    const budgets = await db.collection('budgets').findOne({ userId: req.user.userId });
    res.json(budgets || { userId: req.user.userId, budgets: {} });
  } catch (error) {
    console.error('Get budgets error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Save budgets
app.post('/api/budgets', authenticateToken, async (req, res) => {
  try {
    const { budgets } = req.body;
    
    const budgetData = {
      userId: req.user.userId,
      budgets,
      updatedAt: new Date()
    };

    const result = await db.collection('budgets').updateOne(
      { userId: req.user.userId },
      { $set: budgetData },
      { upsert: true }
    );

    res.json({
      message: 'Budgets saved successfully',
      budgets: budgetData
    });
  } catch (error) {
    console.error('Save budgets error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
