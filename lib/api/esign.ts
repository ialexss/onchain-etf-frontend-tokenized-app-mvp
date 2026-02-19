import { apiClient } from "./client";

export interface Actor {
	email: string;
	givenName: string;
	surname: string;
	phoneNumber: string;
}

export interface InitiateSigningDto {
	assetId: number;
	client: Actor;
	warehouse: Actor;
	financialEntity: Actor;
}

export interface ActivityStatus {
	actorType: "CLIENT" | "WAREHOUSE" | "BANK";
	actorEmail: string;
	actorName: string;
	status: "PENDING" | "ACTIVE" | "COMPLETED" | "REJECTED";
	openedDate?: string;
	finishedDate?: string;
}

export interface EnvelopeDetails {
	envelopeId: string;
	status: string;
	activities: ActivityStatus[];
}

export const esignApi = {
	/**
	 * Prepares suggested actor data from the backend.
	 */
	prepareSigning: async (assetId: number): Promise<InitiateSigningDto> => {
		const response = await apiClient.get(
			`/esign/envelopes/prepare/${assetId}`,
		);
		return response.data;
	},

	/**
	 * Initiates the eSignAnywhere signing flow.
	 */
	initiateSigning: async (dto: InitiateSigningDto) => {
		const response = await apiClient.post("/esign/envelopes", dto);
		return response.data;
	},

	/**
	 * Gets the current status of an eSignAnywhere envelope.
	 */
	getEnvelopeStatus: async (envelopeId: string) => {
		const response = await apiClient.get(
			`/esign/envelopes/${envelopeId}/status`,
		);
		return response.data;
	},

	/**
	 * Gets detailed activities for an envelope (who signed, who didn't).
	 */
	getEnvelopeActivities: async (
		envelopeId: string,
	): Promise<ActivityStatus[]> => {
		const response = await apiClient.get(
			`/esign/envelopes/${envelopeId}/activities`,
		);
		return response.data;
	},
};
