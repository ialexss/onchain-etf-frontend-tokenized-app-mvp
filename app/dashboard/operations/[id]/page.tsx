"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { operationsApi } from "@/lib/api/operations";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { SignaturesSection } from "@/components/operations/signatures-section";
import { ReleaseLetterSection } from "@/components/operations/release-letter-section";
import { TokenizationSection } from "@/components/operations/tokenization-section";
import { ReleaseSection } from "@/components/operations/release-section";
import { DeliveryStatusBadge } from "@/components/operations/delivery-status-badge";
import { OperationStatusTimeline } from "@/components/operations/operation-status-timeline";
import { AssetTokenBundleCard } from "@/components/operations/asset-token-bundle-card";
import { AtomicAssetBundleSignatures } from "@/components/shared/atomic-asset-bundle-signatures";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth/auth-context";
import { toast } from "sonner";
import {
	FileCheck,
	AlertCircle,
	Loader2,
	Package,
	FileText,
	FileSignature,
	Coins,
	Receipt,
	Building2,
	Calendar,
	Hash,
	CircleDot,
	CheckCircle2,
	CheckCircle,
	XCircle,
	Circle,
	LayoutGrid,
	List,
	Eye,
	Lock,
	Unlock,
	Search,
	Filter,
	Shield,
} from "lucide-react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AssetDeliveryStatus, AssetStatus } from "@/types/asset";

