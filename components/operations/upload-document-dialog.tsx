"use client";

import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
	Loader2,
	Upload,
	FileText,
	CheckCircle2,
	Edit,
	X,
} from "lucide-react";
import { UploadDocumentResponse } from "@/types/operation";
import { operationsApi } from "@/lib/api/operations";

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

// Definir campos por tipo de documento
const getDocumentFields = (
	documentType: "CD" | "BP" | "PAGARE" | "PROMISSORY_NOTE"
) => {
	const commonFields = [
		{ key: "documentNumber", label: "Número de Título", type: "text" },
		{ key: "issueCity", label: "Ciudad de Emisión", type: "text" },
		{ key: "issueDate", label: "Fecha de Emisión", type: "text" },
	];

	if (documentType === "CD") {
		return [
			...commonFields,
			{ key: "depositNumber", label: "Número de Depósito", type: "text" },
			{ key: "beneficiaryName", label: "Nombre del Beneficiario", type: "text" },
			{ key: "beneficiaryAddress", label: "Dirección del Beneficiario", type: "textarea" },
			{ key: "insurancePolicyNumber", label: "Número de Póliza", type: "text" },
			{ key: "insuranceCompany", label: "Compañía de Seguro", type: "text" },
			{ key: "expirationDate", label: "Fecha de Vencimiento", type: "text" },
			{ key: "totalValue", label: "Valor Total", type: "text" },
		];
	} else if (documentType === "BP") {
		return [
			...commonFields,
			{ key: "depositNumber", label: "Número de Depósito", type: "text" },
			{ key: "beneficiaryName", label: "Nombre del Beneficiario", type: "text" },
			{ key: "beneficiaryAddress", label: "Dirección del Beneficiario", type: "textarea" },
			{ key: "insurancePolicyNumber", label: "Número de Póliza", type: "text" },
			{ key: "insuranceCompany", label: "Compañía de Seguro", type: "text" },
			{ key: "depositTermDays", label: "Plazo del Depósito (días)", type: "text" },
			{ key: "expirationDate", label: "Fecha de Vencimiento", type: "text" },
			{ key: "warrantCommission", label: "Comisión WARRANT (%)", type: "text" },
			{ key: "totalValue", label: "Valor Total", type: "text" },
			{ key: "endorsedTo", label: "Endosado a Favor de", type: "text" },
			{ key: "endorsementAmount", label: "Suma del Endoso", type: "text" },
			{ key: "endorsementAddress", label: "Domicilio del Endosatario", type: "textarea" },
			{ key: "interestRate", label: "Tasa de Interés (%)", type: "text" },
		];
	} else {
		// PAGARE
		return [
			{ key: "principalAmount", label: "Monto Principal", type: "text" },
			{ key: "interestRate", label: "Tasa de Interés (%)", type: "text" },
			{ key: "maturityDate", label: "Fecha de Vencimiento", type: "text" },
			{ key: "debtorName", label: "Nombre del Deudor", type: "text" },
			{ key: "debtorAddress", label: "Dirección del Deudor", type: "textarea" },
			{ key: "creditorName", label: "Nombre del Acreedor", type: "text" },
			{ key: "creditorAddress", label: "Dirección del Acreedor", type: "textarea" },
			{ key: "issueCity", label: "Ciudad de Emisión", type: "text" },
			{ key: "issueDate", label: "Fecha de Emisión", type: "text" },
		];
	}
};

interface UploadDocumentDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	operationId: number;
	documentType: "CD" | "BP" | "PAGARE" | "PROMISSORY_NOTE";
	onUploadSuccess?: (response: UploadDocumentResponse) => void;
}

