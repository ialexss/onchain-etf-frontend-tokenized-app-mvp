"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { operationsApi } from "@/lib/api/operations";
import { toast } from "sonner";
import {
	FileText,
	Upload,
	Download,
	CheckCircle,
	Eye,
	Loader2,
	AlertCircle,
	FileCheck,
	ArrowRight,
	XCircle,
} from "lucide-react";
import { DocumentViewer } from "@/components/ui/document-viewer";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

interface AssetBundleReleaseLetterProps {
	assetId: number;
	operationId: number;
	canUpload?: boolean;
	canApprove?: boolean;
}

/**
 * Componente para gestionar la carta de liberación de un Paquete de Activos
 */
export function AssetBundleReleaseLetter({
	assetId,
	operationId,
	canUpload = false,
	canApprove = false,
}: AssetBundleReleaseLetterProps) {
	const queryClient = useQueryClient();
	const [isUploading, setIsUploading] = useState(false);
	const [viewerState, setViewerState] = useState<{
		open: boolean;
		url: string | null;
		title: string;
	}>({
		open: false,
		url: null,
		title: "",
	});

	// Obtener cartas de liberación de la operación
	const { data: releaseLetters = [], isLoading } = useQuery({
		queryKey: ["operations", operationId, "release-letters"],
		queryFn: () => operationsApi.getReleaseLetters(operationId),
		enabled: !!operationId,
	});

	// Filtrar carta que incluya este activo
	// Buscar primero en approvedAssetIds (si está aprobada), luego en assetIds
	const assetReleaseLetter = releaseLetters.find((letter: any) => {
		if (letter.status === "APPROVED" && letter.approvedAssetIds) {
			return letter.approvedAssetIds.includes(assetId);
		}
		return letter.assetIds?.includes(assetId);
	});

	// Subir carta
	const uploadMutation = useMutation({
		mutationFn: async (file: File) => {
			return operationsApi.uploadReleaseLetter(operationId, file, [assetId]);
		},
		onSuccess: () => {
			toast.success("Carta de liberación subida exitosamente");
			queryClient.invalidateQueries({
				queryKey: ["operations", operationId, "release-letters"],
			});
		},
		onError: (error: any) => {
			toast.error(error.response?.data?.message || "Error al subir carta");
		},
		onSettled: () => {
			setIsUploading(false);
		},
	});

	// Generar carta
	const generateMutation = useMutation({
		mutationFn: () => operationsApi.generateReleaseLetter(operationId, [assetId]),
		onSuccess: () => {
			toast.success("Carta de liberación generada exitosamente");
			queryClient.invalidateQueries({
				queryKey: ["operations", operationId, "release-letters"],
			});
		},
		onError: (error: any) => {
			toast.error(error.response?.data?.message || "Error al generar carta");
		},
	});

	const updateStepStatus = (index: number, status: "pending" | "loading" | "success" | "error") => {
		setSteps(prev =>
			prev.map((step, i) => (i === index ? { ...step, status } : step))
		);
	};

	const resetSteps = () => {
		setSteps(prev => prev.map(step => ({ ...step, status: "pending" })));
		setCurrentStepIndex(0);
	};

	// Aprobar carta y transferir tokens
	const approveMutation = useMutation({
		mutationFn: async (letterId: number) => {
			// Simular progreso de pasos
			for (let i = 0; i < steps.length; i++) {
				setCurrentStepIndex(i);
				updateStepStatus(i, "loading");
				
				// Simular delay para cada paso (excepto el último que es la llamada real)
				if (i < steps.length - 1) {
					await new Promise(resolve => setTimeout(resolve, 800));
					updateStepStatus(i, "success");
				}
			}
			
			// Hacer la llamada real al API
			return operationsApi.approveReleaseLetter(letterId);
		},
		onSuccess: () => {
			// Marcar último paso como exitoso
			updateStepStatus(steps.length - 1, "success");
			
			toast.success("Carta de liberación aprobada y tokens transferidos a warehouse exitosamente. El semáforo cambió a GREEN.");
			queryClient.invalidateQueries({
				queryKey: ["operations", operationId, "release-letters"],
			});
			queryClient.invalidateQueries({
				queryKey: ["asset", assetId],
			});
			queryClient.invalidateQueries({
				queryKey: ["assets"],
			});
			queryClient.invalidateQueries({
				queryKey: ["tokens"],
			});
			
			// Cerrar diálogo después de un delay
			setTimeout(() => {
				setShowApproveDialog(false);
				resetSteps();
			}, 1500);
		},
		onError: (error: any) => {
			updateStepStatus(currentStepIndex, "error");
			toast.error(error.response?.data?.message || "Error al aprobar carta y transferir tokens");
		},
	});

	const handleFileUpload = () => {
		const input = document.createElement("input");
		input.type = "file";
		input.accept = ".pdf";
		input.onchange = (e: any) => {
			const file = e.target.files?.[0];
			if (file) {
				setIsUploading(true);
				uploadMutation.mutate(file);
			}
		};
		input.click();
	};

	const handleDownload = async () => {
		if (!assetReleaseLetter) return;
		try {
			const blob = await operationsApi.downloadReleaseLetter(
				operationId,
				assetReleaseLetter.id
			);
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `carta-liberacion-${assetId}.pdf`;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
		} catch (error: any) {
			toast.error("Error al descargar carta");
		}
	};

	const handleView = async () => {
		if (!assetReleaseLetter) return;
		try {
			setViewerState({
				open: true,
				url: null,
				title: "Carta de Liberación",
			});
			const blob = await operationsApi.downloadReleaseLetter(
				operationId,
				assetReleaseLetter.id
			);
			const url = window.URL.createObjectURL(blob);
			setViewerState({
				open: true,
				url: url,
				title: "Carta de Liberación",
			});
		} catch (error: any) {
			toast.error("Error al cargar carta de liberación");
			setViewerState({
				open: false,
				url: null,
				title: "",
			});
		}
	};

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
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle className="flex items-center gap-2">
							<FileText className="h-5 w-5" />
							Carta de Liberación
						</CardTitle>
						<CardDescription>
							Documento para liberar este activo específico
						</CardDescription>
					</div>
					{assetReleaseLetter && (
						<Badge
							variant={
								assetReleaseLetter.status === "APPROVED" ? "default" : "secondary"
							}
						>
							{assetReleaseLetter.status === "APPROVED" ? (
								<>
									<CheckCircle className="h-3 w-3 mr-1" />
									Aprobada
								</>
							) : assetReleaseLetter.status === "REJECTED" ? (
								"Rechazada"
							) : (
								"Pendiente"
							)}
						</Badge>
					)}
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				{!assetReleaseLetter ? (
					<>
						{/* No hay carta */}
						<Alert>
							<AlertCircle className="h-4 w-4" />
							<AlertDescription>
								No se ha subido carta de liberación para este activo
							</AlertDescription>
						</Alert>

						<div className="grid grid-cols-2 gap-3">
							{canUpload && (
								<Button
									variant="outline"
									onClick={handleFileUpload}
									disabled={isUploading || uploadMutation.isPending}
								>
									{isUploading || uploadMutation.isPending ? (
										<Loader2 className="h-4 w-4 animate-spin mr-2" />
									) : (
										<Upload className="h-4 w-4 mr-2" />
									)}
									Subir Carta
								</Button>
							)}

							{canUpload && (
								<Button
									variant="outline"
									onClick={() => generateMutation.mutate()}
									disabled={generateMutation.isPending}
								>
									{generateMutation.isPending ? (
										<Loader2 className="h-4 w-4 animate-spin mr-2" />
									) : (
										<FileText className="h-4 w-4 mr-2" />
									)}
									Generar Carta
								</Button>
							)}
						</div>
					</>
				) : (
					<>
						{/* Hay carta */}
						<div className="space-y-3">
							<div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
								<div className="flex items-center gap-2">
									<FileCheck className="h-5 w-5 text-green-500" />
									<div>
										<p className="font-medium text-sm">Carta Disponible</p>
										<p className="text-xs text-muted-foreground">
											Subida el{" "}
											{new Date(assetReleaseLetter.createdAt).toLocaleDateString()}
										</p>
									</div>
								</div>
							</div>

							{assetReleaseLetter.status !== "APPROVED" && (
								<Alert>
									<AlertCircle className="h-4 w-4" />
									<AlertDescription>
										{assetReleaseLetter.status === "REJECTED"
											? "La carta fue rechazada. Debe subir o generar una nueva carta."
											: "La carta debe ser aprobada para poder liberar el activo"}
									</AlertDescription>
								</Alert>
							)}

							<div className="grid grid-cols-2 gap-3">
								<Button
									variant="outline"
									size="sm"
									onClick={handleDownload}
								>
									<Download className="h-4 w-4 mr-2" />
									Descargar
								</Button>

								<Button
									variant="outline"
									size="sm"
									onClick={handleView}
								>
									<Eye className="h-4 w-4 mr-2" />
									Ver
								</Button>
							</div>

							{canApprove && assetReleaseLetter.status !== "APPROVED" && (
								<Button
									className="w-full"
									onClick={() => {
										setShowApproveDialog(true);
										resetSteps();
										approveMutation.mutate(assetReleaseLetter.id);
									}}
									disabled={approveMutation.isPending || assetReleaseLetter.status === "REJECTED"}
								>
									{approveMutation.isPending ? (
										<Loader2 className="h-4 w-4 animate-spin mr-2" />
									) : (
										<CheckCircle className="h-4 w-4 mr-2" />
									)}
									Aprobar y Transferir Tokens
								</Button>
							)}
						</div>
					</>
				)}
			</CardContent>
			<DocumentViewer
				isOpen={viewerState.open}
				onClose={() => {
					if (viewerState.url) {
						window.URL.revokeObjectURL(viewerState.url);
					}
				setViewerState((prev) => ({ ...prev, open: false, url: null }));
			}}
			url={viewerState.url}
			title={viewerState.title}
		/>

		{/* Dialog de progreso para aprobar y transferir */}
		<Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<FileCheck className="h-5 w-5" />
						Aprobando y Transfiriendo Tokens
					</DialogTitle>
					<DialogDescription>
						Procesando carta de liberación y transferencia de tokens
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-4">
					{/* Progress bar */}
					<div className="space-y-2">
						<Progress value={((currentStepIndex + 1) / steps.length) * 100} className="h-2" />
						<p className="text-xs text-muted-foreground text-center">
							{steps.every(step => step.status === "success")
								? "¡Completado!"
								: steps.some(step => step.status === "error")
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
									<div className="flex-shrink-0">
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
					{(steps.every(step => step.status === "success") || steps.some(step => step.status === "error")) && (
						<div className="flex justify-end gap-2 pt-2">
							<Button
								variant="outline"
								onClick={() => {
									setShowApproveDialog(false);
									resetSteps();
								}}
							>
								Cerrar
							</Button>
							{steps.some(step => step.status === "error") && (
								<Button onClick={() => {
									if (assetReleaseLetter) {
										resetSteps();
										approveMutation.mutate(assetReleaseLetter.id);
									}
								}}>
									Reintentar
								</Button>
							)}
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	</Card>
);
}
