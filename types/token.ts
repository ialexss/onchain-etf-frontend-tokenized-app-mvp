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
  assetId: number;
  asset?: Asset;
  currentHolderWalletId: number;
  currentHolderWallet?: Wallet;
  issuerWalletId: number;
  issuerWallet?: Wallet;
  amount: number;
  metadataHash: string;
  documentHash?: string; // Hash del documento BP que respalda el token
  documentUrl?: string; // URL para acceder al documento que respalda el token
  backingDocumentId?: number; // ID del documento BP que respalda este token
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

