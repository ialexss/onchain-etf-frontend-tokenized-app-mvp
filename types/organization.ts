export enum OrganizationType {
  ETF = 'ETF',
  WAREHOUSE = 'WAREHOUSE',
  CLIENT = 'CLIENT',
  BANK = 'BANK'
}

export interface Organization {
  id: number;
  name: string;
  type: OrganizationType;
  taxId: string;
  address?: string;
  contactEmail?: string;
  contactPhone?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

