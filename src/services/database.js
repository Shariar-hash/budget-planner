import axios from 'axios';

// MongoDB-based database service for handling API calls
class DatabaseService {
  constructor() {
    // Use the correct base URL for your Vercel deployment
    this.baseURL = process.env.REACT_APP_API_URL || 
                   (process.env.NODE_ENV === 'production' 
                     ? 'https://budget-planner-ochre.vercel.app/api' 
                     : 'http://localhost:5000/api');
    this.token = localStorage.getItem('authToken');
    
    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add token to requests if available
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle token expiration
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('currentUser');
          window.location.reload();
        }
        return Promise.reject(error);
      }
    );
  }

  // Authentication methods
  async register(userData) {
    try {
      const response = await this.api.post('/register', userData);
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('currentUser', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      
      // Better error handling
      if (error.response && error.response.data && error.response.data.error) {
        throw new Error(error.response.data.error);
      } else if (error.response && error.response.data) {
        throw new Error(JSON.stringify(error.response.data));
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Registration failed. Please check your connection and try again.');
      }
    }
  }

  async login(credentials) {
    try {
      const response = await this.api.post('/login', credentials);
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('currentUser', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Login failed. Please check your credentials and try again.');
    }
  }

  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
  }

  getCurrentUser() {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
  }

  isAuthenticated() {
    return !!localStorage.getItem('authToken');
  }

  // User authentication methods (legacy compatibility)
  async createUser(userData) {
    return this.register(userData);
  }

  async getUser(username) {
    // This is handled by the authentication flow now
    return this.getCurrentUser();
  }

  async updateUser(userId, userData) {
    try {
      const response = await this.api.put(`/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      throw new Error('Failed to update user: ' + error.message);
    }
  }

  // Transaction methods with fallback
  async getTransactions() {
    try {
      const response = await this.api.get('/transactions');
      return response.data;
    } catch (error) {
      throw new Error('Failed to load transactions. Please check your connection.');
    }
  }

  async addTransaction(transactionData) {
    try {
      const response = await this.api.post('/transactions', transactionData);
      return response.data.transaction;
    } catch (error) {
      throw new Error('Failed to add transaction. Please try again.');
    }
  }

  async deleteTransaction(transactionId) {
    try {
      await this.api.delete('/transactions', {
        data: { id: transactionId }
      });
      return true;
    } catch (error) {
      throw new Error('Failed to delete transaction. Please try again.');
    }
  }

  // Budget methods
  async getBudgets() {
    try {
      const response = await this.api.get('/budgets');
      return response.data;
    } catch (error) {
      throw new Error('Failed to load budgets. Please check your connection.');
    }
  }

  async saveBudgets(budgetData) {
    try {
      const response = await this.api.post('/budgets', { budgets: budgetData });
      return response.data;
    } catch (error) {
      throw new Error('Failed to save budgets. Please try again.');
    }
  }

  // Health check for API
  async healthCheck() {
    try {
      const response = await this.api.get('/health');
      return { status: 'connected', data: response.data };
    } catch (error) {
      return { status: 'disconnected', error: error.message };
    }
  }
}

// Create singleton instance
const dbService = new DatabaseService();

export default dbService;
