import { apiClient } from "./client";

export interface RoleOption {
	id: number;
	name: string;
	description?: string;
	isActive: boolean;
}

export const rolesApi = {
	getAll: async (): Promise<RoleOption[]> => {
		const { data } = await apiClient.get("/roles");
		return data;
	},
};
