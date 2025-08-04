module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({
    message: 'API Status Check',
    timestamp: new Date().toISOString(),
    apiFiles: [
      'budgets.js',
      'delete-transaction.js', 
      'index.js',
      'login.js',
      'register.js',
      'transactions.js'
    ],
    totalFiles: 6,
    underLimit: true
  });
};
