import { Organization } from './organization';
import { Token } from './token';
import { Document } from './document';

export enum AssetStatus {
  STORED = 'STORED',
  PLEDGED = 'PLEDGED',
  DELIVERED = 'DELIVERED',
  BURNED = 'BURNED'
}

export interface Asset {
  id: number;
  vinSerial: string;
  description?: string;
  value: number;
  warehouseId: number;
  warehouse: Organization;
  clientId: number;
  client: Organization;
  status: AssetStatus;
  iconUrl?: string; // URL del icono del activo (opcional)
  token?: Token;
  documents?: Document[]; // Documentos asociados (CD, BP, Endosos)
  createdAt: Date;
  updatedAt: Date;
}

