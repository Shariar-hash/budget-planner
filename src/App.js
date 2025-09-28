import React, { useState, useEffect, useMemo } from 'react';
import { PlusCircle, DollarSign, TrendingUp, TrendingDown, Download, Moon, Sun, AlertCircle, Trash2, Edit2, Save, X, User, LogOut, LogIn, UserPlus, Eye, EyeOff } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import dbService from './services/database';

// Styles Component
const styles = {
  container: {
    minHeight: '100vh',
    transition: 'all 0.3s ease',
  },
  card: {
    backgroundColor: 'var(--card-bg)',
    borderRadius: '12px',
    padding: 'clamp(16px, 4vw, 24px)',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    border: '1px solid var(--border-color)',
    transition: 'all 0.3s ease',
    transform: 'translateY(0)',
  },
  cardHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  },
  button: {
    padding: 'clamp(8px, 2vw, 12px) clamp(12px, 3vw, 20px)',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: 'clamp(12px, 2.5vw, 14px)',
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    color: 'white',
  },
  secondaryButton: {
    backgroundColor: 'var(--secondary-bg)',
    color: 'var(--text-color)',
    border: '1px solid var(--border-color)',
  },
  input: {
    width: '100%',
    padding: 'clamp(10px, 2.5vw, 12px)',
    borderRadius: '8px',
    border: '1px solid var(--border-color)',
    backgroundColor: 'var(--input-bg)',
    color: 'var(--text-color)',
    fontSize: 'clamp(12px, 2.5vw, 14px)',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    padding: 'clamp(10px, 2.5vw, 12px)',
    borderRadius: '8px',
    border: '1px solid var(--border-color)',
    backgroundColor: 'var(--input-bg)',
    color: 'var(--text-color)',
    fontSize: 'clamp(12px, 2.5vw, 14px)',
    cursor: 'pointer',
    boxSizing: 'border-box',
  }
};

