import { Organization } from './organization';

export interface Wallet {
  id: number;
  publicAddress: string;
  organizationId: number;
  organization?: Organization;
  createdAt: Date;
  updatedAt: Date;
}

