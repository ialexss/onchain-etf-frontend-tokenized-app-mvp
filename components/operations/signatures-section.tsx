"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { DocumentBundle } from "@/types/operation";
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
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface SignaturesSectionProps {
	operationId: number;
	bundle?: DocumentBundle;
}

interface SignatureItem {
	documentType: "CD" | "BP" | "PAGARE";
	signerType: "WAREHOUSE" | "CLIENT" | "BANK";
	signerEmail: string;
}

export function SignaturesSection({
	operationId,
	bundle,
}: SignaturesSectionProps) {
	const queryClient = useQueryClient();
	const [signatures, setSignatures] = useState<SignatureItem[]>([]);

	const executeSignaturesMutation = useMutation({
		mutationFn: (sigs: SignatureItem[]) =>
			operationsApi.executeSignatures(operationId, sigs),
		onSuccess: () => {
			toast.success("Firmas ejecutadas exitosamente");
			queryClient.invalidateQueries({
				queryKey: ["operations", operationId],
			});
			queryClient.invalidateQueries({
				queryKey: ["document-bundle", operationId],
			});
			setSignatures([]);
		},
		onError: (error: any) => {
			toast.error(
				error.response?.data?.message || "Error al ejecutar las firmas"
			);
		},
	});

	if (!bundle) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Firmas de Documentos</CardTitle>
				</CardHeader>
				<CardContent>
					<Alert>
						<FileSignature className="h-4 w-4" />
						<AlertDescription>
							No hay bundle de documentos disponible aún. Los
							documentos deben estar generados o subidos primero.
						</AlertDescription>
					</Alert>
				</CardContent>
			</Card>
		);
	}

	const cd = bundle.cd;
	const bp = bundle.bp;
	const pagare = bundle.pagare;

	// Calcular progreso de firmas (6 firmas totales según el diagrama)
	// Ajustar según documentos disponibles
	let totalSignatures = 0;
	let completedSignatures = 0;

	if (cd) {
		totalSignatures += 2; // warehouse + client
		completedSignatures += (cd.signedByWarehouse ? 1 : 0) + (cd.signedByClient ? 1 : 0);
	}

	if (bp) {
		totalSignatures += 2; // warehouse + client
		completedSignatures += (bp.signedByWarehouse ? 1 : 0) + (bp.signedByClient ? 1 : 0);
	}

	if (pagare) {
		totalSignatures += 2; // client + bank
		completedSignatures += (pagare.signedByClient ? 1 : 0) + (pagare.signedByBank ? 1 : 0);
	}

	const progressPercentage = totalSignatures > 0 ? (completedSignatures / totalSignatures) * 100 : 0;

	const allSigned =
		(!cd || (cd.signedByWarehouse && cd.signedByClient)) &&
		(!bp || (bp.signedByWarehouse && bp.signedByClient)) &&
		(!pagare || (pagare.signedByClient && pagare.signedByBank));

	const getSignatureStatus = (
		document: any,
		requiredSignatures: Array<"warehouse" | "client" | "bank">
	) => {
		const status: { [key: string]: boolean } = {};
		requiredSignatures.forEach((sig) => {
			if (sig === "warehouse")
				status.warehouse = document.signedByWarehouse || false;
			if (sig === "client")
				status.client = document.signedByClient || false;
			if (sig === "bank") status.bank = document.signedByBank || false;
		});
		return status;
	};

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
		executeSignaturesMutation.mutate(values.signatures);
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center justify-between">
					<span>Estado de Firmas</span>
					{allSigned && (
						<Badge variant="default" className="bg-green-500">
							<CheckCircle className="h-3 w-3 mr-1" />
							Todos firmados
						</Badge>
					)}
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-6">
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
					{cd ? (
						<div className="border rounded-lg p-4 space-y-3">
							<div className="flex items-center justify-between">
								<h4 className="font-medium">
									Certificado de Depósito (CD)
								</h4>
								<Badge
									variant={
										cd.signedByWarehouse && cd.signedByClient
											? "default"
											: "outline"
									}
								>
									{cd.signedByWarehouse && cd.signedByClient ? (
										<>
											<CheckCircle className="h-3 w-3 mr-1" />
											Completo
										</>
									) : (
										<>
											<XCircle className="h-3 w-3 mr-1" />
											Pendiente
										</>
									)}
								</Badge>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div className="flex items-center gap-2">
									<Building2 className="h-4 w-4 text-muted-foreground" />
									<div className="flex-1">
										<p className="text-sm font-medium">Warehouse</p>
										{cd.signedByWarehouse ? (
											<div className="flex items-center gap-1 text-xs text-green-600">
												<CheckCircle className="h-3 w-3" />
												Firmado
												{cd.warehouseSignatureDate && (
													<span className="text-muted-foreground">
														({new Date(cd.warehouseSignatureDate).toLocaleDateString("es-BO")})
													</span>
												)}
											</div>
										) : (
											<p className="text-xs text-muted-foreground">
												Pendiente
											</p>
										)}
									</div>
								</div>
								<div className="flex items-center gap-2">
									<User className="h-4 w-4 text-muted-foreground" />
									<div className="flex-1">
										<p className="text-sm font-medium">Cliente</p>
										{cd.signedByClient ? (
											<div className="flex items-center gap-1 text-xs text-green-600">
												<CheckCircle className="h-3 w-3" />
												Firmado
												{cd.clientSignatureDate && (
													<span className="text-muted-foreground">
														({new Date(cd.clientSignatureDate).toLocaleDateString("es-BO")})
													</span>
												)}
											</div>
										) : (
											<p className="text-xs text-muted-foreground">
												Pendiente
											</p>
										)}
									</div>
								</div>
							</div>
						</div>
					) : (
						<div className="border rounded-lg p-4">
							<p className="text-sm text-muted-foreground">
								Certificado de Depósito (CD) no disponible
							</p>
						</div>
					)}

					{/* BP */}
					{bp ? (
						<div className="border rounded-lg p-4 space-y-3">
							<div className="flex items-center justify-between">
								<h4 className="font-medium">Bono de Prenda (BP)</h4>
								<Badge
									variant={
										bp.signedByWarehouse && bp.signedByClient
											? "default"
											: "outline"
									}
								>
									{bp.signedByWarehouse && bp.signedByClient ? (
										<>
											<CheckCircle className="h-3 w-3 mr-1" />
											Completo
										</>
									) : (
										<>
											<XCircle className="h-3 w-3 mr-1" />
											Pendiente
										</>
									)}
								</Badge>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div className="flex items-center gap-2">
									<Building2 className="h-4 w-4 text-muted-foreground" />
									<div className="flex-1">
										<p className="text-sm font-medium">Warehouse</p>
										{bp.signedByWarehouse ? (
											<div className="flex items-center gap-1 text-xs text-green-600">
												<CheckCircle className="h-3 w-3" />
												Firmado
												{bp.warehouseSignatureDate && (
													<span className="text-muted-foreground">
														({new Date(bp.warehouseSignatureDate).toLocaleDateString("es-BO")})
													</span>
												)}
											</div>
										) : (
											<p className="text-xs text-muted-foreground">
												Pendiente
											</p>
										)}
									</div>
								</div>
								<div className="flex items-center gap-2">
									<User className="h-4 w-4 text-muted-foreground" />
									<div className="flex-1">
										<p className="text-sm font-medium">Cliente</p>
										{bp.signedByClient ? (
											<div className="flex items-center gap-1 text-xs text-green-600">
												<CheckCircle className="h-3 w-3" />
												Firmado
												{bp.clientSignatureDate && (
													<span className="text-muted-foreground">
														({new Date(bp.clientSignatureDate).toLocaleDateString("es-BO")})
													</span>
												)}
											</div>
										) : (
											<p className="text-xs text-muted-foreground">
												Pendiente
											</p>
										)}
									</div>
								</div>
							</div>
						</div>
					) : (
						<div className="border rounded-lg p-4">
							<p className="text-sm text-muted-foreground">
								Bono de Prenda (BP) no disponible
							</p>
						</div>
					)}

					{/* Pagaré */}
					{pagare ? (
						<div className="border rounded-lg p-4 space-y-3">
							<div className="flex items-center justify-between">
								<h4 className="font-medium">Pagaré</h4>
								<Badge
									variant={
										pagare.signedByClient && pagare.signedByBank
											? "default"
											: "outline"
									}
								>
									{pagare.signedByClient && pagare.signedByBank ? (
										<>
											<CheckCircle className="h-3 w-3 mr-1" />
											Completo
										</>
									) : (
										<>
											<XCircle className="h-3 w-3 mr-1" />
											Pendiente
										</>
									)}
								</Badge>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div className="flex items-center gap-2">
									<User className="h-4 w-4 text-muted-foreground" />
									<div className="flex-1">
										<p className="text-sm font-medium">Cliente</p>
										{pagare.signedByClient ? (
											<div className="flex items-center gap-1 text-xs text-green-600">
												<CheckCircle className="h-3 w-3" />
												Firmado
												{pagare.clientSignatureDate && (
													<span className="text-muted-foreground">
														({new Date(pagare.clientSignatureDate).toLocaleDateString("es-BO")})
													</span>
												)}
											</div>
										) : (
											<p className="text-xs text-muted-foreground">
												Pendiente
											</p>
										)}
									</div>
								</div>
								<div className="flex items-center gap-2">
									<Landmark className="h-4 w-4 text-muted-foreground" />
									<div className="flex-1">
										<p className="text-sm font-medium">Entidad Financiera/Banco</p>
										{pagare.signedByBank ? (
											<div className="flex items-center gap-1 text-xs text-green-600">
												<CheckCircle className="h-3 w-3" />
												Firmado
												{pagare.bankSignatureDate && (
													<span className="text-muted-foreground">
														({new Date(pagare.bankSignatureDate).toLocaleDateString("es-BO")})
													</span>
												)}
											</div>
										) : (
											<p className="text-xs text-muted-foreground">
												Pendiente
											</p>
										)}
									</div>
								</div>
							</div>
						</div>
					) : (
						<div className="border rounded-lg p-4">
							<p className="text-sm text-muted-foreground">
								Pagaré no disponible
							</p>
						</div>
					)}
				</div>

				{allSigned && (
					<Alert className="bg-green-50 border-green-200">
						<CheckCircle className="h-4 w-4 text-green-600" />
						<AlertDescription className="text-green-800">
							Todos los documentos han sido firmados
							correctamente. La operación está lista para
							tokenización.
						</AlertDescription>
					</Alert>
				)}

				{!allSigned && (
					<>
						<Alert>
							<FileSignature className="h-4 w-4" />
							<AlertDescription>
								Algunos documentos aún no han sido firmados. Todos
								los documentos deben estar firmados antes de
								proceder con la tokenización.
							</AlertDescription>
						</Alert>

						{/* Formulario para ejecutar firmas */}
						<Card>
							<CardHeader>
								<CardTitle>Ejecutar Firmas Atómicas</CardTitle>
							</CardHeader>
							<CardContent>
								<Form {...form}>
									<form
										onSubmit={form.handleSubmit(handleExecuteSignatures)}
										className="space-y-4"
									>
										<div className="space-y-2">
											<FormLabel>Agregar Firmas</FormLabel>
											<div className="space-y-2">
												{form.watch("signatures").map((sig, index) => (
													<div
														key={index}
														className="flex items-end gap-2 p-3 border rounded-lg"
													>
														<FormField
															control={form.control}
															name={`signatures.${index}.documentType`}
															render={({ field }) => (
																<FormItem className="flex-1">
																	<FormLabel>Documento</FormLabel>
																	<Select
																		onValueChange={field.onChange}
																		value={field.value}
																	>
																		<FormControl>
																			<SelectTrigger>
																				<SelectValue />
																			</SelectTrigger>
																		</FormControl>
																		<SelectContent>
																			<SelectItem value="CD">CD</SelectItem>
																			<SelectItem value="BP">BP</SelectItem>
																			<SelectItem value="PAGARE">Pagaré</SelectItem>
																		</SelectContent>
																	</Select>
																</FormItem>
															)}
														/>
														<FormField
															control={form.control}
															name={`signatures.${index}.signerType`}
															render={({ field }) => (
																<FormItem className="flex-1">
																	<FormLabel>Tipo</FormLabel>
																	<Select
																		onValueChange={field.onChange}
																		value={field.value}
																	>
																		<FormControl>
																			<SelectTrigger>
																				<SelectValue />
																			</SelectTrigger>
																		</FormControl>
																		<SelectContent>
																			<SelectItem value="WAREHOUSE">Warehouse</SelectItem>
																			<SelectItem value="CLIENT">Cliente</SelectItem>
																			<SelectItem value="BANK">Banco/Entidad Financiera</SelectItem>
																		</SelectContent>
																	</Select>
																</FormItem>
															)}
														/>
														<FormField
															control={form.control}
															name={`signatures.${index}.signerEmail`}
															render={({ field }) => (
																<FormItem className="flex-1">
																	<FormLabel>Email</FormLabel>
																	<FormControl>
																		<Input
																			type="email"
																			placeholder="email@example.com"
																			{...field}
																		/>
																	</FormControl>
																	<FormMessage />
																</FormItem>
															)}
														/>
														<Button
															type="button"
															variant="ghost"
															size="icon"
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
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={() => {
													const current = form.getValues("signatures");
													form.setValue("signatures", [
														...current,
														{
															documentType: "CD",
															signerType: "WAREHOUSE",
															signerEmail: "",
														},
													]);
												}}
											>
												<Plus className="h-4 w-4 mr-2" />
												Agregar Firma
											</Button>
										</div>

										<Button
											type="submit"
											disabled={executeSignaturesMutation.isPending}
											className="w-full"
										>
											{executeSignaturesMutation.isPending && (
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											)}
											Ejecutar Firmas
										</Button>
									</form>
								</Form>
							</CardContent>
						</Card>
					</>
				)}
			</CardContent>
		</Card>
	);
}




