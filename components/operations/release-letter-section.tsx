"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
	FileText,
	Upload,
	FileCheck,
	CheckCircle,
	XCircle,
	Loader2,
	AlertCircle,
	Download,
	Eye,
	Package,
	ArrowRight,
	Hash,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/lib/auth/auth-context";
import { Asset } from "@/types/asset";

interface ReleaseLetterSectionProps {
	operationId: number;
	assets?: Asset[];
}

/**
 * ReleaseLetterSection
 * 
 * Reemplaza PaymentLetterSection para permitir liberación parcial de Paquete de Activoss.
 * Permite seleccionar Paquete de Activoss específicos para aprobar su liberación.
 */
export function ReleaseLetterSection({
	operationId,
	assets = [],
}: ReleaseLetterSectionProps) {
	const { user } = useAuth();
	const queryClient = useQueryClient();
	const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
	const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [selectedAssetIds, setSelectedAssetIds] = useState<number[]>([]);
	const [viewingPdf, setViewingPdf] = useState(false);
	const [pdfUrl, setPdfUrl] = useState<string | null>(null);
	const [downloading, setDownloading] = useState(false);
	const [showApproveDialog, setShowApproveDialog] = useState(false);
	const [currentStepIndex, setCurrentStepIndex] = useState(0);
	const [steps, setSteps] = useState<Array<{
		id: string;
		label: string;
		icon: any;
		status: "pending" | "loading" | "success" | "error";
	}>>([
		{
			id: "approve",
			label: "Aprobando carta de liberación",
			icon: FileCheck,
			status: "pending",
		},
		{
			id: "transfer",
			label: "Transfiriendo tokens a warehouse",
			icon: ArrowRight,
			status: "pending",
		},
		{
			id: "update",
			label: "Actualizando estado de activos (GREEN)",
			icon: CheckCircle,
			status: "pending",
		},
	]);

	// Obtener todas las ReleaseLetters de la operación
	const { data: releaseLetters, isLoading } = useQuery({
		queryKey: ["release-letters", operationId],
		queryFn: () => operationsApi.getReleaseLetters(operationId),
		enabled: !!operationId,
	});

	// Obtener Paquete de Activoss aprobados
	const { data: approvedAssetIds = [] } = useQuery({
		queryKey: ["approved-asset-token-bundles", operationId],
		queryFn: () => operationsApi.getApprovedAssetTokenBundles(operationId),
		enabled: !!operationId,
	});

	// Filtrar activos tokenizados (solo estos pueden ser aprobados)
	const tokenizedAssets = assets.filter((asset) => asset.token);

	const uploadMutation = useMutation({
		mutationFn: (data: { file: File; assetIds: number[] }) =>
			operationsApi.uploadReleaseLetter(operationId, data.file, data.assetIds),
		onSuccess: () => {
			toast.success("Carta de liberación subida exitosamente. Aprueba la carta para poder transferir los tokens.");
			queryClient.invalidateQueries({
				queryKey: ["release-letters", operationId],
			});
			queryClient.invalidateQueries({
				queryKey: ["approved-asset-token-bundles", operationId],
			});
			queryClient.invalidateQueries({
				queryKey: ["operations", operationId],
			});
			queryClient.invalidateQueries({
				queryKey: ["assets"],
			});
			setUploadDialogOpen(false);
			setSelectedFile(null);
			setSelectedAssetIds([]);
		},
		onError: (error: any) => {
			toast.error(
				error.response?.data?.message ||
					"Error al subir la carta de liberación"
			);
		},
	});

	const generateMutation = useMutation({
		mutationFn: (assetIds: number[]) =>
			operationsApi.generateReleaseLetter(operationId, assetIds),
		onSuccess: () => {
			toast.success("Carta de liberación generada exitosamente. Aprueba la carta para poder transferir los tokens.");
			queryClient.invalidateQueries({
				queryKey: ["release-letters", operationId],
			});
			queryClient.invalidateQueries({
				queryKey: ["approved-asset-token-bundles", operationId],
			});
			queryClient.invalidateQueries({
				queryKey: ["operations", operationId],
			});
			queryClient.invalidateQueries({
				queryKey: ["assets"],
			});
			setGenerateDialogOpen(false);
			setSelectedAssetIds([]);
		},
		onError: (error: any) => {
			toast.error(
				error.response?.data?.message ||
					"Error al generar la carta de liberación"
			);
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

	const approveMutation = useMutation({
		mutationFn: async (releaseLetterId: number) => {
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
			return operationsApi.approveReleaseLetter(releaseLetterId);
		},
		onSuccess: () => {
			// Marcar último paso como exitoso
			updateStepStatus(steps.length - 1, "success");
			
			toast.success("Carta de liberación aprobada y tokens transferidos a warehouse exitosamente. El semáforo cambió a GREEN.");
			queryClient.invalidateQueries({
				queryKey: ["release-letters", operationId],
			});
			queryClient.invalidateQueries({
				queryKey: ["approved-asset-token-bundles", operationId],
			});
			queryClient.invalidateQueries({
				queryKey: ["operations", operationId],
			});
			// Invalidar también los assets para actualizar deliveryStatus
			queryClient.invalidateQueries({
				queryKey: ["assets"],
			});
			// Invalidar tokens para actualizar el estado
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
			toast.error(
				error.response?.data?.message ||
					"Error al aprobar la carta de liberación y transferir tokens"
			);
		},
	});

	const handleUpload = () => {
		if (!selectedFile) {
			toast.error("Por favor selecciona un archivo");
			return;
		}
		if (selectedAssetIds.length === 0) {
			toast.error("Por favor selecciona al menos un Paquete de Activos");
			return;
		}
		uploadMutation.mutate({ file: selectedFile, assetIds: selectedAssetIds });
	};

	const handleGenerate = () => {
		if (selectedAssetIds.length === 0) {
			toast.error("Por favor selecciona al menos un Paquete de Activos");
			return;
		}
		generateMutation.mutate(selectedAssetIds);
	};

	const handleToggleAsset = (assetId: number, checked: boolean) => {
		if (checked) {
			setSelectedAssetIds([...selectedAssetIds, assetId]);
		} else {
			setSelectedAssetIds(selectedAssetIds.filter((id) => id !== assetId));
		}
	};

	const handleViewPdf = async (releaseLetterId: number) => {
		try {
			setDownloading(true);
			const blob = await operationsApi.downloadReleaseLetter(
				operationId,
				releaseLetterId
			);
			const url = URL.createObjectURL(blob);
			setPdfUrl(url);
			setViewingPdf(true);
		} catch (error: any) {
			toast.error(
				error.response?.data?.message || "Error al descargar la carta de liberación"
			);
		} finally {
			setDownloading(false);
		}
	};

	const isBank = user?.organizations?.some((org) => org.type === "BANK");

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<FileText className="h-5 w-5" />
						Cartas de Liberación
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-center py-8">
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
					<CardTitle className="flex items-center gap-2">
						<FileText className="h-5 w-5" />
						Cartas de Liberación
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* Información */}
					<Alert>
						<AlertCircle className="h-4 w-4" />
						<AlertDescription>
							Las cartas de liberación permiten aprobar la liberación de Paquete de Activoss
							específicos dentro de la operación, permitiendo liberación parcial.
						</AlertDescription>
					</Alert>

					{/* Lista de ReleaseLetters */}
					{releaseLetters && releaseLetters.length > 0 ? (
						<div className="space-y-3">
							{releaseLetters.map((letter: any) => (
								<div
									key={letter.id}
									className="border rounded-lg p-4 space-y-2"
								>
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<FileText className="h-4 w-4" />
											<span className="font-medium">
												Carta #{letter.id}
											</span>
											<Badge
												variant={
													letter.status === "APPROVED"
														? "default"
														: letter.status === "REJECTED"
														? "destructive"
														: "outline"
												}
											>
												{letter.status}
											</Badge>
										</div>
										<div className="flex gap-2">
											<Button
												variant="outline"
												size="sm"
												onClick={() => handleViewPdf(letter.id)}
												disabled={downloading}
											>
												<Eye className="h-4 w-4" />
											</Button>
											{isBank &&
												letter.status === "PENDING" && (
													<Button
														variant="default"
														size="sm"
														onClick={() => {
															setShowApproveDialog(true);
															resetSteps();
															approveMutation.mutate(letter.id);
														}}
														disabled={approveMutation.isPending}
													>
														{approveMutation.isPending ? (
															<Loader2 className="h-4 w-4 animate-spin" />
														) : (
															<CheckCircle className="h-4 w-4" />
														)}
														Aprobar y Transferir
													</Button>
												)}
										</div>
									</div>
									<div className="text-sm text-muted-foreground">
										<p>
											Paquete de Activoss: {letter.assetIds?.length || 0}
										</p>
										{letter.approvedAssetIds && (
											<p>
												Aprobados: {letter.approvedAssetIds.length}
											</p>
										)}
									</div>
								</div>
							))}
						</div>
					) : (
						<p className="text-sm text-muted-foreground">
							No hay cartas de liberación para esta operación.
						</p>
					)}

					{/* Acciones para Banco */}
					{isBank && (
						<div className="flex gap-2 pt-4 border-t">
							<Button
								variant="outline"
								onClick={() => setUploadDialogOpen(true)}
							>
								<Upload className="h-4 w-4 mr-2" />
								Subir Carta
							</Button>
							<Button
								variant="outline"
								onClick={() => setGenerateDialogOpen(true)}
							>
								<FileText className="h-4 w-4 mr-2" />
								Generar Carta
							</Button>
						</div>
					)}

					{/* Paquete de Activoss aprobados */}
					{approvedAssetIds.length > 0 && (
						<div className="pt-4 border-t">
							<p className="text-sm font-medium mb-2">
								Paquete de Activoss Aprobados para Liberación:
							</p>
							<div className="flex flex-wrap gap-2">
								{approvedAssetIds.map((assetId) => {
									const asset = assets.find((a) => a.id === assetId);
									return (
										<Badge key={assetId} variant="default" className="bg-green-500">
											<Package className="h-3 w-3 mr-1" />
											{asset?.vinSerial || `Asset ${assetId}`}
										</Badge>
									);
								})}
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Dialog para subir carta */}
			<Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>Subir Carta de Liberación</DialogTitle>
						<DialogDescription>
							Selecciona los Paquete de Activoss que se aprueban para liberación.
							Solo se pueden seleccionar Paquete de Activoss tokenizados.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							<Label htmlFor="file">Archivo PDF</Label>
							<Input
								id="file"
								type="file"
								accept=".pdf"
								onChange={(e) =>
									setSelectedFile(e.target.files?.[0] || null)
								}
							/>
						</div>
						<div>
							<Label>Paquete de Activoss a Aprobar</Label>
							<div className="mt-2 space-y-2 max-h-60 overflow-y-auto border rounded p-2">
								{tokenizedAssets.length === 0 ? (
									<p className="text-sm text-muted-foreground">
										No hay Paquete de Activoss tokenizados disponibles.
									</p>
								) : (
									tokenizedAssets.map((asset) => (
										<div
											key={asset.id}
											className="flex items-center gap-2 p-2 hover:bg-muted rounded"
										>
											<Checkbox
												checked={selectedAssetIds.includes(asset.id)}
												onCheckedChange={(checked) =>
													handleToggleAsset(asset.id, checked as boolean)
												}
											/>
											<Package className="h-4 w-4 text-muted-foreground" />
											<div className="flex-1">
												<span className="text-sm font-medium">{asset.vinSerial}</span>
												{asset.description && (
													<span className="text-xs text-muted-foreground block">
														{asset.description}
													</span>
												)}
												{asset.value && (
													<span className="text-xs font-medium text-primary block">
														Valor: ${Number(asset.value).toLocaleString()}
													</span>
												)}
											</div>
										</div>
									))
								)}
							</div>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setUploadDialogOpen(false);
								setSelectedFile(null);
								setSelectedAssetIds([]);
							}}
						>
							Cancelar
						</Button>
						<Button
							onClick={handleUpload}
							disabled={
								!selectedFile ||
								selectedAssetIds.length === 0 ||
								uploadMutation.isPending
							}
						>
							{uploadMutation.isPending ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<Upload className="h-4 w-4" />
							)}
							Subir
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Dialog para generar carta */}
			<Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>Generar Carta de Liberación</DialogTitle>
						<DialogDescription>
							Selecciona los Paquete de Activoss que se aprueban para liberación.
							Solo se pueden seleccionar Paquete de Activoss tokenizados.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							<Label>Paquete de Activoss a Aprobar</Label>
							<div className="mt-2 space-y-2 max-h-60 overflow-y-auto border rounded p-2">
								{tokenizedAssets.length === 0 ? (
									<p className="text-sm text-muted-foreground">
										No hay Paquete de Activoss tokenizados disponibles.
									</p>
								) : (
									tokenizedAssets.map((asset) => (
										<div
											key={asset.id}
											className="flex items-center gap-2 p-2 hover:bg-muted rounded"
										>
											<Checkbox
												checked={selectedAssetIds.includes(asset.id)}
												onCheckedChange={(checked) =>
													handleToggleAsset(asset.id, checked as boolean)
												}
											/>
											<Package className="h-4 w-4 text-muted-foreground" />
											<div className="flex-1">
												<span className="text-sm font-medium">{asset.vinSerial}</span>
												{asset.description && (
													<span className="text-xs text-muted-foreground block">
														{asset.description}
													</span>
												)}
												{asset.value && (
													<span className="text-xs font-medium text-primary block">
														Valor: ${Number(asset.value).toLocaleString()}
													</span>
												)}
											</div>
										</div>
									))
								)}
							</div>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setGenerateDialogOpen(false);
								setSelectedAssetIds([]);
							}}
						>
							Cancelar
						</Button>
						<Button
							onClick={handleGenerate}
							disabled={
								selectedAssetIds.length === 0 || generateMutation.isPending
							}
						>
							{generateMutation.isPending ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<FileText className="h-4 w-4" />
							)}
							Generar
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Dialog para ver PDF */}
			<Dialog open={viewingPdf} onOpenChange={setViewingPdf}>
				<DialogContent className="max-w-4xl">
					<DialogHeader>
						<DialogTitle>Carta de Liberación</DialogTitle>
					</DialogHeader>
					{pdfUrl && (
						<iframe
							src={pdfUrl}
							className="w-full h-[600px] border rounded"
							title="Carta de Liberación"
						/>
					)}
				</DialogContent>
			</Dialog>

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
										const pendingLetter = releaseLetters?.find(l => l.status === "PENDING");
										if (pendingLetter) {
											resetSteps();
											approveMutation.mutate(pendingLetter.id);
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
		</>
	);
}