export function UploadDocumentDialog({
	open,
	onOpenChange,
	operationId,
	documentType,
	onUploadSuccess,
}: UploadDocumentDialogProps) {
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [extractedFields, setExtractedFields] = useState<any>({});
	const [editableFields, setEditableFields] = useState<any>({});
	const [showEditFields, setShowEditFields] = useState(false);
	const documentTypeLabel = getDocumentTypeLabel(documentType);
	const fields = getDocumentFields(documentType);

	// Mutación para extraer campos (opcional)
	const extractMutation = useMutation({
		mutationFn: async (file: File) => {
			const formData = new FormData();
			formData.append("file", file);
			formData.append("documentType", documentType === "PROMISSORY_NOTE" ? "PAGARE" : documentType);

			const data = await operationsApi.extractFields(operationId, formData);
			return data;
		},
		onSuccess: (data) => {
			setExtractedFields(data.extractedFields || {});
			setEditableFields(data.extractedFields || {});
			setShowEditFields(true);
			toast.success("Campos extraídos correctamente. Puede editarlos antes de subir.");
		},
		onError: (error: any) => {
			// No mostrar error si el endpoint no existe, solo un warning
			if (error.response?.status === 404) {
				toast.warning("La extracción automática no está disponible. Puede subir el documento directamente.");
			} else {
				toast.error(
					error.response?.data?.message ||
						"Error al extraer campos del PDF"
				);
			}
		},
	});

	// Mutación para subir documento
	const uploadMutation = useMutation({
		mutationFn: async (file: File) => {
			if (documentType === "CD") {
				return operationsApi.uploadCD(operationId, file);
			} else if (documentType === "BP") {
				return operationsApi.uploadBP(operationId, file);
			} else if (
				documentType === "PAGARE" ||
				documentType === "PROMISSORY_NOTE"
			) {
				return operationsApi.uploadPagare(operationId, file);
			} else {
				throw new Error(`Unknown document type: ${documentType}`);
			}
		},
		onSuccess: (data) => {
			toast.success(`${documentTypeLabel} subido exitosamente`);
			if (onUploadSuccess) {
				onUploadSuccess(data);
			}
			handleClose();
		},
		onError: (error: any) => {
			toast.error(
				error.response?.data?.message ||
					`Error al subir ${documentTypeLabel}`
			);
		},
	});

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			if (file.type !== "application/pdf") {
				toast.error("Solo se permiten archivos PDF");
				return;
			}
			setSelectedFile(file);
			setExtractedFields({});
			setEditableFields({});
			setShowEditFields(false);
		}
	};

	const handleExtract = () => {
		if (!selectedFile) {
			toast.error("Debe seleccionar un archivo");
			return;
		}
		extractMutation.mutate(selectedFile);
	};

	const handleFieldChange = (key: string, value: string) => {
		setEditableFields((prev: any) => ({
			...prev,
			[key]: value,
		}));
	};

	const handleUpload = () => {
		if (!selectedFile) {
			toast.error("Debe seleccionar un archivo");
			return;
		}
		uploadMutation.mutate(selectedFile);
	};

	const handleClose = () => {
		setSelectedFile(null);
		setExtractedFields({});
		setEditableFields({});
		setShowEditFields(false);
		onOpenChange(false);
	};

	// Reset cuando se cierra el diálogo
	useEffect(() => {
		if (!open) {
			setSelectedFile(null);
			setExtractedFields({});
			setEditableFields({});
			setShowEditFields(false);
		}
	}, [open]);

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Subir {documentTypeLabel}</DialogTitle>
					<DialogDescription>
						Seleccione el documento {documentTypeLabel} en formato PDF.
						{!showEditFields && " Puede extraer y editar campos opcionalmente antes de subir."}
						{showEditFields && " Revise y complete los campos extraídos antes de subir."}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					{/* Seleccionar archivo */}
					<div className="space-y-2">
						<Label htmlFor="file-upload">Archivo PDF</Label>
						<div className="flex items-center gap-4">
							<Input
								id="file-upload"
								type="file"
								accept="application/pdf"
								onChange={handleFileChange}
								disabled={uploadMutation.isPending || extractMutation.isPending}
							/>
							{selectedFile && (
								<div className="flex items-center gap-2 text-sm text-muted-foreground">
									<FileText className="h-4 w-4" />
									{selectedFile.name}
								</div>
							)}
						</div>
					</div>

					{/* Botón opcional para extraer campos */}
					{selectedFile && !showEditFields && (
						<Button
							type="button"
							variant="outline"
							onClick={handleExtract}
							disabled={extractMutation.isPending}
							className="w-full"
						>
							{extractMutation.isPending && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							<FileText className="mr-2 h-4 w-4" />
							Extraer Campos del PDF (Opcional)
						</Button>
					)}

					{/* Formulario de edición de campos (opcional) */}
					{showEditFields && (
						<div className="space-y-4 border rounded-lg p-4">
							<div className="flex items-center justify-between">
								<Label className="text-base font-semibold">
									Campos Extraídos (Opcional)
								</Label>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={() => setShowEditFields(false)}
								>
									<X className="h-4 w-4" />
								</Button>
							</div>
							<p className="text-sm text-muted-foreground">
								Puede editar estos campos antes de subir. Si no los edita, el sistema los extraerá automáticamente al subir.
							</p>

							<ScrollArea className="h-[300px] border rounded-md p-4">
								<div className="space-y-4">
									{fields.map((field) => {
										const value = editableFields[field.key] || "";
										const wasExtracted = extractedFields[field.key] ? true : false;

										return (
											<div key={field.key} className="space-y-2">
												<div className="flex items-center gap-2">
													<Label htmlFor={field.key} className="text-sm">
														{field.label}
													</Label>
													{wasExtracted && (
														<span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
															<CheckCircle2 className="h-3 w-3" />
															Extraído
														</span>
													)}
												</div>
												{field.type === "textarea" ? (
													<Textarea
														id={field.key}
														value={value}
														onChange={(e) =>
															handleFieldChange(
																field.key,
																e.target.value
															)
														}
														placeholder={`Ingrese ${field.label.toLowerCase()}`}
														className="min-h-[80px]"
													/>
												) : (
													<Input
														id={field.key}
														type={field.type}
														value={value}
														onChange={(e) =>
															handleFieldChange(
																field.key,
																e.target.value
															)
														}
														placeholder={`Ingrese ${field.label.toLowerCase()}`}
													/>
												)}
											</div>
										);
									})}
								</div>
							</ScrollArea>
						</div>
					)}
				</div>

				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={handleClose}
						disabled={
							extractMutation.isPending || uploadMutation.isPending
						}
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
						Subir Documento
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
