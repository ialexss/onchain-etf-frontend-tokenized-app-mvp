"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { operationsApi } from "@/lib/api/operations";
import { toast } from "sonner";
import {
	FileText,
	Upload,
	CheckCircle,
	XCircle,
	Loader2,
	FileCheck,
	FileX,
	Eye,
	AlertCircle,
	FileSignature,
} from "lucide-react";
import { DocumentViewer } from "@/components/ui/document-viewer";

interface AssetDocumentUploaderProps {
	assetId: number;
	operationId: number;
	canUpload?: boolean;
	trigger?: React.ReactNode;
}

/**
 * Componente reutilizable para subir documentos a un Paquete de Activos
 * y gestionar las firmas requeridas
 */
export function AssetDocumentUploader({
	assetId,
	operationId,
	canUpload = false,
	trigger,
}: AssetDocumentUploaderProps) {
	const queryClient = useQueryClient();
	const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
	const [viewerState, setViewerState] = useState<{
		open: boolean;
		url: string | null;
		title: string;
	}>({
		open: false,
		url: null,
		title: "",
	});

	// Obtener estado de documentos del bundle
	const { data: bundleStatus, isLoading } = useQuery({
		queryKey: ["asset-token-bundle", assetId, "status"],
		queryFn: () => operationsApi.getAssetTokenBundleStatus(assetId),
		enabled: !!assetId,
	});

	const validation = bundleStatus?.validation;
	const documents = bundleStatus?.documents || {} as any;
	
	// Estado para mostrar feedback visual durante el refetch
	const isRefetching = queryClient.isFetching({ 
		queryKey: ["asset-token-bundle", assetId, "status"],
		exact: true 
	}) > 0;
	
	// Forzar refetch cuando el popover se abre
	const handleOpenChange = (open: boolean) => {
		if (open) {
			queryClient.invalidateQueries({ 
				queryKey: ["asset-token-bundle", assetId, "status"],
				exact: true 
			});
		}
	};

	// Subir documento
	const uploadMutation = useMutation({
		mutationFn: async ({ file, type }: { file: File; type: string }) => {
			if (!operationId) throw new Error("Operation ID required");

			if (type === "CD") {
				return operationsApi.uploadCD(operationId, file, assetId);
			} else if (type === "BP") {
				return operationsApi.uploadBP(operationId, file, assetId);
			} else if (type === "PAGARE") {
				return operationsApi.uploadPagare(operationId, file, assetId);
			}
			throw new Error("Tipo de documento no válido");
		},
		onSuccess: async (_, variables) => {
			toast.success(`${variables.type} subido exitosamente`);
			
			// Pequeño delay para dar tiempo al backend a procesar
			await new Promise((resolve) => setTimeout(resolve, 300));
			
			// Invalidar y refetch en el orden correcto
			// 1. Cancelar queries en progreso
			await queryClient.cancelQueries({ 
				queryKey: ["asset-token-bundle", assetId, "status"] 
			});
			
			// 2. Invalidar cache
			await queryClient.invalidateQueries({ 
				queryKey: ["asset-token-bundle", assetId, "status"],
				exact: true
			});
			
			// 3. Forzar refetch inmediato
			await queryClient.refetchQueries({ 
				queryKey: ["asset-token-bundle", assetId, "status"],
				exact: true,
				type: "active"
			});
			
			// 4. Invalidar queries relacionadas (sin esperar)
			queryClient.invalidateQueries({ queryKey: ["asset-token-bundle", assetId] });
			queryClient.invalidateQueries({ queryKey: ["operations", operationId] });
			queryClient.invalidateQueries({ queryKey: ["operations", operationId, "status"] });
			queryClient.invalidateQueries({ queryKey: ["asset", assetId] });
			queryClient.invalidateQueries({ queryKey: ["assets"] });
		},
		onError: (error: any) => {
			toast.error(error.response?.data?.message || "Error al subir documento");
			setUploadingDoc(null);
		},
		onSettled: () => {
			// Pequeño delay antes de quitar el spinner para dar feedback visual
			setTimeout(() => {
				setUploadingDoc(null);
			}, 500);
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

	const getDocStatus = (docType: "CD" | "BP" | "PAGARE") => {
		if (docType === "CD") {
			// Verificar existencia desde múltiples fuentes: validation y documents directamente
			const cdExists = validation?.cdExists ?? (documents.cd !== null && documents.cd !== undefined && !!documents.cd.pdfPath);
			return {
				exists: cdExists,
				warehouseSigned: validation?.cdSignedByWarehouse ?? documents.cd?.signedByWarehouse ?? false,
				clientSigned: validation?.cdSignedByClient ?? documents.cd?.signedByClient ?? false,
				doc: documents.cd,
			};
		} else if (docType === "BP") {
			const bpExists = validation?.bpExists ?? (documents.bp !== null && documents.bp !== undefined && !!documents.bp.pdfPath);
			return {
				exists: bpExists,
				warehouseSigned: validation?.bpSignedByWarehouse ?? documents.bp?.signedByWarehouse ?? false,
				clientSigned: validation?.bpSignedByClient ?? documents.bp?.signedByClient ?? false,
				doc: documents.bp,
			};
		} else {
			const pagareExists = validation?.pagareExists ?? (documents.pagare !== null && documents.pagare !== undefined && !!documents.pagare.pdfPath);
			return {
				exists: pagareExists,
				clientSigned: validation?.pagareSignedByClient ?? documents.pagare?.signedByClient ?? false,
				bankSigned: validation?.pagareSignedByBank ?? documents.pagare?.signedByBank ?? false,
				doc: documents.pagare,
			};
		}
	};

	const renderDocumentRow = (
		name: string,
		type: "CD" | "BP" | "PAGARE",
		optional = false
	) => {
		const status = getDocStatus(type);
		const isPagare = type === "PAGARE";

		// Determinar el ícono correcto:
		// - Verde si existe
		// - Gris/neutro si es opcional y no existe
		// - Rojo si es requerido y no existe
		const getStatusIcon = () => {
			if (status.exists) {
				return <CheckCircle className="h-4 w-4 text-green-500" />;
			}
			if (optional) {
				// Opcional y no existe = icono neutro (guión)
				return <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />;
			}
			// Requerido y no existe = rojo
			return <XCircle className="h-4 w-4 text-red-500" />;
		};

		return (
			<div key={type} className="space-y-2">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						{getStatusIcon()}
						<span className="text-sm font-medium">
							{name}
							{optional && (
								<span className="text-xs text-muted-foreground ml-1">
									(opcional)
								</span>
							)}
						</span>
					</div>
					{!status.exists && canUpload && (
						<Button
							size="sm"
							variant="ghost"
							onClick={() => handleFileUpload(type)}
							disabled={uploadingDoc === type}
						>
							{uploadingDoc === type ? (
								<Loader2 className="h-3 w-3 animate-spin" />
							) : (
								<Upload className="h-3 w-3" />
							)}
						</Button>
					)}
					{status.exists && status.doc && (
						<Button
							size="sm"
							variant="ghost"
							onClick={() => setViewerState({
								open: true,
								url: status.doc.documentUrl,
								title: name,
							})}
						>
							<Eye className="h-3 w-3" />
						</Button>
					)}
				</div>

				{/* Firmas */}
				{status.exists && (
					<div className="pl-6 space-y-1">
						{!isPagare && (
							<>
								<div className="flex items-center justify-between text-xs">
									<span className="text-muted-foreground">
										Warehouse
									</span>
									{status.warehouseSigned ? (
										<Badge variant="default" className="h-5 text-xs">
											<FileCheck className="h-3 w-3 mr-1" />
											Firmado
										</Badge>
									) : (
										<Badge variant="outline" className="h-5 text-xs">
											<FileX className="h-3 w-3 mr-1" />
											Pendiente
										</Badge>
									)}
								</div>
								<div className="flex items-center justify-between text-xs">
									<span className="text-muted-foreground">Cliente</span>
									{status.clientSigned ? (
										<Badge variant="default" className="h-5 text-xs">
											<FileCheck className="h-3 w-3 mr-1" />
											Firmado
										</Badge>
									) : (
										<Badge variant="outline" className="h-5 text-xs">
											<FileX className="h-3 w-3 mr-1" />
											Pendiente
										</Badge>
									)}
								</div>
							</>
						)}
						{isPagare && (
							<>
								<div className="flex items-center justify-between text-xs">
									<span className="text-muted-foreground">Cliente</span>
									{status.clientSigned ? (
										<Badge variant="default" className="h-5 text-xs">
											<FileCheck className="h-3 w-3 mr-1" />
											Firmado
										</Badge>
									) : (
										<Badge variant="outline" className="h-5 text-xs">
											<FileX className="h-3 w-3 mr-1" />
											Pendiente
										</Badge>
									)}
								</div>
								<div className="flex items-center justify-between text-xs">
									<span className="text-muted-foreground">Banco</span>
									{status.bankSigned ? (
										<Badge variant="default" className="h-5 text-xs">
											<FileCheck className="h-3 w-3 mr-1" />
											Firmado
										</Badge>
									) : (
										<Badge variant="outline" className="h-5 text-xs">
											<FileX className="h-3 w-3 mr-1" />
											Pendiente
										</Badge>
									)}
								</div>
							</>
						)}
					</div>
				)}
			</div>
		);
	};

	// Separar validación de DOCUMENTOS (existen) vs FIRMAS (están firmados)
	const documentsUploaded = () => {
		// Verificar desde múltiples fuentes: validation y documents directamente
		const cdExists = validation?.cdExists ?? (documents?.cd !== null && documents?.cd !== undefined);
		const bpExists = validation?.bpExists ?? (documents?.bp !== null && documents?.bp !== undefined);
		// Solo verificar que CD y BP existan (Pagaré es opcional)
		return cdExists && bpExists;
	};
	
	const allSignaturesComplete = () => {
		if (!documentsUploaded()) return false;
		// Verificar firmas desde múltiples fuentes
		const cdSigned = (validation?.cdSignedByWarehouse ?? documents?.cd?.signedByWarehouse ?? false) && 
			(validation?.cdSignedByClient ?? documents?.cd?.signedByClient ?? false);
		const bpSigned = (validation?.bpSignedByWarehouse ?? documents?.bp?.signedByWarehouse ?? false) && 
			(validation?.bpSignedByClient ?? documents?.bp?.signedByClient ?? false);
		// Pagaré: OK si no existe, o si existe y está firmado por cliente
		const pagareExists = validation?.pagareExists ?? (documents?.pagare !== null && documents?.pagare !== undefined);
		const pagareSigned = !pagareExists || 
			(validation?.pagareSignedByClient ?? documents?.pagare?.signedByClient ?? false);
		return cdSigned && bpSigned && pagareSigned;
	};
	
	// Para el badge: completo = documentos subidos Y firmados
	const allComplete = documentsUploaded() && allSignaturesComplete();

	return (
		<>
			<Popover onOpenChange={handleOpenChange}>
				<PopoverTrigger asChild>
					{trigger || (
						<Button variant="outline" size="sm">
							<FileText className="h-4 w-4 mr-2" />
							Documentos
							{allComplete && (
								<CheckCircle className="h-3 w-3 ml-2 text-green-500" />
							)}
						</Button>
					)}
				</PopoverTrigger>
				<PopoverContent className="w-80" align="start">
					{isLoading ? (
						<div className="flex items-center justify-center py-4">
							<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
						</div>
					) : (
						<div className="space-y-4">
							<div>
								<div className="flex items-center justify-between">
									<h4 className="font-semibold text-sm mb-1">
										Documentos del Bundle
									</h4>
									{isRefetching && (
										<Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
									)}
								</div>
								<p className="text-xs text-muted-foreground">
									Gestiona los documentos y firmas de este activo
								</p>
							</div>

							<Separator />

							{/* Estado General */}
							{!documentsUploaded() && (
								<Alert variant="destructive">
									<XCircle className="h-4 w-4" />
									<AlertDescription>
										Documentos incompletos. Debes subir CD y BP.
									</AlertDescription>
								</Alert>
							)}
							{documentsUploaded() && !allSignaturesComplete() && (
								<Alert>
									<FileSignature className="h-4 w-4" />
									<AlertDescription>
										Documentos subidos. Firmas pendientes.
									</AlertDescription>
								</Alert>
							)}
							{allComplete && (
								<Alert className="bg-green-50 border-green-200">
									<CheckCircle className="h-4 w-4 text-green-600" />
									<AlertDescription className="text-green-800">
										Bundle completo y listo para tokenizar
									</AlertDescription>
								</Alert>
							)}

							{/* Documentos */}
							<div className="space-y-3">
								{renderDocumentRow("Certificado de Depósito", "CD")}
								<Separator />
								{renderDocumentRow("Bono de Prenda", "BP")}
								<Separator />
								{renderDocumentRow("Pagaré", "PAGARE", true)}
							</div>

							{/* Estado general */}
							{allComplete ? (
								<div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950 rounded text-green-700 dark:text-green-300 text-xs">
									<CheckCircle className="h-4 w-4" />
									<span className="font-medium">Documentos completos</span>
								</div>
							) : (
								<div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-950 rounded text-amber-700 dark:text-amber-300 text-xs">
									<AlertCircle className="h-4 w-4" />
									<span className="font-medium">Documentos incompletos</span>
								</div>
							)}
						</div>
					)}
				</PopoverContent>
			</Popover>
			<DocumentViewer
				isOpen={viewerState.open}
				onClose={() => setViewerState((prev) => ({ ...prev, open: false }))}
				url={viewerState.url}
				title={viewerState.title}
			/>
		</>
	);
}
