"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { operationsApi } from "@/lib/api/operations";
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
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import {
	FileCheck,
	Plus,
	Eye,
	Search,
	Filter,
	Grid3x3,
	List,
	Package,
	DollarSign,
	Lock,
	Unlock,
} from "lucide-react";
import { AssetDeliveryStatus } from "@/types/asset";
import { CreateOperationDialog } from "@/components/operations/create-operation-dialog";
import { DeliveryStatusBadge } from "@/components/operations/delivery-status-badge";
import { OperationStatus } from "@/types/operation";

export default function OperationsPage() {
	const { user, hasPermission } = useAuth();
	const [createDialogOpen, setCreateDialogOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [viewMode, setViewMode] = useState<"table" | "cards">("table");

	const { data: operations, isLoading } = useQuery({
		queryKey: ["operations"],
		queryFn: operationsApi.getAll,
		enabled: !!user,
	});

	// Filtrar operaciones
	const filteredOperations = useMemo(() => {
		if (!operations) return [];

		return operations.filter((op: any) => {
			const matchesSearch =
				searchQuery === "" ||
				op.operationNumber
					?.toLowerCase()
					.includes(searchQuery.toLowerCase()) ||
				op.warrant?.name
					?.toLowerCase()
					.includes(searchQuery.toLowerCase()) ||
				op.client?.name
					?.toLowerCase()
					.includes(searchQuery.toLowerCase()) ||
				op.bank?.name
					?.toLowerCase()
					.includes(searchQuery.toLowerCase());

			const matchesStatus =
				statusFilter === "all" || op.status === statusFilter;

			return matchesSearch && matchesStatus;
		});
	}, [operations, searchQuery, statusFilter]);

	// Calcular estadísticas de bundles para una operación
	const getBundleStats = (operation: any) => {
		const assets = operation.assets || [];
		const total = assets.length;
		const libre = assets.filter((a: any) => {
			const deliveryStatus = a.deliveryStatus || 
				(a.token ? AssetDeliveryStatus.RED : AssetDeliveryStatus.GREEN);
			return deliveryStatus === AssetDeliveryStatus.GREEN;
		}).length;
		const bloqueados = total - libre;
		const totalValue = assets.reduce((sum: number, a: any) => sum + Number(a.value || 0), 0);
		
		return { total, libre, bloqueados, totalValue };
	};

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
			LIQUIDATED: "Liberado",
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
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-3xl font-bold">Operaciones</h2>
					<p className="text-zinc-500 dark:text-zinc-400">
						Gestiona las operaciones de depósito y tokenización
					</p>
				</div>
				<div className="flex items-center gap-2">
					{(hasPermission("operations:create") ||
						user?.organizations?.some(
							(org: any) => org.type === "WAREHOUSE"
						)) && (
						<Link href="/dashboard/operations/new">
							<Button>
								<Plus className="mr-2 h-4 w-4" />
								Nueva Operación
							</Button>
						</Link>
					)}
				</div>
			</div>

			{/* Filtros y Búsqueda */}
			<Card>
				<CardContent className="pt-6">
					<div className="flex flex-col md:flex-row gap-4">
						<div className="flex-1 relative">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Buscar por número, warrantera, cliente o Entidad Financiera..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-10"
							/>
						</div>
						<Select
							value={statusFilter}
							onValueChange={setStatusFilter}
						>
							<SelectTrigger className="w-full md:w-[200px]">
								<Filter className="h-4 w-4 mr-2" />
								<SelectValue placeholder="Filtrar por estado" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">
									Todos los estados
								</SelectItem>
								<SelectItem value={OperationStatus.PENDING}>
									Pendiente
								</SelectItem>
								<SelectItem
									value={OperationStatus.DOCUMENTS_UPLOADED}
								>
									Documentos Subidos
								</SelectItem>
								<SelectItem value={OperationStatus.SIGNED}>
									Firmado
								</SelectItem>
								<SelectItem value={OperationStatus.TOKENIZED}>
									Tokenizado
								</SelectItem>
								<SelectItem value={OperationStatus.ACTIVE}>
									Activo
								</SelectItem>
								<SelectItem value={OperationStatus.LIQUIDATED}>
									Liquidado
								</SelectItem>
								<SelectItem value={OperationStatus.RELEASED}>
									Liberado
								</SelectItem>
							</SelectContent>
						</Select>
						<div className="flex gap-2">
							<Button
								variant={
									viewMode === "table" ? "default" : "outline"
								}
								size="icon"
								onClick={() => setViewMode("table")}
							>
								<List className="h-4 w-4" />
							</Button>
							<Button
								variant={
									viewMode === "cards" ? "default" : "outline"
								}
								size="icon"
								onClick={() => setViewMode("cards")}
							>
								<Grid3x3 className="h-4 w-4" />
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle>
							Operaciones ({filteredOperations.length})
						</CardTitle>
					</div>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="space-y-2">
							<Skeleton className="h-12 w-full" />
							<Skeleton className="h-12 w-full" />
							<Skeleton className="h-12 w-full" />
						</div>
					) : viewMode === "table" ? (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Número de Operación</TableHead>
									<TableHead>Cliente</TableHead>
									<TableHead className="text-center">Bundles</TableHead>
									<TableHead className="text-center">Libres</TableHead>
									<TableHead className="text-center">Bloqueados</TableHead>
									<TableHead className="text-right">Valor Total</TableHead>
									<TableHead>Estado</TableHead>
									<TableHead>Acciones</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredOperations &&
								filteredOperations.length > 0 ? (
									filteredOperations.map((operation: any) => {
										const stats = getBundleStats(operation);
										return (
											<TableRow key={operation.id}>
												<TableCell className="font-medium">
													{operation.operationNumber ||
														`OP-${operation.id}`}
												</TableCell>
												<TableCell>
													<div>
														<p className="font-medium">
															{operation.client?.name || "-"}
														</p>
														<p className="text-xs text-muted-foreground">
															{operation.bank?.name || "-"}
														</p>
													</div>
												</TableCell>
												<TableCell className="text-center">
													<div className="flex items-center justify-center gap-1">
														<Package className="h-4 w-4 text-muted-foreground" />
														<span className="font-semibold">{stats.total}</span>
													</div>
												</TableCell>
												<TableCell className="text-center">
													<Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-300">
														<Unlock className="h-3 w-3 mr-1" />
														{stats.libre}
													</Badge>
												</TableCell>
												<TableCell className="text-center">
													<Badge variant="outline" className="bg-red-50 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-300">
														<Lock className="h-3 w-3 mr-1" />
														{stats.bloqueados}
													</Badge>
												</TableCell>
												<TableCell className="text-right font-semibold">
													${stats.totalValue.toLocaleString()}
												</TableCell>
												<TableCell>
													{getStatusBadge(
														operation.status
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
										);
									})
								) : (
									<TableRow>
										<TableCell
											colSpan={8}
											className="text-center text-slate-500 py-8"
										>
											<FileCheck className="h-12 w-12 mx-auto mb-2 opacity-50" />
											<p>No se encontraron operaciones</p>
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{filteredOperations &&
							filteredOperations.length > 0 ? (
								filteredOperations.map((operation: any) => (
									<Card
										key={operation.id}
										className="hover:shadow-lg transition-shadow"
									>
										<CardHeader>
											<div className="flex items-center justify-between">
												<CardTitle className="text-lg">
													{operation.operationNumber ||
														`OP-${operation.id}`}
												</CardTitle>
												{getStatusBadge(
													operation.status
												)}
											</div>
										</CardHeader>
										<CardContent className="space-y-3">
											<div className="space-y-2 text-sm">
												<div>
													<p className="text-muted-foreground">
														Warrantera
													</p>
													<p className="font-medium">
														{operation.warrant
															?.name || "-"}
													</p>
												</div>
												<div>
													<p className="text-muted-foreground">
														Cliente
													</p>
													<p className="font-medium">
														{operation.client
															?.name || "-"}
													</p>
												</div>
												<div>
													<p className="text-muted-foreground">
														Entidad Financiera
													</p>
													<p className="font-medium">
														{operation.bank?.name ||
															"-"}
													</p>
												</div>
											</div>
											{operation.deliveryStatus && (
												<DeliveryStatusBadge
													status={
														operation.deliveryStatus
															.status
													}
													message={
														operation.deliveryStatus
															.message
													}
												/>
											)}
											<Link
												href={`/dashboard/operations/${operation.id}`}
											>
												<Button
													variant="outline"
													className="w-full"
												>
													<Eye className="h-4 w-4 mr-2" />
													Ver Detalles
												</Button>
											</Link>
										</CardContent>
									</Card>
								))
							) : (
								<div className="col-span-full text-center py-8 text-slate-500">
									<FileCheck className="h-12 w-12 mx-auto mb-2 opacity-50" />
									<p>No se encontraron operaciones</p>
								</div>
							)}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
