"use client";

import { useState } from "react";
import { Document } from "@/types/document";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, CheckCircle, Clock } from "lucide-react";
import { documentsApi } from "@/lib/api/documents";

interface DocumentViewerProps {
	document: Document;
	onSign?: () => void;
	canSign?: boolean;
}

export function DocumentViewer({
	document,
	onSign,
	canSign,
}: DocumentViewerProps) {
	const [downloading, setDownloading] = useState(false);

	const handleDownload = async () => {
		setDownloading(true);
		try {
			const blob = await documentsApi.downloadPDF(document.id);
			const url = window.URL.createObjectURL(blob);
			const a = window.document.createElement("a");
			a.href = url;
			a.download = `${document.type}-${document.id}.pdf`;
			a.click();
			window.URL.revokeObjectURL(url);
		} catch (error) {
			console.error("Error downloading PDF:", error);
		} finally {
			setDownloading(false);
		}
	};

	const getDocumentTypeName = () => {
		switch (document.type) {
			case "CD":
				return "Certificado de Depósito";
			case "BP":
				return "Bono de Prenda";
			case "PROMISSORY_NOTE":
				return "Pagaré";
			default:
				return document.type;
		}
	};

	const isFullySigned = () => {
		if (document.type === "PROMISSORY_NOTE") {
			// Pagaré: solo banco y cliente
			return document.signedByBank && document.signedByClient;
		}
		// CD y BP: warehouse y cliente
		return document.signedByWarehouse && document.signedByClient;
	};

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<FileText className="h-6 w-6" />
						<div>
							<CardTitle>{getDocumentTypeName()}</CardTitle>
							<p className="text-sm text-zinc-500 dark:text-zinc-400">
								Versión {document.version}
							</p>
						</div>
					</div>
					<Badge variant={isFullySigned() ? "default" : "secondary"}>
						{isFullySigned() ? "Firmado" : "Pendiente"}
					</Badge>
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Estado de Firmas */}
				<div className="space-y-2">
					<p className="text-sm font-medium">Estado de firmas:</p>
					<div className="space-y-2">
						{/* CD y BP: warehouse y cliente */}
						{document.type !== "PROMISSORY_NOTE" && (
							<div className="flex items-center gap-2">
								{document.signedByWarehouse ? (
									<CheckCircle className="h-4 w-4 text-green-500" />
								) : (
									<Clock className="h-4 w-4 text-zinc-400" />
								)}
								<span className="text-sm">
									Almacén (WAREHOUSE)
								</span>
								{document.warehouseSignatureDate && (
									<span className="text-xs text-zinc-500">
										{new Date(
											document.warehouseSignatureDate
										).toLocaleDateString()}
									</span>
								)}
							</div>
						)}
						{/* Todos: cliente */}
						<div className="flex items-center gap-2">
							{document.signedByClient ? (
								<CheckCircle className="h-4 w-4 text-green-500" />
							) : (
								<Clock className="h-4 w-4 text-zinc-400" />
							)}
							<span className="text-sm">Cliente (CLIENT)</span>
							{document.clientSignatureDate && (
								<span className="text-xs text-zinc-500">
									{new Date(
										document.clientSignatureDate
									).toLocaleDateString()}
								</span>
							)}
						</div>
						{/* Pagaré: banco y cliente */}
						{document.type === "PROMISSORY_NOTE" && (
							<div className="flex items-center gap-2">
								{document.signedByBank ? (
									<CheckCircle className="h-4 w-4 text-green-500" />
								) : (
									<Clock className="h-4 w-4 text-zinc-400" />
								)}
								<span className="text-sm">
									Entidad Financiera (BANK)
								</span>
								{document.bankSignatureDate && (
									<span className="text-xs text-zinc-500">
										{new Date(
											document.bankSignatureDate
										).toLocaleDateString()}
									</span>
								)}
							</div>
						)}
						{/* Endoso: todos */}
						{false && (
							<div className="flex items-center gap-2">
								{document.signedByBank ? (
									<CheckCircle className="h-4 w-4 text-green-500" />
								) : (
									<Clock className="h-4 w-4 text-zinc-400" />
								)}
								<span className="text-sm">Banco (BANK)</span>
								{document.bankSignatureDate && (
									<span className="text-xs text-zinc-500">
										{new Date(
											document.bankSignatureDate
										).toLocaleDateString()}
									</span>
								)}
							</div>
						)}
					</div>
				</div>

				{/* Acciones */}
				<div className="flex gap-2">
					<Button
						variant="outline"
						onClick={handleDownload}
						disabled={downloading}
					>
						<Download className="mr-2 h-4 w-4" />
						{downloading ? "Descargando..." : "Descargar PDF"}
					</Button>

					{canSign && onSign && (
						<Button onClick={onSign}>Firmar Documento</Button>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
