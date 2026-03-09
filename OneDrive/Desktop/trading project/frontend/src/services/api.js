import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5001/api'
});

// Add token to requests if it exists
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  signup: (data) => API.post('/auth/signup', data),
  signin: (data) => API.post('/auth/signin', data),
  getMe: () => API.get('/auth/me')
};

export const tradeAPI = {
  getStocks: () => API.get('/trades/stocks'),
  buyStock: (data) => API.post('/trades/buy', data),
  sellStock: (data) => API.post('/trades/sell', data),
  getPortfolio: () => API.get('/trades/portfolio'),
  getHistory: () => API.get('/trades/history')
};

export const newsAPI = {
  getNews: () => API.get('/news')
};

export const recommendationAPI = {
  getRecommendations: () => API.get('/recommendations')
};

export default API;
