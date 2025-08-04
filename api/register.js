const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// MongoDB connection
const MONGODB_URI = process.env.REACT_APP_MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;

let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }

  try {
    console.log('Connecting to MongoDB...');
    const client = await MongoClient.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connection successful');
    const db = client.db();
    cachedDb = db;
    return db;
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    throw new Error('Database connection failed: ' + error.message);
  }
}

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

  try {
    // Check if MongoDB URI is available
    if (!MONGODB_URI) {
      console.error('MONGODB_URI environment variable is not set');
      return res.status(500).json({ error: 'Database configuration error' });
    }

    // Check if JWT_SECRET is available
    if (!JWT_SECRET) {
      console.error('JWT_SECRET environment variable is not set');
      return res.status(500).json({ error: 'Authentication configuration error' });
    }

    const database = await connectToDatabase();
    const { username, password, email } = req.body;

    console.log('Registration attempt:', { username, email, hasPassword: !!password });

    if (!username || !password || !email) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user already exists
    const existingUser = await database.collection('users').findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const newUser = {
      username,
      email,
      password: hashedPassword,
      createdAt: new Date()
    };

    const result = await database.collection('users').insertOne(newUser);

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: result.insertedId, 
        username: username,
        email: email
      }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: result.insertedId,
        username,
        email
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    // Return a proper error response
    if (error.code === 11000) {
      return res.status(400).json({ error: 'User with this email or username already exists' });
    }
    
    return res.status(500).json({ 
      error: error.message || 'Internal server error during registration' 
    });
  }
}