const BudgetPlanner = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [tempBudgets, setTempBudgets] = useState({}); // Temporary budgets for editing
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [showPassword, setShowPassword] = useState(false);
  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  });
  
  // Notification system state
  const [notifications, setNotifications] = useState([]);
  const [notificationId, setNotificationId] = useState(0);
  const [newTransaction, setNewTransaction] = useState({
    type: 'expense',
    amount: '',
    category: 'Food',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const categories = {
    expense: ['Food', 'Travel', 'Rent', 'Entertainment', 'Healthcare', 'Shopping', 'Bills', 'Other'],
    income: ['Salary', 'Freelance', 'Investment', 'Business', 'Gift', 'Other']
  };

  const categoryColors = {
    Food: '#ff6b6b', Travel: '#4ecdc4', Rent: '#45b7d1', Entertainment: '#96ceb4',
    Healthcare: '#feca57', Shopping: '#ff9ff3', Bills: '#54a0ff', Other: '#5f27cd',
    Salary: '#00d2d3', Freelance: '#ff9f43', Investment: '#10ac84', Business: '#ee5a24',
    Gift: '#0abde3'
  };

  // Notification functions
  const showNotification = (message, type = 'info', duration = 4000) => {
    const id = notificationId + 1;
    setNotificationId(id);
    
    const notification = {
      id,
      message,
      type, // 'success', 'error', 'warning', 'info'
      timestamp: Date.now()
    };
    
    setNotifications(prev => [...prev, notification]);
    
    // Auto remove after duration
    setTimeout(() => {
      removeNotification(id);
    }, duration);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  // Load data from localStorage and check authentication on mount
  useEffect(() => {
    const initializeApp = async () => {
      const savedDarkMode = localStorage.getItem('darkMode');
      if (savedDarkMode) setDarkMode(JSON.parse(savedDarkMode));

      // Check if user is authenticated
      if (dbService.isAuthenticated()) {
        const user = dbService.getCurrentUser();
        setCurrentUser(user);
        await loadUserData();
      } else {
        setShowAuth(true);
      }
    };

    initializeApp();
  }, []);

  // Load user-specific data from database
  const loadUserData = async () => {
    try {
      const [transactionsData, budgetsData] = await Promise.all([
        dbService.getTransactions(),
        dbService.getBudgets()
      ]);

      setTransactions(transactionsData);
      
      if (budgetsData && budgetsData.budgets) {
        setBudgets(budgetsData.budgets);
        setTempBudgets(budgetsData.budgets);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      // Fallback to local storage if API fails
      const user = dbService.getCurrentUser();
      if (user) {
        const savedTransactions = localStorage.getItem(`budgetTransactions_${user.username}`);
        const savedBudgets = localStorage.getItem(`budgetLimits_${user.username}`);
        
        if (savedTransactions) setTransactions(JSON.parse(savedTransactions));
        if (savedBudgets) {
          const budgetData = JSON.parse(savedBudgets);
          setBudgets(budgetData);
          setTempBudgets(budgetData);
        }
      }
    }
  };

  // Save data to localStorage when state changes (backup)
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`budgetTransactions_${currentUser.username}`, JSON.stringify(transactions));
    }
  }, [transactions, currentUser]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`budgetLimits_${currentUser.username}`, JSON.stringify(budgets));
    }
  }, [budgets, currentUser]);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.style.setProperty('--bg-color', '#1a1a1a');
      root.style.setProperty('--card-bg', '#2d2d2d');
      root.style.setProperty('--text-color', '#ffffff');
      root.style.setProperty('--secondary-text', '#a0a0a0');
      root.style.setProperty('--border-color', '#404040');
      root.style.setProperty('--input-bg', '#404040');
      root.style.setProperty('--secondary-bg', '#404040');
    } else {
      root.style.setProperty('--bg-color', '#f8fafc');
      root.style.setProperty('--card-bg', '#ffffff');
      root.style.setProperty('--text-color', '#1a202c');
      root.style.setProperty('--secondary-text', '#718096');
      root.style.setProperty('--border-color', '#e2e8f0');
      root.style.setProperty('--input-bg', '#ffffff');
      root.style.setProperty('--secondary-bg', '#f7fafc');
    }
  }, [darkMode]);

  const handleAuth = async () => {
    const { email, password, confirmPassword, name } = authForm;
    
    if (!email || !password) {
      showNotification('Please fill in all required fields', 'warning');
      return;
    }
    
    try {
      if (authMode === 'signup') {
        if (!name) {
          showNotification('Please enter your name', 'warning');
          return;
        }
        if (password !== confirmPassword) {
          showNotification('Passwords do not match', 'error');
          return;
        }
        if (password.length < 6) {
          showNotification('Password must be at least 6 characters long', 'warning');
          return;
        }
        
        const result = await dbService.register({
          username: name,
          email: email,
          password: password
        });
        
        setCurrentUser(result.user);
        setShowAuth(false);
        showNotification('Account created successfully! 🎉', 'success');
        
      } else {
        // Login
        const result = await dbService.login({
          emailOrUsername: email, // Can be either email or username
          password: password
        });
        
        setCurrentUser(result.user);
        setShowAuth(false);
        await loadUserData();
        showNotification('Logged in successfully! 👋', 'success');
      }
      
      // Reset form
      setAuthForm({
        email: '',
        password: '',
        confirmPassword: '',
        name: ''
      });
      
    } catch (error) {
      if (authMode === 'login') {
        showNotification(`Login failed: ${error.message}. Tip: You can use either your username or email to login. If this is your first time, please create an account using the "Sign Up" option.`, 'error', 6000);
      } else {
        showNotification(`Registration failed: ${error.message}`, 'error');
      }
      console.error('Auth error:', error);
    }
  };

  const handleLogout = () => {
    dbService.logout();
    setCurrentUser(null);
    setTransactions([]);
    setBudgets({});
    setTempBudgets({});
    setShowAuth(true);
  };

  const addTransaction = async () => {
    if (!newTransaction.amount || !newTransaction.description) {
      showNotification('Please fill in amount and description', 'warning');
      return;
    }
    
    if (parseFloat(newTransaction.amount) <= 0) {
      showNotification('Amount must be greater than 0', 'warning');
      return;
    }

    try {
      const transactionData = {
        ...newTransaction,
        amount: parseFloat(newTransaction.amount)
      };

      const savedTransaction = await dbService.addTransaction(transactionData);
      
      // Add to local state
      setTransactions(prevTransactions => [savedTransaction, ...prevTransactions]);
      
      // Reset form
      setNewTransaction({
        type: 'expense',
        amount: '',
        category: 'Food',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
      setShowAddForm(false);
      
      showNotification('Transaction added successfully! 💰', 'success');
    } catch (error) {
      showNotification('Error adding transaction: ' + error.message, 'error');
      console.error('Add transaction error:', error);
    }
  };

  const updateTransaction = () => {
    if (!editingTransaction.amount || !editingTransaction.description) return;
    
    const transactionId = editingTransaction._id || editingTransaction.id;
    setTransactions(transactions.map(t => 
      (t._id || t.id) === transactionId
        ? { ...editingTransaction, amount: parseFloat(editingTransaction.amount) }
        : t
    ));
    setEditingTransaction(null);
  };

  const deleteTransaction = async (id) => {
    try {
      await dbService.deleteTransaction(id);
      setTransactions(transactions.filter(t => t._id !== id));
      showNotification('Transaction deleted successfully! 🗑️', 'success');
    } catch (error) {
      showNotification('Error deleting transaction: ' + error.message, 'error');
      console.error('Delete transaction error:', error);
    }
  };

  const setTempBudgetLimit = (category, limit) => {
    setTempBudgets({ ...tempBudgets, [category]: limit });
  };

  const saveBudgets = async () => {
    const validBudgets = {};
    let hasChanges = false;
    
    // Validate and convert temp budgets to numbers
    Object.keys(tempBudgets).forEach(category => {
      const value = tempBudgets[category];
      if (value && !isNaN(value) && parseFloat(value) >= 0) {
        validBudgets[category] = parseFloat(value);
        if (budgets[category] !== parseFloat(value)) {
          hasChanges = true;
        }
      }
    });
    
    // Check for any removed budgets
    Object.keys(budgets).forEach(category => {
      if (!tempBudgets[category] || tempBudgets[category] === '') {
        hasChanges = true;
      }
    });
    
    if (hasChanges) {
      try {
        await dbService.saveBudgets(validBudgets);
        setBudgets(validBudgets);
        showNotification('Budget limits saved successfully! 📊', 'success');
      } catch (error) {
        showNotification('Error saving budgets: ' + error.message, 'error');
        console.error('Save budgets error:', error);
      }
    } else {
      showNotification('No changes to save.', 'info');
    }
  };

  const resetBudgets = () => {
    setTempBudgets({ ...budgets });
  };

  // Calculations
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthlyTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    return transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear;
  });

  const totalIncome = monthlyTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalExpenses = monthlyTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;

  const expensesByCategory = monthlyTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

  const budgetAlerts = Object.entries(expensesByCategory)
    .filter(([category, spent]) => budgets[category] && spent > budgets[category])
    .map(([category, spent]) => ({
      category,
      spent,
      budget: budgets[category],
      overspend: spent - budgets[category]
    }));

  // Chart data
  const chartData = useMemo(() => {
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = date.toLocaleString('default', { month: 'short' });
      const year = date.getFullYear();
      
      const monthTransactions = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate.getMonth() === date.getMonth() && tDate.getFullYear() === year;
      });
      
      const income = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expenses = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      
      last6Months.push({ month: `${month} ${year.toString().slice(-2)}`, income, expenses });
    }
    return last6Months;
  }, [transactions]);

  const pieData = Object.entries(expensesByCategory).map(([category, amount]) => ({
    name: category,
    value: amount,
    color: categoryColors[category]
  }));

  const exportToCSV = () => {
    const csvContent = [
      ['Date', 'Type', 'Category', 'Description', 'Amount (৳)'],
      ...transactions.map(t => [t.date, t.type, t.category, t.description, t.amount])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'budget_transactions.csv';
    link.click();
  };

  return (
    <div style={{ ...styles.container, backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}>
      {/* Toast Notifications */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        maxWidth: 'clamp(300px, 50vw, 400px)',
        pointerEvents: 'none'
      }}>
        {notifications.map(notification => (
          <div
            key={notification.id}
            style={{
              backgroundColor: notification.type === 'success' ? '#10b981' :
                             notification.type === 'error' ? '#ef4444' :
                             notification.type === 'warning' ? '#f59e0b' : '#3b82f6',
              color: 'white',
              padding: '16px 20px',
              borderRadius: '12px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              fontSize: '14px',
              fontWeight: '500',
              lineHeight: '1.5',
              maxWidth: '100%',
              wordBreak: 'break-word',
              position: 'relative',
              pointerEvents: 'auto',
              cursor: 'pointer',
              transform: 'translateX(0)',
              animation: `slideInRight 0.3s ease-out, fadeOut 0.3s ease-in ${notification.type === 'error' ? '5.7s' : '3.7s'} forwards`,
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px'
            }}
            onClick={() => removeNotification(notification.id)}
          >
            <div style={{ fontSize: '18px', flexShrink: 0, marginTop: '1px' }}>
              {notification.type === 'success' ? '✅' :
               notification.type === 'error' ? '❌' :
               notification.type === 'warning' ? '⚠️' : 'ℹ️'}
            </div>
            <div style={{ flex: 1 }}>{notification.message}</div>
            <div style={{ 
              fontSize: '16px', 
              opacity: 0.8, 
              flexShrink: 0,
              marginTop: '1px',
              cursor: 'pointer',
              padding: '2px'
            }}>×</div>
          </div>
        ))}
      </div>

      {/* Authentication Modal */}
      {showAuth && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          animation: 'fadeIn 0.3s ease'
        }}>
          <div style={{
            ...styles.card,
            width: '400px',
            maxWidth: '90vw',
            animation: 'slideUp 0.3s ease'
          }}>
            <h2 style={{ textAlign: 'center', marginBottom: '12px', color: 'var(--text-color)' }}>
              {authMode === 'login' ? 'Welcome Back!' : 'Create Account'}
            </h2>
            
            <p style={{ 
              textAlign: 'center', 
              marginBottom: '24px', 
              fontSize: '14px',
              backgroundColor: authMode === 'login' ? '#fef3c7' : '#dbeafe',
              color: authMode === 'login' ? '#92400e' : '#1e40af',
              padding: '8px 12px',
              borderRadius: '6px',
              border: authMode === 'login' ? '1px solid #fcd34d' : '1px solid #93c5fd'
            }}>
              {authMode === 'login' 
                ? '👋 First time? Click "Sign up" below to create an account!'
                : '🎉 Fill in your details to create your Alriar Budget Buddy account'
              }
            </p>
            
            {authMode === 'signup' && (
              <input
                type="text"
                placeholder="Full Name"
                value={authForm.name}
                onChange={(e) => setAuthForm({...authForm, name: e.target.value})}
                style={{...styles.input, marginBottom: '16px'}}
              />
            )}
            
            <input
              type={authMode === 'login' ? "text" : "email"}
              placeholder={authMode === 'login' ? "Email or Username" : "Email"}
              value={authForm.email}
              onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
              style={{...styles.input, marginBottom: '16px'}}
            />
            
            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={authForm.password}
                onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
                style={{...styles.input, paddingRight: '45px'}}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--secondary-text)'
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            
            {authMode === 'signup' && (
              <input
                type="password"
                placeholder="Confirm Password"
                value={authForm.confirmPassword}
                onChange={(e) => setAuthForm({...authForm, confirmPassword: e.target.value})}
                style={{...styles.input, marginBottom: '16px'}}
              />
            )}
            
            <button
              onClick={handleAuth}
              style={{
                ...styles.button,
                ...styles.primaryButton,
                width: '100%',
                marginBottom: '16px',
                transform: 'scale(1)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#2563eb';
                e.target.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#3b82f6';
                e.target.style.transform = 'scale(1)';
              }}
            >
              {authMode === 'login' ? <LogIn size={16} /> : <UserPlus size={16} />}
              {authMode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
            
            <p style={{ textAlign: 'center', color: 'var(--secondary-text)', margin: 0 }}>
              {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => {
                  setAuthMode(authMode === 'login' ? 'signup' : 'login');
                  setAuthForm({ email: '', password: '', confirmPassword: '', name: '' });
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#3b82f6',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontSize: 'inherit'
                }}
              >
                {authMode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <header style={{ padding: 'clamp(15px, 4vw, 20px) 0', borderBottom: '1px solid var(--border-color)', animation: 'slideDown 0.5s ease' }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          padding: '0 clamp(10px, 3vw, 20px)', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <h1 style={{ 
            fontSize: 'clamp(20px, 5vw, 28px)', 
            fontWeight: 'bold', 
            margin: 0, 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent',
            minWidth: 'fit-content'
          }}>
            🌟 Alriar Budget Buddy
          </h1>
          <div style={{ display: 'flex', gap: 'clamp(8px, 2vw, 12px)', alignItems: 'center', flexWrap: 'wrap' }}>
            {currentUser && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                marginRight: '12px',
                minWidth: 'fit-content'
              }}>
                <User size={16} color="var(--text-color)" />
                <span style={{ 
                  fontSize: 'clamp(12px, 2.5vw, 14px)', 
                  color: 'var(--text-color)',
                  whiteSpace: 'nowrap'
                }}>
                  Hello, {currentUser.name || currentUser.username || 'User'}
                </span>
              </div>
            )}
            <button
              onClick={exportToCSV}
              style={{ ...styles.button, ...styles.secondaryButton }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px) scale(1.05)';
                e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0) scale(1)';
                e.target.style.boxShadow = 'none';
              }}
            >
              <Download size={16} />
              <span style={{ display: window.innerWidth > 768 ? 'inline' : 'none' }}>Export CSV</span>
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              style={{ ...styles.button, ...styles.secondaryButton }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px) scale(1.05)';
                e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0) scale(1)';
                e.target.style.boxShadow = 'none';
              }}
            >
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            {currentUser && (
              <button
                onClick={handleLogout}
                style={{ 
                  ...styles.button, 
                  backgroundColor: '#ef4444', 
                  color: 'white',
                  border: 'none'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#dc2626';
                  e.target.style.transform = 'translateY(-2px) scale(1.05)';
                  e.target.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#ef4444';
                  e.target.style.transform = 'translateY(0) scale(1)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <LogOut size={16} />
                <span style={{ display: window.innerWidth > 768 ? 'inline' : 'none' }}>Logout</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {currentUser && (
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          padding: 'clamp(15px, 4vw, 20px)',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          {/* Budget Alerts */}
          {budgetAlerts.length > 0 && (
            <div style={{ marginBottom: 'clamp(15px, 4vw, 20px)', animation: 'bounceIn 0.6s ease' }}>
              {budgetAlerts.map((alert, index) => (
                <div key={alert.category} style={{
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  padding: 'clamp(10px, 3vw, 12px)',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  animation: `slideInRight 0.5s ease ${index * 0.1}s both, pulse 2s infinite`,
                  transform: 'translateX(0)',
                  fontSize: 'clamp(12px, 2.5vw, 14px)',
                  flexWrap: 'wrap'
                }}>
                  <AlertCircle size={20} color="#ef4444" />
                  <span style={{ color: '#dc2626', flex: '1', minWidth: '200px' }}>
                    Budget Alert: You've overspent ৳{alert.overspend.toFixed(2)} in {alert.category} 
                    (৳{alert.spent.toFixed(2)} / ৳{alert.budget.toFixed(2)})
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Summary Cards */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(250px, 100%), 1fr))', 
            gap: 'clamp(15px, 3vw, 20px)', 
            marginBottom: 'clamp(20px, 5vw, 30px)'
          }}>
            {[
              { title: 'Total Income', value: totalIncome, color: '#10b981', icon: TrendingUp, delay: '0s' },
              { title: 'Total Expenses', value: totalExpenses, color: '#ef4444', icon: TrendingDown, delay: '0.1s' },
              { title: 'Balance', value: balance, color: balance >= 0 ? '#10b981' : '#ef4444', icon: DollarSign, delay: '0.2s' }
            ].map((card, index) => {
              const IconComponent = card.icon;
              return (
                <div 
                  key={card.title}
                  style={{
                    ...styles.card,
                    animation: `slideUp 0.6s ease ${card.delay} both`,
                    transition: 'all 0.3s ease',
                    minHeight: 'fit-content'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-8px) scale(1.02)';
                    e.target.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0) scale(1)';
                    e.target.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{ 
                        color: 'var(--secondary-text)', 
                        margin: '0 0 4px 0', 
                        fontSize: 'clamp(12px, 2.5vw, 14px)' 
                      }}>
                        {card.title}
                      </p>
                      <p style={{ 
                        fontSize: 'clamp(18px, 4vw, 24px)', 
                        fontWeight: 'bold', 
                        margin: 0, 
                        color: card.color,
                        wordBreak: 'break-word'
                      }}>
                        ৳{card.value.toFixed(2)}
                      </p>
                    </div>
                    <div style={{ animation: `float 3s ease-in-out infinite ${index * 0.5}s` }}>
                      <IconComponent size={window.innerWidth > 768 ? 32 : 24} color={card.color} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Transaction Button */}
          <div style={{ marginBottom: '20px', animation: 'slideUp 0.6s ease 0.3s both' }}>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              style={{ 
                ...styles.button, 
                ...styles.primaryButton,
                transform: 'scale(1)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#2563eb';
                e.target.style.transform = 'scale(1.05) translateY(-2px)';
                e.target.style.boxShadow = '0 10px 20px rgba(59, 130, 246, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#3b82f6';
                e.target.style.transform = 'scale(1) translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              <PlusCircle size={16} />
              Add Transaction
            </button>
          </div>

        {/* Add Transaction Form */}
        {showAddForm && (
          <div style={{ ...styles.card, marginBottom: '20px', animation: 'slideDown 0.3s ease' }}>
            <h3 style={{ margin: '0 0 16px 0' }}>Add New Transaction</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <select
                value={newTransaction.type}
                onChange={(e) => setNewTransaction({ ...newTransaction, type: e.target.value, category: categories[e.target.value][0] })}
                style={styles.select}
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
              
              <select
                value={newTransaction.category}
                onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
                style={styles.select}
              >
                {categories[newTransaction.type].map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              
              <input
                type="number"
                placeholder="Amount"
                value={newTransaction.amount}
                onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                style={styles.input}
              />
              
              <input
                type="text"
                placeholder="Description"
                value={newTransaction.description}
                onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                style={styles.input}
              />
              
              <input
                type="date"
                value={newTransaction.date}
                onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                style={styles.input}
              />
            </div>
            
            <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
              <button
                onClick={addTransaction}
                style={{ ...styles.button, ...styles.primaryButton }}
              >
                <Save size={16} />
                Add Transaction
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                style={{ ...styles.button, ...styles.secondaryButton }}
              >
                <X size={16} />
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Charts Section */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(350px, 100%), 1fr))', 
          gap: 'clamp(15px, 3vw, 20px)', 
          marginBottom: 'clamp(20px, 5vw, 30px)' 
        }}>
          {/* Line Chart */}
          <div style={{ ...styles.card, animation: 'slideUp 0.6s ease 0.4s both' }}>
            <h3 style={{ margin: '0 0 clamp(15px, 3vw, 20px) 0', fontSize: 'clamp(16px, 3vw, 18px)' }}>Monthly Trends</h3>
            <ResponsiveContainer width="100%" height={window.innerWidth > 768 ? 300 : 250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis 
                  dataKey="month" 
                  stroke="var(--text-color)" 
                  fontSize={window.innerWidth > 768 ? 12 : 10}
                />
                <YAxis 
                  stroke="var(--text-color)" 
                  fontSize={window.innerWidth > 768 ? 12 : 10}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--card-bg)', 
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    fontSize: 'clamp(12px, 2.5vw, 14px)'
                  }}
                  formatter={(value) => [`৳${value}`, '']}
                />
                <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart */}
          <div style={{ ...styles.card, animation: 'slideUp 0.6s ease 0.5s both' }}>
            <h3 style={{ margin: '0 0 clamp(15px, 3vw, 20px) 0', fontSize: 'clamp(16px, 3vw, 18px)' }}>Expenses by Category</h3>
            <ResponsiveContainer width="100%" height={window.innerWidth > 768 ? 300 : 250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => {
                    const percentage = (percent * 100).toFixed(0);
                    return `${name}\n${percentage}%`;
                  }}
                  outerRadius={window.innerWidth > 768 ? 80 : 60}
                  fill="#8884d8"
                  dataKey="value"
                  fontSize={window.innerWidth > 768 ? 10 : 8}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--card-bg)', 
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    fontSize: 'clamp(12px, 2.5vw, 14px)'
                  }}
                  formatter={(value, name) => [`৳${value.toFixed(2)}`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Budget Settings */}
        <div style={{ 
          ...styles.card, 
          marginBottom: '20px',
          animation: 'slideUp 0.6s ease 0.6s both'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0 }}>Budget Limits</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={resetBudgets}
                style={{ 
                  ...styles.button, 
                  ...styles.secondaryButton,
                  padding: '8px 16px',
                  fontSize: '14px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <X size={14} />
                Reset
              </button>
              <button
                onClick={saveBudgets}
                style={{ 
                  ...styles.button, 
                  ...styles.primaryButton,
                  padding: '8px 16px',
                  fontSize: '14px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#2563eb';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#3b82f6';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <Save size={14} />
                Save Budgets
              </button>
            </div>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', 
            gap: 'clamp(15px, 3vw, 20px)' 
          }}>
            {categories.expense.map((category, index) => (
              <div 
                key={category} 
                style={{ 
                  padding: '16px',
                  backgroundColor: 'var(--secondary-bg)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  transition: 'all 0.3s ease',
                  animation: `slideUp 0.4s ease ${index * 0.05}s both`
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'var(--border-color)';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'var(--secondary-bg)';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                {/* Top row with category name and input */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px',
                  marginBottom: '8px'
                }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: categoryColors[category] || '#666',
                    flexShrink: 0
                  }} />
                  
                  <div style={{ 
                    minWidth: '80px', 
                    fontSize: '14px',
                    fontWeight: '500',
                    color: 'var(--text-color)'
                  }}>
                    {category}
                  </div>
                  
                  <div style={{ position: 'relative', flex: 1, maxWidth: '150px' }}>
                    <span style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: 'clamp(14px, 3vw, 16px)',
                      color: 'var(--secondary-text)',
                      pointerEvents: 'none'
                    }}>৳</span>
                    <input
                      type="number"
                      placeholder="Set limit"
                      value={tempBudgets[category] || ''}
                      onChange={(e) => setTempBudgetLimit(category, e.target.value)}
                      style={{ 
                        ...styles.input, 
                        margin: 0,
                        paddingLeft: 'clamp(26px, 4vw, 30px)',
                        fontSize: 'clamp(14px, 3vw, 16px)',
                        height: 'clamp(48px, 6vw, 56px)',
                        width: '100%',
                        minWidth: 'clamp(140px, 20vw, 180px)'
                      }}
                    />
                  </div>
                </div>
                
                {/* Bottom row with spent and limit info */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  fontSize: '12px',
                  paddingLeft: '24px' // Align with the category text
                }}>
                  <div style={{ 
                    color: expensesByCategory[category] > budgets[category] ? '#ef4444' : 'var(--secondary-text)',
                    fontWeight: '500'
                  }}>
                    Spent: ৳{(expensesByCategory[category] || 0).toFixed(2)}
                  </div>
                  {budgets[category] && (
                    <div style={{ 
                      color: 'var(--secondary-text)'
                    }}>
                      Limit: ৳{budgets[category].toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div style={{ 
            marginTop: '16px', 
            padding: '12px', 
            backgroundColor: 'var(--secondary-bg)', 
            borderRadius: '6px',
            fontSize: '12px',
            color: 'var(--secondary-text)',
            textAlign: 'center'
          }}>
            💡 Set budget limits for each category and click "Save Budgets" to apply changes. You'll get alerts when you overspend!
          </div>
        </div>

        {/* Transactions List */}
        <div style={styles.card}>
          <h3 style={{ margin: '0 0 20px 0' }}>Recent Transactions</h3>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {transactions.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--secondary-text)', margin: '40px 0' }}>
                No transactions yet. Add your first transaction above!
              </p>
            ) : (
              transactions.map(transaction => (
                <div 
                  key={transaction._id || transaction.id} 
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    borderBottom: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    marginBottom: '8px',
                    backgroundColor: 'var(--secondary-bg)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--border-color)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--secondary-bg)'}
                >
                  {editingTransaction && (editingTransaction._id || editingTransaction.id) === (transaction._id || transaction.id) ? (
                    <div style={{ display: 'flex', gap: '8px', flex: 1, alignItems: 'center' }}>
                      <select
                        value={editingTransaction.type}
                        onChange={(e) => setEditingTransaction({ ...editingTransaction, type: e.target.value })}
                        style={{ ...styles.select, margin: 0, minWidth: '100px' }}
                      >
                        <option value="expense">Expense</option>
                        <option value="income">Income</option>
                      </select>
                      <select
                        value={editingTransaction.category}
                        onChange={(e) => setEditingTransaction({ ...editingTransaction, category: e.target.value })}
                        style={{ ...styles.select, margin: 0, minWidth: '120px' }}
                      >
                        {categories[editingTransaction.type].map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={editingTransaction.amount}
                        onChange={(e) => setEditingTransaction({ ...editingTransaction, amount: e.target.value })}
                        style={{ ...styles.input, margin: 0, width: '100px' }}
                      />
                      <input
                        type="text"
                        value={editingTransaction.description}
                        onChange={(e) => setEditingTransaction({ ...editingTransaction, description: e.target.value })}
                        style={{ ...styles.input, margin: 0, flex: 1 }}
                      />
                      <input
                        type="date"
                        value={editingTransaction.date}
                        onChange={(e) => setEditingTransaction({ ...editingTransaction, date: e.target.value })}
                        style={{ ...styles.input, margin: 0, width: '140px' }}
                      />
                      <button onClick={updateTransaction} style={{ ...styles.button, ...styles.primaryButton, padding: '6px 8px' }}>
                        <Save size={14} />
                      </button>
                      <button onClick={() => setEditingTransaction(null)} style={{ ...styles.button, ...styles.secondaryButton, padding: '6px 8px' }}>
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                        <div
                          style={{
                            width: '8px',
                            height: '40px',
                            borderRadius: '4px',
                            backgroundColor: categoryColors[transaction.category] || '#666'
                          }}
                        />
                        <div>
                          <div style={{ fontWeight: '500', marginBottom: '2px' }}>
                            {transaction.description}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--secondary-text)' }}>
                            {transaction.category} • {transaction.date}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span 
                          style={{ 
                            fontWeight: 'bold', 
                            color: transaction.type === 'income' ? '#10b981' : '#ef4444',
                            minWidth: '80px',
                            textAlign: 'right',
                            fontSize: 'clamp(12px, 2.5vw, 14px)'
                          }}
                        >
                          {transaction.type === 'income' ? '+' : '-'}৳{transaction.amount.toFixed(2)}
                        </span>
                        <button 
                          onClick={() => setEditingTransaction(transaction)}
                          style={{ ...styles.button, ...styles.secondaryButton, padding: '6px 8px' }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => deleteTransaction(transaction._id || transaction.id)}
                          style={{ ...styles.button, backgroundColor: '#ef4444', color: 'white', padding: '6px 8px' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{
        marginTop: '60px',
        padding: 'clamp(20px, 4vw, 30px)',
        borderTop: '1px solid var(--border-color)',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        textAlign: 'center',
        animation: 'slideUp 0.8s ease'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '15px',
          alignItems: 'center'
        }}>
          {/* Brand and tagline */}
          <div style={{ marginBottom: '10px' }}>
            <h3 style={{
              margin: '0 0 8px 0',
              fontSize: 'clamp(16px, 3vw, 20px)',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 'bold'
            }}>
              🌟 Alriar Budget Buddy
            </h3>
            <p style={{
              margin: 0,
              fontSize: 'clamp(12px, 2.5vw, 14px)',
              color: 'var(--secondary-text)',
              fontStyle: 'italic'
            }}>
              Your Personal Financial Management Companion
            </p>
          </div>

          {/* Features */}
          <div style={{
            display: 'flex',
            gap: 'clamp(15px, 3vw, 25px)',
            flexWrap: 'wrap',
            justifyContent: 'center',
            fontSize: 'clamp(11px, 2vw, 13px)',
            color: 'var(--secondary-text)'
          }}>
            <span>💰 Expense Tracking</span>
            <span>📊 Budget Management</span>
            <span>📈 Financial Analytics</span>
            <span>🔒 Secure & Private</span>
          </div>

          {/* Copyright and links */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            alignItems: 'center',
            fontSize: 'clamp(10px, 2vw, 12px)',
            color: 'var(--secondary-text)'
          }}>
            <div style={{
              display: 'flex',
              gap: '15px',
              flexWrap: 'wrap',
              justifyContent: 'center'
            }}>
              <span>Made with ❤️ by montasimajumdar123@gmail.com</span>
              <span>|</span>
              <span>© {new Date().getFullYear()} Alriar Budget Buddy</span>
            </div>
            
            <div style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
              justifyContent: 'center',
              marginTop: '5px'
            }}>
              <span style={{ opacity: '0.7' }}>Made with React & MongoDB</span>
              <span style={{ opacity: '0.5' }}>|</span>
              <span style={{ opacity: '0.7' }}>v1.0.0</span>
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0.3) translateY(-20px);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
        
        @keyframes fadeOut {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(100px);
          }
        }
        
        * {
          box-sizing: border-box;
        }
        
        input:focus, select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        button:hover {
          transform: translateY(-1px);
        }
        
        button:active {
          transform: translateY(0);
        }
        
        /* Responsive styles */
        @media (max-width: 768px) {
          .responsive-grid {
            grid-template-columns: 1fr !important;
          }
          
          .mobile-stack {
            flex-direction: column !important;
            align-items: stretch !important;
          }
          
          .mobile-full-width {
            width: 100% !important;
          }
          
          .hide-mobile {
            display: none !important;
          }
        }
        
        @media (max-width: 480px) {
          .extra-small-text {
            font-size: 12px !important;
          }
          
          .compact-padding {
            padding: 8px !important;
          }
        }
        
        /* Ensure responsive images */
        img {
          max-width: 100%;
          height: auto;
        }
        
        /* Smooth scrolling */
        html {
          scroll-behavior: smooth;
        }
        
        /* Better mobile touch targets */
        @media (max-width: 768px) {
          button, input, select {
            min-height: 44px;
          }
        }
      `}</style>
    </div>
  );
};

export default BudgetPlanner;