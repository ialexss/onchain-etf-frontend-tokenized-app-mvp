import { Organization } from "./organization";
import { Document } from "./document";
import { Asset } from "./asset";

export enum OperationStatus {
	PENDING = "PENDING",
	DOCUMENTS_GENERATED = "DOCUMENTS_GENERATED",
	DOCUMENTS_UPLOADED = "DOCUMENTS_UPLOADED",
	SIGNED = "SIGNED",
	TOKENIZED = "TOKENIZED",
	ACTIVE = "ACTIVE",
	LIQUIDATED = "LIQUIDATED",
	RELEASED = "RELEASED",
}

export enum PaymentLetterStatus {
	PENDING = "PENDING",
	APPROVED = "APPROVED",
	REJECTED = "REJECTED",
}

export interface Operation {
	id: number;
	operationNumber: string;
	titleNumber?: string;
	warrantId: number;
	warrant: Organization;
	clientId: number;
	client: Organization;
	bankId: number;
	bank: Organization;
	status: OperationStatus;
	merkleRoot?: string;
	description?: string;
	annualRate?: number;
	principalAmount?: number;
	maturityDate?: Date;
	assets?: Asset[];
	paymentLetterId?: number;
	paymentLetter?: PaymentLetter;
	deliveryStatus?: DeliveryStatus;
	createdAt: Date;
	updatedAt: Date;
}

export interface PaymentLetter {
	id: number;
	operationId: number;
	pdfPath: string;
	pdfHash: string;
	issuedByBank: boolean;
	issuedAt?: Date;
	isGenerated: boolean;
	status: PaymentLetterStatus;
	createdAt: Date;
	updatedAt: Date;
}

export interface DocumentBundle {
	id: number;
	operationId: number;
	cdId: number;
	bpId: number;
	pagareId: number | null;
	cd: Document;
	bp: Document;
	pagare: Document | null;
	cdHash: string;
	bpHash: string;
	pagareHash: string | null;
	merkleRoot: string;
	bundleSignedAt?: Date;
	bundleTokenizedAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}

export interface CreateOperationDto {
	operationNumber?: string;
	clientId: number;
	bankId: number;
	description?: string;
	annualRate?: number;
	principalAmount?: number;
	maturityDate?: string;
	assets: Array<{
		vinSerial: string;
		name?: string;
		description?: string;
		brands?: string;
		quantity?: number;
		location?: string;
		value: number;
	}>;
}

export interface UploadDocumentResponse {
	documentId: number;
	extractedFields: any;
	validationStatus: "valid" | "invalid" | "partial";
	missingFields: string[];
}

export interface PaymentLetterResponse {
	id: number;
	operationId: number;
	pdfPath: string;
	pdfHash: string;
	isGenerated: boolean;
	issuedByBank: boolean;
	issuedAt: Date;
	status: string;
}

export interface DeliveryStatus {
	status: "RED" | "GREEN";
	message: string;
	tokenStatus?: string;
}

export interface VerifyTokenizationResponse {
	ready: boolean;
	allDocumentsUploaded: boolean;
	allDocumentsSigned: boolean;
	missingDocuments: string[];
	missingSignatures: string[];
}

export interface TokenizationData {
	description?: string;
	annualRate?: number;
	principalAmount?: number;
	maturityDate?: string;
}

export interface TokenizationPreview {
	operation: {
		id: number;
		operationNumber: string;
		titleNumber?: string;
		description?: string;
		annualRate?: number;
		principalAmount?: number;
		maturityDate?: Date;
		warrant: {
			id: number;
			name: string;
		};
		client: {
			id: number;
			name: string;
		};
		bank: {
			id: number;
			name: string;
		};
	};
	assets: Array<{
		id: number;
		vinSerial: string;
		value: number;
		description?: string;
		status: string;
	}>;
	documents: {
		cd: {
			id: number;
			documentNumber?: string;
			hash: string;
			signedByWarehouse: boolean;
			signedByClient: boolean;
		};
		bp: {
			id: number;
			documentNumber?: string;
			hash: string;
			signedByWarehouse: boolean;
			signedByClient: boolean;
		};
		pagare: {
			id: number;
			documentNumber?: string;
			hash: string | null;
			signedByClient: boolean;
			signedByBank: boolean;
			interestRate?: number | null;
			principalAmount?: number | null;
			maturityDate?: string | null;
		} | null;
	};
	tokenPreview: {
		description?: string;
		interestRate?: number;
		principalAmount?: number;
		maturityDate?: Date;
		ticker: string;
		name: string;
		uris: Array<{
			url: string;
			category: string;
			title: string;
		}>;
	};
	missingFields: string[];
	suggestions: string[];
}




