import { apiClient } from './client';
import { Asset } from '@/types/asset';

export const assetsApi = {
  getAll: async (): Promise<Asset[]> => {
    const { data } = await apiClient.get('/assets');
    return data;
  },

  getById: async (id: number): Promise<Asset> => {
    const { data } = await apiClient.get(`/assets/${id}`);
    return data;
  },

  create: async (assetData: any, iconFile?: File): Promise<Asset> => {
    const formData = new FormData();
    
    // Agregar campos del formulario
    Object.keys(assetData).forEach((key) => {
      formData.append(key, assetData[key]);
    });
    
    // Agregar archivo de icono si existe
    if (iconFile) {
      formData.append('icon', iconFile);
    }
    
    const { data } = await apiClient.post('/assets', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  update: async (id: number, assetData: any): Promise<Asset> => {
    const { data } = await apiClient.patch(`/assets/${id}`, assetData);
    return data;
  },

  tokenize: async (id: number): Promise<any> => {
    const { data } = await apiClient.post(`/assets/${id}/tokenize`);
    return data;
  },

  withdraw: async (id: number): Promise<Asset> => {
    const { data } = await apiClient.post(`/assets/${id}/withdraw`);
    return data;
  }
};

