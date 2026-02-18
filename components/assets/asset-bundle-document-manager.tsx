"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { operationsApi } from "@/lib/api/operations";
import { toast } from "sonner";
import {
	FileText,
	Upload,
	Download,
	CheckCircle,
	XCircle,
	FileCheck,
	FileX,
	Loader2,
	AlertCircle,
	Eye,
} from "lucide-react";
import { DocumentViewer } from "@/components/ui/document-viewer";

interface AssetBundleDocumentManagerProps {
	assetId: number;
	operationId?: number;
	canUpload?: boolean;
	onDocumentUploaded?: () => void;
}

/**
 * Componente para gestionar documentos de un Paquete de Activos
 * Muestra el estado de CD, BP y Pagaré (opcional) con sus firmas
 */
export function AssetBundleDocumentManager({
	assetId,
	operationId,
	canUpload = false,
	onDocumentUploaded,
}: AssetBundleDocumentManagerProps) {
	const queryClient = useQueryClient();
	const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

	// Obtener estado del bundle con documentos
	const { data: bundleStatus, isLoading } = useQuery({
		queryKey: ["asset-bundle", assetId, "documents"],
		queryFn: () => operationsApi.getAssetTokenBundleStatus(assetId),
		enabled: !!assetId,
	});

	const documents = bundleStatus?.documents || {} as any;
	const validation = bundleStatus?.validation || {} as any;

	// State para el visor de documentos
	const [viewerState, setViewerState] = useState<{
		isOpen: boolean;
		url: string | null;
		title: string;
	}>({
		isOpen: false,
		url: null,
		title: "",
	});

	const openDocument = (url: string, title: string) => {
		setViewerState({
			isOpen: true,
			url,
			title,
		});
	};

	// Subir documento
	const uploadMutation = useMutation({
		mutationFn: async ({ file, type }: { file: File; type: string }) => {
			if (!operationId) throw new Error("Operation ID required");

			// Usar el endpoint correspondiente según el tipo, pasando el assetId
			if (type === "CD") {
				return operationsApi.uploadCD(operationId, file, assetId);
			} else if (type === "BP") {
				return operationsApi.uploadBP(operationId, file, assetId);
			} else if (type === "PAGARE") {
				return operationsApi.uploadPagare(operationId, file, assetId);
			}
			throw new Error("Tipo de documento no válido");
		},
		onSuccess: (_, variables) => {
			toast.success(`${variables.type} subido exitosamente`);
			queryClient.invalidateQueries({ queryKey: ["asset-bundle", assetId] });
			onDocumentUploaded?.();
		},
		onError: (error: any) => {
			toast.error(error.response?.data?.message || "Error al subir documento");
		},
		onSettled: () => {
			setUploadingDoc(null);
		},
	});

	const handleFileUpload = (type: string) => {
		const input = document.createElement("input");
		input.type = "file";
		input.accept = ".pdf";
		input.onchange = (e: any) => {
			const file = e.target.files?.[0];
			if (file) {
				setUploadingDoc(type);
				uploadMutation.mutate({ file, type });
			}
		};
		input.click();
	};

	// Calcular progreso de documentos
	const calculateProgress = () => {
		let completed = 0;
		let total = 2; // CD y BP son obligatorios

		if (validation.cdExists && validation.cdSignedByWarehouse && validation.cdSignedByClient) completed++;
		if (validation.bpExists && validation.bpSignedByWarehouse && validation.bpSignedByClient) completed++;

		// Si existe pagaré, contarlo
		if (validation.pagareExists !== null) {
			total++;
			if (validation.pagareExists && validation.pagareSignedByClient && validation.pagareSignedByBank) {
				completed++;
			}
		}

		return total > 0 ? Math.round((completed / total) * 100) : 0;
	};

	const progress = calculateProgress();

	if (isLoading) {
		return (
			<Card>
				<CardContent className="py-8">
					<div className="flex items-center justify-center">
						<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<>
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle className="flex items-center gap-2">
								<FileText className="h-5 w-5" />
								Documentos del Bundle
							</CardTitle>
							<CardDescription>
								Gestión de documentos del Paquete de Activos
							</CardDescription>
						</div>
						<Badge variant={progress === 100 ? "default" : "secondary"}>
							{progress}% completo
						</Badge>
					</div>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* Barra de progreso */}
					<div>
						<Progress value={progress} className="h-2" />
					</div>

					{/* Certificado de Depósito */}
					<div className="border rounded-lg p-4">
						<div className="flex items-center justify-between mb-3">
							<div className="flex items-center gap-2">
								{validation.cdExists ? (
									<CheckCircle className="h-5 w-5 text-green-500" />
								) : (
									<XCircle className="h-5 w-5 text-red-500" />
								)}
								<div>
									<h3 className="font-medium">Certificado de Depósito (CD)</h3>
									<p className="text-xs text-muted-foreground">Documento obligatorio</p>
								</div>
							</div>
							{!validation.cdExists && canUpload && (
								<Button
									size="sm"
									variant="outline"
									onClick={() => handleFileUpload("CD")}
									disabled={uploadingDoc === "CD"}
								>
									{uploadingDoc === "CD" ? (
										<Loader2 className="h-4 w-4 animate-spin" />
									) : (
										<Upload className="h-4 w-4" />
									)}
								</Button>
							)}
						</div>

						{validation.cdExists && (
							<div className="space-y-2 mt-3 pt-3 border-t">
								<div className="flex items-center justify-between text-sm">
									<span className="flex items-center gap-1">
										{validation.cdSignedByWarehouse ? (
											<FileCheck className="h-4 w-4 text-green-500" />
										) : (
											<FileX className="h-4 w-4 text-red-500" />
										)}
										Firma Warehouse
									</span>
									<Badge variant={validation.cdSignedByWarehouse ? "default" : "outline"}>
										{validation.cdSignedByWarehouse ? "Firmado" : "Pendiente"}
									</Badge>
								</div>
								<div className="flex items-center justify-between text-sm">
									<span className="flex items-center gap-1">
										{validation.cdSignedByClient ? (
											<FileCheck className="h-4 w-4 text-green-500" />
										) : (
											<FileX className="h-4 w-4 text-red-500" />
										)}
										Firma Cliente
									</span>
									<Badge variant={validation.cdSignedByClient ? "default" : "outline"}>
										{validation.cdSignedByClient ? "Firmado" : "Pendiente"}
									</Badge>
								</div>
								{documents.cd && (
									<Button
										size="sm"
										variant="ghost"
										className="w-full mt-2"
										onClick={() => openDocument(documents.cd.documentUrl, "Certificado de Depósito (CD)")}
									>
										<Eye className="h-4 w-4 mr-2" />
										Ver documento
									</Button>
								)}
							</div>
						)}
					</div>

					{/* Bono de Prenda */}
					<div className="border rounded-lg p-4">
						<div className="flex items-center justify-between mb-3">
							<div className="flex items-center gap-2">
								{validation.bpExists ? (
									<CheckCircle className="h-5 w-5 text-green-500" />
								) : (
									<XCircle className="h-5 w-5 text-red-500" />
								)}
								<div>
									<h3 className="font-medium">Bono de Prenda (BP)</h3>
									<p className="text-xs text-muted-foreground">Documento obligatorio</p>
								</div>
							</div>
							{!validation.bpExists && canUpload && (
								<Button
									size="sm"
									variant="outline"
									onClick={() => handleFileUpload("BP")}
									disabled={uploadingDoc === "BP"}
								>
									{uploadingDoc === "BP" ? (
										<Loader2 className="h-4 w-4 animate-spin" />
									) : (
										<Upload className="h-4 w-4" />
									)}
								</Button>
							)}
						</div>

						{validation.bpExists && (
							<div className="space-y-2 mt-3 pt-3 border-t">
								<div className="flex items-center justify-between text-sm">
									<span className="flex items-center gap-1">
										{validation.bpSignedByWarehouse ? (
											<FileCheck className="h-4 w-4 text-green-500" />
										) : (
											<FileX className="h-4 w-4 text-red-500" />
										)}
										Firma Warehouse
									</span>
									<Badge variant={validation.bpSignedByWarehouse ? "default" : "outline"}>
										{validation.bpSignedByWarehouse ? "Firmado" : "Pendiente"}
									</Badge>
								</div>
								<div className="flex items-center justify-between text-sm">
									<span className="flex items-center gap-1">
										{validation.bpSignedByClient ? (
											<FileCheck className="h-4 w-4 text-green-500" />
										) : (
											<FileX className="h-4 w-4 text-red-500" />
										)}
										Firma Cliente
									</span>
									<Badge variant={validation.bpSignedByClient ? "default" : "outline"}>
										{validation.bpSignedByClient ? "Firmado" : "Pendiente"}
									</Badge>
								</div>
								{documents.bp && (
									<Button
										size="sm"
										variant="ghost"
										className="w-full mt-2"
										onClick={() => openDocument(documents.bp.documentUrl, "Bono de Prenda (BP)")}
									>
										<Eye className="h-4 w-4 mr-2" />
										Ver documento
									</Button>
								)}
							</div>
						)}
					</div>

					{/* Pagaré (opcional) */}
					{validation.pagareExists !== null && (
						<div className="border rounded-lg p-4">
							<div className="flex items-center justify-between mb-3">
								<div className="flex items-center gap-2">
									{validation.pagareExists ? (
										<CheckCircle className="h-5 w-5 text-green-500" />
									) : (
										<XCircle className="h-5 w-5 text-yellow-500" />
									)}
									<div>
										<h3 className="font-medium">Pagaré</h3>
										<p className="text-xs text-muted-foreground">Documento opcional</p>
									</div>
								</div>
								{!validation.pagareExists && canUpload && (
									<Button
										size="sm"
										variant="outline"
										onClick={() => handleFileUpload("PAGARE")}
										disabled={uploadingDoc === "PAGARE"}
									>
										{uploadingDoc === "PAGARE" ? (
											<Loader2 className="h-4 w-4 animate-spin" />
										) : (
											<Upload className="h-4 w-4" />
										)}
									</Button>
								)}
							</div>

							{validation.pagareExists && (
								<div className="space-y-2 mt-3 pt-3 border-t">
									<div className="flex items-center justify-between text-sm">
										<span className="flex items-center gap-1">
											{validation.pagareSignedByClient ? (
												<FileCheck className="h-4 w-4 text-green-500" />
											) : (
												<FileX className="h-4 w-4 text-red-500" />
											)}
											Firma Cliente
										</span>
										<Badge variant={validation.pagareSignedByClient ? "default" : "outline"}>
											{validation.pagareSignedByClient ? "Firmado" : "Pendiente"}
										</Badge>
									</div>
									<div className="flex items-center justify-between text-sm">
										<span className="flex items-center gap-1">
											{validation.pagareSignedByBank ? (
												<FileCheck className="h-4 w-4 text-green-500" />
											) : (
												<FileX className="h-4 w-4 text-red-500" />
											)}
											Firma Banco
										</span>
										<Badge variant={validation.pagareSignedByBank ? "default" : "outline"}>
											{validation.pagareSignedByBank ? "Firmado" : "Pendiente"}
										</Badge>
									</div>
									{documents.pagare && (
										<Button
											size="sm"
											variant="ghost"
											className="w-full mt-2"
											onClick={() => openDocument(documents.pagare.documentUrl, "Pagaré")}
										>
											<Eye className="h-4 w-4 mr-2" />
											Ver documento
										</Button>
									)}
								</div>
							)}
						</div>
					)}

					{/* Alerta de estado */}
					{!validation.cdExists || !validation.bpExists ? (
						<Alert variant="destructive">
							<AlertCircle className="h-4 w-4" />
							<AlertDescription>
								<div className="space-y-1">
									<p className="font-medium text-sm">Documentos faltantes:</p>
									<ul className="list-disc list-inside text-xs space-y-0.5">
										{!validation.cdExists && <li>Certificado de Depósito (CD)</li>}
										{!validation.bpExists && <li>Bono de Prenda (BP)</li>}
									</ul>
								</div>
							</AlertDescription>
						</Alert>
					) : progress < 100 ? (
						<Alert>
							<AlertCircle className="h-4 w-4" />
							<AlertDescription>
								Documentos subidos. Faltan firmas pendientes para completar el bundle.
							</AlertDescription>
						</Alert>
					) : (
						<Alert className="border-green-500 bg-green-50 dark:bg-green-950">
							<CheckCircle className="h-4 w-4 text-green-500" />
							<AlertDescription className="text-green-700 dark:text-green-300">
								Todos los documentos están completos y firmados
							</AlertDescription>
						</Alert>
					)}
				</CardContent>
			</Card>

			<DocumentViewer
				isOpen={viewerState.isOpen}
				onClose={() => setViewerState({ ...viewerState, isOpen: false })}
				url={viewerState.url}
				title={viewerState.title}
			/>
		</>
	);
}
