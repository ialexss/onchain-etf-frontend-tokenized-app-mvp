import { Document } from './document';

export enum EndorsementStatus {
  PENDING = 'PENDING',
  SIGNED = 'SIGNED',
  TRANSFERRED = 'TRANSFERRED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface Endorsement {
  id: number;
  assetId: number;
  tokenId: number;
  fromWalletId: number;
  toWalletId: number;
  principalAmount: number;
  interestRate: number;
  repaymentDate: Date;
  status: EndorsementStatus;
  signedByClient: boolean;
  signedByBank: boolean;
  transferTxHash?: string;
  repaidAt?: Date;
  documentId?: number;
  document?: Document;
  token?: any;
  createdAt: Date;
}

export interface SignEndorsementRequest {
  signerEmail: string;
  signerType: 'CLIENT' | 'BANK';
}

