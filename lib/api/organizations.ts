import { apiClient } from './client';
import { Organization } from '@/types/organization';

export const organizationsApi = {
  getAll: async (): Promise<Organization[]> => {
    const { data } = await apiClient.get('/organizations');
    return data;
  },

  getById: async (id: number): Promise<Organization> => {
    const { data } = await apiClient.get(`/organizations/${id}`);
    return data;
  },

  create: async (orgData: any): Promise<Organization> => {
    const { data } = await apiClient.post('/organizations', orgData);
    return data;
  },

  update: async (id: number, orgData: any): Promise<Organization> => {
    const { data } = await apiClient.patch(`/organizations/${id}`, orgData);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/organizations/${id}`);
  },

  createWallet: async (id: number): Promise<any> => {
    const { data } = await apiClient.post(`/organizations/${id}/wallet`);
    return data;
  },

  getClients: async (): Promise<Organization[]> => {
    const { data } = await apiClient.get('/organizations/clients');
    return data;
  },

  getBanks: async (): Promise<Organization[]> => {
    const { data } = await apiClient.get('/organizations/banks');
    return data;
  }
};

