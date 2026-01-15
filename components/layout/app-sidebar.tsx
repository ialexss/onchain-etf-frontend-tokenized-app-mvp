"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/auth-context";
import { navigationSections } from "@/lib/navigation/nav-config";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useState } from "react";

function SidebarContent({ onLinkClick }: { onLinkClick?: () => void }) {
	const pathname = usePathname();
	const { user, hasPermission } = useAuth();

	const getUserOrganizationType = () => {
		return user?.organizations?.[0]?.type;
	};

	const filterNavItem = (item: any) => {
		const userOrgType = getUserOrganizationType();

		// Verificar permisos
		if (item.permission) {
			const hasPerm = hasPermission(item.permission);
			// Si no tiene el permiso, verificar si el tipo de organización debería tener acceso
			if (!hasPerm) {
				// Fallback: Si es warehouse y el item es de operaciones/tokens/assets/documents, permitir acceso
				if (userOrgType === "WAREHOUSE") {
					const warehouseAllowedPermissions = [
						"operations:read",
						"operations:create",
						"operations:update",
						"tokens:read",
						"assets:read",
						"assets:create",
						"assets:update",
						"documents:read",
						"documents:create",
						"documents:sign",
					];
					if (warehouseAllowedPermissions.includes(item.permission)) {
						// Permitir acceso basado en el tipo de organización
						// (esto es un fallback si los permisos no están cargados)
					} else {
						return false;
					}
				} else {
					return false;
				}
			}
		}

		// Verificar tipos de organización
		if (item.organizationTypes) {
			if (!userOrgType || !item.organizationTypes.includes(userOrgType)) {
				return false;
			}
		}
		return true;
	};

	return (
		<>
			{/* Logo */}
			<div className="flex h-16 items-center border-b px-6">
				<Link
					href="/dashboard/overview"
					className="flex items-center gap-2"
					onClick={onLinkClick}
				>
					<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
						<span className="text-sm font-bold">OA</span>
					</div>
					<span className="text-lg font-semibold">ONCHAIN APP</span>
				</Link>
			</div>

			{/* Navigation */}
			<ScrollArea className="flex-1 px-3 py-4">
				<nav className="space-y-6">
					{navigationSections.map((section) => {
						const filteredItems =
							section.items.filter(filterNavItem);

						// Mostrar la sección si tiene al menos un item visible
						if (filteredItems.length === 0) {
							// Para la sección "Operaciones", verificar si el usuario pertenece a una organización relevante
							// o tiene algún permiso relacionado (por si los permisos no están cargados)
							if (section.title === "Operaciones") {
								const userOrgType = getUserOrganizationType();
								const isRelevantOrg =
									userOrgType === "WAREHOUSE" ||
									userOrgType === "CLIENT" ||
									userOrgType === "BANK" ||
									userOrgType === "ETF";
								const hasAnyOperationPermission =
									hasPermission("operations:read") ||
									hasPermission("operations:create") ||
									hasPermission("tokens:read") ||
									hasPermission("assets:read") ||
									hasPermission("documents:read");
								// Mostrar la sección si el usuario pertenece a una org relevante O tiene permisos
								if (
									!isRelevantOrg &&
									!hasAnyOperationPermission
								) {
									return null;
								}
								// Si no hay items filtrados pero debería mostrar la sección, mostrar al menos los items básicos
								// Esto es un fallback en caso de que los permisos no estén cargados
							} else {
								return null;
							}
						}

						return (
							<div key={section.title} className="space-y-1">
								<h4 className="px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider dark:text-zinc-400">
									{section.title}
								</h4>
								<div className="space-y-1">
									{filteredItems.map((item) => {
										const Icon = item.icon;
										const isActive =
											pathname === item.href ||
											pathname.startsWith(
												item.href + "/"
											);

										return (
											<Link
												key={item.href}
												href={item.href}
												onClick={onLinkClick}
											>
												<Button
													variant={
														isActive
															? "secondary"
															: "ghost"
													}
													className={cn(
														"w-full justify-start",
														isActive &&
															"bg-zinc-100 dark:bg-zinc-800"
													)}
												>
													<Icon className="mr-3 h-4 w-4" />
													<span className="flex-1 text-left">
														{item.title}
													</span>
													{item.badge && (
														<Badge
															variant="secondary"
															className="ml-auto"
														>
															{item.badge}
														</Badge>
													)}
												</Button>
											</Link>
										);
									})}
								</div>
							</div>
						);
					})}
				</nav>
			</ScrollArea>

			{/* Footer - User Info */}
			<div className="border-t p-4">
				<div className="flex items-center gap-3 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
					<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
						{user?.firstName?.[0]}
						{user?.lastName?.[0]}
					</div>
					<div className="flex-1 overflow-hidden">
						<p className="text-sm font-medium truncate">
							{user?.firstName} {user?.lastName}
						</p>
						<p className="text-xs text-zinc-500 truncate dark:text-zinc-400">
							{user?.organizations?.[0]?.name}
						</p>
					</div>
				</div>
			</div>
		</>
	);
}

export function AppSidebar() {
	return (
		<div className="flex h-full w-64 flex-col border-r bg-white dark:bg-zinc-950">
			<SidebarContent />
		</div>
	);
}

export function MobileSidebarTrigger() {
	const [mobileOpen, setMobileOpen] = useState(false);

	return (
		<Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
			<SheetTrigger asChild>
				<Button variant="ghost" size="icon" className="md:hidden">
					<Menu className="h-5 w-5" />
				</Button>
			</SheetTrigger>
			<SheetContent side="left" className="w-64 p-0">
				<div className="flex h-full flex-col">
					<SidebarContent onLinkClick={() => setMobileOpen(false)} />
				</div>
			</SheetContent>
		</Sheet>
	);
}
