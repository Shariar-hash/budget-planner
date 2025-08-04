const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'DELETE') {
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

  // Extract and verify JWT token
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  let userId;
  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    userId = decoded.userId;
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  // Extract transaction ID from query parameters
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ error: 'Transaction ID is required' });
  }

  let client;

  try {
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    await client.connect();
    const db = client.db();

    // Delete the transaction (ensure it belongs to the authenticated user)
    const result = await db.collection('transactions').deleteOne({
      _id: new ObjectId(id),
      userId: new ObjectId(userId)
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Transaction not found or not authorized' });
    }

    res.status(200).json({ 
      message: 'Transaction deleted successfully',
      deletedId: id
    });

  } catch (error) {
    console.error('Delete transaction error:', error);
    
    if (error.name === 'BSONError') {
      return res.status(400).json({ error: 'Invalid transaction ID format' });
    }
    
    res.status(500).json({ 
      error: 'Failed to delete transaction: ' + error.message 
    });
  } finally {
    if (client) {
      await client.close();
    }
  }
}
