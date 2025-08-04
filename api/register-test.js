module.exports = async function handler(req, res) {
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
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    // Try loading MongoDB module
    const { MongoClient } = require('mongodb');
    
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
      // Simple connection with minimal options
      client = new MongoClient(MONGODB_URI);
      await client.connect();
      
      // Test connection
      await client.db().admin().ping();
      
      res.json({
        message: 'Connection successful - registration would work',
        user: {
          username,
          email
        }
      });

    } catch (dbError) {
      return res.status(500).json({ 
        error: 'Database connection failed: ' + dbError.message
      });
    } finally {
      if (client) {
        await client.close();
      }
    }

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ 
      error: 'Registration failed: ' + error.message
    });
  }
}
