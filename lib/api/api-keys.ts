import { apiClient } from "./client";
import {
	ApiKey,
	CreateApiKeyPayload,
	CreateApiKeyResponse,
} from "@/types/api-key";

export const apiKeysApi = {
	list: async (orgId: number): Promise<ApiKey[]> => {
		const { data } = await apiClient.get(
			`/organizations/${orgId}/api-keys`,
		);
		return data;
	},

	create: async (
		orgId: number,
		payload: CreateApiKeyPayload,
	): Promise<CreateApiKeyResponse> => {
		const { data } = await apiClient.post(
			`/organizations/${orgId}/api-keys`,
			payload,
		);
		return data;
	},

	revoke: async (orgId: number, keyId: number): Promise<ApiKey> => {
		const { data } = await apiClient.delete(
			`/organizations/${orgId}/api-keys/${keyId}`,
		);
		return data;
	},

	rotate: async (
		orgId: number,
		keyId: number,
	): Promise<CreateApiKeyResponse> => {
		const { data } = await apiClient.post(
			`/organizations/${orgId}/api-keys/${keyId}/rotate`,
		);
		return data;
	},
};
