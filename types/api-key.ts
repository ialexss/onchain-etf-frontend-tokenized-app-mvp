export interface ApiKey {
	id: number;
	name: string;
	keyPrefix: string;
	organizationId: number;
	organizationName: string;
	roleId: number;
	roleName: string;
	expiresAt: string | null;
	isActive: boolean;
	lastUsedAt: string | null;
	revokedAt: string | null;
	createdAt: string;
}

export interface CreateApiKeyPayload {
	name: string;
	roleId: number;
	expiresIn?: "30d" | "90d" | "365d" | "never";
}

export interface CreateApiKeyResponse extends ApiKey {
	/** Shown ONLY once at creation — store securely, cannot be recovered */
	rawKey: string;
}
