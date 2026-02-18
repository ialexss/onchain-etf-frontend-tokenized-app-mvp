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

/**
 * Semáforo del Asset Token Bundle
 * RED = Bloqueado/En garantía (tokenizado, no liberado)
 * GREEN = Liberado/Disponible (no tokenizado o ya liberado)
 */
export enum AssetDeliveryStatus {
  RED = 'RED',
  GREEN = 'GREEN'
}

/**
 * Moneda para el valor del activo
 */
export enum Currency {
  USD = 'USD',
  BOB = 'BOB',
}

/**
 * Asset - Representa un activo físico (vehículo, maquinaria, etc.)
 * Parte del concepto Paquete de Activos = Activo + Documentos + Token
 */
export interface Asset {
  id: number;
  vinSerial?: string; // Opcional: VIN/CHASIS/SERIE
  description?: string; // Campo principal
  value: number;
  currency: Currency; // Moneda: USD o BOB
  warehouseId: number;
  warehouse: Organization;
  clientId: number;
  client: Organization;
  status: AssetStatus;
  deliveryStatus: AssetDeliveryStatus; // Semáforo del bundle
  token?: Token;
  documents?: Document[]; // Documentos asociados (CD, BP, Pagaré)
  operationId?: number; // ID de la operación asociada
  operation?: Operation; // Operación relacionada
  quantity?: number; // Cantidad de unidades (default: 1)
  location?: string; // Ubicación física en almacén
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Estado del Asset Token Bundle para tokenización
 */
export interface AssetTokenBundleReadiness {
  ready: boolean;
  assetExists: boolean;
  cdExists: boolean;
  bpExists: boolean;
  pagareExists: boolean | null;
  cdSignedByWarehouse: boolean;
  cdSignedByClient: boolean;
  bpSignedByWarehouse: boolean;
  bpSignedByClient: boolean;
  pagareSignedByClient: boolean | null;
  pagareSignedByBank: boolean | null;
  merkleRootCalculated: boolean;
  missingComponents: string[];
}

/**
 * Estado completo de un Asset Token Bundle
 */
export interface AssetTokenBundle {
  assetId: number;
  vinSerial: string;
  description?: string;
  value: number;
  status: AssetStatus;
  deliveryStatus: AssetDeliveryStatus;
  token: Token | null;
  documents: {
    cd: Document | null;
    bp: Document | null;
    pagare: Document | null;
  };
  isReadyForTokenization: boolean;
  isTokenized: boolean;
}