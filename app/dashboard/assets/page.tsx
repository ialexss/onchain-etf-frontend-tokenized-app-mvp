"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { assetsApi } from "@/lib/api/assets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import {
	Package,
	Plus,
	Coins,
	Briefcase,
	LayoutGrid,
	Table as TableIcon,
	MapPin,
	Tag,
	Calendar,
	FileText,
	Building2,
	User,
	Eye,
} from "lucide-react";
import { CreateAssetDialog } from "@/components/assets/create-asset-dialog";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Separator } from "@/components/ui/separator";

type ViewMode = "table" | "cards";

export default function AssetsPage() {
	const { user, hasPermission } = useAuth();
	const [createDialogOpen, setCreateDialogOpen] = useState(false);
	const [viewMode, setViewMode] = useState<ViewMode>("cards");

	const { data: assets, isLoading } = useQuery({
		queryKey: ["assets"],
		queryFn: assetsApi.getAll,
		enabled: !!user,
	});

	const getStatusBadge = (status: string) => {
		const variants: Record<
			string,
			"default" | "secondary" | "destructive" | "outline"
		> = {
			STORED: "secondary",
			PLEDGED: "default",
			DELIVERED: "outline",
			BURNED: "destructive",
		};
		return (
			<Badge variant={variants[status] || "secondary"}>{status}</Badge>
		);
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-3xl font-bold">Activos</h2>
					<p className="text-zinc-500 dark:text-zinc-400">
						Gestiona los activos físicos tokenizados
					</p>
				</div>
				{hasPermission("assets:create") && (
					<Button onClick={() => setCreateDialogOpen(true)}>
						<Plus className="mr-2 h-4 w-4" />
						Crear Activo
					</Button>
				)}
			</div>

			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle>Lista de Activos</CardTitle>
						<div className="flex items-center gap-2">
							<Button
								variant={
									viewMode === "table" ? "default" : "outline"
								}
								size="sm"
								onClick={() => setViewMode("table")}
							>
								<TableIcon className="h-4 w-4 mr-2" />
								Tabla
							</Button>
							<Button
								variant={
									viewMode === "cards" ? "default" : "outline"
								}
								size="sm"
								onClick={() => setViewMode("cards")}
							>
								<LayoutGrid className="h-4 w-4 mr-2" />
								Cards
							</Button>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						viewMode === "table" ? (
							<div className="space-y-2">
								<Skeleton className="h-12 w-full" />
								<Skeleton className="h-12 w-full" />
								<Skeleton className="h-12 w-full" />
							</div>
						) : (
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
								<Skeleton className="h-96 w-full" />
								<Skeleton className="h-96 w-full" />
								<Skeleton className="h-96 w-full" />
							</div>
						)
					) : assets && assets.length > 0 ? (
						viewMode === "table" ? (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>ID</TableHead>
										<TableHead>Nombre</TableHead>
										<TableHead>VIN/Serial</TableHead>
										<TableHead>Descripción</TableHead>
										<TableHead>Marcas</TableHead>
										<TableHead>Cantidad</TableHead>
										<TableHead>Valor</TableHead>
										<TableHead>Almacén</TableHead>
										<TableHead>Cliente</TableHead>
										<TableHead>Localización</TableHead>
										<TableHead>Estado</TableHead>
										<TableHead>Operación</TableHead>
										<TableHead>Token</TableHead>
										<TableHead>Documentos</TableHead>
										<TableHead>Creado</TableHead>
										<TableHead>Acciones</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{assets.map((asset: any) => (
										<TableRow key={asset.id}>
											<TableCell className="font-medium">
												#{asset.id}
											</TableCell>
											<TableCell className="font-medium">
												{asset.name || "-"}
											</TableCell>
											<TableCell className="font-medium">
												{asset.vinSerial}
											</TableCell>
											<TableCell>
												<div>
													{asset.description && (
														<p className="text-sm">
															{asset.description}
														</p>
													)}
												</div>
											</TableCell>
											<TableCell>
												{asset.brands || "-"}
											</TableCell>
											<TableCell>
												{asset.quantity
													? Math.floor(
															Number(
																asset.quantity
															)
													  )
													: 1}
											</TableCell>
											<TableCell className="font-semibold">
												${asset.value?.toLocaleString()}
											</TableCell>
											<TableCell>
												{asset.warehouse?.name || "-"}
											</TableCell>
											<TableCell>
												{asset.client?.name || "-"}
											</TableCell>
											<TableCell>
												{asset.location ? (
													<div className="flex items-center gap-1 text-xs">
														<MapPin className="h-3 w-3" />
														{asset.location}
													</div>
												) : (
													"-"
												)}
											</TableCell>
											<TableCell>
												{getStatusBadge(asset.status)}
											</TableCell>
											<TableCell>
												{asset.operationId ? (
													<Link
														href={`/dashboard/operations/${asset.operationId}`}
													>
														<Badge
															variant="outline"
															className="cursor-pointer hover:bg-primary/10 flex items-center gap-1 w-fit"
														>
															<Briefcase className="h-3 w-3" />
															OP-
															{asset.operationId}
														</Badge>
													</Link>
												) : (
													<span className="text-muted-foreground text-sm">
														-
													</span>
												)}
											</TableCell>
											<TableCell>
												{asset.token ? (
													<div className="flex items-center gap-2">
														<Link
															href={`/dashboard/tokens/${asset.token.id}`}
														>
															<Badge
																variant="default"
																className="cursor-pointer hover:bg-primary/80 flex items-center gap-1"
															>
																<Coins className="h-3 w-3" />
																Token #
																{asset.token.id}
															</Badge>
														</Link>
														{asset.token
															.operationId && (
															<Badge
																variant="secondary"
																className="text-xs"
															>
																Compartido
															</Badge>
														)}
													</div>
												) : (
													<Badge variant="secondary">
														No tokenizado
													</Badge>
												)}
											</TableCell>
											<TableCell>
												{asset.documents &&
												asset.documents.length > 0 ? (
													<Badge
														variant="outline"
														className="flex items-center gap-1 w-fit"
													>
														<FileText className="h-3 w-3" />
														{asset.documents.length}
													</Badge>
												) : (
													"-"
												)}
											</TableCell>
											<TableCell className="text-xs text-muted-foreground">
												{asset.createdAt &&
													format(
														new Date(
															asset.createdAt
														),
														"dd/MM/yyyy",
														{ locale: es }
													)}
											</TableCell>
											<TableCell>
												<Link
													href={`/dashboard/assets/${asset.id}`}
												>
													<Button
														variant="ghost"
														size="sm"
													>
														<Eye className="h-4 w-4" />
													</Button>
												</Link>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						) : (
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
								{assets.map((asset: any) => (
									<Card
										key={asset.id}
										className="hover:shadow-lg transition-shadow"
									>
										<CardHeader>
											<div className="flex items-start justify-between">
												<div className="flex-1">
													<CardTitle className="text-lg flex items-center gap-2">
														{asset.iconUrl ? (
															<div className="relative w-10 h-10 rounded overflow-hidden bg-muted flex items-center justify-center">
																<img
																	src={
																		asset.iconUrl
																	}
																	alt={
																		asset.name ||
																		asset.description ||
																		asset.vinSerial
																	}
																	className="w-full h-full object-cover"
																	onError={(
																		e
																	) => {
																		(
																			e.target as HTMLImageElement
																		).style.display =
																			"none";
																	}}
																/>
															</div>
														) : (
															<Package className="h-5 w-5" />
														)}
														<div>
															<p className="font-medium">
																{asset.name ||
																	asset.vinSerial}
															</p>
															<p className="text-xs text-muted-foreground">
																{asset.name
																	? `VIN: ${asset.vinSerial}`
																	: `ID: #${asset.id}`}
															</p>
														</div>
													</CardTitle>
												</div>
												{getStatusBadge(asset.status)}
											</div>
										</CardHeader>
										<CardContent className="space-y-4">
											{/* Nombre */}
											{asset.name && (
												<div>
													<p className="text-sm font-medium text-muted-foreground">
														Nombre
													</p>
													<p className="text-sm font-semibold">
														{asset.name}
													</p>
												</div>
											)}
											{/* Descripción */}
											{asset.description && (
												<div>
													<p className="text-sm font-medium text-muted-foreground">
														Descripción
													</p>
													<p className="text-sm">
														{asset.description}
													</p>
												</div>
											)}

											{/* Información principal */}
											<div className="grid grid-cols-2 gap-3">
												<div>
													<p className="text-xs text-muted-foreground">
														Valor
													</p>
													<p className="text-lg font-bold">
														$
														{asset.value?.toLocaleString()}
													</p>
												</div>
												{asset.quantity && (
													<div>
														<p className="text-xs text-muted-foreground">
															Cantidad
														</p>
														<p className="text-lg font-semibold">
															{Math.floor(
																Number(
																	asset.quantity
																)
															)}
														</p>
													</div>
												)}
											</div>

											<Separator />

											{/* Organizaciones */}
											<div className="space-y-2">
												<div className="flex items-center gap-2 text-sm">
													<Building2 className="h-4 w-4 text-muted-foreground" />
													<div className="flex-1">
														<p className="text-xs text-muted-foreground">
															Almacén
														</p>
														<p className="font-medium">
															{asset.warehouse
																?.name || "-"}
														</p>
													</div>
												</div>
												<div className="flex items-center gap-2 text-sm">
													<User className="h-4 w-4 text-muted-foreground" />
													<div className="flex-1">
														<p className="text-xs text-muted-foreground">
															Cliente
														</p>
														<p className="font-medium">
															{asset.client
																?.name || "-"}
														</p>
													</div>
												</div>
											</div>

											{/* Marcas y Localización */}
											{(asset.brands ||
												asset.location) && (
												<>
													<Separator />
													<div className="space-y-2">
														{asset.brands && (
															<div className="flex items-center gap-2 text-sm">
																<Tag className="h-4 w-4 text-muted-foreground" />
																<div className="flex-1">
																	<p className="text-xs text-muted-foreground">
																		Marcas
																	</p>
																	<p className="font-medium">
																		{
																			asset.brands
																		}
																	</p>
																</div>
															</div>
														)}
														{asset.location && (
															<div className="flex items-center gap-2 text-sm">
																<MapPin className="h-4 w-4 text-muted-foreground" />
																<div className="flex-1">
																	<p className="text-xs text-muted-foreground">
																		Localización
																	</p>
																	<p className="font-medium">
																		{
																			asset.location
																		}
																	</p>
																</div>
															</div>
														)}
													</div>
												</>
											)}

											<Separator />

											{/* Operación y Token */}
											<div className="space-y-2">
												{asset.operationId && (
													<div>
														<p className="text-xs text-muted-foreground mb-1">
															Operación
														</p>
														<Link
															href={`/dashboard/operations/${asset.operationId}`}
														>
															<Badge
																variant="outline"
																className="cursor-pointer hover:bg-primary/10 flex items-center gap-1 w-fit"
															>
																<Briefcase className="h-3 w-3" />
																OP-
																{
																	asset.operationId
																}
															</Badge>
														</Link>
													</div>
												)}
												<div>
													<p className="text-xs text-muted-foreground mb-1">
														Token
													</p>
													{asset.token ? (
														<div className="flex items-center gap-2">
															<Link
																href={`/dashboard/tokens/${asset.token.id}`}
															>
																<Badge
																	variant="default"
																	className="cursor-pointer hover:bg-primary/80 flex items-center gap-1"
																>
																	<Coins className="h-3 w-3" />
																	Token #
																	{
																		asset
																			.token
																			.id
																	}
																</Badge>
															</Link>
															{asset.token
																.operationId && (
																<Badge
																	variant="secondary"
																	className="text-xs"
																>
																	Compartido
																</Badge>
															)}
														</div>
													) : (
														<Badge variant="secondary">
															No tokenizado
														</Badge>
													)}
												</div>
												{asset.documents &&
													asset.documents.length >
														0 && (
														<div>
															<p className="text-xs text-muted-foreground mb-1">
																Documentos
															</p>
															<Badge
																variant="outline"
																className="flex items-center gap-1 w-fit"
															>
																<FileText className="h-3 w-3" />
																{
																	asset
																		.documents
																		.length
																}{" "}
																documento
																{asset.documents
																	.length !==
																1
																	? "s"
																	: ""}
															</Badge>
														</div>
													)}
											</div>

											<Separator />

											{/* Fechas */}
											<div className="flex items-center justify-between text-xs text-muted-foreground">
												<div className="flex items-center gap-1">
													<Calendar className="h-3 w-3" />
													{asset.createdAt &&
														format(
															new Date(
																asset.createdAt
															),
															"dd/MM/yyyy",
															{ locale: es }
														)}
												</div>
												{asset.updatedAt &&
													asset.updatedAt !==
														asset.createdAt && (
														<span>
															Actualizado:{" "}
															{format(
																new Date(
																	asset.updatedAt
																),
																"dd/MM/yyyy",
																{ locale: es }
															)}
														</span>
													)}
											</div>

											{/* Acción */}
											<Link
												href={`/dashboard/assets/${asset.id}`}
											>
												<Button
													variant="default"
													className="w-full"
													size="sm"
												>
													<Eye className="h-4 w-4 mr-2" />
													Ver Detalle Completo
												</Button>
											</Link>
										</CardContent>
									</Card>
								))}
							</div>
						)
					) : (
						<div className="text-center py-12 text-slate-500">
							<Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
							<p className="text-lg font-medium mb-2">
								No hay activos registrados
							</p>
							<p className="text-sm text-muted-foreground">
								{hasPermission("assets:create") &&
									"Crea tu primer activo para comenzar"}
							</p>
						</div>
					)}
				</CardContent>
			</Card>

			<CreateAssetDialog
				open={createDialogOpen}
				onOpenChange={setCreateDialogOpen}
			/>
		</div>
	);
}
