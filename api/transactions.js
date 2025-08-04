const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
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

  let client;

  try {
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    await client.connect();
    const db = client.db();

    if (req.method === 'GET') {
      // Get transactions for the authenticated user
      const transactions = await db.collection('transactions')
        .find({ userId: new ObjectId(userId) })
        .sort({ date: -1 })
        .toArray();

      res.status(200).json(transactions);

    } else if (req.method === 'POST') {
      // Add new transaction
      const { type, category, amount, description, date } = req.body;

      if (!type || !category || !amount || !date) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      if (!['income', 'expense'].includes(type)) {
        return res.status(400).json({ error: 'Type must be either income or expense' });
      }

      if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ error: 'Amount must be a positive number' });
      }

      const transaction = {
        userId: new ObjectId(userId),
        type,
        category,
        amount: parseFloat(amount),
        description: description || '',
        date: new Date(date),
        createdAt: new Date()
      };

      const result = await db.collection('transactions').insertOne(transaction);
      
      // Return the created transaction with the new ID
      const createdTransaction = {
        ...transaction,
        _id: result.insertedId
      };

      res.status(201).json({ 
        message: 'Transaction added successfully',
        transaction: createdTransaction
      });

    } else if (req.method === 'DELETE') {
      // Delete transaction by ID from URL path
      const url = new URL(req.url, `http://${req.headers.host}`);
      const pathParts = url.pathname.split('/');
      const transactionId = pathParts[pathParts.length - 1];

      console.log('Delete request - URL:', req.url, 'Parsed ID:', transactionId);

      if (!transactionId || transactionId === 'transactions') {
        return res.status(400).json({ error: 'Transaction ID is required' });
      }

      try {
        const result = await db.collection('transactions').deleteOne({
          _id: new ObjectId(transactionId),
          userId: new ObjectId(userId)
        });

        console.log('Delete result:', result);

        if (result.deletedCount === 0) {
          return res.status(404).json({ error: 'Transaction not found' });
        }

        res.status(200).json({ message: 'Transaction deleted successfully' });
      } catch (error) {
        console.error('Delete error:', error);
        if (error.name === 'BSONError') {
          return res.status(400).json({ error: 'Invalid transaction ID format' });
        }
        throw error;
      }

    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Transactions API error:', error);
    res.status(500).json({ 
      error: 'Internal server error: ' + error.message 
    });
  } finally {
    if (client) {
      await client.close();
    }
  }
};
