"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { operationsApi } from "@/lib/api/operations";
import { PaymentLetterStatus } from "@/types/operation";
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
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";

interface PaymentLetterSectionProps {
	operationId: number;
}

export function PaymentLetterSection({
	operationId,
}: PaymentLetterSectionProps) {
	const { user } = useAuth();
	const queryClient = useQueryClient();
	const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [viewingPdf, setViewingPdf] = useState(false);
	const [pdfUrl, setPdfUrl] = useState<string | null>(null);
	const [downloading, setDownloading] = useState(false);

	const { data: paymentLetter, isLoading } = useQuery({
		queryKey: ["payment-letter", operationId],
		queryFn: () => operationsApi.getPaymentLetter(operationId),
		enabled: !!operationId,
	});

	const uploadMutation = useMutation({
		mutationFn: (file: File) =>
			operationsApi.uploadPaymentLetter(operationId, file),
		onSuccess: () => {
			toast.success("Carta de pago subida exitosamente");
			queryClient.invalidateQueries({
				queryKey: ["payment-letter", operationId],
			});
			queryClient.invalidateQueries({
				queryKey: ["operations", operationId],
			});
			setUploadDialogOpen(false);
			setSelectedFile(null);
		},
		onError: (error: any) => {
			toast.error(
				error.response?.data?.message ||
					"Error al subir la carta de pago"
			);
		},
	});

	const generateMutation = useMutation({
		mutationFn: () => operationsApi.generatePaymentLetter(operationId),
		onSuccess: () => {
			toast.success("Carta de pago generada exitosamente");
			queryClient.invalidateQueries({
				queryKey: ["payment-letter", operationId],
			});
			queryClient.invalidateQueries({
				queryKey: ["operations", operationId],
			});
		},
		onError: (error: any) => {
			toast.error(
				error.response?.data?.message ||
					"Error al generar la carta de pago"
			);
		},
	});

	const approveMutation = useMutation({
		mutationFn: () => operationsApi.approvePaymentLetter(operationId),
		onSuccess: () => {
			toast.success("Carta de pago aprobada exitosamente");
			queryClient.invalidateQueries({
				queryKey: ["payment-letter", operationId],
			});
			queryClient.invalidateQueries({
				queryKey: ["operations", operationId],
			});
		},
		onError: (error: any) => {
			toast.error(
				error.response?.data?.message ||
					"Error al aprobar la carta de pago"
			);
		},
	});

	const handleUpload = () => {
		if (!selectedFile) {
			toast.error("Debe seleccionar un archivo");
			return;
		}
		uploadMutation.mutate(selectedFile);
	};

	const handleViewPdf = async () => {
		try {
			setDownloading(true);
			const blob = await operationsApi.downloadPaymentLetter(operationId);
			const url = window.URL.createObjectURL(blob);
			setPdfUrl(url);
			setViewingPdf(true);
		} catch (error: any) {
			toast.error(
				error.response?.data?.message || "Error al cargar la carta de pago"
			);
		} finally {
			setDownloading(false);
		}
	};

	const handleDownloadPdf = async () => {
		try {
			setDownloading(true);
			const blob = await operationsApi.downloadPaymentLetter(operationId);
			const url = window.URL.createObjectURL(blob);
			const a = window.document.createElement("a");
			a.href = url;
			a.download = `carta-pago-${operationId}.pdf`;
			a.click();
			window.URL.revokeObjectURL(url);
		} catch (error: any) {
			toast.error(
				error.response?.data?.message || "Error al descargar la carta de pago"
			);
		} finally {
			setDownloading(false);
		}
	};

	const handleClosePdf = () => {
		if (pdfUrl) {
			window.URL.revokeObjectURL(pdfUrl);
		}
		setPdfUrl(null);
		setViewingPdf(false);
	};

	const getStatusBadge = () => {
		if (!paymentLetter) return null;

		const status = paymentLetter.status;
		if (status === PaymentLetterStatus.APPROVED) {
			return (
				<Badge variant="default" className="bg-green-500">
					<CheckCircle className="h-3 w-3 mr-1" />
					Aprobada
				</Badge>
			);
		} else if (status === PaymentLetterStatus.PENDING) {
			return (
				<Badge
					variant="outline"
					className="border-yellow-500 text-yellow-600"
				>
					<AlertCircle className="h-3 w-3 mr-1" />
					Pendiente
				</Badge>
			);
		} else {
			return (
				<Badge variant="destructive">
					<XCircle className="h-3 w-3 mr-1" />
					Rechazada
				</Badge>
			);
		}
	};

	// Solo SAFI puede ver/gestionar cartas de pago
	// Esto se debe verificar en el backend, aquí solo ocultamos la UI
	const isSAFI = user?.organizations?.some((org) => org.type === "BANK");

	if (!isSAFI) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Carta de Pago</CardTitle>
				</CardHeader>
				<CardContent>
					<Alert>
						<AlertCircle className="h-4 w-4" />
						<AlertDescription>
							Solo los usuarios de Entidad Financiera pueden gestionar cartas de
							pago.
						</AlertDescription>
					</Alert>
				</CardContent>
			</Card>
		);
	}

	return (
		<>
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center justify-between">
						<span>Carta de Pago</span>
						{paymentLetter && getStatusBadge()}
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					{isLoading ? (
						<div className="text-center py-4">
							<Loader2 className="h-6 w-6 mx-auto animate-spin text-muted-foreground" />
						</div>
					) : paymentLetter ? (
						<>
							<div className="space-y-2">
								<div className="text-sm">
									<span className="font-medium">Tipo: </span>
									<span>
										{paymentLetter.isGenerated
											? "Generada en sistema"
											: "Subida manualmente"}
									</span>
								</div>
								{paymentLetter.issuedAt && (
									<div className="text-sm">
										<span className="font-medium">
											Fecha de emisión:{" "}
										</span>
										<span>
											{new Date(
												paymentLetter.issuedAt
											).toLocaleDateString("es-BO")}
										</span>
									</div>
								)}
							</div>

							{/* Botones para ver y descargar la carta */}
							<div className="flex gap-2">
								<Button
									variant="outline"
									onClick={handleViewPdf}
									disabled={downloading}
									className="flex-1"
								>
									{downloading ? (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									) : (
										<Eye className="mr-2 h-4 w-4" />
									)}
									Ver Carta
								</Button>
								<Button
									variant="outline"
									onClick={handleDownloadPdf}
									disabled={downloading}
									className="flex-1"
								>
									{downloading ? (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									) : (
										<Download className="mr-2 h-4 w-4" />
									)}
									Descargar
								</Button>
							</div>

							{paymentLetter.status ===
								PaymentLetterStatus.PENDING && (
								<Button
									onClick={() => approveMutation.mutate()}
									disabled={approveMutation.isPending}
									className="w-full"
								>
									{approveMutation.isPending && (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									)}
									<FileCheck className="mr-2 h-4 w-4" />
									Aprobar Carta de Pago
								</Button>
							)}

							{paymentLetter.status ===
								PaymentLetterStatus.APPROVED && (
								<Alert className="bg-green-50 border-green-200">
									<CheckCircle className="h-4 w-4 text-green-600" />
									<AlertDescription className="text-green-800">
										La carta de pago ha sido aprobada y está
										lista para la liquidación.
									</AlertDescription>
								</Alert>
							)}
						</>
					) : (
						<div className="space-y-4">
							<Alert>
								<AlertCircle className="h-4 w-4" />
								<AlertDescription>
									No hay carta de pago disponible. Puede subir
									una o generar una en el sistema.
								</AlertDescription>
							</Alert>

							<div className="flex gap-2">
								<Button
									variant="outline"
									onClick={() => setUploadDialogOpen(true)}
									className="flex-1"
								>
									<Upload className="h-4 w-4 mr-2" />
									Subir PDF
								</Button>
								<Button
									variant="outline"
									onClick={() => generateMutation.mutate()}
									disabled={generateMutation.isPending}
									className="flex-1"
								>
									{generateMutation.isPending && (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									)}
									<FileText className="h-4 w-4 mr-2" />
									Generar en Sistema
								</Button>
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			<Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Subir Carta de Pago</DialogTitle>
						<DialogDescription>
							Sube el PDF de la carta de pago emitida por Entidad Financiera.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="payment-letter-file">
								Archivo PDF
							</Label>
							<Input
								id="payment-letter-file"
								type="file"
								accept="application/pdf"
								onChange={(e) =>
									setSelectedFile(e.target.files?.[0] || null)
								}
								disabled={uploadMutation.isPending}
							/>
							{selectedFile && (
								<p className="text-sm text-muted-foreground">
									{selectedFile.name}
								</p>
							)}
						</div>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setUploadDialogOpen(false)}
							disabled={uploadMutation.isPending}
						>
							Cancelar
						</Button>
						<Button
							type="button"
							onClick={handleUpload}
							disabled={!selectedFile || uploadMutation.isPending}
						>
							{uploadMutation.isPending && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							<Upload className="mr-2 h-4 w-4" />
							Subir
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Dialog para ver el PDF */}
			<Dialog open={viewingPdf} onOpenChange={handleClosePdf}>
				<DialogContent className="max-w-4xl max-h-[90vh]">
					<DialogHeader>
						<DialogTitle>Carta de Pago</DialogTitle>
						<DialogDescription>
							Vista previa de la carta de pago generada
						</DialogDescription>
					</DialogHeader>
					{pdfUrl && (
						<div className="w-full h-[70vh] border rounded-lg overflow-hidden">
							<iframe
								src={pdfUrl}
								className="w-full h-full"
								title="Carta de Pago"
							/>
						</div>
					)}
					<DialogFooter>
						<Button variant="outline" onClick={handleClosePdf}>
							Cerrar
						</Button>
						<Button onClick={handleDownloadPdf} disabled={downloading}>
							{downloading ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : (
								<Download className="mr-2 h-4 w-4" />
							)}
							Descargar
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}








