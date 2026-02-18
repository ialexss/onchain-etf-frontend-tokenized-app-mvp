"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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

export function AtomicAssetBundleSignatures({
	assetId,
	operationId,
	onSuccess
}: AtomicAssetBundleSignaturesProps) {
	const queryClient = useQueryClient();

	// Obtener estado del bundle con documentos y firmas
	const { data: bundleStatus, isLoading } = useQuery({
		queryKey: ["asset-token-bundle", assetId, "status"],
		queryFn: () => operationsApi.getAssetTokenBundleStatus(assetId),
		enabled: !!assetId,
	});

	const validation = bundleStatus?.validation || {} as any;
	const documents = bundleStatus?.documents || {} as any;

	// Verificar documentos desde múltiples fuentes
	// El backend puede devolver null si no existe, o un objeto si existe
	const cd = documents.cd && documents.cd !== null ? documents.cd : null;
	const bp = documents.bp && documents.bp !== null ? documents.bp : null;
	const pagare = documents.pagare && documents.pagare !== null ? documents.pagare : null;
	
	// Debug: Log para verificar qué se está recibiendo
	console.log('AtomicAssetBundleSignatures - bundleStatus:', bundleStatus);
	console.log('AtomicAssetBundleSignatures - documents:', documents);
	console.log('AtomicAssetBundleSignatures - cd:', cd);
	console.log('AtomicAssetBundleSignatures - cd.signedByWarehouse:', cd?.signedByWarehouse, 'cd.signedByClient:', cd?.signedByClient);
	console.log('AtomicAssetBundleSignatures - bp:', bp);
	console.log('AtomicAssetBundleSignatures - bp.signedByWarehouse:', bp?.signedByWarehouse, 'bp.signedByClient:', bp?.signedByClient);
	console.log('AtomicAssetBundleSignatures - pagare:', pagare);

	// Calcular progreso de firmas
	// Usar también validation como fuente alternativa si documents no tiene las propiedades
	let totalSignatures = 0;
	let completedSignatures = 0;
	const missingSignatures: string[] = [];

	if (cd) {
		totalSignatures += 2; // warehouse + client
		// Verificar desde múltiples fuentes: documents.cd y validation
		const cdWarehouseSigned = cd.signedByWarehouse ?? validation?.cdSignedByWarehouse ?? false;
		const cdClientSigned = cd.signedByClient ?? validation?.cdSignedByClient ?? false;
		completedSignatures += (cdWarehouseSigned ? 1 : 0) + (cdClientSigned ? 1 : 0);
		if (!cdWarehouseSigned) missingSignatures.push("CD - Warehouse");
		if (!cdClientSigned) missingSignatures.push("CD - Cliente");
		console.log('CD signatures - Warehouse:', cdWarehouseSigned, 'Client:', cdClientSigned);
	}

	if (bp) {
		totalSignatures += 2; // warehouse + client
		// Verificar desde múltiples fuentes: documents.bp y validation
		const bpWarehouseSigned = bp.signedByWarehouse ?? validation?.bpSignedByWarehouse ?? false;
		const bpClientSigned = bp.signedByClient ?? validation?.bpSignedByClient ?? false;
		completedSignatures += (bpWarehouseSigned ? 1 : 0) + (bpClientSigned ? 1 : 0);
		if (!bpWarehouseSigned) missingSignatures.push("BP - Warehouse");
		if (!bpClientSigned) missingSignatures.push("BP - Cliente");
		console.log('BP signatures - Warehouse:', bpWarehouseSigned, 'Client:', bpClientSigned);
	}

	// Pagaré es opcional - solo cuenta si existe
	if (pagare) {
		totalSignatures += 1; // Solo cliente es requerido
		const pagareClientSigned = pagare.signedByClient ?? validation?.pagareSignedByClient ?? false;
		completedSignatures += pagareClientSigned ? 1 : 0;
		if (!pagareClientSigned) missingSignatures.push("Pagaré - Cliente");
		console.log('Pagaré signatures - Client:', pagareClientSigned);
		// Banco es opcional
	}
	
	console.log('Total signatures:', totalSignatures, 'Completed:', completedSignatures);

	const progressPercentage = totalSignatures > 0 ? (completedSignatures / totalSignatures) * 100 : 0;

	// Verificar desde múltiples fuentes
	const allSigned =
		(!cd || ((cd.signedByWarehouse ?? validation?.cdSignedByWarehouse ?? false) && (cd.signedByClient ?? validation?.cdSignedByClient ?? false))) &&
		(!bp || ((bp.signedByWarehouse ?? validation?.bpSignedByWarehouse ?? false) && (bp.signedByClient ?? validation?.bpSignedByClient ?? false))) &&
		(!pagare || (pagare.signedByClient ?? validation?.pagareSignedByClient ?? false));

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
				error.response?.data?.message || error.message || "Error al ejecutar las firmas"
			);
		},
	});

	// Schema para formulario de firmas
	const signatureSchema = z.object({
		signatures: z.array(
			z.object({
				documentType: z.enum(["CD", "BP", "PAGARE"]),
				signerEmail: z.string().email("Email inválido"),
				signerType: z.enum(["WAREHOUSE", "CLIENT", "BANK"]),
			})
		),
	});

	const form = useForm<z.infer<typeof signatureSchema>>({
		resolver: zodResolver(signatureSchema),
		defaultValues: {
			signatures: [],
		},
	});

	const handleExecuteSignatures = (values: z.infer<typeof signatureSchema>) => {
		if (values.signatures.length === 0) {
			toast.error("Debe agregar al menos una firma");
			return;
		}
		
		// Validar que todos los emails estén completos
		const incompleteSignatures = values.signatures.filter(sig => !sig.signerEmail || sig.signerEmail.trim() === "");
		if (incompleteSignatures.length > 0) {
			toast.error("Todos los emails deben estar completos");
			return;
		}
		
		console.log('Ejecutando firmas:', {
			operationId,
			assetId,
			signatures: values.signatures
		});
		
		executeSignaturesMutation.mutate(values.signatures);
	};

    // Helper to add signature quickly
    const addSignature = (docType: "CD" | "BP" | "PAGARE", signerType: "WAREHOUSE" | "CLIENT" | "BANK") => {
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
					Los documentos (CD y BP) deben estar subidos antes de solicitar firmas.
				</AlertDescription>
			</Alert>
		);
	}

	return (
		<div className="space-y-6">
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

			{/* Matriz de Firmas */}
			<div className="space-y-4">
				{/* CD */}
				{cd && (
					<div className="border rounded-lg p-4 space-y-3">
						<div className="flex items-center justify-between">
							<h4 className="font-medium">Certificado de Depósito (CD)</h4>
							<Badge variant={cd.signedByWarehouse && cd.signedByClient ? "default" : "outline"}>
								{cd.signedByWarehouse && cd.signedByClient ? "Completo" : "Pendiente"}
							</Badge>
						</div>
						<div className="grid grid-cols-2 gap-4">
                            {/* CD Warehouse */}
							<div className="flex items-center justify-between gap-2 p-2 rounded hover:bg-muted/50 transition-colors">
								<div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium">Warehouse</p>
                                        <p className="text-xs text-muted-foreground">
                                            {(cd.signedByWarehouse ?? validation?.cdSignedByWarehouse ?? false) ? "Firmado" : "Pendiente"}
                                        </p>
                                    </div>
                                </div>
								{(cd.signedByWarehouse ?? validation?.cdSignedByWarehouse ?? false) ? (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
								) : (
                                    <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => addSignature("CD", "WAREHOUSE")}>
                                        <Plus className="h-3 w-3 mr-1" /> Firmar
                                    </Button>
								)}
							</div>
                            {/* CD Client */}
							<div className="flex items-center justify-between gap-2 p-2 rounded hover:bg-muted/50 transition-colors">
								<div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium">Cliente</p>
                                        <p className="text-xs text-muted-foreground">
                                            {(cd.signedByClient ?? validation?.cdSignedByClient ?? false) ? "Firmado" : "Pendiente"}
                                        </p>
                                    </div>
                                </div>
								{(cd.signedByClient ?? validation?.cdSignedByClient ?? false) ? (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
								) : (
                                    <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => addSignature("CD", "CLIENT")}>
                                        <Plus className="h-3 w-3 mr-1" /> Firmar
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
							<h4 className="font-medium">Bono de Prenda (BP)</h4>
							<Badge variant={((bp.signedByWarehouse ?? validation?.bpSignedByWarehouse ?? false) && (bp.signedByClient ?? validation?.bpSignedByClient ?? false)) ? "default" : "outline"}>
								{((bp.signedByWarehouse ?? validation?.bpSignedByWarehouse ?? false) && (bp.signedByClient ?? validation?.bpSignedByClient ?? false)) ? "Completo" : "Pendiente"}
							</Badge>
						</div>
						<div className="grid grid-cols-2 gap-4">
                            {/* BP Warehouse */}
							<div className="flex items-center justify-between gap-2 p-2 rounded hover:bg-muted/50 transition-colors">
								<div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium">Warehouse</p>
                                        <p className="text-xs text-muted-foreground">
                                            {(bp.signedByWarehouse ?? validation?.bpSignedByWarehouse ?? false) ? "Firmado" : "Pendiente"}
                                        </p>
                                    </div>
                                </div>
								{(bp.signedByWarehouse ?? validation?.bpSignedByWarehouse ?? false) ? (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
								) : (
                                    <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => addSignature("BP", "WAREHOUSE")}>
                                        <Plus className="h-3 w-3 mr-1" /> Firmar
                                    </Button>
								)}
							</div>
                            {/* BP Client */}
							<div className="flex items-center justify-between gap-2 p-2 rounded hover:bg-muted/50 transition-colors">
								<div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium">Cliente</p>
                                        <p className="text-xs text-muted-foreground">
                                            {(bp.signedByClient ?? validation?.bpSignedByClient ?? false) ? "Firmado" : "Pendiente"}
                                        </p>
                                    </div>
                                </div>
								{(bp.signedByClient ?? validation?.bpSignedByClient ?? false) ? (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
								) : (
                                    <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => addSignature("BP", "CLIENT")}>
                                        <Plus className="h-3 w-3 mr-1" /> Firmar
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
							<Badge variant={(pagare.signedByClient ?? validation?.pagareSignedByClient ?? false) ? "default" : "outline"}>
								{(pagare.signedByClient ?? validation?.pagareSignedByClient ?? false) ? "Completo" : "Pendiente"}
							</Badge>
						</div>
						<div className="grid grid-cols-2 gap-4">
                            {/* Pagare Client */}
							<div className="flex items-center justify-between gap-2 p-2 rounded hover:bg-muted/50 transition-colors">
								<div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium">Cliente</p>
                                        <p className="text-xs text-muted-foreground">
                                            {(pagare.signedByClient ?? validation?.pagareSignedByClient ?? false) ? "Firmado" : "Pendiente"}
                                        </p>
                                    </div>
                                </div>
								{(pagare.signedByClient ?? validation?.pagareSignedByClient ?? false) ? (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
								) : (
                                    <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => addSignature("PAGARE", "CLIENT")}>
                                        <Plus className="h-3 w-3 mr-1" /> Firmar
                                    </Button>
								)}
							</div>
                            {/* Pagare Bank */}
							<div className="flex items-center justify-between gap-2 p-2 rounded hover:bg-muted/50 transition-colors">
								<div className="flex items-center gap-2">
                                    <Landmark className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium">Banco</p>
                                        <p className="text-xs text-muted-foreground">
                                            {(pagare.signedByBank ?? validation?.pagareSignedByBank ?? false) ? "Firmado" : "Opcional"}
                                        </p>
                                    </div>
                                </div>
								{(pagare.signedByBank ?? validation?.pagareSignedByBank ?? false) ? (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
								) : (
                                    <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => addSignature("PAGARE", "BANK")}>
                                        <Plus className="h-3 w-3 mr-1" /> Firmar
                                    </Button>
								)}
							</div>
						</div>
					</div>
				)}
			</div>

			{/* Formulario de Firmas (Visible si hay firmas agregadas) */}
            {form.watch("signatures").length > 0 && (
                <Card className="border-primary/20 bg-primary/5">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Firmas a Ejecutar</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form
                                onSubmit={form.handleSubmit(handleExecuteSignatures)}
                                className="space-y-4"
                            >
                                <div className="space-y-2">
                                    {form.watch("signatures").map((sig, index) => (
                                        <div
                                            key={index}
                                            className="flex items-end gap-2 p-2 bg-background border rounded-lg"
                                        >
                                            <div className="flex-1 grid grid-cols-2 gap-2">
                                                <div className="text-sm font-medium py-2">
                                                    {sig.documentType} - {sig.signerType}
                                                </div>
                                                <FormField
                                                    control={form.control}
                                                    name={`signatures.${index}.signerEmail`}
                                                    render={({ field }) => (
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
                                                    const current = form.getValues("signatures");
                                                    form.setValue(
                                                        "signatures",
                                                        current.filter((_, i) => i !== index)
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
                                        onClick={() => form.setValue("signatures", [])}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={executeSignaturesMutation.isPending}
                                    >
                                        {executeSignaturesMutation.isPending && (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        )}
                                        Ejecutar {form.watch("signatures").length} Firma(s)
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            )}
		</div>
	);
}
