import { Asset } from './asset';
import { Wallet } from './wallet';

export enum TokenStatus {
  MINTED = 'MINTED',
  TRANSFERRED = 'TRANSFERRED',
  BURNED = 'BURNED'
}

export interface Token {
  id: number;
  xrplIssuanceId: string;
  xrplTokenId: string;
  assetId?: number; // Nullable, ahora es ManyToOne (múltiples activos comparten token)
  asset?: Asset; // Mantener para compatibilidad
  assets?: Asset[]; // Array de activos que comparten este token
  operationId?: number; // Identifica la operación a la que pertenece el token
  currentHolderWalletId: number;
  currentHolderWallet?: Wallet;
  issuerWalletId: number;
  issuerWallet?: Wallet;
  amount: number;
  metadataHash: string;
  // Campos antiguos (mantener para compatibilidad)
  documentHash?: string; // Hash del documento BP que respalda el token
  documentUrl?: string; // URL para acceder al documento que respalda el token
  backingDocumentId?: number; // ID del documento BP que respalda este token
  // Nuevos campos para los 3 documentos del bundle
  cdHash?: string; // Hash del CD
  bpHash?: string; // Hash del BP
  pagareHash?: string; // Hash del Pagaré
  cdDocumentUrl?: string; // URL para acceder al CD
  bpDocumentUrl?: string; // URL para acceder al BP
  pagareDocumentUrl?: string; // URL para acceder al Pagaré
  cdDocumentId?: number; // ID del documento CD
  bpDocumentId?: number; // ID del documento BP
  pagareDocumentId?: number; // ID del documento Pagaré
  status: TokenStatus;
  burnedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TokenHistory {
  issuanceId: string;
  issuer: string | null;
  transactions: Array<{
    type: string;
    hash: string;
    date: string;
    ledgerIndex: number;
    from?: string;
    to?: string;
    amount?: string;
    status: string;
    memo?: string;
  }>;
}

