import { apiClient } from './client';
import { Document, SignDocumentRequest } from '@/types/document';

export const documentsApi = {
  getAll: async (): Promise<Document[]> => {
    const { data } = await apiClient.get('/documents');
    return data;
  },

  generateCD: async (assetId: number): Promise<Document> => {
    const { data } = await apiClient.post('/documents/generate-cd', { assetId });
    return data;
  },

  generateBP: async (assetId: number): Promise<Document> => {
    const { data } = await apiClient.post('/documents/generate-bp', { assetId });
    return data;
  },

  signDocument: async (documentId: number, signData: SignDocumentRequest): Promise<Document> => {
    const { data } = await apiClient.post(`/documents/${documentId}/sign`, signData);
    return data;
  },

  getById: async (documentId: number): Promise<Document> => {
    const { data } = await apiClient.get(`/documents/${documentId}`);
    return data;
  },

  getByAsset: async (assetId: number): Promise<Document[]> => {
    const { data } = await apiClient.get(`/documents/asset/${assetId}`);
    return data;
  },

  downloadPDF: async (documentId: number): Promise<Blob> => {
    const { data } = await apiClient.get(`/documents/${documentId}/download`, {
      responseType: 'blob'
    });
    return data;
  },
  
  downloadAuditTrail: async (documentId: number): Promise<Blob> => {
    const { data } = await apiClient.get(`/documents/${documentId}/download-audit-trail`, {
      responseType: 'blob'
    });
    return data;
  }
};

