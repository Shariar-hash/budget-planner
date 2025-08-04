const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
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
      // Get budgets for the authenticated user
      const userBudgets = await db.collection('budgets')
        .findOne({ userId: new ObjectId(userId) });

      if (!userBudgets) {
        // Return empty budgets structure if none exists
        res.status(200).json({});
      } else {
        res.status(200).json(userBudgets.budgets || {});
      }

    } else if (req.method === 'POST') {
      // Save/update budgets
      const { budgets } = req.body;

      if (!budgets || typeof budgets !== 'object') {
        return res.status(400).json({ error: 'Valid budgets object is required' });
      }

      // Validate budget structure
      for (const [category, amount] of Object.entries(budgets)) {
        if (typeof amount !== 'number' || amount < 0) {
          return res.status(400).json({ 
            error: `Invalid budget amount for category ${category}. Must be a non-negative number.` 
          });
        }
      }

      // Upsert (update or insert) the user's budgets
      const result = await db.collection('budgets').updateOne(
        { userId: new ObjectId(userId) },
        { 
          $set: { 
            budgets,
            updatedAt: new Date()
          },
          $setOnInsert: {
            userId: new ObjectId(userId),
            createdAt: new Date()
          }
        },
        { upsert: true }
      );

      res.status(200).json({
        message: 'Budgets saved successfully',
        budgets,
        modified: result.modifiedCount > 0,
        upserted: result.upsertedCount > 0
      });

    } else if (req.method === 'PUT') {
      // Alternative endpoint for updating budgets
      const { budgets } = req.body;

      if (!budgets || typeof budgets !== 'object') {
        return res.status(400).json({ error: 'Valid budgets object is required' });
      }

      // Validate budget structure
      for (const [category, amount] of Object.entries(budgets)) {
        if (typeof amount !== 'number' || amount < 0) {
          return res.status(400).json({ 
            error: `Invalid budget amount for category ${category}. Must be a non-negative number.` 
          });
        }
      }

      // Update the user's budgets
      const result = await db.collection('budgets').updateOne(
        { userId: new ObjectId(userId) },
        { 
          $set: { 
            budgets,
            updatedAt: new Date()
          }
        }
      );

      if (result.matchedCount === 0) {
        // Create new budgets if none exist
        await db.collection('budgets').insertOne({
          userId: new ObjectId(userId),
          budgets,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      res.status(200).json({
        message: 'Budgets updated successfully',
        budgets
      });

    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Budgets API error:', error);
    res.status(500).json({ 
      error: 'Internal server error: ' + error.message 
    });
  } finally {
    if (client) {
      await client.close();
    }
  }
}
