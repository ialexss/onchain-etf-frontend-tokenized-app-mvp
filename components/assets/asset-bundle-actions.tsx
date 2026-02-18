"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { operationsApi } from "@/lib/api/operations";
import { Asset, AssetStatus } from "@/types/asset";
import { toast } from "sonner";
import {
	Coins,
	Unlock,
	Loader2,
	AlertCircle,
	CheckCircle,
	Eye,
	Shield,
} from "lucide-react";

interface AssetBundleActionsProps {
	asset: Asset;
	isReady: boolean;
	missingComponents?: string[];
	onActionComplete?: () => void;
}

/**
 * Componente para acciones del Paquete de Activos
 * - Tokenizar
 * - Liberar
 * - Ver token en explorer
 */
export function AssetBundleActions({
	asset,
	isReady,
	missingComponents = [],
	onActionComplete,
}: AssetBundleActionsProps) {
	const queryClient = useQueryClient();
	const [showTokenizeDialog, setShowTokenizeDialog] = useState(false);
	const [showReleaseDialog, setShowReleaseDialog] = useState(false);

	// Tokenizar activo
	const tokenizeMutation = useMutation({
		mutationFn: () => operationsApi.tokenizeAsset(asset.id),
		onSuccess: () => {
			toast.success(`Asset ${asset.vinSerial} tokenizado exitosamente`);
			queryClient.invalidateQueries({ queryKey: ["asset", asset.id] });
			queryClient.invalidateQueries({ queryKey: ["asset-bundle", asset.id] });
			setShowTokenizeDialog(false);
			onActionComplete?.();
		},
		onError: (error: any) => {
			toast.error(error.response?.data?.message || "Error al tokenizar");
		},
	});

	// Liberar activo
	const releaseMutation = useMutation({
		mutationFn: () => {
			if (!asset.operationId) throw new Error("Operation ID required");
			return operationsApi.releaseAssetTokenBundles(asset.operationId, [asset.id]);
		},
		onSuccess: () => {
			toast.success(`Asset ${asset.vinSerial} liberado exitosamente`);
			queryClient.invalidateQueries({ queryKey: ["asset", asset.id] });
			queryClient.invalidateQueries({ queryKey: ["asset-bundle", asset.id] });
			setShowReleaseDialog(false);
			onActionComplete?.();
		},
		onError: (error: any) => {
			toast.error(error.response?.data?.message || "Error al liberar activo");
		},
	});

	const canTokenize = isReady && !asset.token;
	const canRelease = asset.token && (asset.status === AssetStatus.PLEDGED || asset.status === AssetStatus.STORED);
	const isReleased = asset.status === AssetStatus.BURNED || asset.status === AssetStatus.DELIVERED;

	return (
		<>
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Shield className="h-5 w-5" />
						Acciones del Bundle
					</CardTitle>
					<CardDescription>
						Gestión de tokenización y liberación del activo
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* Estado del bundle */}
					<div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
						<span className="text-sm font-medium">Estado del Bundle</span>
						<Badge variant={isReady ? "default" : "secondary"}>
							{isReady ? "Listo" : "Incompleto"}
						</Badge>
					</div>

					{/* Tokenización */}
					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Coins className="h-5 w-5 text-muted-foreground" />
								<div>
									<p className="font-medium">Tokenización</p>
									<p className="text-xs text-muted-foreground">
										Crear token en XRPL
									</p>
								</div>
							</div>
							{asset.token ? (
								<Badge className="bg-blue-500">
									<CheckCircle className="h-3 w-3 mr-1" />
									Tokenizado
								</Badge>
							) : (
								<Badge variant="outline">No tokenizado</Badge>
							)}
						</div>

						{!asset.token && (
							<>
								{!isReady && missingComponents.length > 0 && (
									<Alert variant="destructive">
										<AlertCircle className="h-4 w-4" />
										<AlertDescription>
											<p className="font-medium text-sm mb-1">Faltan componentes:</p>
											<ul className="list-disc list-inside text-xs">
												{missingComponents.map((comp, i) => (
													<li key={i}>{comp}</li>
												))}
											</ul>
										</AlertDescription>
									</Alert>
								)}

								<Button
									className="w-full"
									disabled={!canTokenize || tokenizeMutation.isPending}
									onClick={() => setShowTokenizeDialog(true)}
								>
									{tokenizeMutation.isPending ? (
										<Loader2 className="h-4 w-4 animate-spin mr-2" />
									) : (
										<Coins className="h-4 w-4 mr-2" />
									)}
									Tokenizar Asset Bundle
								</Button>
							</>
						)}

						{asset.token && (
							<div className="space-y-2">
								<div className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded">
									<span className="text-muted-foreground">Token ID</span>
									<span className="font-mono">#{asset.token.id}</span>
								</div>
								<div className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded">
									<span className="text-muted-foreground">XRPL Token</span>
									<span className="font-mono text-xs">
										{asset.token.xrplTokenId?.slice(0, 16)}...
									</span>
								</div>
								<Button
									variant="outline"
									size="sm"
									className="w-full"
									onClick={() => {
										// Abrir en explorer de XRPL
										toast.info("Funcionalidad de explorer próximamente");
									}}
								>
									<Eye className="h-4 w-4 mr-2" />
									Ver en XRPL Explorer
								</Button>
							</div>
						)}
					</div>

					{/* Liberación */}
					{asset.token && !isReleased && (
						<div className="space-y-3 pt-3 border-t">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<Unlock className="h-5 w-5 text-muted-foreground" />
									<div>
										<p className="font-medium">Liberación</p>
										<p className="text-xs text-muted-foreground">
											Quemar token y liberar activo
										</p>
									</div>
								</div>
								{isReleased ? (
									<Badge className="bg-green-500">
										<CheckCircle className="h-3 w-3 mr-1" />
										Liberado
									</Badge>
								) : (
									<Badge variant="outline">Bloqueado</Badge>
								)}
							</div>

							<Alert>
								<AlertCircle className="h-4 w-4" />
								<AlertDescription className="text-xs">
									La liberación requiere carta de liberación aprobada.
									El token será quemado de forma permanente.
								</AlertDescription>
							</Alert>

							<Button
								variant="secondary"
								className="w-full"
								disabled={!canRelease || releaseMutation.isPending}
								onClick={() => setShowReleaseDialog(true)}
							>
								{releaseMutation.isPending ? (
									<Loader2 className="h-4 w-4 animate-spin mr-2" />
								) : (
									<Unlock className="h-4 w-4 mr-2" />
								)}
								Liberar Asset Bundle
							</Button>
						</div>
					)}

					{isReleased && (
						<Alert className="border-green-500 bg-green-50 dark:bg-green-950">
							<CheckCircle className="h-4 w-4 text-green-500" />
							<AlertDescription className="text-green-700 dark:text-green-300">
								El activo ha sido liberado exitosamente
							</AlertDescription>
						</Alert>
					)}
				</CardContent>
			</Card>

			{/* Dialog de confirmación de tokenización */}
			<AlertDialog open={showTokenizeDialog} onOpenChange={setShowTokenizeDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Tokenizar Asset Bundle</AlertDialogTitle>
						<AlertDialogDescription>
							Se creará un token MPT en XRPL para el activo <strong>{asset.vinSerial}</strong>.
							Esta acción:
							<ul className="list-disc list-inside mt-2 space-y-1">
								<li>Creará un token único en la blockchain</li>
								<li>Registrará el Merkle Root de los documentos</li>
								<li>Bloqueará el activo (semáforo RED)</li>
								<li>Transferirá el token al banco</li>
							</ul>
							<p className="mt-3 font-medium">¿Desea continuar?</p>
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancelar</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => tokenizeMutation.mutate()}
							disabled={tokenizeMutation.isPending}
						>
							{tokenizeMutation.isPending && (
								<Loader2 className="h-4 w-4 animate-spin mr-2" />
							)}
							Confirmar Tokenización
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Dialog de confirmación de liberación */}
			<AlertDialog open={showReleaseDialog} onOpenChange={setShowReleaseDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Liberar Asset Bundle</AlertDialogTitle>
						<AlertDialogDescription>
							Se liberará el activo <strong>{asset.vinSerial}</strong>.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<div className="space-y-3">
						<div>
							<p className="text-sm text-muted-foreground mb-2">Esta acción:</p>
							<ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
								<li>Quemará el token de forma permanente</li>
								<li>Liberará el activo (semáforo GREEN)</li>
								<li>Permitirá la entrega física del activo</li>
								<li><strong className="text-red-600">Esta acción es irreversible</strong></li>
							</ul>
						</div>
						<p className="text-sm font-medium">¿Desea continuar?</p>
					</div>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancelar</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => releaseMutation.mutate()}
							disabled={releaseMutation.isPending}
							className="bg-red-600 hover:bg-red-700"
						>
							{releaseMutation.isPending && (
								<Loader2 className="h-4 w-4 animate-spin mr-2" />
							)}
							Confirmar Liberación
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
