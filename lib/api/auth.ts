import { apiClient } from './client';
import { LoginCredentials, RegisterData, AuthResponse } from '@/types/auth';

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const { data } = await apiClient.post('/auth/login', credentials);
    return data;
  },

  register: async (registerData: RegisterData): Promise<AuthResponse> => {
    const { data } = await apiClient.post('/auth/register', registerData);
    return data;
  },

  getProfile: async (): Promise<any> => {
    const { data } = await apiClient.get('/auth/profile');
    return data;
  },

  refreshToken: async (): Promise<{ access_token: string }> => {
    const { data } = await apiClient.post('/auth/refresh');
    return data;
  }
};

