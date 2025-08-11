# 💰 Budget Planner

⚠️ **SECURITY NOTICE**: This repository has been cleaned of all sensitive data. Never commit `.env` files or credentials to version control.

A modern, responsive budget planner application built with React and MongoDB. Track your income, expenses, and manage your budget with beautiful charts and analytics.

## ✨ Features

- 📊 **Income & Expense Tracking** - Add, edit, and categorize transactions
- 💼 **Budget Management** - Set budget limits and track spending
- 📈 **Visual Analytics** - Beautiful charts and graphs 
- 🔐 **User Authentication** - Secure login and registration
- 📱 **Responsive Design** - Works perfectly on all devices
- 💾 **Cloud Database** - MongoDB Atlas integration
- 🎨 **Modern UI** - Clean and intuitive interface

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Shariar-hash/budget-planner.git
   cd budget-planner
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup** ⚠️ **CRITICAL SECURITY STEP**
   ```bash
   # Copy the example environment file
   cp .env.example .env
   ```

4. **Configure Environment Variables**
   
   **⚠️ NEVER commit .env files to GitHub! They contain sensitive credentials.**
   
   Edit `.env` file with your credentials:
   ```env
   REACT_APP_MONGODB_URI=your_mongodb_atlas_connection_string
   JWT_SECRET=your_super_strong_jwt_secret_32_chars_minimum
   REACT_APP_API_URL=http://localhost:5000/api
   ```
   
   **Security Notes:**
   - Generate a strong JWT secret (minimum 32 characters)
   - Use secure MongoDB Atlas credentials  
   - Never share these credentials publicly
   - The `.env` file is already in `.gitignore`

5. **Start the application**
   ```bash
   # Development mode
   npm start
   
   # Production build
   npm run build
   ```

## 🔒 Security Best Practices

- ✅ `.env` files are excluded from version control
- ✅ No sensitive data committed to repository
- ✅ Strong JWT secrets required
- ✅ MongoDB Atlas connection secured
- ✅ Environment variables properly templated

## 🌐 Deployment

### Vercel Deployment

1. **Push to GitHub** (sensitive data already excluded)
2. **Deploy to Vercel**
   - Connect your GitHub repository to Vercel
   - Add environment variables in Vercel dashboard
   - Deploy automatically

3. **Environment Variables for Vercel**
   - `REACT_APP_MONGODB_URI` - Your MongoDB Atlas connection string
   - `JWT_SECRET` - Strong JWT secret for production
   - `REACT_APP_API_URL` - Your production API URL

## 📁 Project Structure

```
budget-planner/
├── public/                 # Static files
├── src/
│   ├── App.js             # Main application component
│   ├── App.css            # Application styles
│   ├── services/
│   │   └── database.js    # Database connection logic
│   └── ...
├── server.js              # Express server
├── .env.example           # Environment variables template (SAFE)
├── .gitignore             # Excludes sensitive files
├── package.json           # Dependencies and scripts
└── DEPLOYMENT.md          # Deployment guide
```

## 🛠️ Technology Stack

- **Frontend**: React, CSS3, Chart.js
- **Backend**: Node.js, Express.js
- **Database**: MongoDB Atlas
- **Authentication**: JWT (JSON Web Tokens)
- **Deployment**: Vercel
- **Version Control**: Git

## 🔧 MongoDB Atlas Setup

1. Create a MongoDB Atlas account
2. Create a new cluster
3. Add a database user with read/write permissions
4. Get your connection string
5. Replace placeholders in `.env` file

### Security Notes

- Never commit `.env` file to version control
- Use strong JWT secrets in production
- Enable MongoDB Atlas IP whitelisting for security
- Use HTTPS in production

## 📜 Available Scripts

- `npm start` - Run development server
- `npm run build` - Create production build
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you have any questions or need help with setup, please open an issue on GitHub.

## 🔄 Version

Current Version: 1.0.0

---

Built with ❤️ using React and MongoDB

**⚠️ Remember: Keep your credentials safe and never commit sensitive data!**
created by :

Name:Montasir Majumder Shariar

Portfolio:  https://montasir-majumder-shariar-portfolio.vercel.app/
