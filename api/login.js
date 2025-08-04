const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const MONGODB_URI = process.env.MONGODB_URI || process.env.REACT_APP_MONGODB_URI;
  const JWT_SECRET = process.env.JWT_SECRET;

  if (!MONGODB_URI) {
    return res.status(500).json({ error: 'Database configuration error' });
  }

  if (!JWT_SECRET) {
    return res.status(500).json({ error: 'Authentication configuration error' });
  }

  let client;
  
  try {
    const { emailOrUsername, username, password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    // Find user by email or username
    const loginField = emailOrUsername || username;
    if (!loginField) {
      return res.status(400).json({ error: 'Email or username is required' });
    }

    // Connect to MongoDB with minimal options
    client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    await client.connect();
    const db = client.db();

    const user = await db.collection('users').findOne({
      $or: [{ email: loginField }, { username: loginField }]
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        username: user.username,
        email: user.email
      }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      error: 'Login failed: ' + error.message
    });
  } finally {
    // Always close the connection
    if (client) {
      await client.close();
    }
  }
}
