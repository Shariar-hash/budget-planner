module.exports = (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Simple test response for now
  res.status(200).json({
    message: 'Transactions endpoint is working!',
    method: req.method,
    timestamp: new Date().toISOString(),
    hasAuth: !!req.headers.authorization
  });
};
