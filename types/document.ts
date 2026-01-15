export enum DocumentType {
	CD = "CD",
	BP = "BP",
	ENDORSEMENT = "ENDORSEMENT",
	PROMISSORY_NOTE = "PROMISSORY_NOTE",
}

export enum SignerType {
	WAREHOUSE = "WAREHOUSE",
	CLIENT = "CLIENT",
	BANK = "BANK",
}

import { Asset } from './asset';
import { Operation } from './operation';

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
	asset?: Asset; // Activo relacionado con información completa
	version: number;
	previousDocumentId?: number;
	// Nuevos campos para correlativos vinculados
	documentNumber?: string; // Número de título (ej: "4355" para CD, "4258" para BP)
	pairedDocumentId?: number; // ID del documento pareado (CD <-> BP)
	pairedDocument?: Document; // Referencia al documento pareado
	// Campos para documentos subidos
	isUploaded?: boolean; // true si se subió, false si se generó
	uploadedAt?: Date; // Cuándo se subió el documento
	extractedData?: any; // Campos extraídos del PDF (JSON)
	createdAt: Date;
	updatedAt: Date;
}

export interface SignDocumentRequest {
	signerEmail: string;
	signerType: SignerType;
}
