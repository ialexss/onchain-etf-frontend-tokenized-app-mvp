import { apiClient } from "./client";
import {
	Operation,
	CreateOperationDto,
	UploadDocumentResponse,
	PaymentLetterResponse,
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
		file: File
	): Promise<UploadDocumentResponse> => {
		const formData = new FormData();
		formData.append("file", file);

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
		file: File
	): Promise<UploadDocumentResponse> => {
		const formData = new FormData();
		formData.append("file", file);

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
		file: File
	): Promise<UploadDocumentResponse> => {
		const formData = new FormData();
		formData.append("file", file);

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
		}>
	): Promise<any> => {
		const { data } = await apiClient.post(
			`/operations/${operationId}/execute-signatures`,
			{
				signatures,
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

	liquidateOperation: async (operationId: number): Promise<any> => {
		const { data } = await apiClient.post(
			`/operations/${operationId}/liquidate`
		);
		return data;
	},

	uploadPaymentLetter: async (
		operationId: number,
		file: File
	): Promise<PaymentLetterResponse> => {
		const formData = new FormData();
		formData.append("file", file);

		const { data } = await apiClient.post(
			`/operations/${operationId}/payment-letter/upload`,
			formData,
			{
				headers: {
					"Content-Type": "multipart/form-data",
				},
			}
		);
		return data;
	},

	generatePaymentLetter: async (
		operationId: number
	): Promise<PaymentLetterResponse> => {
		const { data } = await apiClient.post(
			`/operations/${operationId}/payment-letter/generate`
		);
		return data;
	},

	getPaymentLetter: async (
		operationId: number
	): Promise<PaymentLetterResponse | null> => {
		try {
			const { data } = await apiClient.get(
				`/operations/${operationId}/payment-letter`
			);
			return data;
		} catch (error: any) {
			if (error.response?.status === 404) {
				return null;
			}
			throw error;
		}
	},

	approvePaymentLetter: async (
		operationId: number
	): Promise<PaymentLetterResponse> => {
		const { data } = await apiClient.post(
			`/operations/${operationId}/payment-letter/approve`
		);
		return data;
	},

	downloadPaymentLetter: async (operationId: number): Promise<Blob> => {
		const { data } = await apiClient.get(
			`/operations/${operationId}/payment-letter/download`,
			{
				responseType: "blob",
			}
		);
		return data;
	},
};










