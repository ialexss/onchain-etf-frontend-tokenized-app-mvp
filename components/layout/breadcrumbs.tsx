"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
	label: string;
	href?: string;
}

interface BreadcrumbsProps {
	items?: BreadcrumbItem[];
	className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
	const pathname = usePathname();

	// Si no se proporcionan items, generar automáticamente desde la ruta
	const breadcrumbItems: BreadcrumbItem[] =
		items ||
		pathname
			.split("/")
			.filter(Boolean)
			.map((segment, index, array) => {
				const href = "/" + array.slice(0, index + 1).join("/");
				let label = segment;

				// Mapear segmentos a labels más amigables
				const labelMap: Record<string, string> = {
					dashboard: "Dashboard",
					operations: "Operaciones",
					assets: "Activos",
					tokens: "Tokens",
					documents: "Documentos",
					endorsements: "Endosos",
					organizations: "Organizaciones",
					users: "Usuarios",
					profile: "Mi Perfil",
					overview: "Resumen",
					new: "Nueva Operación",
					wallet: "Mi Wallet",
				};

				// Si es un ID numérico, mantenerlo como está
				if (/^\d+$/.test(segment)) {
					label = `#${segment}`;
				} else {
					label = labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
				}

				return {
					label,
					href: index < array.length - 1 ? href : undefined, // Último item no tiene link
				};
			});

	return (
		<nav
			aria-label="Breadcrumb"
			className={cn("flex items-center space-x-2 text-sm", className)}
		>
			<Link
				href="/dashboard/overview"
				className="text-muted-foreground hover:text-foreground transition-colors"
			>
				<Home className="h-4 w-4" />
			</Link>

			{breadcrumbItems.map((item, index) => (
				<div key={index} className="flex items-center space-x-2">
					<ChevronRight className="h-4 w-4 text-muted-foreground" />
					{item.href ? (
						<Link
							href={item.href}
							className="text-muted-foreground hover:text-foreground transition-colors"
						>
							{item.label}
						</Link>
					) : (
						<span className="text-foreground font-medium">{item.label}</span>
					)}
				</div>
			))}
		</nav>
	);
}

