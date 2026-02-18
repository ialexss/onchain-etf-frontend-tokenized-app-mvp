import { apiClient } from "./client";
import {
	Operation,
	CreateOperationDto,
	UploadDocumentResponse,
	DeliveryStatus,
	VerifyTokenizationResponse,
	TokenizationPreview,
	TokenizationData,
} from "@/types/operation";

export const operationsApi = {
	getAll: async (): Promise<Operation[]> => {
		const { data } = await apiClient.get("/operations");
		return data;
	},

	getById: async (id: number): Promise<Operation> => {
		const { data } = await apiClient.get(`/operations/${id}`);
		return data;
	},

	getOperationStatus: async (operationId: number): Promise<any> => {
		const { data } = await apiClient.get(
			`/operations/${operationId}/status`
		);
		return data;
	},

	create: async (operationData: CreateOperationDto): Promise<Operation> => {
		const { data } = await apiClient.post("/operations", operationData);
		return data;
	},

	prepareDocumentData: async (operationId: number): Promise<any> => {
		const { data } = await apiClient.get(
			`/operations/${operationId}/prepare-document-data`
		);
		return data;
	},

	generateDocuments: async (
		operationId: number,
		documentData: any,
		pagareData: any
	): Promise<any> => {
		const { data } = await apiClient.post(
			`/operations/${operationId}/generate-documents`,
			{
				documentData,
				pagareData,
			}
		);
		return data;
	},

	uploadCD: async (
		operationId: number,
		file: File,
		assetId?: number,
		titleNumber?: string
	): Promise<UploadDocumentResponse> => {
		const formData = new FormData();
		formData.append("file", file);
		if (assetId) {
			formData.append("assetId", assetId.toString());
		}
		if (titleNumber) {
			formData.append("titleNumber", titleNumber);
		}

		const { data } = await apiClient.post(
			`/operations/${operationId}/upload-cd`,
			formData,
			{
				headers: {
					"Content-Type": "multipart/form-data",
				},
			}
		);
		return data;
	},

	uploadBP: async (
		operationId: number,
		file: File,
		assetId?: number,
		titleNumber?: string
	): Promise<UploadDocumentResponse> => {
		const formData = new FormData();
		formData.append("file", file);
		if (assetId) {
			formData.append("assetId", assetId.toString());
		}
		if (titleNumber) {
			formData.append("titleNumber", titleNumber);
		}

		const { data } = await apiClient.post(
			`/operations/${operationId}/upload-bp`,
			formData,
			{
				headers: {
					"Content-Type": "multipart/form-data",
				},
			}
		);
		return data;
	},

	uploadPagare: async (
		operationId: number,
		file: File,
		assetId?: number,
		titleNumber?: string
	): Promise<UploadDocumentResponse> => {
		const formData = new FormData();
		formData.append("file", file);
		if (assetId) {
			formData.append("assetId", assetId.toString());
		}
		if (titleNumber) {
			formData.append("titleNumber", titleNumber);
		}

		const { data } = await apiClient.post(
			`/operations/${operationId}/upload-pagare`,
			formData,
			{
				headers: {
					"Content-Type": "multipart/form-data",
				},
			}
		);
		return data;
	},

	extractFields: async (
		operationId: number,
		formData: FormData
	): Promise<{
		extractedFields: any;
		validationStatus: "valid" | "invalid" | "partial";
		missingFields: string[];
	}> => {
		const { data } = await apiClient.post(
			`/operations/${operationId}/extract-fields`,
			formData,
			{
				headers: {
					"Content-Type": "multipart/form-data",
				},
			}
		);
		return data;
	},

	executeSignatures: async (
		operationId: number,
		signatures: Array<{
			documentType: "CD" | "BP" | "PAGARE";
			signerEmail: string;
			signerType: "WAREHOUSE" | "CLIENT" | "BANK";
		}>,
		assetId?: number
	): Promise<any> => {
		const { data } = await apiClient.post(
			`/operations/${operationId}/execute-signatures`,
			{
				signatures,
				assetId,
			}
		);
		return data;
	},

	verifyReadyForTokenization: async (
		operationId: number
	): Promise<VerifyTokenizationResponse> => {
		const { data } = await apiClient.post(
			`/operations/${operationId}/verify-ready-for-tokenization`
		);
		return data;
	},

	getTokenizationPreview: async (
		operationId: number
	): Promise<TokenizationPreview> => {
		const { data } = await apiClient.get(
			`/operations/${operationId}/tokenization-preview`
		);
		return data;
	},

	tokenizeBundle: async (
		operationId: number,
		data?: TokenizationData
	): Promise<any> => {
		const { data: response } = await apiClient.post(
			`/operations/${operationId}/tokenize`,
			data || {}
		);
		return response;
	},

	// Paquete de Activos methods
	validateAssetTokenBundle: async (assetId: number): Promise<{
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
	}> => {
		const { data } = await apiClient.get(
			`/assets/${assetId}/tokenization-readiness`
		);
		return data;
	},

	getAssetTokenBundleStatus: async (assetId: number): Promise<{
		asset: any;
		documents: {
			cd: any;
			bp: any;
			pagare: any;
		};
		merkleRoot: string | null;
		token: any;
		validation: {
			valid: boolean;
			missingComponents: string[];
			cdExists: boolean;
			bpExists: boolean;
			pagareExists: boolean | null;
			cdSignedByWarehouse: boolean;
			cdSignedByClient: boolean;
			bpSignedByWarehouse: boolean;
			bpSignedByClient: boolean;
			pagareSignedByClient: boolean;
			pagareSignedByBank: boolean;
			merkleRootCalculated: boolean;
		};
		isReadyForTokenization: boolean;
		isTokenized: boolean;
		isReleased: boolean;
	}> => {
		const { data } = await apiClient.get(
			`/assets/${assetId}/bundle-status`
		);
		return data;
	},

	tokenizeAsset: async (assetId: number): Promise<any> => {
		const { data } = await apiClient.post(
			`/assets/${assetId}/tokenize`
		);
		return data;
	},

	tokenizeMultipleAssets: async (assetIds: number[]): Promise<{
		success: any[];
		failed: { assetId: number; error: string }[];
	}> => {
		const { data } = await apiClient.post(
			`/tokens/assets/tokenize-batch`,
			{ assetIds }
		);
		return data;
	},

	getAssetTokenBundlesStatus: async (operationId: number): Promise<{
		total: number;
		stored: number;
		pledged: number;
		burned: number;
		tokenized: number;
		allReleased: boolean;
	}> => {
		const { data } = await apiClient.get(
			`/operations/${operationId}/asset-token-bundles-status`
		);
		return data;
	},

	getDeliveryStatus: async (operationId: number): Promise<DeliveryStatus> => {
		const { data } = await apiClient.get(
			`/operations/${operationId}/delivery-status`
		);
		return data;
	},

	certifyDelivery: async (operationId: number): Promise<any> => {
		const { data } = await apiClient.post(
			`/operations/${operationId}/certify-delivery`
		);
		return data;
	},

	transferTokensToWarehouse: async (
		operationId: number,
		assetIds: number[]
	): Promise<{
		success: { assetId: number; tokenId: number; txHash: string }[];
		failed: { assetId: number; error: string }[];
	}> => {
		const { data } = await apiClient.post(
			`/operations/${operationId}/transfer-tokens-to-warehouse`,
			{ assetIds }
		);
		return data;
	},

	// Release Letter methods
	uploadReleaseLetter: async (
		operationId: number,
		file: File,
		assetIds: number[]
	): Promise<any> => {
		const formData = new FormData();
		formData.append("file", file);
		formData.append("assetIds", JSON.stringify(assetIds));

		const { data } = await apiClient.post(
			`/operations/${operationId}/release-letter/upload`,
			formData,
			{
				headers: {
					"Content-Type": "multipart/form-data",
				},
			}
		);
		return data;
	},

	generateReleaseLetter: async (
		operationId: number,
		assetIds: number[]
	): Promise<any> => {
		const { data } = await apiClient.post(
			`/operations/${operationId}/release-letter/generate`,
			{ assetIds }
		);
		return data;
	},

	getReleaseLetters: async (operationId: number): Promise<any[]> => {
		const { data } = await apiClient.get(
			`/operations/${operationId}/release-letters`
		);
		return data;
	},

	approveReleaseLetter: async (
		releaseLetterId: number
	): Promise<any> => {
		const { data } = await apiClient.post(
			`/operations/release-letters/${releaseLetterId}/approve`
		);
		return data;
	},

	getApprovedAssetTokenBundles: async (
		operationId: number
	): Promise<number[]> => {
		const { data } = await apiClient.get(
			`/operations/${operationId}/approved-asset-token-bundles`
		);
		return data;
	},

	downloadReleaseLetter: async (
		operationId: number,
		releaseLetterId: number
	): Promise<Blob> => {
		const { data } = await apiClient.get(
			`/operations/${operationId}/release-letters/${releaseLetterId}/download`,
			{
				responseType: "blob",
			}
		);
		return data;
	},

	releaseAssetTokenBundles: async (
		operationId: number,
		assetIds: number[]
	): Promise<{
		success: any[];
		failed: { assetId: number; error: string }[];
	}> => {
		const { data } = await apiClient.post(
			`/operations/${operationId}/release-asset-token-bundles`,
			{ assetIds }
		);
		return data;
	},
};










