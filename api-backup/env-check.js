module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const MONGODB_URI = process.env.MONGODB_URI || process.env.REACT_APP_MONGODB_URI;
  const JWT_SECRET = process.env.JWT_SECRET;

  res.status(200).json({
    message: 'Environment variables check',
    timestamp: new Date().toISOString(),
    hasMongoUri: !!MONGODB_URI,
    hasJwtSecret: !!JWT_SECRET,
    mongoUriPrefix: MONGODB_URI ? MONGODB_URI.substring(0, 20) + '...' : 'Not found',
    environment: process.env.NODE_ENV || 'development'
  });
};
