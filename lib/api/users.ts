import { apiClient } from './client';
import { AuthUser } from '@/types/auth';

export const usersApi = {
  getAll: async (): Promise<AuthUser[]> => {
    const { data } = await apiClient.get('/users');
    return data;
  },

  getById: async (id: number): Promise<AuthUser> => {
    const { data } = await apiClient.get(`/users/${id}`);
    return data;
  },

  create: async (userData: any): Promise<AuthUser> => {
    const { data } = await apiClient.post('/users', userData);
    return data;
  },

  update: async (id: number, userData: any): Promise<AuthUser> => {
    const { data } = await apiClient.patch(`/users/${id}`, userData);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },

  getPermissions: async (id: number): Promise<string[]> => {
    const { data } = await apiClient.get(`/users/${id}/permissions`);
    return data;
  },

  addRoles: async (id: number, roleIds: number[]): Promise<AuthUser> => {
    const { data } = await apiClient.post(`/users/${id}/roles`, { roleIds });
    return data;
  },

  removeRoles: async (id: number, roleIds: number[]): Promise<AuthUser> => {
    const { data } = await apiClient.delete(`/users/${id}/roles`, { data: { roleIds } });
    return data;
  }
};

