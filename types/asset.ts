import { Organization } from './organization';
import { Token } from './token';
import { Document } from './document';
import { Operation } from './operation';

export enum AssetStatus {
  STORED = 'STORED',
  PLEDGED = 'PLEDGED',
  DELIVERED = 'DELIVERED',
  BURNED = 'BURNED'
}

export interface Asset {
  id: number;
  vinSerial: string;
  name?: string; // Nombre del activo (opcional)
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
  operationId?: number; // ID de la operación asociada
  operation?: Operation; // Operación relacionada (cuando se incluye en relaciones)
  brands?: string; // Marcas del activo
  quantity?: number; // Cantidad de unidades
  location?: string; // Localización física en almacén
  createdAt: Date;
  updatedAt: Date;
}

