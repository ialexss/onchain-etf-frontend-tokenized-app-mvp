"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { operationsApi } from "@/lib/api/operations";
import { toast } from "sonner";
import {
	CheckCircle,
	XCircle,
	FileSignature,
	Loader2,
	User,
	Building2,
	Landmark,
	Plus,
	Trash2,
	AlertCircle,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { esignApi, Actor } from "@/lib/api/esign";
import { EsignActivitiesStatus } from "@/components/shared/esign-activities-status";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import {
	Mail,
	Phone,
	ShieldCheck,
	Clock,
	CheckCircle2,
	AlertTriangle,
	Info,
} from "lucide-react";

interface AtomicAssetBundleSignaturesProps {
	assetId: number;
	operationId: number;
	onSuccess?: () => void;
}

interface SignatureItem {
	documentType: "CD" | "BP" | "PAGARE";
	signerType: "WAREHOUSE" | "CLIENT" | "BANK";
	signerEmail: string;
}

// Validación de formato de teléfono según eSignAnywhere
// Debe empezar con + o 00, seguido de al menos 2 dígitos
const validatePhoneNumber = (phone: string): boolean => {
	if (!phone || phone.trim() === "") return false;
	const regex = /^(\+|00){1}\(?([0-9]{2,})\)?([\-. ]?([0-9]{2,})){1,}$/;
	return regex.test(phone.trim());
};

const normalizePhoneForDisplay = (phone: string): string => {
	if (!phone || phone.trim() === "") return "";
	const cleaned = phone.trim();
	if (cleaned.startsWith("+") || cleaned.startsWith("00")) {
		return cleaned;
	}
	return `+${cleaned}`;
};

export function AtomicAssetBundleSignatures({
	assetId,
	operationId,
	onSuccess,
}: AtomicAssetBundleSignaturesProps) {
	const queryClient = useQueryClient();
	const [isEsignModalOpen, setIsEsignModalOpen] = useState(false);
	const [preparingEsign, setPreparingEsign] = useState(false);
	const [showSimulatedSignatures, setShowSimulatedSignatures] =
		useState(false);
	const [phoneValidationErrors, setPhoneValidationErrors] = useState<{
		warehouse?: string;
		client?: string;
		financialEntity?: string;
	}>({});
	const [esignActors, setEsignActors] = useState<{
		client: Actor;
		warehouse: Actor;
		financialEntity: Actor;
	} | null>(null);

	// Obtener estado del bundle con documentos y firmas
	const { data: bundleStatus, isLoading } = useQuery({
		queryKey: ["asset-token-bundle", assetId, "status"],
		queryFn: () => operationsApi.getAssetTokenBundleStatus(assetId),
		enabled: !!assetId,
	});

	const validation = bundleStatus?.validation || ({} as any);
	const documents = bundleStatus?.documents || ({} as any);

	// Verificar documentos desde múltiples fuentes
	// El backend puede devolver null si no existe, o un objeto si existe
	const cd = documents.cd && documents.cd !== null ? documents.cd : null;
	const bp = documents.bp && documents.bp !== null ? documents.bp : null;
	const pagare =
		documents.pagare && documents.pagare !== null ? documents.pagare : null;

	// Debug: Log para verificar qué se está recibiendo
	console.log("AtomicAssetBundleSignatures - bundleStatus:", bundleStatus);
	console.log("AtomicAssetBundleSignatures - documents:", documents);
	console.log("AtomicAssetBundleSignatures - cd:", cd);
	console.log(
		"AtomicAssetBundleSignatures - cd.signedByWarehouse:",
		cd?.signedByWarehouse,
		"cd.signedByClient:",
		cd?.signedByClient,
	);
	console.log(
		"AtomicAssetBundleSignatures - cd.esignEnvelopeId:",
		cd?.esignEnvelopeId,
		"cd.esignStatus:",
		cd?.esignStatus,
	);
	console.log("AtomicAssetBundleSignatures - bp:", bp);
	console.log(
		"AtomicAssetBundleSignatures - bp.signedByWarehouse:",
		bp?.signedByWarehouse,
		"bp.signedByClient:",
		bp?.signedByClient,
	);
	console.log(
		"AtomicAssetBundleSignatures - bp.esignEnvelopeId:",
		bp?.esignEnvelopeId,
		"bp.esignStatus:",
		bp?.esignStatus,
	);
	console.log("AtomicAssetBundleSignatures - pagare:", pagare);

	// Calcular progreso de firmas
	// Usar también validation como fuente alternativa si documents no tiene las propiedades
	let totalSignatures = 0;
	let completedSignatures = 0;
	const missingSignatures: string[] = [];

	if (cd) {
		totalSignatures += 2; // warehouse + client
		// Verificar desde múltiples fuentes: documents.cd y validation
		const cdWarehouseSigned =
			cd.signedByWarehouse ?? validation?.cdSignedByWarehouse ?? false;
		const cdClientSigned =
			cd.signedByClient ?? validation?.cdSignedByClient ?? false;
		completedSignatures +=
			(cdWarehouseSigned ? 1 : 0) + (cdClientSigned ? 1 : 0);
		if (!cdWarehouseSigned) missingSignatures.push("CD - Warehouse");
		if (!cdClientSigned) missingSignatures.push("CD - Cliente");
		console.log(
			"CD signatures - Warehouse:",
			cdWarehouseSigned,
			"Client:",
			cdClientSigned,
		);
	}

	if (bp) {
		totalSignatures += 2; // warehouse + client
		// Verificar desde múltiples fuentes: documents.bp y validation
		const bpWarehouseSigned =
			bp.signedByWarehouse ?? validation?.bpSignedByWarehouse ?? false;
		const bpClientSigned =
			bp.signedByClient ?? validation?.bpSignedByClient ?? false;
		completedSignatures +=
			(bpWarehouseSigned ? 1 : 0) + (bpClientSigned ? 1 : 0);
		if (!bpWarehouseSigned) missingSignatures.push("BP - Warehouse");
		if (!bpClientSigned) missingSignatures.push("BP - Cliente");
		console.log(
			"BP signatures - Warehouse:",
			bpWarehouseSigned,
			"Client:",
			bpClientSigned,
		);
	}

	// Pagaré es opcional - solo cuenta si existe
	if (pagare) {
		totalSignatures += 1; // Solo cliente es requerido
		const pagareClientSigned =
			pagare.signedByClient ?? validation?.pagareSignedByClient ?? false;
		completedSignatures += pagareClientSigned ? 1 : 0;
		if (!pagareClientSigned) missingSignatures.push("Pagaré - Cliente");
		console.log("Pagaré signatures - Client:", pagareClientSigned);
		// Banco es opcional
	}

	console.log(
		"Total signatures:",
		totalSignatures,
		"Completed:",
		completedSignatures,
	);

	const progressPercentage =
		totalSignatures > 0 ? (completedSignatures / totalSignatures) * 100 : 0;

	// Verificar desde múltiples fuentes
	const allSigned =
		(!cd ||
			((cd.signedByWarehouse ??
				validation?.cdSignedByWarehouse ??
				false) &&
				(cd.signedByClient ??
					validation?.cdSignedByClient ??
					false))) &&
		(!bp ||
			((bp.signedByWarehouse ??
				validation?.bpSignedByWarehouse ??
				false) &&
				(bp.signedByClient ??
					validation?.bpSignedByClient ??
					false))) &&
		(!pagare ||
			(pagare.signedByClient ??
				validation?.pagareSignedByClient ??
				false));

	const executeSignaturesMutation = useMutation({
		mutationFn: (sigs: SignatureItem[]) => {
			if (!assetId) {
				throw new Error("Asset ID es requerido para ejecutar firmas");
			}
			return operationsApi.executeSignatures(operationId, sigs, assetId);
		},
		onSuccess: async () => {
			toast.success("Firmas ejecutadas exitosamente");

			// Esperar un momento para que el backend procese
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Invalidar todas las queries relacionadas
			await queryClient.invalidateQueries({
				queryKey: ["asset-token-bundle", assetId, "status"],
			});
			await queryClient.invalidateQueries({
				queryKey: ["operations", operationId],
			});
			await queryClient.invalidateQueries({
				queryKey: ["operations", operationId, "status"],
			});
			await queryClient.invalidateQueries({
				queryKey: ["asset-token-bundle", assetId],
			});

			// Refetch inmediato con un pequeño delay para asegurar que el backend haya guardado
			setTimeout(async () => {
				await queryClient.refetchQueries({
					queryKey: ["asset-token-bundle", assetId, "status"],
				});
			}, 300);

			if (onSuccess) onSuccess();
		},
		onError: (error: any) => {
			console.error("Error ejecutando firmas:", error);
			toast.error(
				error.response?.data?.message ||
					error.message ||
					"Error al ejecutar las firmas",
			);
		},
	});

	// --- eSignAnywhere Mutations ---
	const prepareEsignMutation = useMutation({
		mutationFn: () => esignApi.prepareSigning(assetId),
		onSuccess: (data) => {
			setEsignActors({
				client: data.client,
				warehouse: data.warehouse,
				financialEntity: data.financialEntity,
			});

			// Verificar si hay números de teléfono con formato incorrecto
			const warnings: string[] = [];
			if (!validatePhoneNumber(data.warehouse.phoneNumber)) {
				warnings.push("Almacén");
			}
			if (!validatePhoneNumber(data.client.phoneNumber)) {
				warnings.push("Cliente");
			}
			if (!validatePhoneNumber(data.financialEntity.phoneNumber)) {
				warnings.push("Banco");
			}

			if (warnings.length > 0) {
				toast.warning(
					`Advertencia: Los números de teléfono de ${warnings.join(", ")} necesitan corrección. Deben comenzar con + o 00.`,
					{ duration: 5000 },
				);
			}

			setIsEsignModalOpen(true);
		},
		onError: (error: any) => {
			toast.error(
				error.response?.data?.message ||
					"Error al preparar datos de firmantes",
			);
		},
		onSettled: () => setPreparingEsign(false),
	});

	const initiateEsignMutation = useMutation({
		mutationFn: (actors: any) =>
			esignApi.initiateSigning({ assetId, ...actors }),
		onSuccess: () => {
			toast.success("Flujo de firma oficial iniciado. Emails enviados.");
			setIsEsignModalOpen(false);
			setPhoneValidationErrors({});
			// Invalidar queries para refrescar el estado y ocultar el botón
			queryClient.invalidateQueries({
				queryKey: ["asset-token-bundle", assetId, "status"],
			});
			queryClient.invalidateQueries({
				queryKey: ["asset-token-bundle", assetId],
			});
			queryClient.invalidateQueries({
				queryKey: ["operations", operationId],
			});
		},
		onError: (error: any) => {
			console.error("Error al iniciar flujo eSign:", error);

			// Detectar error específico de formato de teléfono (ERR0011)
			const errorMessage =
				error.response?.data?.message || error.message || "";
			const errorId =
				error.response?.data?.ErrorId ||
				error.response?.data?.errorId ||
				"";

			// Detectar error de validación de LanguageCode
			if (
				errorId === "ERR0011" &&
				errorMessage.includes("LanguageCode")
			) {
				toast.error(
					"Error de configuración: Problema con el código de idioma. Por favor contacte al soporte técnico.",
					{ duration: 6000 },
				);
			}
			// Detectar error específico de formato de teléfono (ERR0011)
			else if (
				errorId === "ERR0011" ||
				errorMessage.includes("PhoneNumber") ||
				errorMessage.includes("regular expression")
			) {
				toast.error(
					"Error: Formato de números de teléfono inválido. Deben comenzar con + o 00 seguido del código de país (ej: +591 2 1234567)",
					{ duration: 6000 },
				);

				// Resaltar los campos con error
				const errors: any = {};
				if (errorMessage.includes("Activities[0]"))
					errors.client = "Formato inválido";
				if (errorMessage.includes("Activities[1]"))
					errors.warehouse = "Formato inválido";
				if (errorMessage.includes("Activities[2]"))
					errors.financialEntity = "Formato inválido";
				setPhoneValidationErrors(errors);
			} else {
				toast.error(
					error.response?.data?.message ||
						"Error al iniciar flujo oficial",
				);
			}
		},
	});

	const checkEsignStatusMutation = useMutation({
		mutationFn: (envId: string) => esignApi.getEnvelopeStatus(envId),
		onSuccess: (data) => {
			toast.info(`Estado en eSignAnywhere: ${data.status}`);
			queryClient.invalidateQueries({
				queryKey: ["asset-token-bundle", assetId],
			});
		},
	});

	// Schema para formulario de firmas
	const signatureSchema = z.object({
		signatures: z.array(
			z.object({
				documentType: z.enum(["CD", "BP", "PAGARE"]),
				signerEmail: z.string().email("Email inválido"),
				signerType: z.enum(["WAREHOUSE", "CLIENT", "BANK"]),
			}),
		),
	});

	const form = useForm<z.infer<typeof signatureSchema>>({
		resolver: zodResolver(signatureSchema),
		defaultValues: {
			signatures: [],
		},
	});

	const handleExecuteSignatures = (
		values: z.infer<typeof signatureSchema>,
	) => {
		if (values.signatures.length === 0) {
			toast.error("Debe agregar al menos una firma");
			return;
		}

		// Validar que todos los emails estén completos
		const incompleteSignatures = values.signatures.filter(
			(sig) => !sig.signerEmail || sig.signerEmail.trim() === "",
		);
		if (incompleteSignatures.length > 0) {
			toast.error("Todos los emails deben estar completos");
			return;
		}

		console.log("Ejecutando firmas:", {
			operationId,
			assetId,
			signatures: values.signatures,
		});

		executeSignaturesMutation.mutate(values.signatures);
	};

	// Función para validar antes de enviar
	const handleInitiateEsign = () => {
		if (!esignActors) return;

		// Validar números de teléfono
		const errors: any = {};
		let hasErrors = false;

		if (!validatePhoneNumber(esignActors.warehouse.phoneNumber)) {
			errors.warehouse = "Formato inválido. Debe comenzar con + o 00";
			hasErrors = true;
		}

		if (!validatePhoneNumber(esignActors.client.phoneNumber)) {
			errors.client = "Formato inválido. Debe comenzar con + o 00";
			hasErrors = true;
		}

		if (!validatePhoneNumber(esignActors.financialEntity.phoneNumber)) {
			errors.financialEntity =
				"Formato inválido. Debe comenzar con + o 00";
			hasErrors = true;
		}

		if (hasErrors) {
			setPhoneValidationErrors(errors);
			toast.error(
				"Por favor corrige los números de teléfono. Deben comenzar con + o 00 seguido del código de país.",
				{ duration: 5000 },
			);
			return;
		}

		// Si todo está bien, iniciar el flujo
		setPhoneValidationErrors({});
		initiateEsignMutation.mutate(esignActors);
	};

	// Helper to add signature quickly
	const addSignature = (
		docType: "CD" | "BP" | "PAGARE",
		signerType: "WAREHOUSE" | "CLIENT" | "BANK",
	) => {
		const current = form.getValues("signatures");
		form.setValue("signatures", [
			...current,
			{
				documentType: docType,
				signerType: signerType,
				signerEmail: "",
			},
		]);
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center p-8">
				<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (!cd && !bp) {
		return (
			<Alert>
				<FileSignature className="h-4 w-4" />
				<AlertDescription>
					Los documentos (CD y BP) deben estar subidos antes de
					solicitar firmas.
				</AlertDescription>
			</Alert>
		);
	}

	return (
		<div className="h-full max-h-[calc(100vh-200px)] overflow-y-auto m-3">
			<div className="space-y-6 pr-2">
				{/* Progress Bar */}
				<div className="space-y-2">
					<div className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground">
							Progreso de Firmas
						</span>
						<span className="font-medium">
							{completedSignatures} / {totalSignatures}
						</span>
					</div>
					<Progress value={progressPercentage} className="h-2" />
				</div>

				{/* Official eSignAnywhere Status - Detailed Activity Tracking */}
				{(cd?.esignEnvelopeId || bp?.esignEnvelopeId) && (
					<EsignActivitiesStatus
						envelopeId={cd?.esignEnvelopeId || bp?.esignEnvelopeId}
						envelopeStatus={cd?.esignStatus || bp?.esignStatus}
						autoRefresh={true}
					/>
				)}

				{/* Botón para mostrar Firmas Simuladas */}
				<div className="space-y-4">
					<Button
						variant={
							showSimulatedSignatures ? "secondary" : "outline"
						}
						onClick={() =>
							setShowSimulatedSignatures(!showSimulatedSignatures)
						}
						className="w-full"
					>
						{showSimulatedSignatures ? "Ocultar" : "Simular"} Firmas
						Manuales
					</Button>
				</div>

				{/* Matriz de Firmas (Simuladas) */}
				{showSimulatedSignatures && (
					<div className="space-y-4">
						{/* CD */}
						{cd && (
							<div className="border rounded-lg p-4 space-y-3">
								<div className="flex items-center justify-between">
									<h4 className="font-medium">
										Certificado de Depósito (CD)
									</h4>
									<Badge
										variant={
											cd.signedByWarehouse &&
											cd.signedByClient
												? "default"
												: "outline"
										}
									>
										{cd.signedByWarehouse &&
										cd.signedByClient
											? "Completo"
											: "Pendiente"}
									</Badge>
								</div>
								<div className="grid grid-cols-2 gap-4">
									{/* CD Warehouse */}
									<div className="flex items-center justify-between gap-2 p-2 rounded hover:bg-muted/50 transition-colors">
										<div className="flex items-center gap-2">
											<Building2 className="h-4 w-4 text-muted-foreground" />
											<div>
												<p className="text-sm font-medium">
													Warehouse
												</p>
												<p className="text-xs text-muted-foreground">
													{(cd.signedByWarehouse ??
													validation?.cdSignedByWarehouse ??
													false)
														? "Firmado"
														: "Pendiente"}
												</p>
											</div>
										</div>
										{(cd.signedByWarehouse ??
										validation?.cdSignedByWarehouse ??
										false) ? (
											<CheckCircle className="h-4 w-4 text-green-500" />
										) : (
											<Button
												size="sm"
												variant="ghost"
												className="h-6 text-xs"
												onClick={() =>
													addSignature(
														"CD",
														"WAREHOUSE",
													)
												}
											>
												<Plus className="h-3 w-3 mr-1" />{" "}
												Firmar
											</Button>
										)}
									</div>
									{/* CD Client */}
									<div className="flex items-center justify-between gap-2 p-2 rounded hover:bg-muted/50 transition-colors">
										<div className="flex items-center gap-2">
											<User className="h-4 w-4 text-muted-foreground" />
											<div>
												<p className="text-sm font-medium">
													Cliente
												</p>
												<p className="text-xs text-muted-foreground">
													{(cd.signedByClient ??
													validation?.cdSignedByClient ??
													false)
														? "Firmado"
														: "Pendiente"}
												</p>
											</div>
										</div>
										{(cd.signedByClient ??
										validation?.cdSignedByClient ??
										false) ? (
											<CheckCircle className="h-4 w-4 text-green-500" />
										) : (
											<Button
												size="sm"
												variant="ghost"
												className="h-6 text-xs"
												onClick={() =>
													addSignature("CD", "CLIENT")
												}
											>
												<Plus className="h-3 w-3 mr-1" />{" "}
												Firmar
											</Button>
										)}
									</div>
								</div>
							</div>
						)}

						{/* BP */}
						{bp && (
							<div className="border rounded-lg p-4 space-y-3">
								<div className="flex items-center justify-between">
									<h4 className="font-medium">
										Bono de Prenda (BP)
									</h4>
									<Badge
										variant={
											(bp.signedByWarehouse ??
												validation?.bpSignedByWarehouse ??
												false) &&
											(bp.signedByClient ??
												validation?.bpSignedByClient ??
												false)
												? "default"
												: "outline"
										}
									>
										{(bp.signedByWarehouse ??
											validation?.bpSignedByWarehouse ??
											false) &&
										(bp.signedByClient ??
											validation?.bpSignedByClient ??
											false)
											? "Completo"
											: "Pendiente"}
									</Badge>
								</div>
								<div className="grid grid-cols-2 gap-4">
									{/* BP Warehouse */}
									<div className="flex items-center justify-between gap-2 p-2 rounded hover:bg-muted/50 transition-colors">
										<div className="flex items-center gap-2">
											<Building2 className="h-4 w-4 text-muted-foreground" />
											<div>
												<p className="text-sm font-medium">
													Warehouse
												</p>
												<p className="text-xs text-muted-foreground">
													{(bp.signedByWarehouse ??
													validation?.bpSignedByWarehouse ??
													false)
														? "Firmado"
														: "Pendiente"}
												</p>
											</div>
										</div>
										{(bp.signedByWarehouse ??
										validation?.bpSignedByWarehouse ??
										false) ? (
											<CheckCircle className="h-4 w-4 text-green-500" />
										) : (
											<Button
												size="sm"
												variant="ghost"
												className="h-6 text-xs"
												onClick={() =>
													addSignature(
														"BP",
														"WAREHOUSE",
													)
												}
											>
												<Plus className="h-3 w-3 mr-1" />{" "}
												Firmar
											</Button>
										)}
									</div>
									{/* BP Client */}
									<div className="flex items-center justify-between gap-2 p-2 rounded hover:bg-muted/50 transition-colors">
										<div className="flex items-center gap-2">
											<User className="h-4 w-4 text-muted-foreground" />
											<div>
												<p className="text-sm font-medium">
													Cliente
												</p>
												<p className="text-xs text-muted-foreground">
													{(bp.signedByClient ??
													validation?.bpSignedByClient ??
													false)
														? "Firmado"
														: "Pendiente"}
												</p>
											</div>
										</div>
										{(bp.signedByClient ??
										validation?.bpSignedByClient ??
										false) ? (
											<CheckCircle className="h-4 w-4 text-green-500" />
										) : (
											<Button
												size="sm"
												variant="ghost"
												className="h-6 text-xs"
												onClick={() =>
													addSignature("BP", "CLIENT")
												}
											>
												<Plus className="h-3 w-3 mr-1" />{" "}
												Firmar
											</Button>
										)}
									</div>
								</div>
							</div>
						)}

						{/* Pagaré */}
						{pagare && (
							<div className="border rounded-lg p-4 space-y-3">
								<div className="flex items-center justify-between">
									<h4 className="font-medium">Pagaré</h4>
									<Badge
										variant={
											(pagare.signedByClient ??
											validation?.pagareSignedByClient ??
											false)
												? "default"
												: "outline"
										}
									>
										{(pagare.signedByClient ??
										validation?.pagareSignedByClient ??
										false)
											? "Completo"
											: "Pendiente"}
									</Badge>
								</div>
								<div className="grid grid-cols-2 gap-4">
									{/* Pagare Client */}
									<div className="flex items-center justify-between gap-2 p-2 rounded hover:bg-muted/50 transition-colors">
										<div className="flex items-center gap-2">
											<User className="h-4 w-4 text-muted-foreground" />
											<div>
												<p className="text-sm font-medium">
													Cliente
												</p>
												<p className="text-xs text-muted-foreground">
													{(pagare.signedByClient ??
													validation?.pagareSignedByClient ??
													false)
														? "Firmado"
														: "Pendiente"}
												</p>
											</div>
										</div>
										{(pagare.signedByClient ??
										validation?.pagareSignedByClient ??
										false) ? (
											<CheckCircle className="h-4 w-4 text-green-500" />
										) : (
											<Button
												size="sm"
												variant="ghost"
												className="h-6 text-xs"
												onClick={() =>
													addSignature(
														"PAGARE",
														"CLIENT",
													)
												}
											>
												<Plus className="h-3 w-3 mr-1" />{" "}
												Firmar
											</Button>
										)}
									</div>
									{/* Pagare Bank */}
									<div className="flex items-center justify-between gap-2 p-2 rounded hover:bg-muted/50 transition-colors">
										<div className="flex items-center gap-2">
											<Landmark className="h-4 w-4 text-muted-foreground" />
											<div>
												<p className="text-sm font-medium">
													Banco
												</p>
												<p className="text-xs text-muted-foreground">
													{(pagare.signedByBank ??
													validation?.pagareSignedByBank ??
													false)
														? "Firmado"
														: "Opcional"}
												</p>
											</div>
										</div>
										{(pagare.signedByBank ??
										validation?.pagareSignedByBank ??
										false) ? (
											<CheckCircle className="h-4 w-4 text-green-500" />
										) : (
											<Button
												size="sm"
												variant="ghost"
												className="h-6 text-xs"
												onClick={() =>
													addSignature(
														"PAGARE",
														"BANK",
													)
												}
											>
												<Plus className="h-3 w-3 mr-1" />{" "}
												Firmar
											</Button>
										)}
									</div>
								</div>
							</div>
						)}
					</div>
				)}

				{/* Formulario de Firmas (Visible si hay firmas agregadas) */}
				{form.watch("signatures").length > 0 && (
					<Card className="border-primary/20 bg-primary/5">
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium">
								Firmas a Ejecutar
							</CardTitle>
						</CardHeader>
						<CardContent>
							<Form {...form}>
								<form
									onSubmit={form.handleSubmit(
										handleExecuteSignatures,
									)}
									className="space-y-4"
								>
									<div className="space-y-2">
										{form
											.watch("signatures")
											.map((sig, index) => (
												<div
													key={index}
													className="flex items-end gap-2 p-2 bg-background border rounded-lg"
												>
													<div className="flex-1 grid grid-cols-2 gap-2">
														<div className="text-sm font-medium py-2">
															{sig.documentType} -{" "}
															{sig.signerType}
														</div>
														<FormField
															control={
																form.control
															}
															name={`signatures.${index}.signerEmail`}
															render={({
																field,
															}) => (
																<FormItem className="space-y-0">
																	<FormControl>
																		<Input
																			className="h-9"
																			type="email"
																			placeholder="email@example.com"
																			{...field}
																		/>
																	</FormControl>
																	<FormMessage />
																</FormItem>
															)}
														/>
													</div>
													<Button
														type="button"
														variant="ghost"
														size="icon"
														className="h-9 w-9"
														onClick={() => {
															const current =
																form.getValues(
																	"signatures",
																);
															form.setValue(
																"signatures",
																current.filter(
																	(_, i) =>
																		i !==
																		index,
																),
															);
														}}
													>
														<Trash2 className="h-4 w-4" />
													</Button>
												</div>
											))}
									</div>

									<div className="flex justify-end gap-2">
										<Button
											type="button"
											variant="outline"
											onClick={() =>
												form.setValue("signatures", [])
											}
										>
											Cancelar
										</Button>
										<Button
											type="submit"
											disabled={
												executeSignaturesMutation.isPending
											}
										>
											{executeSignaturesMutation.isPending && (
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											)}
											Ejecutar{" "}
											{form.watch("signatures").length}{" "}
											Firma(s)
										</Button>
									</div>
								</form>
							</Form>
						</CardContent>
					</Card>
				)}

				{/* eSignAnywhere Integration Button */}
				{!allSigned && !cd?.esignEnvelopeId && !bp?.esignEnvelopeId && (
					<div className="pt-2 border-t">
						<Button
							variant="outline"
							className="w-full border-blue-200 bg-blue-50/30 hover:bg-blue-50 hover:border-blue-300 text-blue-700 h-10"
							onClick={() => {
								setPreparingEsign(true);
								prepareEsignMutation.mutate();
							}}
							disabled={preparingEsign || isLoading}
						>
							{preparingEsign ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : (
								<ShieldCheck className="mr-2 h-4 w-4" />
							)}
							Solicitar Firma Oficial
						</Button>
						<p className="text-[10px] text-center text-muted-foreground mt-2 italic">
							* Este flujo envía un email real a los 3 firmantes
							(Cliente, Almacén y Banco).
						</p>
					</div>
				)}

				{/* Mensaje cuando ya existe un sobre de firma activo */}
				{!allSigned && (cd?.esignEnvelopeId || bp?.esignEnvelopeId) && (
					<div className="pt-2 border-t">
						<Alert className="bg-amber-50 border-amber-200">
							<AlertCircle className="h-4 w-4 text-amber-600" />
							<AlertDescription className="text-amber-900">
								<div className="flex flex-col gap-1">
									<span className="font-semibold">
										Flujo de firma oficial ya iniciado
									</span>
									<span className="text-xs">
										Los documentos están en proceso de
										firma. ID:{" "}
										{cd?.esignEnvelopeId ||
											bp?.esignEnvelopeId}
									</span>
								</div>
							</AlertDescription>
						</Alert>
					</div>
				)}
			</div>

			{/* eSignAnywhere Actor Confirmation Dialog */}
			<Dialog open={isEsignModalOpen} onOpenChange={setIsEsignModalOpen}>
				<DialogContent className="max-w-md h-[85vh] max-h-175 overflow-hidden p-0 gap-0 flex flex-col">
					<DialogHeader className="px-6 pt-6 pb-4 shrink-0 border-b">
						<DialogTitle className="flex items-center gap-2">
							<ShieldCheck className="h-5 w-5 text-blue-600" />
							Confirmar Firmantes Oficiales
						</DialogTitle>
						<DialogDescription>
							Verifica los datos de contacto. Se enviará un email
							a cada uno para firmar el CD y BP.
						</DialogDescription>
					</DialogHeader>

					{esignActors && (
						<div className="space-y-4 px-6 py-4 overflow-y-auto flex-1 min-h-0">
							<div className="space-y-3">
								<h5 className="text-sm font-semibold flex items-center gap-2">
									<Building2 className="h-4 w-4 text-muted-foreground" />
									Almacén General (Warrant)
								</h5>
								<div className="grid grid-cols-2 gap-2">
									<Input
										placeholder="Nombre"
										value={esignActors.warehouse.givenName}
										onChange={(e) =>
											setEsignActors({
												...esignActors,
												warehouse: {
													...esignActors.warehouse,
													givenName: e.target.value,
												},
											})
										}
									/>
									<Input
										placeholder="Apellido"
										value={esignActors.warehouse.surname}
										onChange={(e) =>
											setEsignActors({
												...esignActors,
												warehouse: {
													...esignActors.warehouse,
													surname: e.target.value,
												},
											})
										}
									/>
								</div>
								<div className="relative">
									<Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
									<Input
										className="pl-9"
										placeholder="Email"
										value={esignActors.warehouse.email}
										onChange={(e) =>
											setEsignActors({
												...esignActors,
												warehouse: {
													...esignActors.warehouse,
													email: e.target.value,
												},
											})
										}
									/>
								</div>
								<div>
									<div className="relative">
										<Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
										<Input
											className={`pl-9 ${phoneValidationErrors.warehouse ? "border-red-500 focus-visible:ring-red-500" : ""}`}
											placeholder="+591 2 1234567"
											value={
												esignActors.warehouse
													.phoneNumber
											}
											onChange={(e) => {
												setEsignActors({
													...esignActors,
													warehouse: {
														...esignActors.warehouse,
														phoneNumber:
															e.target.value,
													},
												});
												if (
													phoneValidationErrors.warehouse
												) {
													setPhoneValidationErrors({
														...phoneValidationErrors,
														warehouse: undefined,
													});
												}
											}}
										/>
									</div>
									{phoneValidationErrors.warehouse && (
										<p className="text-xs text-red-500 mt-1 flex items-center gap-1">
											<AlertCircle className="h-3 w-3" />
											{phoneValidationErrors.warehouse}
										</p>
									)}
								</div>
							</div>

							<div className="space-y-3">
								<h5 className="text-sm font-semibold flex items-center gap-2">
									<User className="h-4 w-4 text-muted-foreground" />
									Cliente (Titular)
								</h5>
								<div className="grid grid-cols-2 gap-2">
									<Input
										placeholder="Nombre"
										value={esignActors.client.givenName}
										onChange={(e) =>
											setEsignActors({
												...esignActors,
												client: {
													...esignActors.client,
													givenName: e.target.value,
												},
											})
										}
									/>
									<Input
										placeholder="Apellido"
										value={esignActors.client.surname}
										onChange={(e) =>
											setEsignActors({
												...esignActors,
												client: {
													...esignActors.client,
													surname: e.target.value,
												},
											})
										}
									/>
								</div>
								<div className="relative">
									<Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
									<Input
										className="pl-9"
										placeholder="Email"
										value={esignActors.client.email}
										onChange={(e) =>
											setEsignActors({
												...esignActors,
												client: {
													...esignActors.client,
													email: e.target.value,
												},
											})
										}
									/>
								</div>
								<div>
									<div className="relative">
										<Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
										<Input
											className={`pl-9 ${phoneValidationErrors.client ? "border-red-500 focus-visible:ring-red-500" : ""}`}
											placeholder="+591 2 1234567"
											value={
												esignActors.client.phoneNumber
											}
											onChange={(e) => {
												setEsignActors({
													...esignActors,
													client: {
														...esignActors.client,
														phoneNumber:
															e.target.value,
													},
												});
												if (
													phoneValidationErrors.client
												) {
													setPhoneValidationErrors({
														...phoneValidationErrors,
														client: undefined,
													});
												}
											}}
										/>
									</div>
									{phoneValidationErrors.client && (
										<p className="text-xs text-red-500 mt-1 flex items-center gap-1">
											<AlertCircle className="h-3 w-3" />
											{phoneValidationErrors.client}
										</p>
									)}
								</div>
							</div>

							<div className="space-y-3">
								<h5 className="text-sm font-semibold flex items-center gap-2">
									<Landmark className="h-4 w-4 text-muted-foreground" />
									Entidad Financiera (Endosatario)
								</h5>
								<div className="grid grid-cols-2 gap-2">
									<Input
										placeholder="Nombre"
										value={
											esignActors.financialEntity
												.givenName
										}
										onChange={(e) =>
											setEsignActors({
												...esignActors,
												financialEntity: {
													...esignActors.financialEntity,
													givenName: e.target.value,
												},
											})
										}
									/>
									<Input
										placeholder="Apellido"
										value={
											esignActors.financialEntity.surname
										}
										onChange={(e) =>
											setEsignActors({
												...esignActors,
												financialEntity: {
													...esignActors.financialEntity,
													surname: e.target.value,
												},
											})
										}
									/>
								</div>
								<div className="relative">
									<Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
									<Input
										className="pl-9"
										placeholder="Email"
										value={
											esignActors.financialEntity.email
										}
										onChange={(e) =>
											setEsignActors({
												...esignActors,
												financialEntity: {
													...esignActors.financialEntity,
													email: e.target.value,
												},
											})
										}
									/>
								</div>
								<div>
									<div className="relative">
										<Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
										<Input
											className={`pl-9 ${phoneValidationErrors.financialEntity ? "border-red-500 focus-visible:ring-red-500" : ""}`}
											placeholder="+591 3 1234567"
											value={
												esignActors.financialEntity
													.phoneNumber
											}
											onChange={(e) => {
												setEsignActors({
													...esignActors,
													financialEntity: {
														...esignActors.financialEntity,
														phoneNumber:
															e.target.value,
													},
												});
												if (
													phoneValidationErrors.financialEntity
												) {
													setPhoneValidationErrors({
														...phoneValidationErrors,
														financialEntity:
															undefined,
													});
												}
											}}
										/>
									</div>
									{phoneValidationErrors.financialEntity && (
										<p className="text-xs text-red-500 mt-1 flex items-center gap-1">
											<AlertCircle className="h-3 w-3" />
											{
												phoneValidationErrors.financialEntity
											}
										</p>
									)}
								</div>
							</div>

							<div className="p-3 bg-yellow-50 border border-yellow-100 rounded-md flex gap-2">
								<Info className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
								<p className="text-[11px] text-yellow-800">
									Se usará el flujo de{" "}
									<strong>Firma con Certificado PDF</strong>{" "}
									de eSignAnywhere. Los números de teléfono
									deben incluir código de país (ej: +591 2
									1234567).
								</p>
							</div>
						</div>
					)}

					<DialogFooter className="px-6 py-4 shrink-0 border-t">
						<Button
							variant="outline"
							onClick={() => {
								setIsEsignModalOpen(false);
								setPhoneValidationErrors({});
							}}
						>
							Cancelar
						</Button>
						<Button
							className="bg-blue-600 hover:bg-blue-700"
							onClick={handleInitiateEsign}
							disabled={initiateEsignMutation.isPending}
						>
							{initiateEsignMutation.isPending && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							Iniciar Firma Oficial
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
