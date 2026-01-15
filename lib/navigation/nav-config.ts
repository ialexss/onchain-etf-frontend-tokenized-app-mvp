import {
	Home,
	Package,
	Coins,
	FileText,
	Building2,
	Users,
	FileSignature,
	UserCircle,
	BarChart3,
	FileCheck,
	Briefcase,
	Plus,
	Wallet,
} from "lucide-react";
import { OrganizationType } from "@/types/organization";

export interface NavSection {
	title: string;
	items: NavItem[];
}

export interface NavItem {
	title: string;
	href: string;
	icon: any;
	permission?: string;
	organizationTypes?: OrganizationType[];
	badge?: string;
}

// Configuración escalable del sidebar
// Para agregar nuevos items, simplemente añádelos a la sección correspondiente
export const navigationSections: NavSection[] = [
	{
		title: "Principal",
		items: [
			{
				title: "Dashboard",
				href: "/dashboard/overview",
				icon: Home,
			},
			{
				title: "Mi Perfil",
				href: "/dashboard/profile",
				icon: UserCircle,
			},
			{
				title: "Wallet",
				href: "/dashboard/wallet",
				icon: Wallet,
				permission: "tokens:read",
			},
		],
	},
	{
		title: "Operaciones",
		items: [
			{
				title: "Operaciones",
				href: "/dashboard/operations",
				icon: Briefcase,
				permission: "operations:read",
			},
			{
				title: "Activos",
				href: "/dashboard/assets",
				icon: Package,
				permission: "assets:read",
				organizationTypes: [
					OrganizationType.ETF,
					OrganizationType.WAREHOUSE,
					OrganizationType.CLIENT,
				],
			},
			{
				title: "Tokens",
				href: "/dashboard/tokens",
				icon: Coins,
				permission: "tokens:read",
			},
			{
				title: "Documentos",
				href: "/dashboard/documents",
				icon: FileSignature,
				permission: "documents:read",
			},
			{
				title: "Endosos",
				href: "/dashboard/endorsements",
				icon: FileText,
				permission: "endorsements:read",
				organizationTypes: [
					OrganizationType.ETF,
					OrganizationType.CLIENT,
					OrganizationType.BANK,
				],
			},
		],
	},
	{
		title: "Administración",
		items: [
			{
				title: "Organizaciones",
				href: "/dashboard/organizations",
				icon: Building2,
				permission: "organizations:read",
				organizationTypes: [OrganizationType.ETF],
			},
			{
				title: "Usuarios",
				href: "/dashboard/users",
				icon: Users,
				permission: "users:read",
				organizationTypes: [OrganizationType.ETF],
			},
			{
				title: "Reportes",
				href: "/dashboard/reports",
				icon: BarChart3,
				permission: "reports:read",
				organizationTypes: [OrganizationType.ETF],
			},
		],
	},
];
