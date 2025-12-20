export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roleIds?: number[];
}

export interface Role {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  permissions?: Permission[];
}

export interface Permission {
  id: number;
  name: string;
  description?: string;
  resource: string;
  action: string;
  isActive: boolean;
}

export interface AuthUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  roles: Role[];
  permissions: string[];
  organizations: Organization[];
  lastLogin?: Date;
  createdAt: Date;
}

export interface AuthResponse {
  user: AuthUser;
  access_token: string;
}