export default function OperationDetailPage() {
	const params = useParams();
	const operationId = parseInt(params.id as string);
	const { user } = useAuth();
	const queryClient = useQueryClient();
	const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
	const [filter, setFilter] = useState<"all" | "ready" | "pending-signatures" | "blocked" | "free">("all");
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedBundleForSignatures, setSelectedBundleForSignatures] = useState<number | null>(null);

	const { data: operation, isLoading } = useQuery({
		queryKey: ["operations", operationId],
		queryFn: () => operationsApi.getById(operationId),
		enabled: !!operationId,
	});

	// Obtener estado completo que incluye el bundle
	const { data: operationStatus } = useQuery({
		queryKey: ["operations", operationId, "status"],
		queryFn: () => operationsApi.getOperationStatus(operationId),
		enabled: !!operationId,
	});

	// Obtener estado de Paquetes de Activos
	const { data: bundlesStatus } = useQuery({
		queryKey: ["operations", operationId, "asset-token-bundles-status"],
		queryFn: () => operationsApi.getAssetTokenBundlesStatus(operationId),
		enabled: !!operationId,
	});

	// El bundle viene desde operationStatus (legacy)
	const bundle = operationStatus?.bundle;
	const cd = bundle?.cd;
	const bp = bundle?.bp;
	const pagare = bundle?.pagare;

	// Determinar permisos
	const isWarrant = user?.organizations?.some((org) => org.type === "WAREHOUSE");
	const isClient = user?.organizations?.some((org) => org.type === "CLIENT");
	const isBank = user?.organizations?.some((org) => org.type === "BANK");

	// Calcular estadísticas de bundles
	const getBundleStats = () => {
		if (!operation?.assets) return null;
		
		const total = operation.assets.length;
		const tokenized = operation.assets.filter(a => a.token).length;
		const released = operation.assets.filter(a => 
			a.status === AssetStatus.BURNED || a.status === AssetStatus.DELIVERED
		).length;
		// Excluir activos BURNED del conteo de bloqueados y libres
		const activeAssets = operation.assets.filter(a => a.status !== AssetStatus.BURNED);
		const blocked = activeAssets.filter(a => 
			a.deliveryStatus === AssetDeliveryStatus.RED || 
			(a.token && a.status !== AssetStatus.BURNED)
		).length;
		const available = activeAssets.filter(a => 
			a.deliveryStatus === AssetDeliveryStatus.GREEN && 
			a.status !== AssetStatus.BURNED
		).length;
		
		// Calculate ready for tokenization
		const ready = operation.assets.filter(a => {
			const bundleData = operationStatus?.assetBundles?.find((b: any) => b.assetId === a.id);
			const docs = bundleData?.documents || {};
			const cd = docs.cd;
			const bp = docs.bp;
			const pagare = docs.pagare;
			
			const hasAllDocs = cd && bp;
			const allSigned = 
				(!cd || (cd.signedByWarehouse && cd.signedByClient)) &&
				(!bp || (bp.signedByWarehouse && bp.signedByClient)) &&
				(!pagare || pagare.signedByClient);
			return hasAllDocs && allSigned && !a.token;
		}).length;

		return {
			total,
			tokenized,
			released,
			blocked,
			available,
			ready,
			progress: total > 0 ? Math.round((tokenized / total) * 100) : 0,
			totalValue: operation.assets.reduce((sum, a) => sum + (Number(a.value) || 0), 0),
		};
	};

	const stats = getBundleStats();
	
	// Calculate filtered bundles count
	const getFilteredBundlesCount = () => {
		if (!operation?.assets) return 0;
		
		return operation.assets.filter((asset) => {
			const deliveryStatus = asset.deliveryStatus || 
				(asset.token ? AssetDeliveryStatus.RED : AssetDeliveryStatus.GREEN);
			
			// Verificar documentos desde múltiples fuentes
			const bundleData = operationStatus?.assetBundles?.find((b: any) => b.assetId === asset.id);
			const docs = bundleData?.documents || {};
			const cd = docs.cd || asset.documents?.find((d: any) => d.type === "CD");
			const bp = docs.bp || asset.documents?.find((d: any) => d.type === "BP");
			const pagare = docs.pagare || asset.documents?.find((d: any) => d.type === "PAGARE");
			
			const hasAllDocs = cd && bp;
			const allSigned = 
				(!cd || (cd.signedByWarehouse && cd.signedByClient)) &&
				(!bp || (bp.signedByWarehouse && bp.signedByClient)) &&
				(!pagare || pagare.signedByClient);
			const isReady = hasAllDocs && allSigned && !asset.token;
			const hasPendingSignatures = hasAllDocs && !allSigned;
			
			const matchesSearch = (asset.vinSerial || asset.description || "").toLowerCase().includes(searchQuery.toLowerCase());
			if (!matchesSearch) return false;

			switch (filter) {
				case "ready":
					return isReady;
				case "pending-signatures":
					return hasPendingSignatures;
				case "blocked":
					return deliveryStatus === AssetDeliveryStatus.RED && asset.status !== AssetStatus.BURNED;
				case "free":
					return deliveryStatus === AssetDeliveryStatus.GREEN && asset.status !== AssetStatus.BURNED;
				default:
					return true;
			}
		}).length;
	};

	if (isLoading) {
		return (
			<div className="space-y-6">
				<Skeleton className="h-12 w-full" />
				<Skeleton className="h-64 w-full" />
			</div>
		);
	}

	if (!operation) {
		return (
			<Card>
				<CardContent className="py-8">
					<Alert>
						<AlertCircle className="h-4 w-4" />
						<AlertDescription>
							Operación no encontrada
						</AlertDescription>
					</Alert>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-3xl font-bold flex items-center gap-3">
						<span>Operación {operation.operationNumber || `OP-${operation.id}`}</span>
						<Badge variant="outline" className="text-base">
							{operation.status}
						</Badge>
					</h2>
					<p className="text-slate-500 dark:text-slate-400 mt-1">
						Vista macro de la operación con {stats?.total || 0} Paquete{stats?.total !== 1 ? "s" : ""} de Activos
					</p>
				</div>
				<div className="flex items-center gap-2">
					{(operation.status === "ACTIVE" ||
						operation.status === "RELEASED") && (
						<DeliveryStatusBadge
							status={operation.status === "ACTIVE" ? "RED" : "GREEN"}
						/>
					)}
					{/* Indicador de Relación Garantía/Riesgo */}
					{operationStatus?.guaranteeRiskCompliant !== undefined && operationStatus?.guaranteeRiskCompliant !== null && (
						<Badge
							variant={operationStatus.guaranteeRiskCompliant ? "default" : "destructive"}
							className="flex items-center gap-1"
							title={
								operationStatus.guaranteeRiskCompliant
									? "La operación cumple con la relación Garantía/Riesgo"
									: "La operación NO cumple con la relación Garantía/Riesgo"
							}
						>
							{operationStatus.guaranteeRiskCompliant ? (
								<CheckCircle2 className="h-3 w-3" />
							) : (
								<AlertCircle className="h-3 w-3" />
							)}
							Garantía/Riesgo: {operationStatus.guaranteeRiskCompliant ? "Cumple" : "No Cumple"}
						</Badge>
					)}
				</div>
			</div>

			{/* Timeline de Estado */}
			<OperationStatusTimeline status={operation.status} assets={operation.assets} />

			{/* Resumen Macro */}
			<div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${operationStatus?.guaranteeRiskCompliant !== undefined && operationStatus?.guaranteeRiskCompliant !== null ? "5" : "4"} gap-4`}>
				{/* Información General */}
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
							<Building2 className="h-4 w-4" />
							Partes
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2">
						<div>
							<span className="text-xs text-muted-foreground">Warrantera</span>
							<p className="font-medium text-sm">{operation.warrant?.name || "-"}</p>
						</div>
						<div>
							<span className="text-xs text-muted-foreground">Cliente</span>
							<p className="font-medium text-sm">{operation.client?.name || "-"}</p>
						</div>
						<div>
							<span className="text-xs text-muted-foreground">Entidad Financiera</span>
							<p className="font-medium text-sm">{operation.bank?.name || "-"}</p>
						</div>
					</CardContent>
				</Card>

				{/* Paquetes de Activos Stats */}
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
							<Package className="h-4 w-4" />
							Paquetes de Activos
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold">{stats?.total || 0}</div>
						<div className="flex items-center gap-4 mt-2 text-sm">
							<div className="flex items-center gap-1">
								<Circle className="h-3 w-3 fill-green-500 text-green-500" />
								<span>{stats?.available || 0} libres</span>
							</div>
							<div className="flex items-center gap-1">
								<Circle className="h-3 w-3 fill-red-500 text-red-500" />
								<span>{stats?.blocked || 0} bloqueados</span>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Tokenización */}
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
							<Coins className="h-4 w-4" />
							Tokenización
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex items-center justify-between">
							<div className="text-3xl font-bold">{stats?.tokenized || 0}</div>
							<span className="text-sm text-muted-foreground">
								de {stats?.total || 0}
							</span>
						</div>
						<Progress value={stats?.progress || 0} className="h-2 mt-2" />
						<p className="text-xs text-muted-foreground mt-1">
							{stats?.progress || 0}% tokenizado
						</p>
					</CardContent>
				</Card>

				{/* Valor Total */}
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
							<Receipt className="h-4 w-4" />
							Valor Total
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold">
							${stats?.totalValue?.toLocaleString() || 0}
						</div>
						<p className="text-xs text-muted-foreground mt-2">
							Suma de todos los paquetes
						</p>
					</CardContent>
				</Card>

				{/* Relación Garantía/Riesgo - Se muestra si hay datos disponibles */}
				{operationStatus?.guaranteeRiskCompliant !== undefined && operationStatus?.guaranteeRiskCompliant !== null && (
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
								<Shield className="h-4 w-4" />
								Garantía/Riesgo
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex items-center gap-2 mb-2">
								{operationStatus.guaranteeRiskCompliant ? (
									<CheckCircle2 className="h-6 w-6 text-green-500" />
								) : (
									<XCircle className="h-6 w-6 text-red-500" />
								)}
								<span className={`text-lg font-bold ${operationStatus.guaranteeRiskCompliant ? "text-green-600" : "text-red-600"}`}>
									{operationStatus.guaranteeRiskCompliant ? "Cumple" : "No Cumple"}
								</span>
							</div>
							{operation.guaranteeRiskRatio && (
								<p className="text-xs text-muted-foreground">
									Ratio: {operation.guaranteeRiskRatio}
								</p>
							)}
							{operation.giroValue && (
								<p className="text-xs text-muted-foreground mt-1">
									Giro: ${operation.giroValue.toLocaleString()}
								</p>
							)}
						</CardContent>
					</Card>
				)}
			</div>

			{/* Tabs */}
			<Tabs defaultValue="bundles" className="space-y-4">
				<TabsList>
					<TabsTrigger value="bundles" className="flex items-center gap-2">
						<Package className="h-4 w-4" />
						Bundles
					</TabsTrigger>
					<TabsTrigger value="documents" className="flex items-center gap-2">
						<FileText className="h-4 w-4" />
						Documentos
					</TabsTrigger>
					<TabsTrigger value="signatures" className="flex items-center gap-2">
						<FileSignature className="h-4 w-4" />
						Firmas
					</TabsTrigger>
					<TabsTrigger value="tokenization" className="flex items-center gap-2">
						<Coins className="h-4 w-4" />
						Tokenización
					</TabsTrigger>
					{(isBank || isWarrant) && (
						<TabsTrigger value="release" className="flex items-center gap-2">
							<Receipt className="h-4 w-4" />
							Liberación
						</TabsTrigger>
					)}
				</TabsList>

				{/* Tab: Paquetes de Activos */}
				<TabsContent value="bundles" className="space-y-4">
					<div className="flex items-center justify-between">
						<div>
							<h3 className="text-lg font-semibold">Paquetes de Activos</h3>
							<p className="text-sm text-muted-foreground">
								Cada paquete representa un activo con sus documentos y token asociado
							</p>
						</div>
						<div className="flex items-center gap-2">
							<Button
								variant={viewMode === "grid" ? "default" : "outline"}
								size="sm"
								onClick={() => setViewMode("grid")}
							>
								<LayoutGrid className="h-4 w-4" />
							</Button>
							<Button
								variant={viewMode === "list" ? "default" : "outline"}
								size="sm"
								onClick={() => setViewMode("list")}
							>
								<List className="h-4 w-4" />
							</Button>
						</div>
					</div>

					<div className="flex flex-col sm:flex-row gap-4 mb-4">
						<div className="relative flex-1 max-w-sm">
							<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
							<Input
								type="search"
								placeholder="Buscar por VIN/Serial..."
								className="pl-8"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
						</div>
					</div>

					{/* Filtros rápidos */}
				<Card className="p-4">
					<div className="flex items-center justify-between mb-3">
						<h3 className="text-sm font-semibold flex items-center gap-2">
							<Filter className="h-4 w-4" />
							Filtros Rápidos
						</h3>
						{filter !== "all" && (
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setFilter("all")}
								className="h-7 text-xs"
							>
								Limpiar filtros
							</Button>
						)}
					</div>
					<div className="flex flex-wrap gap-2">
						<Button
							variant={filter === "all" ? "default" : "outline"}
							size="sm"
							onClick={() => setFilter("all")}
							className="relative"
						>
							<CircleDot className="h-3 w-3 mr-1.5" />
							Todos
							<Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
								{getFilteredBundlesCount()}
							</Badge>
						</Button>
						<Button
							variant={filter === "ready" ? "default" : "outline"}
							size="sm"
							onClick={() => setFilter("ready")}
							className={filter === "ready" ? "bg-green-600 hover:bg-green-700" : ""}
						>
							<CheckCircle className="h-3 w-3 mr-1.5" />
							Listos
							<Badge 
								variant={filter === "ready" ? "secondary" : "outline"} 
								className="ml-2 h-5 px-1.5 text-xs"
							>
								{stats?.ready || 0}
							</Badge>
						</Button>
						<Button
							variant={filter === "pending-signatures" ? "default" : "outline"}
							size="sm"
							onClick={() => setFilter("pending-signatures")}
							className={filter === "pending-signatures" ? "bg-yellow-600 hover:bg-yellow-700" : ""}
						>
							<FileSignature className="h-3 w-3 mr-1.5" />
							Firmas Pendientes
							<Badge 
								variant={filter === "pending-signatures" ? "secondary" : "outline"} 
								className="ml-2 h-5 px-1.5 text-xs"
							>
								{operation.assets?.filter((a: any) => {
									const docs = a.documents || {};
									return !(
										docs.cd?.signedByWarehouse && docs.cd?.signedByClient &&
										docs.bp?.signedByWarehouse && docs.bp?.signedByClient &&
										(!docs.pagare || docs.pagare?.signedByClient)
									);
								}).length || 0}
							</Badge>
						</Button>
						<Button
							variant={filter === "blocked" ? "default" : "outline"}
							size="sm"
							onClick={() => setFilter("blocked")}
							className={filter === "blocked" ? "bg-red-600 hover:bg-red-700" : ""}
						>
							<Lock className="h-3 w-3 mr-1.5" />
							Bloqueados
							<Badge 
								variant={filter === "blocked" ? "secondary" : "outline"} 
								className="ml-2 h-5 px-1.5 text-xs"
							>
								{stats?.blocked || 0}
							</Badge>
						</Button>
						<Button
							variant={filter === "free" ? "default" : "outline"}
							size="sm"
							onClick={() => setFilter("free")}
							className={filter === "free" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
						>
							<Unlock className="h-3 w-3 mr-1.5" />
							Libres
							<Badge 
								variant={filter === "free" ? "secondary" : "outline"} 
								className="ml-2 h-5 px-1.5 text-xs"
							>
								{stats?.available || 0}
							</Badge>
						</Button>
					</div>
				</Card>

					{/* Estadísticas rápidas */}
					{bundlesStatus && (
						<div className="flex flex-wrap gap-2">
							<Badge variant="outline" className="flex items-center gap-1">
								<CircleDot className="h-3 w-3" />
								Total: {bundlesStatus.total}
							</Badge>
							<Badge variant="secondary" className="flex items-center gap-1">
								<Package className="h-3 w-3" />
								Almacenados: {bundlesStatus.stored}
							</Badge>
							<Badge className="bg-blue-500 flex items-center gap-1">
								<Coins className="h-3 w-3" />
								Tokenizados: {bundlesStatus.tokenized}
							</Badge>
							<Badge className="bg-green-500 flex items-center gap-1">
								<CheckCircle2 className="h-3 w-3" />
								Liberados: {bundlesStatus.burned}
							</Badge>
						</div>
					)}

					{/* Lista de Paquetes de Activos */}
					{operation.assets && operation.assets.length > 0 ? (
						viewMode === "grid" ? (
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
								{operation.assets.filter((asset) => {
									const deliveryStatus = asset.deliveryStatus || 
										(asset.token ? AssetDeliveryStatus.RED : AssetDeliveryStatus.GREEN);
									
									// Verificar documentos desde múltiples fuentes
									const bundleData = operationStatus?.assetBundles?.find((b: any) => b.assetId === asset.id);
									const docs = bundleData?.documents || {};
									const cd = docs.cd || asset.documents?.find((d: any) => d.type === "CD");
									const bp = docs.bp || asset.documents?.find((d: any) => d.type === "BP");
									const pagare = docs.pagare || asset.documents?.find((d: any) => d.type === "PAGARE");
									
									const hasAllDocs = cd && bp;
									const allSigned = 
										(!cd || (cd.signedByWarehouse && cd.signedByClient)) &&
										(!bp || (bp.signedByWarehouse && bp.signedByClient)) &&
										(!pagare || pagare.signedByClient);
									const isReady = hasAllDocs && allSigned && !asset.token;
									const hasPendingSignatures = hasAllDocs && !allSigned;
									
									const matchesSearch = (asset.vinSerial || asset.description || "").toLowerCase().includes(searchQuery.toLowerCase());
									if (!matchesSearch) return false;

									switch (filter) {
										case "ready":
											return isReady;
										case "pending-signatures":
											return hasPendingSignatures;
										case "blocked":
											return deliveryStatus === AssetDeliveryStatus.RED && asset.status !== AssetStatus.BURNED;
										case "free":
											return deliveryStatus === AssetDeliveryStatus.GREEN && asset.status !== AssetStatus.BURNED;
										default:
											return true;
									}
								}).map((asset) => (
									<AssetTokenBundleCard
										key={asset.id}
										asset={asset}
										operationId={operationId}
										compact={false}
										canTokenize={
											operation.status === "SIGNED" ||
											operation.status === "TOKENIZED" ||
											operation.status === "ACTIVE"
										}
										canRelease={
											operation.status === "ACTIVE" ||
											operation.status === "RELEASED"
										}
										onSignaturesClick={() => setSelectedBundleForSignatures(asset.id)}
									/>
								))}
							</div>
						) : (
							<Card>
								<CardContent className="p-0">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>VIN/Serial</TableHead>
												<TableHead>Descripción</TableHead>
												<TableHead className="text-right">Valor</TableHead>
												<TableHead className="text-center">Ubicación</TableHead>
												<TableHead className="text-center">Estado</TableHead>
												<TableHead className="text-center">Semáforo</TableHead>
												<TableHead className="text-center">Token</TableHead>
												<TableHead className="text-center">Acciones</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{operation.assets.filter((asset) => {
												const matchesSearch = (asset.vinSerial || asset.description || "").toLowerCase().includes(searchQuery.toLowerCase());
												if (!matchesSearch) return false;

												const deliveryStatus = asset.deliveryStatus || 
													(asset.token ? AssetDeliveryStatus.RED : AssetDeliveryStatus.GREEN);
												
												// Verificar documentos desde múltiples fuentes
												const bundleData = operationStatus?.assetBundles?.find((b: any) => b.assetId === asset.id);
												const docs = bundleData?.documents || {};
												const cd = docs.cd || asset.documents?.find((d: any) => d.type === "CD");
												const bp = docs.bp || asset.documents?.find((d: any) => d.type === "BP");
												const pagare = docs.pagare || asset.documents?.find((d: any) => d.type === "PAGARE");
												
												const hasAllDocs = cd && bp;
												const allSigned = 
													(!cd || (cd.signedByWarehouse && cd.signedByClient)) &&
													(!bp || (bp.signedByWarehouse && bp.signedByClient)) &&
													(!pagare || pagare.signedByClient);
												const isReady = hasAllDocs && allSigned && !asset.token;
												const hasPendingSignatures = hasAllDocs && !allSigned;

												switch (filter) {
													case "ready":
														return isReady;
													case "pending-signatures":
														return hasPendingSignatures;
													case "blocked":
														return deliveryStatus === AssetDeliveryStatus.RED && asset.status !== AssetStatus.BURNED;
													case "free":
														return deliveryStatus === AssetDeliveryStatus.GREEN && asset.status !== AssetStatus.BURNED;
													default:
														return true;
												}
											}).map((asset) => {
												const deliveryStatus = asset.deliveryStatus || 
													(asset.token ? AssetDeliveryStatus.RED : AssetDeliveryStatus.GREEN);
												
												return (
													<TableRow key={asset.id}>
														<TableCell className="font-medium font-mono">
															{asset.vinSerial || `Asset #${asset.id}`}
														</TableCell>
														<TableCell>
															{asset.description || "-"}
														</TableCell>
														<TableCell className="text-right font-semibold">
															${Number(asset.value)?.toLocaleString()}
														</TableCell>
														<TableCell className="text-center">
															{asset.location || "-"}
														</TableCell>
														<TableCell className="text-center">
															<Badge 
																variant={asset.status === AssetStatus.BURNED ? "destructive" : "outline"}
															>
																{asset.status}
															</Badge>
														</TableCell>
														<TableCell className="text-center">
															{asset.status !== AssetStatus.BURNED ? (
																<DeliveryStatusBadge status={deliveryStatus} />
															) : (
																<Badge variant="destructive">QUEMADO</Badge>
															)}
														</TableCell>
														<TableCell className="text-center">
															{asset.token ? (
																<Badge className="bg-blue-500">
																	<Coins className="h-3 w-3 mr-1" />
																	#{asset.token.id}
																</Badge>
															) : (
																<span className="text-muted-foreground text-sm">-</span>
															)}
														</TableCell>
														<TableCell className="text-center">
															<Link href={`/dashboard/assets/${asset.id}`}>
																<Button variant="ghost" size="sm">
																	<Eye className="h-4 w-4" />
																</Button>
															</Link>
															<Button 
																variant="ghost" 
																size="sm"
																onClick={() => setSelectedBundleForSignatures(asset.id)}
																title="Firmas"
															>
																<FileSignature className="h-4 w-4" />
															</Button>
														</TableCell>
													</TableRow>
												);
											})}
										</TableBody>
									</Table>
								</CardContent>
							</Card>
						)
					) : (
						<Card>
							<CardContent className="py-8">
								<div className="text-center">
									<Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
									<p className="text-muted-foreground">
										No hay Paquetes de Activos en esta operación
									</p>
								</div>
							</CardContent>
						</Card>
					)}
				</TabsContent>

				{/* Tab: Documentos */}
				<TabsContent value="documents" className="space-y-4">
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<div>
									<CardTitle>Documentos de Paquetes de Activos</CardTitle>
									<CardDescription>
										Estado de documentos por paquete. Gestiona individualmente desde el detalle de cada activo.
									</CardDescription>
								</div>
								{operationStatus?.assetBundles && (
									<Badge variant="outline">
										{operationStatus.assetBundles.length} bundle{operationStatus.assetBundles.length !== 1 ? 's' : ''}
									</Badge>
								)}
							</div>
						</CardHeader>
						<CardContent>
							{operationStatus?.assetBundles && operationStatus.assetBundles.length > 0 ? (
								<div className="space-y-3">
									{/* Resumen */}
									<div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg text-sm">
										<span className="text-muted-foreground">
											Completos: {operationStatus.assetBundles.filter((b: any) => {
												const asset = operation.assets?.find((a: any) => a.id === b.assetId);
												const docs = b.documents || {};
												const cd = docs.cd || asset?.documents?.find((d: any) => d.type === "CD");
												const bp = docs.bp || asset?.documents?.find((d: any) => d.type === "BP");
												return cd && bp;
											}).length} / {operationStatus.assetBundles.length}
										</span>
										<span className="text-muted-foreground">
											Incompletos: {operationStatus.assetBundles.filter((b: any) => {
												const asset = operation.assets?.find((a: any) => a.id === b.assetId);
												const docs = b.documents || {};
												const cd = docs.cd || asset?.documents?.find((d: any) => d.type === "CD");
												const bp = docs.bp || asset?.documents?.find((d: any) => d.type === "BP");
												return !cd || !bp;
											}).length}
										</span>
									</div>

									{/* Lista de Bundles */}
									{operationStatus.assetBundles.map((bundle: any) => {
										// Verificar documentos desde múltiples fuentes
										const asset = operation.assets?.find((a: any) => a.id === bundle.assetId);
										const docs = bundle.documents || {};
										const cd = docs.cd || asset?.documents?.find((d: any) => d.type === "CD");
										const bp = docs.bp || asset?.documents?.find((d: any) => d.type === "BP");
										const pagare = docs.pagare || asset?.documents?.find((d: any) => d.type === "PAGARE");
										const hasAllRequired = cd && bp;
										const missingDocs: string[] = [];
										if (!cd) missingDocs.push("CD");
										if (!bp) missingDocs.push("BP");

										return (
											<div
												key={bundle.assetId}
												className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors"
											>
												<div className="flex items-center justify-between">
													<div className="flex-1">
														<div className="flex items-center gap-2">
															<h4 className="font-medium">
																{bundle.vinSerial || `Asset #${bundle.assetId}`}
															</h4>
															{hasAllRequired ? (
																<Badge variant="default" className="bg-green-500">
																	<CheckCircle className="h-3 w-3 mr-1" />
																	Completo
																</Badge>
															) : (
																<Badge variant="destructive">
																	<XCircle className="h-3 w-3 mr-1" />
																	Incompleto
																</Badge>
															)}
														</div>
														{bundle.description && (
															<p className="text-sm text-muted-foreground mt-1">
																{bundle.description}
															</p>
														)}
													</div>
												</div>

												{/* Estado de documentos */}
												<div className="grid grid-cols-3 gap-3">
													<div className="flex items-center gap-2 p-2 border rounded">
														{cd ? (
															<CheckCircle className="h-4 w-4 text-green-500" />
														) : (
															<XCircle className="h-4 w-4 text-red-500" />
														)}
														<div className="flex-1">
															<p className="text-sm font-medium">CD</p>
															<p className="text-xs text-muted-foreground">
																{cd ? "Subido" : "Falta"}
															</p>
														</div>
													</div>
													<div className="flex items-center gap-2 p-2 border rounded">
														{bp ? (
															<CheckCircle className="h-4 w-4 text-green-500" />
														) : (
															<XCircle className="h-4 w-4 text-red-500" />
														)}
														<div className="flex-1">
															<p className="text-sm font-medium">BP</p>
															<p className="text-xs text-muted-foreground">
																{bp ? "Subido" : "Falta"}
															</p>
														</div>
													</div>
													<div className="flex items-center gap-2 p-2 border rounded">
														{pagare ? (
															<CheckCircle className="h-4 w-4 text-green-500" />
														) : (
															<div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
														)}
														<div className="flex-1">
															<p className="text-sm font-medium">Pagaré</p>
															<p className="text-xs text-muted-foreground">
																{pagare ? "Subido" : "Opcional"}
															</p>
														</div>
													</div>
												</div>

												{/* Alerta de documentos faltantes */}
												{missingDocs.length > 0 && (
													<Alert variant="destructive" className="py-2">
														<AlertCircle className="h-4 w-4" />
														<AlertDescription className="text-xs">
															Documentos faltantes: {missingDocs.join(", ")}
														</AlertDescription>
													</Alert>
												)}

												{/* Botón para ir a detalle */}
												<Button
													variant="outline"
													size="sm"
													className="w-full"
													onClick={() => {
														window.location.href = `/dashboard/assets/${bundle.assetId}?tab=documents`;
													}}
												>
													<FileText className="h-3 w-3 mr-2" />
													Gestionar Documentos
												</Button>
											</div>
										);
									})}
								</div>
							) : (
								<Alert>
									<AlertCircle className="h-4 w-4" />
									<AlertDescription>
										No hay Paquetes de Activos en esta operación.
									</AlertDescription>
								</Alert>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* Tab: Firmas */}
				<TabsContent value="signatures">
					<SignaturesSection
						operationId={operationId}
						bundle={bundle}
						assetBundles={operationStatus?.assetBundles || []}
					/>
				</TabsContent>

				{/* Tab: Tokenización */}
				<TabsContent value="tokenization">
					<TokenizationSection
						operationId={operationId}
						assets={operation.assets}
					/>
				</TabsContent>

				{/* Tab: Liberación */}
				{(isBank || isWarrant) && (
					<TabsContent value="release" className="space-y-4">
						<ReleaseLetterSection
							operationId={operationId}
							assets={operation.assets}
						/>
						<ReleaseSection
							operationId={operationId}
							assets={operation.assets}
						/>
					</TabsContent>
				)}
			</Tabs>

			{/* Dialog de Firmas */}
			<Dialog open={!!selectedBundleForSignatures} onOpenChange={(open) => !open && setSelectedBundleForSignatures(null)}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>Firmas del Paquete de Activos</DialogTitle>
					</DialogHeader>
					{selectedBundleForSignatures && (
						<AtomicAssetBundleSignatures
							assetId={selectedBundleForSignatures}
							operationId={operationId}
							onSuccess={() => {
								// Refrescar queries
								queryClient.invalidateQueries({ queryKey: ["operations", operationId] });
								queryClient.invalidateQueries({ queryKey: ["asset-token-bundles-status", operationId] });
								toast.success("Firmas actualizadas");
								setSelectedBundleForSignatures(null);
							}}
						/>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
