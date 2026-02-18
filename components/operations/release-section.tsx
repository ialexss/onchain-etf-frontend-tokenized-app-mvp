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
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { operationsApi } from "@/lib/api/operations";
import { toast } from "sonner";
import {
	FileCheck,
	CheckCircle,
	XCircle,
	Loader2,
	AlertCircle,
	Truck,
	Package,
	ArrowRight,
	Coins,
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { Checkbox } from "@/components/ui/checkbox";
import { Asset } from "@/types/asset";

interface ReleaseSectionProps {
	operationId: number;
	assets?: Asset[];
}

export function ReleaseSection({
	operationId,
	assets = [],
}: ReleaseSectionProps) {
	const { user } = useAuth();
	const queryClient = useQueryClient();
	const [selectedAssetIdsForTransfer, setSelectedAssetIdsForTransfer] = useState<number[]>([]);
	const [selectedAssetIdsForRelease, setSelectedAssetIdsForRelease] = useState<number[]>([]);
	const [showTransferDialog, setShowTransferDialog] = useState(false);
	const [showReleaseDialog, setShowReleaseDialog] = useState(false);

	const { data: operation, isLoading: isLoadingOperation } = useQuery({
		queryKey: ["operations", operationId],
		queryFn: () => operationsApi.getById(operationId),
		enabled: !!operationId,
	});

	// Obtener ReleaseLetters y Paquete de Activoss aprobados
	const { data: releaseLetters } = useQuery({
		queryKey: ["release-letters", operationId],
		queryFn: () => operationsApi.getReleaseLetters(operationId),
		enabled: !!operationId,
	});

	const { data: approvedAssetIds = [] } = useQuery({
		queryKey: ["approved-asset-token-bundles", operationId],
		queryFn: () => operationsApi.getApprovedAssetTokenBundles(operationId),
		enabled: !!operationId,
	});

	// Obtener tokens para verificar dónde están
	const { data: tokens } = useQuery({
		queryKey: ["tokens", "operation", operationId],
		queryFn: async () => {
			// Obtener tokens de los activos
			const tokenizedAssets = assets.filter((a) => a.token);
			return tokenizedAssets.map((a) => ({
				assetId: a.id,
				tokenId: a.token?.id,
				currentHolderWalletId: a.token?.currentHolderWalletId,
			}));
		},
		enabled: !!operationId && assets.length > 0,
	});

	// Mutation para transferir tokens del banco a warehouse
	const transferTokensMutation = useMutation({
		mutationFn: (assetIds: number[]) =>
			operationsApi.transferTokensToWarehouse(operationId, assetIds),
		onSuccess: async (data) => {
			const successCount = data.success.length;
			const failedCount = data.failed.length;
			if (successCount > 0) {
				toast.success(
					`${successCount} token(es) transferido(s) exitosamente a warehouse. El semáforo cambió a GREEN (disponible para retiro).`
				);
			}
			if (failedCount > 0) {
				toast.error(
					`${failedCount} transferencia(s) fallaron`
				);
			}
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: ["operations", operationId],
				}),
				queryClient.invalidateQueries({ queryKey: ["operations"] }),
				queryClient.invalidateQueries({
					queryKey: ["tokens", "operation", operationId],
				}),
				queryClient.invalidateQueries({ queryKey: ["tokens"] }),
				queryClient.invalidateQueries({ queryKey: ["assets"] }),
				queryClient.invalidateQueries({
					queryKey: ["approved-asset-token-bundles", operationId],
				}),
			]);
			setShowTransferDialog(false);
			setSelectedAssetIdsForTransfer([]);
		},
		onError: (error: any) => {
			toast.error(
				error.response?.data?.message ||
					"Error al transferir tokens a warehouse"
			);
		},
	});

	// Mutation para liberar y quemar tokens
	const releaseAssetTokenBundlesMutation = useMutation({
		mutationFn: (assetIds: number[]) =>
			operationsApi.releaseAssetTokenBundles(operationId, assetIds),
		onSuccess: async (data) => {
			const successCount = data.success.length;
			const failedCount = data.failed.length;
			if (successCount > 0) {
				toast.success(
					`${successCount} Paquete de Activos(s) liberado(s) exitosamente`
				);
			}
			if (failedCount > 0) {
				toast.error(
					`${failedCount} Paquete de Activos(s) fallaron al liberar`
				);
			}
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: ["operations", operationId],
				}),
				queryClient.invalidateQueries({ queryKey: ["operations"] }),
				queryClient.invalidateQueries({
					queryKey: ["approved-asset-token-bundles", operationId],
				}),
				queryClient.invalidateQueries({
					queryKey: ["tokens", "operation", operationId],
				}),
				queryClient.invalidateQueries({ queryKey: ["tokens"] }),
			]);
			setShowReleaseDialog(false);
			setSelectedAssetIdsForRelease([]);
		},
		onError: (error: any) => {
			toast.error(
				error.response?.data?.message ||
					"Error al liberar Paquete de Activoss"
			);
		},
	});

	const handleTransferTokens = () => {
		if (selectedAssetIdsForTransfer.length === 0) {
			toast.error("Por favor selecciona al menos un Paquete de Activos");
			return;
		}
		if (
			!window.confirm(
				`¿Confirma la transferencia de tokens de ${selectedAssetIdsForTransfer.length} Paquete de Activos(s) a warehouse?`
			)
		) {
			return;
		}
		transferTokensMutation.mutate(selectedAssetIdsForTransfer);
	};

	const handleReleaseSelected = () => {
		if (selectedAssetIdsForRelease.length === 0) {
			toast.error("Por favor selecciona al menos un Paquete de Activos");
			return;
		}
		if (
			!window.confirm(
				`¿Confirma la liberación de ${selectedAssetIdsForRelease.length} Paquete de Activos(s)? Los tokens serán quemados.`
			)
		) {
			return;
		}
		releaseAssetTokenBundlesMutation.mutate(selectedAssetIdsForRelease);
	};

	const handleToggleAssetForTransfer = (assetId: number, checked: boolean) => {
		if (checked) {
			setSelectedAssetIdsForTransfer([...selectedAssetIdsForTransfer, assetId]);
		} else {
			setSelectedAssetIdsForTransfer(selectedAssetIdsForTransfer.filter((id) => id !== assetId));
		}
	};

	const handleToggleAssetForRelease = (assetId: number, checked: boolean) => {
		if (checked) {
			setSelectedAssetIdsForRelease([...selectedAssetIdsForRelease, assetId]);
		} else {
			setSelectedAssetIdsForRelease(selectedAssetIdsForRelease.filter((id) => id !== assetId));
		}
	};

	// Filtrar activos aprobados para liberación
	const approvedAssets = assets.filter((asset) =>
		approvedAssetIds.includes(asset.id)
	);

	// Filtrar activos que tienen token en warehouse (para warehouse)
	const assetsWithTokenInWarehouse = approvedAssets.filter((asset) => {
		if (!asset.token) return false;
		// Verificar si el token está en la wallet de warehouse
		// Esto se verifica comparando con la organización warehouse del usuario
		const userWarehouse = user?.organizations?.find((org) => org.type === "WAREHOUSE");
		if (!userWarehouse) return false;
		// Nota: Necesitaríamos obtener la wallet de warehouse para verificar
		// Por ahora, asumimos que si está aprobado y tokenizado, puede estar en warehouse
		return true;
	});

	const isBank = user?.organizations?.some((org) => org.type === "BANK");
	const isWarehouse = user?.organizations?.some(
		(org) => org.type === "WAREHOUSE"
	);

	const isReleased = operation?.status === "RELEASED";
	const hasApprovedReleaseLetters = approvedAssetIds.length > 0;

	if (isLoadingOperation) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Liberación</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-center py-4">
						<Loader2 className="h-6 w-6 mx-auto animate-spin text-muted-foreground" />
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<>
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center justify-between">
						<span>Liberación</span>
						{isReleased && (
							<Badge variant="default" className="bg-green-500">
								<CheckCircle className="h-3 w-3 mr-1" />
								Finalizada
							</Badge>
						)}
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* Estado de ReleaseLetters */}
					<div className="border rounded-lg p-4 space-y-2">
						<div className="flex items-center justify-between">
							<h4 className="font-medium">Cartas de Liberación</h4>
							{hasApprovedReleaseLetters ? (
								<Badge variant="default" className="bg-green-500">
									<CheckCircle className="h-3 w-3 mr-1" />
									{approvedAssetIds.length} Paquete de Activos(s) aprobado(s)
								</Badge>
							) : (
								<Badge variant="outline">
									<XCircle className="h-3 w-3 mr-1" />
									Sin aprobaciones
								</Badge>
							)}
						</div>
						{!hasApprovedReleaseLetters && (
							<p className="text-sm text-muted-foreground">
								Debe haber al menos una carta de liberación aprobada antes de
								transferir tokens a warehouse.
							</p>
						)}
					</div>

					{/* Sección para Banco: Transferir Tokens a Warehouse */}
					{isBank && operation?.status === "ACTIVE" && (
						<div className="space-y-2">
							{!hasApprovedReleaseLetters ? (
								<Alert>
									<AlertCircle className="h-4 w-4" />
									<AlertDescription>
										Debe haber al menos una carta de liberación aprobada antes de
										transferir tokens a warehouse.
									</AlertDescription>
								</Alert>
							) : (
								<>
									<Button
										onClick={() => setShowTransferDialog(true)}
										disabled={!hasApprovedReleaseLetters}
										className="w-full"
									>
										<ArrowRight className="mr-2 h-4 w-4" />
										Transferir Tokens a Warehouse
									</Button>
									<p className="text-xs text-muted-foreground">
										Selecciona los activos aprobados para transferir sus tokens a warehouse
									</p>
								</>
							)}
						</div>
					)}

					{/* Sección para Warehouse: Liberar y Quemar */}
					{isWarehouse && hasApprovedReleaseLetters && (
						<div className="space-y-2">
							<Button
								onClick={() => setShowReleaseDialog(true)}
								className="w-full bg-green-600 hover:bg-green-700"
							>
								<Truck className="mr-2 h-4 w-4" />
								Liberar y Quemar Tokens
							</Button>
							<p className="text-xs text-muted-foreground">
								Selecciona los activos con carta aprobada y token en warehouse para liberar físicamente y quemar tokens
							</p>
						</div>
					)}

					{/* Estado final */}
					{operation?.status === "RELEASED" && (
						<Alert className="bg-green-50 border-green-200">
							<CheckCircle className="h-4 w-4 text-green-600" />
							<AlertDescription className="text-green-800">
								La operación ha sido completamente finalizada. La
								mercadería ha sido entregada y los tokens han sido
								quemados.
							</AlertDescription>
						</Alert>
					)}

					{/* Información para otros usuarios */}
					{!isBank && !isWarehouse && isReleased && (
						<Alert>
							<CheckCircle className="h-4 w-4" />
							<AlertDescription>
								Esta operación ha sido completamente finalizada. Los
								tokens han sido quemados y los activos han sido
								liberados.
							</AlertDescription>
						</Alert>
					)}
				</CardContent>
			</Card>

			{/* Dialog para transferir tokens (Banco) */}
			<Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<ArrowRight className="h-5 w-5" />
							Transferir Tokens a Warehouse
						</DialogTitle>
						<DialogDescription>
							Selecciona los Paquete de Activoss aprobados para transferir sus tokens a warehouse
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
							{approvedAssets.length === 0 ? (
								<p className="text-sm text-muted-foreground text-center py-4">
									No hay activos aprobados disponibles
								</p>
							) : (
								<div className="space-y-2">
									{approvedAssets.map((asset) => (
										<div
											key={asset.id}
											className="flex items-center gap-2 p-2 hover:bg-muted rounded"
										>
											<Checkbox
												checked={selectedAssetIdsForTransfer.includes(asset.id)}
												onCheckedChange={(checked) =>
													handleToggleAssetForTransfer(asset.id, checked as boolean)
												}
												disabled={asset.status === "BURNED" || !asset.token}
											/>
											<Package className="h-4 w-4 text-muted-foreground" />
											<div className="flex-1">
												<span className="text-sm font-medium">{asset.vinSerial}</span>
												{asset.value && (
													<span className="text-xs text-muted-foreground block">
														Valor: ${Number(asset.value).toLocaleString()}
													</span>
												)}
											</div>
											<Badge
												variant={
													asset.status === "BURNED"
														? "destructive"
														: asset.token
														? "default"
														: "outline"
												}
											>
												{asset.status === "BURNED"
													? "Liberado"
													: asset.token
													? "Tokenizado"
													: "Sin token"}
											</Badge>
										</div>
									))}
								</div>
							)}
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setShowTransferDialog(false);
								setSelectedAssetIdsForTransfer([]);
							}}
						>
							Cancelar
						</Button>
						<Button
							onClick={handleTransferTokens}
							disabled={
								selectedAssetIdsForTransfer.length === 0 ||
								transferTokensMutation.isPending
							}
						>
							{transferTokensMutation.isPending ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : (
								<ArrowRight className="mr-2 h-4 w-4" />
							)}
							Transferir {selectedAssetIdsForTransfer.length} Token(s)
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Dialog para liberar y quemar (Warehouse) */}
			<Dialog open={showReleaseDialog} onOpenChange={setShowReleaseDialog}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<Truck className="h-5 w-5" />
							Liberar y Quemar Tokens
						</DialogTitle>
						<DialogDescription>
							Selecciona los Paquete de Activoss con carta aprobada y token en warehouse para liberar físicamente y quemar tokens
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
							{approvedAssets.length === 0 ? (
								<p className="text-sm text-muted-foreground text-center py-4">
									No hay activos aprobados disponibles
								</p>
							) : (
								<div className="space-y-2">
									{approvedAssets.map((asset) => (
										<div
											key={asset.id}
											className="flex items-center gap-2 p-2 hover:bg-muted rounded"
										>
											<Checkbox
												checked={selectedAssetIdsForRelease.includes(asset.id)}
												onCheckedChange={(checked) =>
													handleToggleAssetForRelease(asset.id, checked as boolean)
												}
												disabled={asset.status === "BURNED" || !asset.token}
											/>
											<Package className="h-4 w-4 text-muted-foreground" />
											<div className="flex-1">
												<span className="text-sm font-medium">{asset.vinSerial}</span>
												{asset.value && (
													<span className="text-xs text-muted-foreground block">
														Valor: ${Number(asset.value).toLocaleString()}
													</span>
												)}
											</div>
											<Badge
												variant={
													asset.status === "BURNED"
														? "destructive"
														: asset.token
														? "default"
														: "outline"
												}
											>
												{asset.status === "BURNED"
													? "Liberado"
													: asset.token
													? "Tokenizado"
													: "Sin token"}
											</Badge>
										</div>
									))}
								</div>
							)}
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setShowReleaseDialog(false);
								setSelectedAssetIdsForRelease([]);
							}}
						>
							Cancelar
						</Button>
						<Button
							onClick={handleReleaseSelected}
							disabled={
								selectedAssetIdsForRelease.length === 0 ||
								releaseAssetTokenBundlesMutation.isPending
							}
							className="bg-green-600 hover:bg-green-700"
						>
							{releaseAssetTokenBundlesMutation.isPending ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : (
								<Truck className="mr-2 h-4 w-4" />
							)}
							Liberar {selectedAssetIdsForRelease.length} Paquete de Activos(s)
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
