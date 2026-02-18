"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Asset, AssetDeliveryStatus, AssetStatus } from "@/types/asset";
import { operationsApi } from "@/lib/api/operations";
import { AssetDocumentUploader } from "@/components/assets/asset-document-uploader";
import { TokenizeButton } from "@/components/shared/tokenize-button";
import { toast } from "sonner";
import { BundleValidationStatus } from "./bundle-validation-status";
import {
	Package,
	CheckCircle,
	XCircle,
	AlertCircle,
	Loader2,
	Coins,
	FileText,
	FileCheck,
	FileX,
	ChevronDown,
	ChevronUp,
	Upload,
	FileSignature,
	Unlock,
	Circle,
	ArrowRight,
	Eye,
	User,
	ExternalLink,
} from "lucide-react";
import Link from "next/link";

interface AssetTokenBundleCardProps {
	asset: Asset;
	operationId: number;
	onTokenize?: (assetId: number) => void;
	onSelect?: (assetId: number, selected: boolean) => void;
	selected?: boolean;
	canTokenize?: boolean;
	canRelease?: boolean;
	compact?: boolean;
	onSignaturesClick?: () => void;
}

/**
 * Ciclo de vida del Paquete de Activos:
 * 1. PENDING - Bundle creado, sin documentos
 * 2. DOCUMENTS_UPLOADED - Documentos subidos (CD, BP, Pagaré opcional)
 * 3. DOCUMENTS_SIGNED - Todos los documentos firmados
 * 4. TOKENIZED - Token minteado en XRPL
 * 5. RELEASED - Token quemado, activo liberado
 */
type BundleLifecycleStage = 
	| "PENDING"
	| "DOCUMENTS_UPLOADED"
	| "DOCUMENTS_SIGNED"
	| "TOKENIZED"
	| "RELEASED";

const LIFECYCLE_STAGES: { id: BundleLifecycleStage; label: string; icon: any }[] = [
	{ id: "PENDING", label: "Creado", icon: Package },
	{ id: "DOCUMENTS_UPLOADED", label: "Docs", icon: FileText },
	{ id: "DOCUMENTS_SIGNED", label: "Firmado", icon: FileSignature },
	{ id: "TOKENIZED", label: "Tokenizado", icon: Coins },
	{ id: "RELEASED", label: "Liberado", icon: Unlock },
];

/**
 * AssetTokenBundleCard
 * 
 * Representa un Paquete de Activos completo con su ciclo de vida:
 * Paquete de Activos = Activo + Documentos (CD, BP, Pagaré opcional) + Token
 * 
 * Muestra:
 * - Semáforo de entrega (RED/GREEN)
 * - Timeline del ciclo de vida
 * - Checklist de documentos y firmas
 * - Acciones según la etapa actual
 */
