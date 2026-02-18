"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { DeliveryStatusBadge } from "@/components/operations/delivery-status-badge";
import { AssetTokenBundleCard } from "@/components/operations/asset-token-bundle-card";
import { AssetBundleDocumentManager } from "@/components/assets/asset-bundle-document-manager";
import { AssetBundleSignatures } from "@/components/assets/asset-bundle-signatures";
import { AssetBundleActions } from "@/components/assets/asset-bundle-actions";
import { AssetBundleReleaseLetter } from "@/components/assets/asset-bundle-release-letter";
import { assetsApi } from "@/lib/api/assets";
import { operationsApi } from "@/lib/api/operations";
import { useAuth } from "@/lib/auth/auth-context";
import { toast } from "sonner";
import {
	ArrowLeft,
	Package,
	AlertCircle,
	Loader2,
	FileText,
	FileSignature,
	Shield,
	Unlock,
	Hash,
	MapPin,
	DollarSign,
	Calendar,
	Building2,
	Coins,
	CheckCircle,
	XCircle,
	Copy,
} from "lucide-react";
import { AssetDeliveryStatus, AssetStatus } from "@/types/asset";

export default function AssetDetailPage() {
	const params = useParams();
	const router = useRouter();
	const { user } = useAuth();
	const assetId = parseInt(params.id as string);

	const { data: asset, isLoading } = useQuery({
		queryKey: ["asset", assetId],
		queryFn: () => assetsApi.getById(assetId),
		enabled: !!assetId,
	});

	// Obtener estado del bundle
	const { data: bundleStatus } = useQuery({
		queryKey: ["asset-bundle", assetId, "status"],
		queryFn: () => operationsApi.getAssetTokenBundleStatus(assetId),
		enabled: !!assetId,
	});

	// Determinar permisos
	const isWarrant = user?.organizations?.some((org) => org.type === "WAREHOUSE");
	const isClient = user?.organizations?.some((org) => org.type === "CLIENT");
	const isBank = user?.organizations?.some((org) => org.type === "BANK");

	const validation = bundleStatus?.validation;
	const isReady = validation?.valid ?? false;
	const missingComponents = validation?.missingComponents ?? [];

	// Determinar etapa actual del ciclo de vida
	const getLifecycleStage = () => {
		if (!asset) return null;
		
		if (asset.status === AssetStatus.BURNED || asset.status === AssetStatus.DELIVERED) {
			return { stage: "RELEASED", progress: 100, label: "Liberado" };
		}
		if (asset.token) {
			return { stage: "TOKENIZED", progress: 85, label: "Tokenizado" };
		}
		if (validation?.cdSignedByWarehouse && validation?.cdSignedByClient &&
			validation?.bpSignedByWarehouse && validation?.bpSignedByClient) {
			return { stage: "DOCUMENTS_SIGNED", progress: 60, label: "Documentos Firmados" };
		}
		if (validation?.cdExists && validation?.bpExists) {
			return { stage: "DOCUMENTS_UPLOADED", progress: 35, label: "Documentos Subidos" };
		}
		return { stage: "PENDING", progress: 10, label: "Creado" };
	};

	const lifecycleInfo = getLifecycleStage();

	if (isLoading) {
		return (
			<div className="space-y-6">
				<Skeleton className="h-12 w-full" />
				<Skeleton className="h-64 w-full" />
			</div>
		);
	}

	if (!asset) {
		return (
			<Card>
				<CardContent className="py-8">
					<Alert>
						<AlertCircle className="h-4 w-4" />
						<AlertDescription>Activo no encontrado</AlertDescription>
					</Alert>
				</CardContent>
			</Card>
		);
	}

	const deliveryStatus = asset.deliveryStatus || 
		(asset.token && asset.status !== AssetStatus.BURNED 
			? AssetDeliveryStatus.RED 
			: AssetDeliveryStatus.GREEN);

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center gap-4">
				<Button
					variant="ghost"
					size="icon"
					onClick={() => router.back()}
				>
					<ArrowLeft className="h-5 w-5" />
				</Button>
				<div className="flex-1">
					<h2 className="text-3xl font-bold flex items-center gap-3">
						<Package className="h-8 w-8" />
						{asset.vinSerial}
					</h2>
					<p className="text-slate-500 dark:text-slate-400">
						Paquete de Activos #{asset.id}
					</p>
				</div>
				<div className="flex items-center gap-3">
					{asset.status !== AssetStatus.BURNED && (
						<DeliveryStatusBadge status={deliveryStatus} />
					)}
					<Badge 
						variant={asset.status === AssetStatus.BURNED ? "destructive" : "outline"}
					>
						{asset.status}
					</Badge>
				</div>
			</div>

			{/* Progreso del Ciclo de Vida */}
				<Card>
				<CardContent className="pt-6">
					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<div>
								<h3 className="font-semibold">Ciclo de Vida del Bundle</h3>
								<p className="text-sm text-muted-foreground">
									{lifecycleInfo?.label}
								</p>
							</div>
							<Badge variant="secondary">{lifecycleInfo?.progress}%</Badge>
						</div>
						<Progress value={lifecycleInfo?.progress} className="h-2" />
							</div>
				</CardContent>
			</Card>

			{/* Información General */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
							<Hash className="h-4 w-4" />
							ID Interno
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold">#{asset.id}</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
							<DollarSign className="h-4 w-4" />
							Valor
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold">${Number(asset.value)?.toLocaleString()}</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
							<MapPin className="h-4 w-4" />
							Ubicación
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-lg font-medium">{asset.location || "No especificada"}</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
							<Package className="h-4 w-4" />
							Cantidad
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold">{asset.quantity || 1}</p>
					</CardContent>
				</Card>
			</div>

			{/* Información del Asset */}
			<Card>
				<CardHeader>
					<CardTitle>Información del Activo</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<span className="text-sm text-muted-foreground">VIN/Serial/Chasis</span>
							<p className="font-medium font-mono">{asset.vinSerial}</p>
								</div>
						{asset.description && (
							<div>
								<span className="text-sm text-muted-foreground">Descripción</span>
								<p className="font-medium">{asset.description}</p>
							</div>
								)}
								<div>
							<span className="text-sm text-muted-foreground">Warehouse</span>
							<p className="font-medium">{asset.warehouse?.name || "-"}</p>
															</div>
						<div>
							<span className="text-sm text-muted-foreground">Cliente</span>
							<p className="font-medium">{asset.client?.name || "-"}</p>
															</div>
						{asset.operationId && (
							<div>
								<span className="text-sm text-muted-foreground">Operación</span>
															<Button
									variant="link"
									className="p-0 h-auto font-medium"
									onClick={() => router.push(`/dashboard/operations/${asset.operationId}`)}
								>
									Ver Operación #{asset.operationId}
															</Button>
								</div>
						)}
						<div>
							<span className="text-sm text-muted-foreground">Fecha de Creación</span>
							<p className="font-medium">
								{new Date(asset.createdAt).toLocaleDateString()}
										</p>
									</div>
					</div>
					</CardContent>
				</Card>

			{/* Tabs de Gestión */}
			<Tabs defaultValue="documents" className="space-y-4">
				<TabsList>
					<TabsTrigger value="documents" className="flex items-center gap-2">
						<FileText className="h-4 w-4" />
						Documentos
					</TabsTrigger>
					<TabsTrigger value="signatures" className="flex items-center gap-2">
						<FileSignature className="h-4 w-4" />
						Firmas
					</TabsTrigger>
					<TabsTrigger value="hashes" className="flex items-center gap-2">
						<Hash className="h-4 w-4" />
						Hashes
					</TabsTrigger>
					<TabsTrigger value="actions" className="flex items-center gap-2">
						<Shield className="h-4 w-4" />
						Acciones
					</TabsTrigger>
					{(isBank || isWarrant) && (
						<TabsTrigger value="release" className="flex items-center gap-2">
							<Unlock className="h-4 w-4" />
							Liberación
						</TabsTrigger>
					)}
					<TabsTrigger value="overview" className="flex items-center gap-2">
						<Package className="h-4 w-4" />
						Vista General
					</TabsTrigger>
				</TabsList>

				{/* Tab: Documentos */}
				<TabsContent value="documents">
					<AssetBundleDocumentManager
						assetId={assetId}
						operationId={asset.operationId}
						canUpload={isWarrant}
						onDocumentUploaded={() => {
							// Refrescar queries
						}}
					/>
				</TabsContent>

				{/* Tab: Firmas */}
				<TabsContent value="signatures">
					<AssetBundleSignatures
						assetId={assetId}
						operationId={asset.operationId || 0}
						canRequestSignatures={isWarrant || isBank}
					/>
				</TabsContent>

				{/* Tab: Hashes */}
				<TabsContent value="hashes">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Hash className="h-5 w-5" />
								Hashes de Documentos y Merkle Root
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							{/* Hash del CD */}
							{bundleStatus?.documents?.cd?.pdfHash && (
								<div className="space-y-2">
									<div className="flex items-center justify-between">
										<span className="text-sm font-medium">Hash del Certificado de Depósito (CD)</span>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => {
												navigator.clipboard.writeText(bundleStatus.documents.cd.pdfHash);
												toast.success("Hash copiado al portapapeles");
											}}
										>
											<Copy className="h-4 w-4" />
										</Button>
									</div>
									<code className="block p-3 bg-muted rounded-md text-xs font-mono break-all">
										{bundleStatus.documents.cd.pdfHash}
									</code>
								</div>
							)}

							{/* Hash del BP */}
							{bundleStatus?.documents?.bp?.pdfHash && (
								<div className="space-y-2">
									<div className="flex items-center justify-between">
										<span className="text-sm font-medium">Hash del Bono de Prenda (BP)</span>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => {
												navigator.clipboard.writeText(bundleStatus.documents.bp.pdfHash);
												toast.success("Hash copiado al portapapeles");
											}}
										>
											<Copy className="h-4 w-4" />
										</Button>
									</div>
									<code className="block p-3 bg-muted rounded-md text-xs font-mono break-all">
										{bundleStatus.documents.bp.pdfHash}
									</code>
								</div>
							)}

							{/* Hash del Pagaré (si existe) */}
							{bundleStatus?.documents?.pagare?.pdfHash && (
								<div className="space-y-2">
									<div className="flex items-center justify-between">
										<span className="text-sm font-medium">Hash del Pagaré</span>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => {
												navigator.clipboard.writeText(bundleStatus.documents.pagare.pdfHash);
												toast.success("Hash copiado al portapapeles");
											}}
										>
											<Copy className="h-4 w-4" />
										</Button>
									</div>
									<code className="block p-3 bg-muted rounded-md text-xs font-mono break-all">
										{bundleStatus.documents.pagare.pdfHash}
									</code>
								</div>
							)}

							{/* Merkle Root */}
							{asset.token?.metadataHash && (
								<div className="space-y-2 pt-4 border-t">
									<div className="flex items-center justify-between">
										<span className="text-sm font-medium">Merkle Root (Hash Completo del Bundle)</span>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => {
												if (asset.token?.metadataHash) {
													navigator.clipboard.writeText(asset.token.metadataHash);
													toast.success("Merkle Root copiado al portapapeles");
												}
											}}
										>
											<Copy className="h-4 w-4" />
										</Button>
									</div>
									<code className="block p-3 bg-primary/10 rounded-md text-xs font-mono break-all border border-primary/20">
										{asset.token.metadataHash}
									</code>
									<p className="text-xs text-muted-foreground">
										Este hash representa la integridad completa del bundle (CD + BP + Pagaré si existe)
									</p>
								</div>
							)}

							{!bundleStatus?.documents?.cd?.pdfHash && !bundleStatus?.documents?.bp?.pdfHash && !asset.token?.metadataHash && (
								<Alert>
									<AlertCircle className="h-4 w-4" />
									<AlertDescription>
										No hay hashes disponibles. Los documentos deben estar subidos y el activo debe estar tokenizado para ver el Merkle Root.
									</AlertDescription>
								</Alert>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* Tab: Acciones */}
				<TabsContent value="actions">
					<AssetBundleActions
						asset={asset}
						isReady={isReady}
						missingComponents={missingComponents}
						onActionComplete={() => {
							// Refrescar queries
						}}
					/>
				</TabsContent>

				{/* Tab: Liberación */}
				{(isBank || isWarrant) && asset.operationId && (
					<TabsContent value="release">
						<AssetBundleReleaseLetter
							assetId={assetId}
							operationId={asset.operationId}
							canUpload={isBank}
							canApprove={isWarrant}
						/>
					</TabsContent>
				)}

				{/* Tab: Vista General (Card Completa) */}
				<TabsContent value="overview">
					<AssetTokenBundleCard
						asset={asset}
						operationId={asset.operationId || 0}
						canTokenize={isReady && !asset.token}
						canRelease={asset.token && !!(asset.status === AssetStatus.PLEDGED || asset.status === AssetStatus.STORED)}
						compact={false}
					/>
				</TabsContent>
			</Tabs>
		</div>
	);
}
