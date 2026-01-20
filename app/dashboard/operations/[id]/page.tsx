"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { operationsApi } from "@/lib/api/operations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DocumentStatusCard } from "@/components/operations/document-status-card";
import { SignaturesSection } from "@/components/operations/signatures-section";
import { PaymentLetterSection } from "@/components/operations/payment-letter-section";
import { TokenizationSection } from "@/components/operations/tokenization-section";
import { LiquidationSection } from "@/components/operations/liquidation-section";
import { DeliveryStatusBadge } from "@/components/operations/delivery-status-badge";
import { OperationStatusTimeline } from "@/components/operations/operation-status-timeline";
import { OperationAssetsManager } from "@/components/operations/operation-assets-manager";
import { useAuth } from "@/lib/auth/auth-context";
import {
	FileCheck,
	AlertCircle,
	Loader2,
	Package,
	FileText,
	FileSignature,
	Coins,
	Receipt,
} from "lucide-react";
import { useParams } from "next/navigation";

export default function OperationDetailPage() {
	const params = useParams();
	const operationId = parseInt(params.id as string);
	const { user } = useAuth();
	const queryClient = useQueryClient();

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

	// El bundle viene desde operationStatus o directamente de la operación
	const bundle =
		operationStatus?.bundle || (operation as any)?.documentBundle;

	// Extraer documentos del bundle si existe
	const cd = bundle?.cd;
	const bp = bundle?.bp;
	const pagare = bundle?.pagare;

	// Determinar permisos de upload según el tipo de usuario
	const isWarrant = user?.organizations?.some(
		(org) => org.type === "WAREHOUSE"
	);
	const isClient = user?.organizations?.some((org) => org.type === "CLIENT");
	const isBank = user?.organizations?.some((org) => org.type === "BANK");

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
					<h2 className="text-3xl font-bold">
						Operación{" "}
						{operation.operationNumber || `OP-${operation.id}`}
					</h2>
					<p className="text-slate-500 dark:text-slate-400">
						Vista detallada de la operación
					</p>
				</div>
				<div className="flex items-center gap-4">
					<Badge variant="outline">{operation.status}</Badge>
					{(operation.status === "ACTIVE" ||
						operation.status === "LIQUIDATED" ||
						operation.status === "RELEASED") && (
						<DeliveryStatusBadge
							status={
								operation.status === "ACTIVE" ? "RED" : "GREEN"
							}
						/>
					)}
				</div>
			</div>

			{/* Timeline de Estado */}
			<OperationStatusTimeline status={operation.status} />

			{/* Tabs */}
			<Tabs defaultValue="summary" className="space-y-4">
				<TabsList className="grid w-full grid-cols-6">
					<TabsTrigger value="summary">Resumen</TabsTrigger>
					<TabsTrigger value="assets">Activos</TabsTrigger>
					<TabsTrigger value="documents">Documentos</TabsTrigger>
					<TabsTrigger value="signatures">Firmas</TabsTrigger>
					<TabsTrigger value="tokenization">Tokenización</TabsTrigger>
					{(isBank || isWarrant) && (
						<TabsTrigger value="liquidation">
							{isBank ? "Liquidación" : "Carta de Pago"}
						</TabsTrigger>
					)}
				</TabsList>

				{/* Tab: Resumen */}
				<TabsContent value="summary" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Información General</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
								<div>
									<p className="text-sm text-muted-foreground">
										Número de Operación
									</p>
									<p className="font-medium">
										{operation.operationNumber ||
											`OP-${operation.id}`}
									</p>
								</div>
								{operation.titleNumber && (
									<div>
										<p className="text-sm text-muted-foreground">
											Número de Título
										</p>
										<p className="font-medium">
											{operation.titleNumber}
										</p>
									</div>
								)}
								<div>
									<p className="text-sm text-muted-foreground">
										Warrantera
									</p>
									<p className="font-medium">
										{operation.warrant?.name || "-"}
									</p>
								</div>
								<div>
									<p className="text-sm text-muted-foreground">
										Cliente
									</p>
									<p className="font-medium">
										{operation.client?.name || "-"}
									</p>
								</div>
								<div>
									<p className="text-sm text-muted-foreground">
										Entidad Financiera
									</p>
									<p className="font-medium">
										{operation.bank?.name || "-"}
									</p>
								</div>
								<div>
									<p className="text-sm text-muted-foreground">
										Estado
									</p>
									<Badge>{operation.status}</Badge>
								</div>
								{operation.merkleRoot && (
									<div className="md:col-span-2">
										<p className="text-sm text-muted-foreground">
											Merkle Root
										</p>
										<p className="font-mono text-xs break-all">
											{operation.merkleRoot}
										</p>
									</div>
								)}
							</div>
						</CardContent>
					</Card>

					{/* Semáforo de Entrega */}
					{(operation.status === "ACTIVE" ||
						operation.status === "LIQUIDATED" ||
						operation.status === "RELEASED") && (
						<Card>
							<CardHeader>
								<CardTitle>Estado de Entrega</CardTitle>
							</CardHeader>
							<CardContent>
								<DeliveryStatusBadge
									status={
										operation.status === "ACTIVE"
											? "RED"
											: "GREEN"
									}
								/>
							</CardContent>
						</Card>
					)}
				</TabsContent>

				{/* Tab: Activos */}
				<TabsContent value="assets">
					<OperationAssetsManager
						assets={operation.assets}
						operationId={operationId}
						canEdit={operation.status === "PENDING"}
						operationStatus={operation.status}
					/>
				</TabsContent>

				{/* Tab: Documentos */}
				<TabsContent value="documents" className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<DocumentStatusCard
							document={cd}
							documentType="CD"
							operationId={operationId}
							canUpload={isWarrant}
							onDocumentUploaded={() => {
								queryClient.invalidateQueries({
									queryKey: ["operations", operationId],
								});
								queryClient.invalidateQueries({
									queryKey: [
										"operations",
										operationId,
										"status",
									],
								});
							}}
						/>
						<DocumentStatusCard
							document={bp}
							documentType="BP"
							operationId={operationId}
							canUpload={isWarrant}
							onDocumentUploaded={() => {
								queryClient.invalidateQueries({
									queryKey: ["operations", operationId],
								});
								queryClient.invalidateQueries({
									queryKey: [
										"operations",
										operationId,
										"status",
									],
								});
							}}
						/>
						{pagare && (
							<DocumentStatusCard
								document={pagare}
								documentType="PROMISSORY_NOTE"
								operationId={operationId}
								canUpload={isClient}
								onDocumentUploaded={() => {
									queryClient.invalidateQueries({
										queryKey: ["operations", operationId],
									});
									queryClient.invalidateQueries({
										queryKey: [
											"operations",
											operationId,
											"status",
										],
									});
								}}
							/>
						)}
					</div>
				</TabsContent>

				{/* Tab: Firmas */}
				<TabsContent value="signatures">
					<SignaturesSection
						operationId={operationId}
						bundle={bundle}
					/>
				</TabsContent>

				{/* Tab: Tokenización */}
				<TabsContent value="tokenization">
					<TokenizationSection operationId={operationId} />
				</TabsContent>

				{/* Tab: Liquidación (Banco) / Carta de Pago (Warrant) */}
				{(isBank || isWarrant) && (
					<TabsContent value="liquidation" className="space-y-4">
						<PaymentLetterSection operationId={operationId} />
						{/* Solo el Banco puede ver la sección de Liquidación completa */}
						{isBank && <LiquidationSection operationId={operationId} />}
					</TabsContent>
				)}
			</Tabs>
		</div>
	);
}
