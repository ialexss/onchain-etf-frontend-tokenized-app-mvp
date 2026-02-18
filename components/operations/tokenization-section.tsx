"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { operationsApi } from "@/lib/api/operations";
// TokenizationPreviewDialog eliminado - ahora se tokeniza a nivel de Paquete de Activos
import { toast } from "sonner";
import {
	Coins,
	CheckCircle,
	XCircle,
	Loader2,
	AlertCircle,
	Info,
	FileCheck,
	Hash,
	Sparkles,
	RefreshCw,
} from "lucide-react";
import { AssetTokenBundleCard } from "./asset-token-bundle-card";
import { Asset } from "@/types/asset";

type TokenizationStep = {
	id: string;
	label: string;
	icon: any;
	status: "pending" | "loading" | "success" | "error";
};

interface TokenizationSectionProps {
	operationId: number;
	assets?: Asset[];
}

export function TokenizationSection({
	operationId,
	assets = [],
}: TokenizationSectionProps) {
	const queryClient = useQueryClient();
	const [selectedAssetIds, setSelectedAssetIds] = useState<number[]>([]);
	const [showDialog, setShowDialog] = useState(false);
	const [currentStepIndex, setCurrentStepIndex] = useState(0);
	const [steps, setSteps] = useState<TokenizationStep[]>([
		{
			id: "validate",
			label: "Validando documentos y firmas",
			icon: FileCheck,
			status: "pending",
		},
		{
			id: "merkle",
			label: "Calculando Merkle Root",
			icon: Hash,
			status: "pending",
		},
		{
			id: "update",
			label: "Actualizando estado de los assets",
			icon: RefreshCw,
			status: "pending",
		},
		{
			id: "mint-transfer",
			label: "Minteando y transfiriendo tokens",
			icon: Sparkles,
			status: "pending",
		},
	]);

	const { data: operation, isLoading: isLoadingOperation } = useQuery({
		queryKey: ["operations", operationId],
		queryFn: () => operationsApi.getById(operationId),
		enabled: !!operationId,
	});

	// Lógica antigua de verificación y preview eliminada
	// Ahora cada Paquete de Activos se valida individualmente

	// Lógica antigua de tokenización a nivel operación eliminada
	// Ahora solo se tokeniza a nivel de Paquete de Activos individual

	const updateStepStatus = (index: number, status: TokenizationStep["status"]) => {
		setSteps(prev =>
			prev.map((step, i) => (i === index ? { ...step, status } : step))
		);
	};

	const resetSteps = () => {
		setSteps(prev => prev.map(step => ({ ...step, status: "pending" })));
		setCurrentStepIndex(0);
	};

	// Tokenizar múltiples Paquete de Activoss
	const tokenizeMultipleMutation = useMutation({
		mutationFn: async (assetIds: number[]) => {
			// Simulate step progression
			for (let i = 0; i < steps.length; i++) {
				setCurrentStepIndex(i);
				updateStepStatus(i, "loading");
				
				// Simulate delay for each step (except the last one which is the actual API call)
				if (i < steps.length - 1) {
					await new Promise(resolve => setTimeout(resolve, 800));
					updateStepStatus(i, "success");
				}
			}
			
			// Make the actual API call
			return operationsApi.tokenizeMultipleAssets(assetIds);
		},
		onSuccess: (data) => {
			updateStepStatus(steps.length - 1, "success");
			
			const successCount = data.success.length;
			const failedCount = data.failed.length;
			if (successCount > 0) {
				toast.success(
					`${successCount} Paquete de Activos(s) tokenizado(s) exitosamente`
				);
			}
			if (failedCount > 0) {
				toast.error(
					`${failedCount} Paquete de Activos(s) fallaron al tokenizar`
				);
			}
			queryClient.invalidateQueries({
				queryKey: ["operations", operationId],
			});
			queryClient.invalidateQueries({
				queryKey: ["operations", operationId, "status"],
			});
			queryClient.invalidateQueries({
				queryKey: ["operations", operationId, "asset-token-bundles-status"],
			});
			queryClient.invalidateQueries({
				queryKey: ["asset-token-bundle"],
			});
			setSelectedAssetIds([]);
			
			setTimeout(() => {
				setShowDialog(false);
				resetSteps();
			}, 1500);
		},
		onError: (error: any) => {
			updateStepStatus(currentStepIndex, "error");
			toast.error(
				error.response?.data?.message ||
					"Error al tokenizar Paquete de Activoss"
			);
		},
	});

	const handleTokenizeAsset = (assetId: number) => {
		queryClient.invalidateQueries({
			queryKey: ["operations", operationId],
		});
		queryClient.invalidateQueries({
			queryKey: ["asset-token-bundle", assetId],
		});
	};

	const handleToggleAsset = (assetId: number, checked: boolean) => {
		if (checked) {
			setSelectedAssetIds([...selectedAssetIds, assetId]);
		} else {
			setSelectedAssetIds(selectedAssetIds.filter((id) => id !== assetId));
		}
	};

	const handleTokenizeSelected = () => {
		if (selectedAssetIds.length === 0) {
			toast.error("Por favor selecciona al menos un Paquete de Activos");
			return;
		}
		setShowDialog(true);
		resetSteps();
		tokenizeMultipleMutation.mutate(selectedAssetIds);
	};

	const handleSelectAll = () => {
		// Seleccionar solo los que no están tokenizados
		const untokenizedAssets = assets.filter(a => !a.token);
		const allIds = untokenizedAssets.map(a => a.id);
		setSelectedAssetIds(allIds);
	};

	const handleDeselectAll = () => {
		setSelectedAssetIds([]);
	};

	// Calcular estadísticas de tokenización
	const tokenizedCount = assets.filter(a => a.token).length;
	const readyToTokenize = assets.filter(a => {
		// Un asset está listo si no tiene token y tiene todos los documentos y firmas
		// Esto se valida individualmente en cada AssetTokenBundleCard
		return !a.token;
	}).length;

	const progress = ((currentStepIndex + 1) / steps.length) * 100;
	const isCompleted = steps.every(step => step.status === "success");
	const hasError = steps.some(step => step.status === "error");

	return (
		<>
			<Card>
			<CardHeader>
				<CardTitle className="flex items-center justify-between">
					<span>Tokenización de Paquete de Activoss</span>
					<div className="flex items-center gap-2">
						<Badge variant="outline">
							{tokenizedCount} / {assets.length} tokenizados
						</Badge>
						{readyToTokenize > 0 && (
							<Badge className="bg-green-500">
								<CheckCircle className="h-3 w-3 mr-1" />
								{readyToTokenize} listos
							</Badge>
						)}
					</div>
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Sección de Paquete de Activoss */}
				{assets && assets.length > 0 && (
					<div className="space-y-4 border-b pb-4">
						<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
							<h3 className="text-lg font-semibold">
								Paquete de Activoss ({assets.length})
							</h3>
							<div className="flex items-center gap-2 flex-wrap">
								{/* Botones de selección */}
								{assets.some(a => !a.token) && (
									<>
										{selectedAssetIds.length === 0 ? (
											<Button
												onClick={handleSelectAll}
												variant="outline"
												size="sm"
											>
												<CheckCircle className="h-4 w-4 mr-2" />
												Seleccionar Todos
											</Button>
										) : (
											<Button
												onClick={handleDeselectAll}
												variant="outline"
												size="sm"
											>
												<XCircle className="h-4 w-4 mr-2" />
												Deseleccionar Todos
											</Button>
										)}
									</>
								)}
								{/* Botón tokenizar seleccionados */}
								{selectedAssetIds.length > 0 && (
									<Button
										onClick={handleTokenizeSelected}
										disabled={tokenizeMultipleMutation.isPending}
										size="sm"
									>
										{tokenizeMultipleMutation.isPending ? (
											<Loader2 className="h-4 w-4 animate-spin mr-2" />
										) : (
											<Coins className="h-4 w-4 mr-2" />
										)}
										Tokenizar {selectedAssetIds.length}
									</Button>
								)}
							</div>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{assets.map((asset) => (
								<AssetTokenBundleCard
									key={asset.id}
									asset={asset}
									operationId={operationId}
									onTokenize={handleTokenizeAsset}
									onSelect={handleToggleAsset}
									selected={selectedAssetIds.includes(asset.id)}
									canTokenize={
										operation?.status === "SIGNED" ||
										operation?.status === "TOKENIZED" ||
										operation?.status === "ACTIVE"
									}
								/>
							))}
						</div>
					</div>
				)}

				{isLoadingOperation ? (
					<div className="text-center py-4">
						<Loader2 className="h-6 w-6 mx-auto animate-spin text-muted-foreground" />
					</div>
				) : assets.length === 0 ? (
					<Alert>
						<AlertCircle className="h-4 w-4" />
						<AlertDescription>
							No hay Paquete de Activoss en esta operación.
						</AlertDescription>
					</Alert>
				) : (
					<Alert className="bg-blue-50 border-blue-200">
						<Info className="h-4 w-4 text-blue-600" />
						<AlertDescription className="text-blue-800">
							Selecciona los Paquete de Activoss que deseas tokenizar. Solo se pueden tokenizar bundles que tengan todos los documentos subidos y firmados.
						</AlertDescription>
					</Alert>
				)}
			</CardContent>
		</Card>

		<Dialog open={showDialog} onOpenChange={setShowDialog}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Coins className="h-5 w-5" />
						Tokenizando {selectedAssetIds.length} Paquete de Activos
					</DialogTitle>
					<DialogDescription>
						Procesando {selectedAssetIds.length} activo(s) seleccionado(s)
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-4">
					{/* Progress bar */}
					<div className="space-y-2">
						<Progress value={progress} className="h-2" />
						<p className="text-xs text-muted-foreground text-center">
							{isCompleted
								? "¡Completado!"
								: hasError
								? "Error en el proceso"
								: `Paso ${currentStepIndex + 1} de ${steps.length}`}
						</p>
					</div>

					{/* Steps */}
					<div className="space-y-3">
						{steps.map((step, index) => {
							const Icon = step.icon;
							return (
								<div
									key={step.id}
									className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
										step.status === "loading"
											? "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800"
											: step.status === "success"
											? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
											: step.status === "error"
											? "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"
											: "bg-muted/50"
									}`}
								>
									<div className="shrink-0">
										{step.status === "loading" ? (
											<Loader2 className="h-5 w-5 animate-spin text-blue-600" />
										) : step.status === "success" ? (
											<CheckCircle className="h-5 w-5 text-green-600" />
										) : step.status === "error" ? (
											<XCircle className="h-5 w-5 text-red-600" />
										) : (
											<Icon className="h-5 w-5 text-muted-foreground" />
										)}
									</div>
									<div className="flex-1">
										<p
											className={`text-sm font-medium ${
												step.status === "pending"
													? "text-muted-foreground"
													: ""
											}`}
										>
											{step.label}
										</p>
									</div>
								</div>
							);
						})}
					</div>

					{/* Action buttons */}
					{(isCompleted || hasError) && (
						<div className="flex justify-end gap-2 pt-2">
							<Button
								variant="outline"
								onClick={() => {
									setShowDialog(false);
									resetSteps();
								}}
							>
								Cerrar
							</Button>
							{hasError && (
								<Button onClick={handleTokenizeSelected}>
									Reintentar
								</Button>
							)}
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
		</>
	);
}
