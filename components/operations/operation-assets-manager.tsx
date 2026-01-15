"use client";

import { useState } from "react";
import { Asset } from "@/types/asset";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Package, Eye, Coins, Truck, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { operationsApi } from "@/lib/api/operations";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/auth-context";

interface OperationAssetsManagerProps {
	assets?: Asset[];
	operationId: number;
	canEdit?: boolean;
	operationStatus?: string;
}

export function OperationAssetsManager({
	assets = [],
	operationId,
	canEdit = false,
	operationStatus,
}: OperationAssetsManagerProps) {
	const { user } = useAuth();
	const queryClient = useQueryClient();
	
	const isWarrant = user?.organizations?.some(
		(org) => org.type === "WAREHOUSE"
	);
	
	const isLiquidated = operationStatus === "LIQUIDATED";
	const canReleaseAssets = isWarrant && isLiquidated;
	
	// Estado para activos marcados como liberados
	const [releasedAssets, setReleasedAssets] = useState<Set<number>>(new Set());
	
	const totalValue = assets.reduce((sum, asset) => {
		const value = typeof asset.value === 'string' 
			? parseFloat(asset.value) 
			: Number(asset.value) || 0;
		return sum + value;
	}, 0);

	// Verificar si todos los activos comparten el mismo token
	const tokenizedAssets = assets.filter(asset => asset.token);
	const hasSharedToken = tokenizedAssets.length > 0 && 
		tokenizedAssets.every(asset => 
			asset.token && 
			tokenizedAssets[0].token?.id === asset.token?.id
		);
	const sharedToken = hasSharedToken ? tokenizedAssets[0].token : null;
	
	// Verificar si todos los activos están marcados como liberados
	const allAssetsReleased = assets.length > 0 && 
		assets.every(asset => 
			asset.status === "BURNED" || 
			releasedAssets.has(asset.id) ||
			asset.status === "DELIVERED"
		);
	
	const certifyDeliveryMutation = useMutation({
		mutationFn: () => operationsApi.certifyDelivery(operationId),
		onSuccess: async () => {
			toast.success("Entrega certificada exitosamente. El token ha sido quemado y los activos han sido liberados.");
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: ["operations", operationId],
				}),
				queryClient.invalidateQueries({ queryKey: ["operations"] }),
				queryClient.invalidateQueries({
					queryKey: ["tokens", "operation", operationId],
				}),
			]);
		},
		onError: (error: any) => {
			toast.error(
				error.response?.data?.message ||
					"Error al certificar la entrega y finalizar la operación"
			);
		},
	});
	
	const handleToggleAssetReleased = (assetId: number) => {
		const newReleased = new Set(releasedAssets);
		if (newReleased.has(assetId)) {
			newReleased.delete(assetId);
		} else {
			newReleased.add(assetId);
		}
		setReleasedAssets(newReleased);
	};
	
	const handleMarkAllReleased = () => {
		const allIds = assets.map(asset => asset.id);
		setReleasedAssets(new Set(allIds));
	};
	
	const handleFinalizeOperation = () => {
		if (
			!window.confirm(
				"¿Confirma que todos los activos han sido entregados físicamente? Esta acción quemará el token y finalizará la operación."
			)
		) {
			return;
		}
		certifyDeliveryMutation.mutate();
	};

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle>Activos de la Operación</CardTitle>
					<Badge variant="secondary">
						{assets.length} activo{assets.length !== 1 ? "s" : ""}
					</Badge>
				</div>
			</CardHeader>
			<CardContent>
				{assets.length === 0 ? (
					<div className="text-center py-8 text-muted-foreground">
						<Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
						<p>No hay activos asociados a esta operación</p>
					</div>
				) : (
					<div className="space-y-4">
						{canReleaseAssets && (
							<Alert className="bg-green-50 border-green-200 mb-4">
								<CheckCircle className="h-4 w-4 text-green-600" />
								<AlertDescription className="text-green-800">
									<strong>Activos disponibles para liberación</strong>
									<br />
									Marque cada activo como entregado físicamente. Cuando todos los activos estén marcados, 
									podrá finalizar la operación quemando el token.
								</AlertDescription>
							</Alert>
						)}
						
						{operationStatus === "RELEASED" && (
							<Alert className="bg-blue-50 border-blue-200 mb-4">
								<CheckCircle className="h-4 w-4 text-blue-600" />
								<AlertDescription className="text-blue-800">
									<strong>Operación finalizada</strong>
									<br />
									Todos los activos han sido liberados y el token ha sido quemado.
								</AlertDescription>
							</Alert>
						)}
						
						<Table>
							<TableHeader>
								<TableRow>
									{canReleaseAssets && (
										<TableHead className="w-12">
											<Checkbox
												checked={allAssetsReleased}
												onCheckedChange={(checked) => {
													if (checked) {
														handleMarkAllReleased();
													} else {
														setReleasedAssets(new Set());
													}
												}}
											/>
										</TableHead>
									)}
									<TableHead>VIN/Serial</TableHead>
									<TableHead>Descripción</TableHead>
									<TableHead>Marcas</TableHead>
									<TableHead>Cantidad</TableHead>
									<TableHead>Valor</TableHead>
									<TableHead>Estado</TableHead>
									<TableHead>Acciones</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{assets.map((asset) => {
									const isReleased = asset.status === "BURNED" || 
										asset.status === "DELIVERED" || 
										releasedAssets.has(asset.id);
									
									return (
										<TableRow key={asset.id}>
											{canReleaseAssets && (
												<TableCell>
													<Checkbox
														checked={isReleased}
														onCheckedChange={(checked) => {
															if (checked !== undefined) {
																handleToggleAssetReleased(asset.id);
															}
														}}
														disabled={asset.status === "BURNED"}
													/>
												</TableCell>
											)}
											<TableCell className="font-medium">
												{asset.vinSerial}
											</TableCell>
											<TableCell>
												{asset.description || "-"}
											</TableCell>
											<TableCell>
												{asset.brands || "-"}
											</TableCell>
											<TableCell>
												{asset.quantity ? Math.floor(Number(asset.quantity)) : 1}
											</TableCell>
											<TableCell>
												${asset.value?.toLocaleString() || "0"}
											</TableCell>
											<TableCell>
												<Badge
													variant={
														asset.status === "BURNED"
															? "destructive"
															: asset.status === "PLEDGED"
															? "default"
															: isReleased
															? "default"
															: "secondary"
													}
												>
													{asset.status === "BURNED" 
														? "BURNED" 
														: isReleased 
														? "LIBERADO" 
														: asset.status}
												</Badge>
											</TableCell>
											<TableCell>
												<Link href={`/dashboard/assets/${asset.id}`}>
													<Button variant="ghost" size="sm">
														<Eye className="h-4 w-4 mr-2" />
														Ver
													</Button>
												</Link>
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>

						<div className="space-y-4 pt-4 border-t">
							<div className="flex items-center justify-between">
								<p className="font-medium">Valor Total de Activos</p>
								<p className="text-lg font-bold">
									${totalValue.toLocaleString()}
								</p>
							</div>
							{hasSharedToken && sharedToken && (
								<div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg">
									<div className="flex items-center gap-2">
										<Coins className="h-4 w-4 text-primary" />
										<div>
											<p className="text-sm font-medium">
												Token Compartido
											</p>
											<p className="text-xs text-muted-foreground">
												Todos los activos comparten el mismo token
											</p>
										</div>
									</div>
									<Link href={`/dashboard/tokens/${sharedToken.id}`}>
										<Button variant="outline" size="sm">
											Ver Token
										</Button>
									</Link>
								</div>
							)}
							
							{canReleaseAssets && (
								<div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
									<div className="flex-1">
										<p className="text-sm font-medium text-green-900">
											Activos marcados como liberados: {releasedAssets.size} de {assets.length}
										</p>
										{allAssetsReleased && (
											<p className="text-xs text-green-700 mt-1">
												Todos los activos están marcados. Puede finalizar la operación.
											</p>
										)}
									</div>
									<Button
										onClick={handleFinalizeOperation}
										disabled={
											!allAssetsReleased || 
											certifyDeliveryMutation.isPending
										}
										className="bg-green-600 hover:bg-green-700"
									>
										{certifyDeliveryMutation.isPending && (
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										)}
										{!certifyDeliveryMutation.isPending && (
											<Truck className="mr-2 h-4 w-4" />
										)}
										Finalizar Operación y Quemar Token
									</Button>
								</div>
							)}
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

