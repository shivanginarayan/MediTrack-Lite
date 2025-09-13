// Authentication API for MediTrack Lite Backend

import { apiRequest } from './api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    avatar?: string;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
}

export const authAPI = {
  // Login user
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    return await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  // Get user profile
  getProfile: async (token: string): Promise<User> => {
    return await apiRequest('/auth/profile', {
      method: 'GET',
    }, token);
  },

  // Refresh token
  refreshToken: async (token: string): Promise<{ token: string }> => {
    return await apiRequest('/auth/refresh', {
      method: 'POST',
    }, token);
  },

  // Logout user
  logout: async (token: string): Promise<void> => {
    return await apiRequest('/auth/logout', {
      method: 'POST',
    }, token);
  },

  // Update profile
  updateProfile: async (token: string, updates: Partial<User>): Promise<User> => {
    return await apiRequest('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }, token);
  },
};

// Demo credentials for testing
export const DEMO_CREDENTIALS = {
  admin: {
    email: 'admin@meditrack-demo.com',
    password: 'demo123',
  },
  lead: {
    email: 'lead@meditrack-demo.com',
    password: 'demo123',
  },
  staff: {
    email: 'staff@meditrack-demo.com',
    password: 'demo123',
  },
};