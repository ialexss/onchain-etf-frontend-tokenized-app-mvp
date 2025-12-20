export enum DocumentType {
  CD = 'CD',
  BP = 'BP',
  ENDORSEMENT = 'ENDORSEMENT',
}

export enum SignerType {
  WAREHOUSE = 'WAREHOUSE',
  CLIENT = 'CLIENT',
  BANK = 'BANK',
}

export interface Document {
  id: number;
  type: DocumentType;
  pdfPath: string;
  pdfHash: string;
  signedByWarehouse: boolean;
  signedByClient: boolean;
  signedByBank: boolean;
  warehouseSignatureDate?: Date;
  clientSignatureDate?: Date;
  bankSignatureDate?: Date;
  assetId: number;
  version: number;
  previousDocumentId?: number;
  // Nuevos campos para correlativos vinculados
  documentNumber?: string; // Número de título (ej: "4355" para CD, "4258" para BP)
  pairedDocumentId?: number; // ID del documento pareado (CD <-> BP)
  pairedDocument?: Document; // Referencia al documento pareado
  createdAt: Date;
  updatedAt: Date;
}

export interface SignDocumentRequest {
  signerEmail: string;
  signerType: SignerType;
}