export function AssetTokenBundleCard({
	asset,
	operationId,
	onTokenize,
	onSelect,
	selected = false,
	canTokenize = false,
	canRelease = false,
	compact = false,
	onSignaturesClick,
}: AssetTokenBundleCardProps) {
	const queryClient = useQueryClient();
	const [isExpanded, setIsExpanded] = useState(!compact);
	const [isValidating, setIsValidating] = useState(false);

	// Obtener estado de validación del Paquete de Activos
	const { data: bundleStatus, isLoading: isLoadingStatus } = useQuery({
		queryKey: ["asset-token-bundle", asset.id, "status"],
		queryFn: () => operationsApi.getAssetTokenBundleStatus(asset.id),
		enabled: !!asset.id,
		refetchInterval: 30000,
		refetchOnWindowFocus: true,
	});

	// Validar Paquete de Activos
	const validateMutation = useMutation({
		mutationFn: () => operationsApi.validateAssetTokenBundle(asset.id),
		onSuccess: (data) => {
			if (data.ready) {
				toast.success(`Bundle ${asset.vinSerial} listo para tokenizar`);
			} else {
				toast.warning(
					`Bundle ${asset.vinSerial} incompleto: ${data.missingComponents?.join(", ") || "Documentos o firmas pendientes"}`
				);
			}
			queryClient.invalidateQueries({
				queryKey: ["asset-token-bundle", asset.id],
			});
		},
		onError: (error: any) => {
			toast.error(
				error.response?.data?.message || "Error al validar bundle"
			);
		},
		onSettled: () => {
			setIsValidating(false);
		},
	});

	const validation = bundleStatus?.validation;
	const documents = bundleStatus?.documents;
	
	// Verificar existencia de documentos desde múltiples fuentes
	// El backend devuelve documents.cd/bp/pagare como null si no existe, o un objeto si existe
	// validation.cdExists se basa en cd.isUploaded, pero debemos verificar la existencia real
	const cdExists = validation?.cdExists ?? (documents?.cd !== null && documents?.cd !== undefined);
	const bpExists = validation?.bpExists ?? (documents?.bp !== null && documents?.bp !== undefined);
	const pagareExists = validation?.pagareExists ?? (documents?.pagare !== null && documents?.pagare !== undefined);
	
	// Determinar si está listo para tokenizar:
	// - CD y BP deben existir y estar firmados
	// - Pagaré es OPCIONAL: OK si no existe, o si existe debe estar firmado por cliente
	const calculateIsReady = () => {
		// Si no hay validación, verificar documentos directamente
		if (!validation && !documents) return false;
		
		// Verificar CD
		const cdOk = cdExists && 
			(validation?.cdSignedByWarehouse ?? documents?.cd?.signedByWarehouse) && 
			(validation?.cdSignedByClient ?? documents?.cd?.signedByClient);
		
		// Verificar BP
		const bpOk = bpExists && 
			(validation?.bpSignedByWarehouse ?? documents?.bp?.signedByWarehouse) && 
			(validation?.bpSignedByClient ?? documents?.bp?.signedByClient);
		
		// Pagaré es opcional: válido si no existe O si existe y está firmado
		const pagareOk = !pagareExists || 
			(validation?.pagareSignedByClient ?? documents?.pagare?.signedByClient);
		
		return cdOk && bpOk && pagareOk;
	};
	
	const isReady = calculateIsReady();
	const missingComponents = validation?.missingComponents ?? [];

	// Determinar etapa actual del ciclo de vida
	const getLifecycleStage = (): BundleLifecycleStage => {
		if (asset.status === AssetStatus.BURNED || asset.status === AssetStatus.DELIVERED) {
			return "RELEASED";
		}
		if (asset.token) {
			return "TOKENIZED";
		}
		
		// Verificar firmas desde múltiples fuentes
		const cdSigned = (validation?.cdSignedByWarehouse ?? documents?.cd?.signedByWarehouse) && 
			(validation?.cdSignedByClient ?? documents?.cd?.signedByClient);
		const bpSigned = (validation?.bpSignedByWarehouse ?? documents?.bp?.signedByWarehouse) && 
			(validation?.bpSignedByClient ?? documents?.bp?.signedByClient);
		
		if (cdSigned && bpSigned) {
			return "DOCUMENTS_SIGNED";
		}
		if (cdExists && bpExists) {
			return "DOCUMENTS_UPLOADED";
		}
		return "PENDING";
	};

	const currentStage = getLifecycleStage();
	const currentStageIndex = LIFECYCLE_STAGES.findIndex(s => s.id === currentStage);

	// Calcular progreso
	const getProgress = (): number => {
		const stageProgress: Record<BundleLifecycleStage, number> = {
			PENDING: 10,
			DOCUMENTS_UPLOADED: 35,
			DOCUMENTS_SIGNED: 60,
			TOKENIZED: 85,
			RELEASED: 100,
		};
		return stageProgress[currentStage];
	};

	// Semáforo
	const deliveryStatus = asset.deliveryStatus || 
		(asset.token && asset.status !== AssetStatus.BURNED ? AssetDeliveryStatus.RED : AssetDeliveryStatus.GREEN);

	const handleValidate = () => {
		setIsValidating(true);
		validateMutation.mutate();
	};

	// Renderizar semáforo (no mostrar si el activo está quemado)
	const renderSemaphore = () => {
		// No mostrar semáforo si el activo está quemado
		if (asset.status === AssetStatus.BURNED) {
			return null;
		}
		
		return (
			<div className="flex items-center gap-1.5">
				<div className="relative">
					<Circle
						className={`h-3.5 w-3.5 ${
							deliveryStatus === AssetDeliveryStatus.RED
								? "fill-red-500 text-red-500"
								: "fill-green-500 text-green-500"
						}`}
					/>
					{deliveryStatus === AssetDeliveryStatus.RED && (
						<Circle
							className="absolute inset-0 h-3.5 w-3.5 fill-red-500 text-red-500 animate-ping opacity-75"
						/>
					)}
				</div>
				<span className={`text-xs font-medium ${
					deliveryStatus === AssetDeliveryStatus.RED ? "text-red-600" : "text-green-600"
				}`}>
					{deliveryStatus === AssetDeliveryStatus.RED ? "BLOQUEADO" : "LIBRE"}
				</span>
			</div>
		);
	};

	// Renderizar timeline compacto
	// Timeline minimalista con solo íconos
	const renderMinimalTimeline = () => (
		<div className="flex items-center justify-between gap-1">
			{LIFECYCLE_STAGES.map((stage, index) => {
				const isCompleted = index < currentStageIndex;
				const isCurrent = index === currentStageIndex;
				const StageIcon = stage.icon;
				
				return (
					<div
						key={stage.id}
						className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
							isCompleted
								? "bg-green-500 text-white"
								: isCurrent
								? "bg-primary text-primary-foreground"
								: "bg-muted text-muted-foreground"
						}`}
						title={stage.label}
					>
						{isCompleted ? (
							<CheckCircle className="h-4 w-4" />
						) : (
							<StageIcon className="h-4 w-4" />
						)}
					</div>
				);
			})}
		</div>
	);

	// Vista compacta
	if (compact) {
		return (
			<Card 
				className={`${selected ? "ring-2 ring-primary" : ""} hover:shadow-md transition-shadow cursor-pointer`}
				onClick={() => setIsExpanded(!isExpanded)}
			>
				<CardContent className="p-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							{onSelect && (
								<Checkbox
									checked={selected}
									onCheckedChange={(checked) => {
										onSelect?.(asset.id, checked as boolean);
									}}
									onClick={(e) => e.stopPropagation()}
								/>
							)}
							<div className="flex-1">
								<div className="flex items-center gap-2 flex-wrap">
									<Package className="h-4 w-4 text-muted-foreground" />
									<span className="font-medium">{asset.vinSerial}</span>
									{/* Badges de estado */}
									{isReady && !asset.token && (
										<Badge className="bg-green-500 text-xs">
											<CheckCircle className="h-3 w-3 mr-1" />
											Listo
										</Badge>
									)}
									{cdExists && bpExists && !isReady && (
										<Badge variant="secondary" className="bg-yellow-500 text-xs">
											<FileSignature className="h-3 w-3 mr-1" />
											Firmas pendientes
										</Badge>
									)}
									{(!cdExists || !bpExists) && (
										<Badge variant="destructive" className="text-xs">
											<XCircle className="h-3 w-3 mr-1" />
											Docs faltantes
										</Badge>
									)}
									{asset.token && (
										<Badge className="bg-blue-500 text-xs">
											<Coins className="h-3 w-3 mr-1" />
											Tokenizado
										</Badge>
									)}
								</div>
								{asset.description && (
									<p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
										{asset.description}
									</p>
								)}
								{asset.token && (
									<div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
										<User className="h-3 w-3" />
										<span>En posesión de: <span className="font-medium text-foreground">{asset.token.currentHolderWallet?.publicAddress?.slice(0, 10) || "Cliente"}...</span></span>
									</div>
								)}
							</div>
						</div>
						<div className="flex items-center gap-3">
							{renderSemaphore()}
							<Badge variant="secondary" className="text-xs">
								${asset.value?.toLocaleString()}
							</Badge>
							{isExpanded ? (
								<ChevronUp className="h-4 w-4 text-muted-foreground" />
							) : (
								<ChevronDown className="h-4 w-4 text-muted-foreground" />
							)}
						</div>
					</div>
					
					{/* Timeline minimalista + Progreso */}
					<div className="mt-3 space-y-2">
						{renderMinimalTimeline()}
						<Progress value={getProgress()} className="h-1" />
					</div>

					{/* Acciones rápidas */}
					<div className="flex items-center gap-2 mt-3">
						<AssetDocumentUploader
							assetId={asset.id}
							operationId={operationId}
							canUpload={true}
							trigger={
								<Button variant="outline" size="sm" className="flex-1" onClick={(e) => e.stopPropagation()}>
									<FileText className="h-3 w-3 mr-1" />
									Documentos
									{isReady && <CheckCircle className="h-3 w-3 ml-1 text-green-500" />}
								</Button>
							}
						/>

						{/* Botón de firmas */}
						<Button 
							variant="outline" 
							size="sm" 
							className="flex-1" 
							onClick={(e) => {
								e.stopPropagation();
								onSignaturesClick?.();
							}}
						>
							<FileSignature className="h-3 w-3 mr-1" />
							Firmas
							{((validation?.cdSignedByWarehouse ?? documents?.cd?.signedByWarehouse) && 
							  (validation?.cdSignedByClient ?? documents?.cd?.signedByClient) && 
							  (validation?.bpSignedByWarehouse ?? documents?.bp?.signedByWarehouse) && 
							  (validation?.bpSignedByClient ?? documents?.bp?.signedByClient)) && (
								<CheckCircle className="h-3 w-3 ml-1 text-green-500" />
							)}
						</Button>
						
						{canTokenize && !asset.token && isReady && (
							<div onClick={(e) => e.stopPropagation()} className="flex-1">
								<TokenizeButton
									assetId={asset.id}
									operationId={operationId}
									assetVinSerial={asset.vinSerial || asset.description || `Asset #${asset.id}`}
									disabled={false}
									onSuccess={() => onTokenize?.(asset.id)}
									variant="default"
									size="sm"
									className="w-full"
								/>
							</div>
						)}
						
						{asset.token && (
							<Link href={`/dashboard/tokens/${asset.token.id}`}>
								<Button
									variant="outline"
									size="sm"
									className="flex-1 justify-center bg-blue-500 hover:bg-blue-600 text-white border-blue-500"
								>
									<Coins className="h-3 w-3 mr-1" />
									Token #{asset.token.id}
									<ExternalLink className="h-3 w-3 ml-1" />
								</Button>
							</Link>
						)}
					</div>
				</CardContent>
			</Card>
		);
	}

	// Vista expandida completa
	return (
		<Card className={`${selected ? "ring-2 ring-primary" : ""}`}>
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						{onSelect && (
							<Checkbox
								checked={selected}
								onCheckedChange={(checked) =>
									onSelect?.(asset.id, checked as boolean)
								}
							/>
						)}
						<Package className="h-5 w-5 text-muted-foreground" />
						<CardTitle className="text-lg">
							{asset.vinSerial}
						</CardTitle>
					</div>
					<div className="flex items-center gap-3">
						{renderSemaphore()}
						<Badge 
							variant={asset.status === AssetStatus.BURNED ? "destructive" : "outline"}
						>
							{asset.status}
						</Badge>
					</div>
				</div>
				{asset.description && (
					<p className="text-sm text-muted-foreground mt-1">
						{asset.description}
					</p>
				)}
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Progreso + Timeline minimalista */}
				<div className="space-y-3">
					{renderMinimalTimeline()}
					<div>
						<Progress value={getProgress()} className="h-2" />
						<div className="flex justify-between text-xs text-muted-foreground mt-1">
							<span>{LIFECYCLE_STAGES[currentStageIndex].label}</span>
							<span>{getProgress()}%</span>
						</div>
					</div>
				</div>

				{/* Información del activo */}
				<div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg">
					<div>
						<span className="text-xs text-muted-foreground">Valor</span>
						<p className="font-medium">${asset.value?.toLocaleString()}</p>
					</div>
					{asset.quantity && asset.quantity > 1 && (
						<div>
							<span className="text-xs text-muted-foreground">Cantidad</span>
							<p className="font-medium">{asset.quantity}</p>
						</div>
					)}
					{asset.location && (
						<div>
							<span className="text-xs text-muted-foreground">Ubicación</span>
							<p className="font-medium">{asset.location}</p>
						</div>
					)}
					{asset.token && (
						<div>
							<span className="text-xs text-muted-foreground">Token</span>
							<Link href={`/dashboard/tokens/${asset.token.id}`}>
								<Button
									variant="ghost"
									size="sm"
									className="p-0 h-auto font-medium font-mono text-xs text-primary hover:underline"
								>
									#{asset.token.id} - {asset.token.xrplTokenId?.slice(0, 8)}...
									<ExternalLink className="h-3 w-3 ml-1" />
								</Button>
							</Link>
						</div>
					)}
				</div>

				{/* Gestión de documentos con componente reutilizable */}
				<div className="flex gap-2">
					<AssetDocumentUploader
						assetId={asset.id}
						operationId={operationId}
						canUpload={!asset.token}
					/>
					
					{validation?.merkleRootCalculated && (
						<Badge variant="outline" className="flex items-center gap-1">
							<CheckCircle className="h-3 w-3 text-green-500" />
							Merkle Root
						</Badge>
					)}
				</div>

				{/* Mensajes de error/validación - Reemplazado por componente visual */}
				{!asset.token && !isReady && (validation || documents) && (
					<BundleValidationStatus 
						validation={{
							cdExists,
							bpExists,
							pagareExists: pagareExists ?? null,
							cdSignedByWarehouse: validation?.cdSignedByWarehouse ?? documents?.cd?.signedByWarehouse ?? false,
							cdSignedByClient: validation?.cdSignedByClient ?? documents?.cd?.signedByClient ?? false,
							bpSignedByWarehouse: validation?.bpSignedByWarehouse ?? documents?.bp?.signedByWarehouse ?? false,
							bpSignedByClient: validation?.bpSignedByClient ?? documents?.bp?.signedByClient ?? false,
							pagareSignedByClient: validation?.pagareSignedByClient ?? documents?.pagare?.signedByClient ?? false,
							pagareSignedByBank: validation?.pagareSignedByBank ?? documents?.pagare?.signedByBank ?? false,
							merkleRootCalculated: validation?.merkleRootCalculated ?? !!bundleStatus?.merkleRoot,
						}} 
					/>
				)}

				{/* Acciones */}
				<div className="flex gap-2 pt-2 border-t">
					<Button
						variant="outline"
						size="sm"
						onClick={onSignaturesClick}
					>
						<FileSignature className="h-4 w-4 mr-1" />
						Firmas
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={handleValidate}
						disabled={isValidating || validateMutation.isPending}
					>
						{isValidating || validateMutation.isPending ? (
							<Loader2 className="h-4 w-4 animate-spin mr-1" />
						) : (
							<Eye className="h-4 w-4 mr-1" />
						)}
						Validar
					</Button>
					
					{canTokenize && !asset.token && (
						<TokenizeButton
							assetId={asset.id}
							operationId={operationId}
							assetVinSerial={asset.vinSerial || asset.description || `Asset #${asset.id}`}
							disabled={!isReady}
							onSuccess={() => onTokenize?.(asset.id)}
							variant="default"
							size="sm"
						/>
					)}

					{asset.token && (
						<Badge variant="outline" className="flex items-center gap-1 ml-auto">
							<Coins className="h-3 w-3" />
							Tokenizado
						</Badge>
					)}

					{canRelease && asset.token && currentStage === "TOKENIZED" && (
						<Button
							variant="secondary"
							size="sm"
						>
							<Unlock className="h-4 w-4 mr-1" />
							Liberar
						</Button>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
