import { apiClient } from './client';
import { Endorsement, SignEndorsementRequest } from '@/types/endorsement';

export const endorsementsApi = {
  getAll: async (): Promise<Endorsement[]> => {
    const { data } = await apiClient.get('/endorsements');
    return data;
  },

  getById: async (id: number): Promise<Endorsement> => {
    const { data } = await apiClient.get(`/endorsements/${id}`);
    return data;
  },

  create: async (endorsementData: any): Promise<Endorsement> => {
    const { data } = await apiClient.post('/endorsements', endorsementData);
    return data;
  },

  sign: async (id: number, signData: SignEndorsementRequest): Promise<Endorsement> => {
    const { data } = await apiClient.post(`/endorsements/${id}/sign`, signData);
    return data;
  },

  execute: async (id: number): Promise<Endorsement> => {
    const { data } = await apiClient.post(`/endorsements/${id}/execute`);
    return data;
  },

  repay: async (id: number): Promise<Endorsement> => {
    const { data } = await apiClient.post(`/endorsements/${id}/repay`);
    return data;
  }
};

