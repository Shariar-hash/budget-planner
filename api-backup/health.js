const { MongoClient } = require('mongodb');

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const MONGODB_URI = process.env.MONGODB_URI || process.env.REACT_APP_MONGODB_URI;
  
  let client;
  let dbStatus = 'disconnected';
  
  try {
    if (MONGODB_URI) {
      client = new MongoClient(MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
      });
      await client.connect();
      await client.db().admin().ping();
      dbStatus = 'connected';
    }
  } catch (error) {
    console.error('Database connection test failed:', error);
    dbStatus = 'error: ' + error.message;
  } finally {
    if (client) {
      await client.close();
    }
  }

  res.status(200).json({
    status: 'API is running',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    environment: process.env.NODE_ENV || 'development',
    hasMongoUri: !!MONGODB_URI,
    hasJwtSecret: !!process.env.JWT_SECRET
  });
}
