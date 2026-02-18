"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DocumentBundle } from "@/types/operation";
import { FileSignature, CheckCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { AtomicAssetBundleSignatures } from "@/components/shared/atomic-asset-bundle-signatures";

interface SignaturesSectionProps {
	operationId: number;
	bundle?: DocumentBundle; // Legacy - mantener para compatibilidad
	assetBundles?: any[]; // Nueva prop para lista de bundles
}

export function SignaturesSection({
	operationId,
	bundle, // Legacy
	assetBundles = [], // Nueva prop
}: SignaturesSectionProps) {
	const queryClient = useQueryClient();

	// Normalizar bundles
	const bundlesToRender = assetBundles && assetBundles.length > 0 
		? assetBundles 
		: bundle 
			? [{ ...bundle, assetId: (bundle as any).assetId || 0 }] // Intentar recuperar assetId si es legacy loop
			: [];
	
	const hasBundles = bundlesToRender.length > 0;

	// Calcular estadísticas globales
	const calculateGlobalStats = () => {
		if (!hasBundles) return { total: 0, completed: 0, pending: 0 };
		
		let totalSignatures = 0;
		let completedSignatures = 0;
		let pendingBundles = 0;

		bundlesToRender.forEach((b: any) => {
			const docs = b.documents || {};
			const cd = docs.cd;
			const bp = docs.bp;
			const pagare = docs.pagare;

			if (cd) {
				totalSignatures += 2;
				completedSignatures += (cd.signedByWarehouse ? 1 : 0) + (cd.signedByClient ? 1 : 0);
			}
			if (bp) {
				totalSignatures += 2;
				completedSignatures += (bp.signedByWarehouse ? 1 : 0) + (bp.signedByClient ? 1 : 0);
			}
			if (pagare) {
				totalSignatures += 1;
				completedSignatures += pagare.signedByClient ? 1 : 0;
			}

			// Verificar si bundle está completo
			const allSigned =
				(!cd || (cd.signedByWarehouse && cd.signedByClient)) &&
				(!bp || (bp.signedByWarehouse && bp.signedByClient)) &&
				(!pagare || pagare.signedByClient);
			
			if (!allSigned) pendingBundles++;
		});

		return { total: totalSignatures, completed: completedSignatures, pending: pendingBundles };
	};

	const globalStats = calculateGlobalStats();
	const globalProgress = globalStats.total > 0 ? (globalStats.completed / globalStats.total) * 100 : 0;

	// Si no hay bundles, mostrar mensaje
	if (!hasBundles) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Firmas de Documentos</CardTitle>
				</CardHeader>
				<CardContent>
					<Alert>
						<FileSignature className="h-4 w-4" />
						<AlertDescription>
							No hay Paquete de Activoss en esta operación. Los
							documentos deben estar generados o subidos primero.
						</AlertDescription>
					</Alert>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-6">
			{/* Estadísticas Globales */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div className="space-y-1">
							<CardTitle>Progreso Global de Firmas</CardTitle>
							<CardDescription>
								{bundlesToRender.length} Paquete de Activos{bundlesToRender.length !== 1 ? 's' : ''} en la operación
							</CardDescription>
						</div>
						<div className="flex gap-2">
							{globalStats.pending === 0 ? (
								<Badge variant="default" className="bg-green-500">
									<CheckCircle className="h-3 w-3 mr-1" />
									Todos Completados
								</Badge>
							) : (
								<>
									<Badge variant="outline">
										{globalStats.completed} Firmas Listas
									</Badge>
									<Badge variant="secondary">
										{globalStats.pending} Bundles Pendientes
									</Badge>
								</>
							)}
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<div className="space-y-2">
						<div className="flex items-center justify-between text-sm">
							<span className="text-muted-foreground">Avance Total</span>
							<span className="font-medium">{Math.round(globalProgress)}%</span>
						</div>
						<Progress value={globalProgress} className="h-2" />
					</div>
				</CardContent>
			</Card>

			{/* Lista de Bundles (Atómicos) */}
			<div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
				{bundlesToRender.map((bundle: any, index: number) => (
					<Card key={bundle.assetId || index} className="overflow-hidden">
						<CardHeader className="bg-muted/30 pb-3">
							<div className="flex items-center justify-between">
								<CardTitle className="text-base font-medium">
									{bundle.vinSerial || `Asset #${bundle.assetId}`}
								</CardTitle>
								{bundle.token ? (
									<Badge className="bg-blue-500">Tokenizado</Badge>
								) : (
									<Badge variant="outline">En Proceso</Badge>
								)}
							</div>
						</CardHeader>
						<CardContent className="p-4 pt-6">
							<AtomicAssetBundleSignatures
								assetId={bundle.assetId}
								operationId={operationId}
								onSuccess={() => {
									// Invalidar queries globales para actualizar stats
									queryClient.invalidateQueries({
										queryKey: ["operations", operationId],
									});
								}}
							/>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
