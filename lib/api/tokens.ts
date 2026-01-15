import { apiClient } from './client';
import { Token, TokenHistory } from '@/types/token';

export const tokensApi = {
  getAll: async (): Promise<Token[]> => {
    const { data } = await apiClient.get('/tokens');
    return data;
  },

  getById: async (id: number): Promise<Token> => {
    const { data } = await apiClient.get(`/tokens/${id}`);
    return data;
  },

  getStatus: async (id: number): Promise<any> => {
    const { data } = await apiClient.get(`/tokens/${id}/status`);
    return data;
  },

  getHistory: async (id: number): Promise<TokenHistory> => {
    const { data } = await apiClient.get(`/tokens/${id}/history`);
    return data;
  },

  transfer: async (id: number, toWalletId: number): Promise<Token> => {
    const { data } = await apiClient.post(`/tokens/${id}/transfer`, { toWalletId });
    return data;
  },

  burn: async (id: number): Promise<Token> => {
    const { data } = await apiClient.post(`/tokens/${id}/burn`);
    return data;
  },

  getMyTokens: async (): Promise<Token[]> => {
    const { data } = await apiClient.get('/tokens');
    return data;
  },

  getTokenDetails: async (id: number): Promise<Token> => {
    const { data } = await apiClient.get(`/tokens/${id}`);
    return data;
  },

  getTokenOperation: async (id: number): Promise<any> => {
    // Obtener el token y luego la operación asociada
    const token = await tokensApi.getById(id);
    // La operación debería venir en el token o necesitamos un endpoint específico
    return token;
  },

  getByOperation: async (operationId: number): Promise<any> => {
    const { data } = await apiClient.get(`/tokens/operation/${operationId}`);
    return data;
  }
};

