const { MongoClient } = require('mongodb');

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const MONGODB_URI = process.env.REACT_APP_MONGODB_URI;

  if (!MONGODB_URI) {
    return res.status(500).json({ error: 'Database configuration error' });
  }

  let client;
  
  try {
    // Log the connection string format (without credentials)
    const uriParts = MONGODB_URI.split('@');
    const serverPart = uriParts[1] || 'unknown';
    
    console.log('Attempting connection to:', serverPart);

    // Try different connection approaches
    const attempts = [
      {
        name: "Default",
        options: {}
      },
      {
        name: "SSL Enabled with relaxed validation",
        options: {
          ssl: true,
          tlsAllowInvalidCertificates: true,
          tlsAllowInvalidHostnames: true,
          serverSelectionTimeoutMS: 5000
        }
      },
      {
        name: "SSL Disabled",
        options: {
          ssl: false,
          serverSelectionTimeoutMS: 5000
        }
      }
    ];

    const results = [];

    for (const attempt of attempts) {
      try {
        client = new MongoClient(MONGODB_URI, attempt.options);
        await client.connect();
        await client.db().admin().ping();
        
        results.push({
          method: attempt.name,
          status: "SUCCESS",
          message: "Connection successful"
        });
        
        await client.close();
        client = null;
        break; // If successful, no need to try other methods
        
      } catch (error) {
        results.push({
          method: attempt.name,
          status: "FAILED",
          error: error.message
        });
        
        if (client) {
          await client.close();
          client = null;
        }
      }
    }

    res.json({
      message: 'Connection test completed',
      server: serverPart,
      results
    });

  } catch (error) {
    console.error('Test error:', error);
    return res.status(500).json({ 
      error: 'Test failed: ' + error.message
    });
  } finally {
    if (client) {
      await client.close();
    }
  }
}
