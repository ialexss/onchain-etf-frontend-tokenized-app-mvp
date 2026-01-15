"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Document } from "@/types/document";
import { UploadDocumentDialog } from "./upload-document-dialog";
import {
	FileText,
	Upload,
	CheckCircle,
	XCircle,
	Download,
	AlertCircle,
} from "lucide-react";
import { documentsApi } from "@/lib/api/documents";
import { toast } from "sonner";

interface DocumentStatusCardProps {
	document?: Document;
	documentType: "CD" | "BP" | "PAGARE" | "PROMISSORY_NOTE";
	operationId: number;
	canUpload?: boolean;
	onDocumentUploaded?: () => void;
}

// Función helper para mostrar el nombre del documento en español
const getDocumentTypeLabel = (
	documentType: "CD" | "BP" | "PAGARE" | "PROMISSORY_NOTE"
): string => {
	switch (documentType) {
		case "CD":
			return "CD";
		case "BP":
			return "BP";
		case "PAGARE":
		case "PROMISSORY_NOTE":
			return "Pagaré";
		default:
			return documentType;
	}
};

export function DocumentStatusCard({
	document,
	documentType,
	operationId,
	canUpload = false,
	onDocumentUploaded,
}: DocumentStatusCardProps) {
	const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
	const documentTypeLabel = getDocumentTypeLabel(documentType);

	const handleDownload = async () => {
		if (!document?.id) return;

		try {
			const blob = await documentsApi.downloadPDF(document.id);
			const url = window.URL.createObjectURL(blob);
			const a = window.document.createElement("a");
			a.href = url;
			a.download = `${documentType}-${document.id}.pdf`;
			window.document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			window.document.body.removeChild(a);
			toast.success("PDF descargado exitosamente");
		} catch (error: any) {
			toast.error("Error al descargar el PDF");
		}
	};

	const getStatusBadges = () => {
		if (!document) {
			return <Badge variant="outline">No disponible</Badge>;
		}

		const badges = [];

		// Estado de upload/generación
		if (document.isUploaded) {
			badges.push(
				<Badge key="uploaded" variant="secondary">
					<Upload className="h-3 w-3 mr-1" />
					Subido
				</Badge>
			);
		} else {
			badges.push(
				<Badge key="generated" variant="secondary">
					<FileText className="h-3 w-3 mr-1" />
					Generado
				</Badge>
			);
		}

		// Estado de firmas
		if (documentType === "CD") {
			if (document.signedByWarehouse) {
				badges.push(
					<Badge
						key="signed"
						variant="default"
						className="bg-green-500"
					>
						<CheckCircle className="h-3 w-3 mr-1" />
						Firmado por Warrant
					</Badge>
				);
			} else {
				badges.push(
					<Badge key="not-signed" variant="outline">
						<XCircle className="h-3 w-3 mr-1" />
						Pendiente de firma
					</Badge>
				);
			}
		} else if (documentType === "BP") {
			if (document.signedByWarehouse && document.signedByClient) {
				badges.push(
					<Badge
						key="signed"
						variant="default"
						className="bg-green-500"
					>
						<CheckCircle className="h-3 w-3 mr-1" />
						Firmado
					</Badge>
				);
			} else {
				const missing = [];
				if (!document.signedByWarehouse) missing.push("Warrant");
				if (!document.signedByClient) missing.push("Cliente");
				badges.push(
					<Badge key="not-signed" variant="outline">
						<XCircle className="h-3 w-3 mr-1" />
						Pendiente: {missing.join(", ")}
					</Badge>
				);
			}
		} else if (
			documentType === "PAGARE" ||
			documentType === "PROMISSORY_NOTE"
		) {
			if (document.signedByClient) {
				badges.push(
					<Badge
						key="signed"
						variant="default"
						className="bg-green-500"
					>
						<CheckCircle className="h-3 w-3 mr-1" />
						Firmado por Cliente
					</Badge>
				);
			} else {
				badges.push(
					<Badge key="not-signed" variant="outline">
						<XCircle className="h-3 w-3 mr-1" />
						Pendiente de firma
					</Badge>
				);
			}
		}

		return <div className="flex flex-wrap gap-2">{badges}</div>;
	};

	return (
		<>
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center justify-between">
						<span>{documentTypeLabel}</span>
						{getStatusBadges()}
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					{document ? (
						<>
							{document.isUploaded && document.extractedData && (
								<Alert>
									<AlertCircle className="h-4 w-4" />
									<AlertDescription>
										Documento subido manualmente. Campos
										extraídos disponibles.
									</AlertDescription>
								</Alert>
							)}

							{document.documentNumber && (
								<div className="text-sm">
									<span className="font-medium">
										Número de Documento:{" "}
									</span>
									<span>{document.documentNumber}</span>
								</div>
							)}

							{document.pdfHash && (
								<div className="text-xs">
									<span className="font-medium">Hash: </span>
									<code className="bg-muted px-2 py-1 rounded break-all">
										{document.pdfHash.substring(0, 32)}...
									</code>
								</div>
							)}

							{/* Estado de firmas */}
							<div className="space-y-2">
								<p className="text-sm font-medium">Firmas:</p>
								<div className="space-y-1 text-xs">
									{/* CD y BP: mostrar Warehouse y Cliente */}
									{(documentType === "CD" || documentType === "BP") && (
										<>
										<div className="flex items-center gap-2">
												{document.signedByWarehouse ? (
											<CheckCircle className="h-3 w-3 text-green-500" />
												) : (
													<XCircle className="h-3 w-3 text-amber-500" />
												)}
											<span>Firmado por Warehouse</span>
											{document.warehouseSignatureDate && (
												<span className="text-muted-foreground">
													({new Date(document.warehouseSignatureDate).toLocaleDateString("es-BO")})
												</span>
											)}
										</div>
										<div className="flex items-center gap-2">
												{document.signedByClient ? (
											<CheckCircle className="h-3 w-3 text-green-500" />
												) : (
													<XCircle className="h-3 w-3 text-amber-500" />
												)}
											<span>Firmado por Cliente</span>
											{document.clientSignatureDate && (
												<span className="text-muted-foreground">
													({new Date(document.clientSignatureDate).toLocaleDateString("es-BO")})
												</span>
											)}
										</div>
										</>
									)}
									{/* Pagaré: mostrar Banco y Cliente */}
									{(documentType === "PAGARE" || documentType === "PROMISSORY_NOTE") && (
										<>
										<div className="flex items-center gap-2">
												{document.signedByBank ? (
											<CheckCircle className="h-3 w-3 text-green-500" />
												) : (
													<XCircle className="h-3 w-3 text-amber-500" />
												)}
												<span>Firmado por Banco/Entidad Financiera</span>
											{document.bankSignatureDate && (
												<span className="text-muted-foreground">
													({new Date(document.bankSignatureDate).toLocaleDateString("es-BO")})
												</span>
											)}
										</div>
											<div className="flex items-center gap-2">
												{document.signedByClient ? (
													<CheckCircle className="h-3 w-3 text-green-500" />
												) : (
													<XCircle className="h-3 w-3 text-amber-500" />
												)}
												<span>Firmado por Cliente</span>
												{document.clientSignatureDate && (
													<span className="text-muted-foreground">
														({new Date(document.clientSignatureDate).toLocaleDateString("es-BO")})
													</span>
												)}
											</div>
										</>
									)}
								</div>
							</div>

							<div className="flex gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={handleDownload}
								>
									<Download className="h-4 w-4 mr-2" />
									Descargar PDF
								</Button>
								{canUpload && (
									<Button
										variant="outline"
										size="sm"
										onClick={() =>
											setUploadDialogOpen(true)
										}
									>
										<Upload className="h-4 w-4 mr-2" />
										Re-subir
									</Button>
								)}
							</div>
						</>
					) : (
						<div className="text-center py-4">
							<FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
							<p className="text-sm text-muted-foreground mb-4">
								No hay documento {documentTypeLabel} disponible
							</p>
							{canUpload && (
								<Button
									onClick={() => setUploadDialogOpen(true)}
								>
									<Upload className="h-4 w-4 mr-2" />
									Subir {documentTypeLabel}
								</Button>
							)}
						</div>
					)}
				</CardContent>
			</Card>

			<UploadDocumentDialog
				open={uploadDialogOpen}
				onOpenChange={setUploadDialogOpen}
				operationId={operationId}
				documentType={documentType}
				onUploadSuccess={() => {
					if (onDocumentUploaded) {
						onDocumentUploaded();
					}
				}}
			/>
		</>
	);
}




