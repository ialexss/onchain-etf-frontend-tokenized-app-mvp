"use client";

import { useAuth } from "@/lib/auth/auth-context";
import { useQuery } from "@tanstack/react-query";
import { operationsApi } from "@/lib/api/operations";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Mail,
	Building2,
	Shield,
	Calendar,
	Edit,
	FileCheck,
	Eye,
	Briefcase,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { OperationStatus } from "@/types/operation";
import { DeliveryStatusBadge } from "@/components/operations/delivery-status-badge";

export default function ProfilePage() {
	const { user } = useAuth();

	// Obtener operaciones
	const { data: operations, isLoading: isLoadingOperations } = useQuery({
		queryKey: ["operations"],
		queryFn: operationsApi.getAll,
		enabled: !!user,
	});

	if (!user) return null;

	const getInitials = () => {
		return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
	};

	// Asegurar que permissions sea un array y eliminar duplicados
	const uniquePermissions = Array.isArray(user.permissions)
		? Array.from(new Set(user.permissions))
		: [];

	// Filtrar operaciones relacionadas con las organizaciones del usuario
	const userOrganizationIds =
		user.organizations?.map((org: any) => org.id) || [];
	const userOperations =
		operations?.filter(
			(op: any) =>
				userOrganizationIds.includes(op.warrantId) ||
				userOrganizationIds.includes(op.clientId) ||
				userOrganizationIds.includes(op.safiId)
		) || [];

	const getStatusBadge = (status: OperationStatus) => {
		const variants: Record<
			OperationStatus,
			"default" | "secondary" | "destructive" | "outline"
		> = {
			PENDING: "secondary",
			DOCUMENTS_GENERATED: "outline",
			DOCUMENTS_UPLOADED: "outline",
			SIGNED: "default",
			TOKENIZED: "default",
			ACTIVE: "default",
			LIQUIDATED: "destructive",
			RELEASED: "outline",
		};

		const labels: Record<OperationStatus, string> = {
			PENDING: "Pendiente",
			DOCUMENTS_GENERATED: "Documentos Generados",
			DOCUMENTS_UPLOADED: "Documentos Subidos",
			SIGNED: "Firmado",
			TOKENIZED: "Tokenizado",
			ACTIVE: "Activo",
			LIQUIDATED: "Liquidado",
			RELEASED: "Liberado",
		};

		return (
			<Badge variant={variants[status] || "secondary"}>
				{labels[status] || status}
			</Badge>
		);
	};

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-3xl font-bold">Mi Perfil</h2>
				<p className="text-zinc-500 dark:text-zinc-400">
					Información personal y configuración de cuenta
				</p>
			</div>

			<div className="grid gap-6 md:grid-cols-3">
				{/* Información Personal */}
				<Card className="md:col-span-2">
					<CardHeader>
						<div className="flex items-center justify-between">
							<div>
								<CardTitle>Información Personal</CardTitle>
								<CardDescription>
									Detalles de tu cuenta
								</CardDescription>
							</div>
							<Button variant="outline" size="sm">
								<Edit className="mr-2 h-4 w-4" />
								Editar
							</Button>
						</div>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="flex items-center gap-4">
							<Avatar className="h-20 w-20">
								<AvatarFallback className="text-2xl">
									{getInitials()}
								</AvatarFallback>
							</Avatar>
							<div>
								<h3 className="text-2xl font-semibold">
									{user.firstName} {user.lastName}
								</h3>
								<p className="text-zinc-500 dark:text-zinc-400">
									{user.email}
								</p>
							</div>
						</div>

						<Separator />

						<div className="grid gap-4">
							<div className="flex items-center gap-3">
								<Mail className="h-5 w-5 text-zinc-400" />
								<div>
									<p className="text-sm font-medium">Email</p>
									<p className="text-sm text-zinc-500 dark:text-zinc-400">
										{user.email}
									</p>
								</div>
							</div>

							<div className="flex items-center gap-3">
								<Calendar className="h-5 w-5 text-zinc-400" />
								<div>
									<p className="text-sm font-medium">
										Último acceso
									</p>
									<p className="text-sm text-zinc-500 dark:text-zinc-400">
										{user.lastLogin
											? format(
													new Date(user.lastLogin),
													"PPP 'a las' p",
													{ locale: es }
											  )
											: "Nunca"}
									</p>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Roles y Permisos */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Shield className="h-5 w-5" />
							Roles y Permisos
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div>
							<p className="text-sm font-medium mb-2">
								Roles asignados
							</p>
							<div className="flex flex-wrap gap-2">
								{user.roles?.map((role) => (
									<Badge key={role.id} variant="secondary">
										{role.name}
									</Badge>
								))}
							</div>
						</div>

						<Separator />

						<div>
							<p className="text-sm font-medium mb-2">
								Permisos activos
							</p>
							<div className="space-y-1 max-h-40 overflow-y-auto">
								{uniquePermissions.map((permission, index) => (
									<div
										key={`${permission}-${index}`}
										className="text-xs text-zinc-600 dark:text-zinc-400"
									>
										• {permission}
									</div>
								))}
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Organizaciones */}
				<Card className="md:col-span-3">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Building2 className="h-5 w-5" />
							Organizaciones
						</CardTitle>
						<CardDescription>
							Organizaciones a las que perteneces
						</CardDescription>
					</CardHeader>
					<CardContent>
						{user.organizations && user.organizations.length > 0 ? (
							<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
								{user.organizations.map((org: any) => (
									<Card key={org.id}>
										<CardContent className="pt-6">
											<div className="space-y-2">
												<div className="flex items-center justify-between">
													<h4 className="font-semibold">
														{org.name}
													</h4>
													<Badge>{org.type}</Badge>
												</div>
												<p className="text-sm text-zinc-500 dark:text-zinc-400">
													RUC: {org.taxId}
												</p>
												{org.contactEmail && (
													<p className="text-sm text-zinc-500 dark:text-zinc-400">
														{org.contactEmail}
													</p>
												)}
												{org.wallet && (
													<div className="mt-3 pt-3 border-t">
														<p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
															Wallet Custodial
														</p>
														<code className="text-xs font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded block break-all">
															{
																org.wallet
																	.publicAddress
															}
														</code>
														<Badge
															variant="outline"
															className="mt-1 text-xs"
														>
															{org.wallet.status}
														</Badge>
													</div>
												)}
											</div>
										</CardContent>
									</Card>
								))}
							</div>
						) : (
							<div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
								<Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
								<p>No tienes organizaciones asignadas</p>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Operaciones */}
				<Card className="md:col-span-3">
					<CardHeader>
						<div className="flex items-center justify-between">
							<div>
								<CardTitle className="flex items-center gap-2">
									<Briefcase className="h-5 w-5" />
									Mis Operaciones
								</CardTitle>
								<CardDescription>
									Operaciones relacionadas con tus
									organizaciones
								</CardDescription>
							</div>
							<Link href="/dashboard/operations">
								<Button variant="outline" size="sm">
									Ver Todas
								</Button>
							</Link>
						</div>
					</CardHeader>
					<CardContent>
						{isLoadingOperations ? (
							<div className="space-y-2">
								<Skeleton className="h-12 w-full" />
								<Skeleton className="h-12 w-full" />
								<Skeleton className="h-12 w-full" />
							</div>
						) : userOperations.length > 0 ? (
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>
												Número de Operación
											</TableHead>
											<TableHead>Warrantera</TableHead>
											<TableHead>Cliente</TableHead>
											<TableHead>Estado</TableHead>
											<TableHead>Semáforo</TableHead>
											<TableHead>Acciones</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{userOperations
											.slice(0, 5)
											.map((operation: any) => (
												<TableRow key={operation.id}>
													<TableCell className="font-medium">
														{operation.operationNumber ||
															`OP-${operation.id}`}
													</TableCell>
													<TableCell>
														{operation.warrant
															?.name || "-"}
													</TableCell>
													<TableCell>
														{operation.client
															?.name || "-"}
													</TableCell>
													<TableCell>
														{getStatusBadge(
															operation.status
														)}
													</TableCell>
													<TableCell>
														{operation.status ===
														"ACTIVE" ? (
															<DeliveryStatusBadge status="RED" />
														) : operation.status ===
																"RELEASED" ||
														  operation.status ===
																"LIQUIDATED" ? (
															<DeliveryStatusBadge status="GREEN" />
														) : (
															<Badge variant="outline">
																N/A
															</Badge>
														)}
													</TableCell>
													<TableCell>
														<Link
															href={`/dashboard/operations/${operation.id}`}
														>
															<Button
																variant="ghost"
																size="sm"
															>
																<Eye className="h-4 w-4 mr-2" />
																Ver
															</Button>
														</Link>
													</TableCell>
												</TableRow>
											))}
									</TableBody>
								</Table>
								{userOperations.length > 5 && (
									<div className="mt-4 text-center">
										<Link href="/dashboard/operations">
											<Button variant="outline">
												Ver todas las operaciones (
												{userOperations.length})
											</Button>
										</Link>
									</div>
								)}
							</div>
						) : (
							<div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
								<FileCheck className="h-12 w-12 mx-auto mb-2 opacity-50" />
								<p>
									No hay operaciones relacionadas con tus
									organizaciones
								</p>
								<Link
									href="/dashboard/operations"
									className="mt-4 inline-block"
								>
									<Button variant="outline" size="sm">
										Ver todas las operaciones
									</Button>
								</Link>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
