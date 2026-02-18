"use client";

import { useState } from "react";
import * as React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { organizationsApi } from "@/lib/api/organizations";
import { operationsApi } from "@/lib/api/operations";
import { toast } from "sonner";
import {
	Loader2,
	Plus,
	Trash2,
	ChevronRight,
	ChevronLeft,
	CheckCircle2,
	FileText,
	Package,
	Building2,
	AlertCircle,
	Coins,
	MapPin,
	Hash,
	Upload,
	X,
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";

/**
 * Schema de validación para Paquete de Activos
 * vinSerial es opcional, description es principal, currency requerido
 */
const assetBundleSchema = z.object({
	vinSerial: z.string().optional(), // Opcional
	description: z.string().min(1, "La descripción es requerida"), // Campo principal
	quantity: z.number().min(1).optional(),
	location: z.string().optional(),
	value: z.number().positive("El valor debe ser mayor a 0"),
	currency: z.enum(["USD", "BOB"], { message: "Debe seleccionar una moneda" }),
	// Documentos opcionales
	cdFile: z.any().optional(),
	bpFile: z.any().optional(),
	pagareFile: z.any().optional(),
	cdTitleNumber: z.string().optional(),
	bpTitleNumber: z.string().optional(),
	pagareTitleNumber: z.string().optional(),
});

const createOperationSchema = z.object({
	operationNumber: z.string().optional(),
	clientId: z.number().min(1, "Debe seleccionar un cliente"),
	bankId: z.number().min(1, "Debe seleccionar una Entidad Financiera"),
	// Campos de financiamiento
	giroValue: z.number().min(0, "El valor de giro debe ser mayor o igual a 0").optional(),
	endorsementValue: z.number().min(0, "El valor de endoso debe ser mayor o igual a 0").optional(),
	termDays: z.number().min(1, "El plazo debe ser mayor a 0").optional(),
	interestRate: z.number().min(0, "La tasa de interés debe ser mayor o igual a 0").optional(),
	guaranteeRiskRatio: z.string().optional(),
	assets: z
		.array(assetBundleSchema)
		.min(1, "Debe agregar al menos un activo"),
});

type CreateOperationFormValues = z.infer<typeof createOperationSchema>;

const STEPS = [
	{ id: 1, title: "Información Básica", description: "Cliente y Entidad Financiera", icon: Building2 },
	{ id: 2, title: "Paquetes de Activos", description: "Agregar activos", icon: Package },
	{ id: 3, title: "Resumen", description: "Revisar y confirmar", icon: CheckCircle2 },
];

export function CreateOperationWizard() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const { user } = useAuth();
	const [currentStep, setCurrentStep] = useState(1);

	const form = useForm<CreateOperationFormValues>({
		resolver: zodResolver(createOperationSchema),
		defaultValues: {
			operationNumber: "",
			termDays: 360,
			guaranteeRiskRatio: "1:2",
			assets: [
				{
					vinSerial: "",
					description: "",
					quantity: 1,
					location: "",
					value: 0,
					currency: "USD" as const,
					cdFile: undefined,
					bpFile: undefined,
					pagareFile: undefined,
					cdTitleNumber: "",
					bpTitleNumber: "",
					pagareTitleNumber: "",
				},
			],
		},
		mode: "onChange",
	});

	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: "assets",
	});

	// Obtener organizaciones
	const { data: organizations = [], isLoading: isLoadingOrgs } = useQuery({
		queryKey: ["organizations"],
		queryFn: organizationsApi.getAll,
	});

	// Obtener clientes y Entidades Financieras
	const { data: clients = [], isLoading: isLoadingClients } = useQuery({
		queryKey: ["organizations", "clients"],
		queryFn: organizationsApi.getClients,
	});

	const { data: banks = [], isLoading: isLoadingBanks } = useQuery({
		queryKey: ["organizations", "banks"],
		queryFn: organizationsApi.getBanks,
	});

	const warehouses = organizations.filter((org) => org.type === "WAREHOUSE");
	const isLoadingAllOrgs = isLoadingOrgs || isLoadingClients || isLoadingBanks;

	// Verificar que el usuario pertenezca a una organización WAREHOUSE
	const userWarehouse = user?.organizations?.find(
		(org: any) => org.type === "WAREHOUSE"
	);

	const createMutation = useMutation({
		mutationFn: async (operationData: any) => {
			// Separar documentos de los datos de la operación
			const { _documents, ...createData } = operationData;
			const operation = await operationsApi.create(createData);
			
			// Subir documentos si existen
			if (_documents && operation.assets && operation.assets.length > 0) {
				const uploadPromises: Promise<any>[] = [];
				
				_documents.forEach((docData: any, docIndex: number) => {
					const asset = operation.assets?.[docData.index];
					if (!asset) return;
					
					if (docData.cdFile) {
						uploadPromises.push(
							operationsApi.uploadCD(operation.id, docData.cdFile, asset.id, docData.cdTitleNumber || undefined)
								.catch((err) => {
									console.error(`Error subiendo CD para asset ${asset.id}:`, err);
									return null;
								})
						);
					}
					
					if (docData.bpFile) {
						uploadPromises.push(
							operationsApi.uploadBP(operation.id, docData.bpFile, asset.id, docData.bpTitleNumber || undefined)
								.catch((err) => {
									console.error(`Error subiendo BP para asset ${asset.id}:`, err);
									return null;
								})
						);
					}
					
					if (docData.pagareFile) {
						uploadPromises.push(
							operationsApi.uploadPagare(operation.id, docData.pagareFile, asset.id, docData.pagareTitleNumber || undefined)
								.catch((err) => {
									console.error(`Error subiendo Pagaré para asset ${asset.id}:`, err);
									return null;
								})
						);
					}
				});
				
				if (uploadPromises.length > 0) {
					await Promise.allSettled(uploadPromises);
				}
			}
			
			return operation;
		},
		onSuccess: (data) => {
			toast.success("Operación creada exitosamente");
			queryClient.invalidateQueries({ queryKey: ["operations"] });
			router.push(`/dashboard/operations/${data.id}`);
		},
		onError: (error: any) => {
			toast.error(
				error.response?.data?.message || "Error al crear la operación"
			);
		},
	});

	const handleCreateOperation = async () => {
		const isValid = await form.trigger();
		if (!isValid) {
			return;
		}

		const values = form.getValues();
		const { operationNumber, clientId, bankId, assets, giroValue, endorsementValue, termDays, interestRate, guaranteeRiskRatio } = values;
		
		// Separar archivos de los datos del asset
		const assetsData = assets.map(({ cdFile, bpFile, pagareFile, cdTitleNumber, bpTitleNumber, pagareTitleNumber, ...assetData }) => assetData);
		const documentsData = assets.map((asset, index) => ({
			index,
			cdFile: asset.cdFile,
			bpFile: asset.bpFile,
			pagareFile: asset.pagareFile,
			cdTitleNumber: asset.cdTitleNumber,
			bpTitleNumber: asset.bpTitleNumber,
			pagareTitleNumber: asset.pagareTitleNumber,
		}));
		
		createMutation.mutate({
			...(operationNumber && { operationNumber }),
			clientId,
			bankId,
			...(giroValue !== undefined && { giroValue }),
			...(endorsementValue !== undefined && { endorsementValue }),
			...(termDays !== undefined && { termDays }),
			...(interestRate !== undefined && { interestRate }),
			...(guaranteeRiskRatio && { guaranteeRiskRatio }),
			assets: assetsData,
			_documents: documentsData, // Datos de documentos para subir después
		});
	};

	const onSubmit = (
		values: CreateOperationFormValues,
		e?: React.BaseSyntheticEvent
	) => {
		e?.preventDefault();
	};

	const nextStep = async () => {
		let isValid = false;

		if (currentStep === 1) {
			isValid = await form.trigger(["clientId", "bankId"]);
		} else if (currentStep === 2) {
			isValid = await form.trigger("assets");
		}

		if (isValid && currentStep < STEPS.length) {
			setCurrentStep(currentStep + 1);
		}
	};

	const prevStep = () => {
		if (currentStep > 1) {
			setCurrentStep(currentStep - 1);
		}
	};

	const getSelectedOrgName = (
		id: number | undefined,
		type: "WAREHOUSE" | "CLIENT" | "BANK"
	) => {
		if (!id) return "-";
		const orgs =
			type === "WAREHOUSE"
				? warehouses
				: type === "CLIENT"
				? clients
				: banks;
		return orgs.find((org) => org.id === id)?.name || "-";
	};

	const totalValue =
		form
			.watch("assets")
			?.reduce((sum, asset) => sum + (Number(asset.value) || 0), 0) || 0;

	const totalAssets = fields.length;
	const totalQuantity =
		form
			.watch("assets")
			?.reduce((sum, asset) => sum + (asset.quantity || 1), 0) || 0;

	return (
		<Card className="max-w-5xl mx-auto">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Coins className="h-6 w-6" />
					Crear Nueva Operación
				</CardTitle>
				<CardDescription>
					Configure los Paquetes de Activos para esta operación de depósito
				</CardDescription>
			</CardHeader>
			<CardContent>
				{/* Progress Steps */}
				<div className="flex items-center justify-between mb-8">
					{STEPS.map((step, index) => {
						const StepIcon = step.icon;
						const isActive = currentStep === step.id;
						const isCompleted = currentStep > step.id;

						return (
							<div
								key={step.id}
								className="flex items-center flex-1"
							>
								<div className="flex flex-col items-center flex-1">
									<div
										className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all ${
											isCompleted
												? "bg-green-500 border-green-500 text-white"
												: isActive
												? "border-primary text-primary bg-primary/10"
												: "border-muted text-muted-foreground"
										}`}
									>
										{isCompleted ? (
											<CheckCircle2 className="h-6 w-6" />
										) : (
											<StepIcon className="h-6 w-6" />
										)}
									</div>
									<div className="mt-2 text-center">
										<p
											className={`text-sm font-medium ${
												isActive
													? "text-foreground"
													: "text-muted-foreground"
											}`}
										>
											{step.title}
										</p>
										<p className="text-xs text-muted-foreground">
											{step.description}
										</p>
									</div>
								</div>
								{index < STEPS.length - 1 && (
									<div
										className={`flex-1 h-0.5 mx-4 ${
											isCompleted
												? "bg-green-500"
												: "bg-muted"
										}`}
									/>
								)}
							</div>
						);
					})}
				</div>

				<Form {...form}>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							if (currentStep === STEPS.length) {
								form.handleSubmit(onSubmit)(e);
							}
						}}
						className="space-y-6"
					>
						{/* Step 1: Información Básica */}
						{currentStep === 1 && (
							<div className="space-y-6">
								{/* Información de Warrantera */}
								{userWarehouse && (
									<Alert>
										<Building2 className="h-4 w-4" />
										<AlertDescription>
											<span className="font-medium">Warrantera:</span> {userWarehouse.name}
											<p className="text-xs text-muted-foreground mt-1">
												Se asigna automáticamente según tu organización
											</p>
										</AlertDescription>
									</Alert>
								)}

								{/* Número de Operación */}
								<FormField
									control={form.control}
									name="operationNumber"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Número de Operación</FormLabel>
											<FormControl>
												<Input
													placeholder="0001/25 (opcional)"
													{...field}
												/>
											</FormControl>
											<FormDescription>
												Si no se proporciona, se generará automáticamente
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								{/* Cliente y Entidad Financiera */}
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									<FormField
										control={form.control}
										name="clientId"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Cliente *</FormLabel>
												<Select
													onValueChange={(value) =>
														field.onChange(parseInt(value))
													}
													value={field.value?.toString()}
													disabled={isLoadingAllOrgs}
												>
													<FormControl>
														<SelectTrigger>
															<SelectValue placeholder="Seleccionar cliente" />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														{clients.length === 0 && !isLoadingClients ? (
															<SelectItem value="none" disabled>
																No hay clientes disponibles
															</SelectItem>
														) : (
															clients.map((org) => (
																<SelectItem
																	key={org.id}
																	value={org.id.toString()}
																>
																	{org.name}
																</SelectItem>
															))
														)}
													</SelectContent>
												</Select>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="bankId"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Entidad Financiera *</FormLabel>
												<Select
													onValueChange={(value) =>
														field.onChange(parseInt(value))
													}
													value={field.value?.toString()}
													disabled={isLoadingAllOrgs}
												>
													<FormControl>
														<SelectTrigger>
															<SelectValue placeholder="Seleccionar Entidad Financiera" />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														{banks.length === 0 && !isLoadingBanks ? (
															<SelectItem value="none" disabled>
																No hay Entidades Financieras disponibles
															</SelectItem>
														) : (
															banks.map((org) => (
																<SelectItem
																	key={org.id}
																	value={org.id.toString()}
																>
																	{org.name}
																</SelectItem>
															))
														)}
													</SelectContent>
												</Select>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								{/* Campos de Financiamiento */}
								<div className="space-y-4 pt-4 border-t">
									<h3 className="text-lg font-semibold flex items-center gap-2">
										<Coins className="h-5 w-5" />
										Datos de Financiamiento
									</h3>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<FormField
											control={form.control}
											name="giroValue"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Valor de Giro</FormLabel>
													<FormControl>
														<Input
															type="number"
															step="0.01"
															min="0"
															placeholder="0.00"
															{...field}
															onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
															value={field.value || ""}
														/>
													</FormControl>
													<FormDescription>
														Monto del giro financiero
													</FormDescription>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name="endorsementValue"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Valor de Endoso</FormLabel>
													<FormControl>
														<Input
															type="number"
															step="0.01"
															min="0"
															placeholder="0.00"
															{...field}
															onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
															value={field.value || ""}
														/>
													</FormControl>
													<FormDescription>
														Monto del endoso
													</FormDescription>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name="termDays"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Plazo en Días</FormLabel>
													<FormControl>
														<Input
															type="number"
															min="1"
															placeholder="360"
															{...field}
															onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 360)}
															value={field.value || 360}
														/>
													</FormControl>
													<FormDescription>
														Plazo del financiamiento en días (default: 360)
													</FormDescription>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name="interestRate"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Tasa de Interés (%)</FormLabel>
													<FormControl>
														<Input
															type="number"
															step="0.01"
															min="0"
															placeholder="0.00"
															{...field}
															onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
															value={field.value || ""}
														/>
													</FormControl>
													<FormDescription>
														Tasa de interés en porcentaje
													</FormDescription>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name="guaranteeRiskRatio"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Relación Garantía/Riesgo</FormLabel>
													<FormControl>
														<Input
															placeholder="1:2"
															{...field}
															value={field.value || "1:2"}
														/>
													</FormControl>
													<FormDescription>
														Formato: "1:2" (default: 1:2)
													</FormDescription>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>
								</div>
							</div>
						)}

						{/* Step 2: Paquetes de Activos */}
						{currentStep === 2 && (
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<div>
										<h3 className="font-medium">Paquetes de Activos</h3>
										<p className="text-sm text-muted-foreground">
											Cada activo se convertirá en un Paquete de Activos individual
										</p>
									</div>
									<Badge variant="outline">
										{totalAssets} {totalAssets === 1 ? "paquete" : "paquetes"}
									</Badge>
								</div>

								{fields.map((field, index) => (
									<Card key={field.id} className="border-dashed">
										<CardContent className="pt-4">
											<div className="flex items-center justify-between mb-4">
												<div className="flex items-center gap-2">
													<Package className="h-4 w-4 text-muted-foreground" />
													<span className="font-medium">
														Bundle {index + 1}
													</span>
												</div>
												{fields.length > 1 && (
													<Button
														type="button"
														variant="ghost"
														size="sm"
														onClick={() => remove(index)}
													>
														<Trash2 className="h-4 w-4 text-destructive" />
													</Button>
												)}
											</div>

											<div className="space-y-4">
												{/* Descripción - Campo principal */}
												<FormField
													control={form.control}
													name={`assets.${index}.description`}
													render={({ field }) => (
														<FormItem>
															<FormLabel className="flex items-center gap-1">
																<FileText className="h-3 w-3" />
																Descripción *
															</FormLabel>
															<FormControl>
																<Textarea
																	placeholder="Descripción detallada del activo"
																	{...field}
																/>
															</FormControl>
															<FormDescription>
																Descripción principal del activo
															</FormDescription>
															<FormMessage />
														</FormItem>
													)}
												/>

												<div className="grid grid-cols-2 gap-4">
													<FormField
														control={form.control}
														name={`assets.${index}.vinSerial`}
														render={({ field }) => (
															<FormItem>
																<FormLabel className="flex items-center gap-1">
																	<Hash className="h-3 w-3" />
																	VIN/Serial/Chasis
																</FormLabel>
																<FormControl>
																	<Input
																		placeholder="VIN123456789 (opcional)"
																		{...field}
																	/>
																</FormControl>
																<FormDescription>
																	Opcional: VIN, Serial o Chasis del activo
																</FormDescription>
																<FormMessage />
															</FormItem>
														)}
													/>

													<FormField
														control={form.control}
														name={`assets.${index}.value`}
														render={({ field }) => (
															<FormItem>
																<FormLabel className="flex items-center gap-1">
																	<Coins className="h-3 w-3" />
																	Valor *
																</FormLabel>
																<FormControl>
																	<Input
																		type="number"
																		step="0.01"
																		placeholder="50000"
																		{...field}
																		value={field.value ?? ""}
																		onChange={(e) =>
																			field.onChange(
																				parseFloat(e.target.value)
																			)
																		}
																	/>
																</FormControl>
																<FormMessage />
															</FormItem>
														)}
													/>
												</div>

												<FormField
													control={form.control}
													name={`assets.${index}.currency`}
													render={({ field }) => (
														<FormItem>
															<FormLabel className="flex items-center gap-1">
																<Coins className="h-3 w-3" />
																Moneda *
															</FormLabel>
															<FormControl>
																<Select
																	onValueChange={field.onChange}
																	value={field.value}
																>
																	<SelectTrigger>
																		<SelectValue placeholder="Seleccionar moneda" />
																	</SelectTrigger>
																	<SelectContent>
																		<SelectItem value="USD">USD - Dólar Estadounidense</SelectItem>
																		<SelectItem value="BOB">BOB - Boliviano</SelectItem>
																	</SelectContent>
																</Select>
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
											</div>

											<div className="grid grid-cols-2 gap-4 mt-4">
												<FormField
													control={form.control}
													name={`assets.${index}.quantity`}
													render={({ field }) => (
														<FormItem>
															<FormLabel>Cantidad</FormLabel>
															<FormControl>
																<Input
																	type="number"
																	min="1"
																	placeholder="1"
																	{...field}
																	value={field.value ?? 1}
																	onChange={(e) =>
																		field.onChange(
																			parseInt(e.target.value, 10) || 1
																		)
																	}
																/>
															</FormControl>
															<FormDescription className="text-xs">
																Unidades del mismo tipo
															</FormDescription>
															<FormMessage />
														</FormItem>
													)}
												/>

												<FormField
													control={form.control}
													name={`assets.${index}.location`}
													render={({ field }) => (
														<FormItem>
															<FormLabel className="flex items-center gap-1">
																<MapPin className="h-3 w-3" />
																Ubicación
															</FormLabel>
															<FormControl>
																<Input
																	placeholder="Almacén A, Estante 5"
																	{...field}
																/>
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
											</div>

											{/* Sección de Documentos Opcionales */}
											<div className="mt-6 pt-6 border-t space-y-4">
												<div className="flex items-center gap-2 mb-3">
													<FileText className="h-4 w-4 text-muted-foreground" />
													<h4 className="text-sm font-medium">Documentos (Opcional)</h4>
												</div>
												
												<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
													{/* CD */}
													<div className="space-y-2">
														<Label className="text-xs">CD (Certificado de Depósito)</Label>
														<FormField
															control={form.control}
															name={`assets.${index}.cdFile`}
															render={({ field: { value, onChange, ...field } }) => (
																<FormItem>
																	<FormControl>
																		<div className="space-y-2">
																			<Input
																				type="file"
																				accept=".pdf"
																				{...field}
																				onChange={(e) => {
																					const file = e.target.files?.[0];
																					onChange(file || undefined);
																				}}
																			/>
																			{value && (
																				<div className="flex items-center gap-2 text-xs text-muted-foreground">
																					<FileText className="h-3 w-3" />
																					<span className="truncate">{value.name}</span>
																					<Button
																						type="button"
																						variant="ghost"
																						size="sm"
																						className="h-4 w-4 p-0"
																						onClick={() => onChange(undefined)}
																					>
																						<X className="h-3 w-3" />
																					</Button>
																				</div>
																			)}
																		</div>
																	</FormControl>
																</FormItem>
															)}
														/>
														<FormField
															control={form.control}
															name={`assets.${index}.cdTitleNumber`}
															render={({ field }) => (
																<FormItem>
																	<FormControl>
																		<Input
																			placeholder="Número de título (opcional)"
																			{...field}
																		/>
																	</FormControl>
																</FormItem>
															)}
														/>
													</div>

													{/* BP */}
													<div className="space-y-2">
														<Label className="text-xs">BP (Bono de Prenda)</Label>
														<FormField
															control={form.control}
															name={`assets.${index}.bpFile`}
															render={({ field: { value, onChange, ...field } }) => (
																<FormItem>
																	<FormControl>
																		<div className="space-y-2">
																			<Input
																				type="file"
																				accept=".pdf"
																				{...field}
																				onChange={(e) => {
																					const file = e.target.files?.[0];
																					onChange(file || undefined);
																				}}
																			/>
																			{value && (
																				<div className="flex items-center gap-2 text-xs text-muted-foreground">
																					<FileText className="h-3 w-3" />
																					<span className="truncate">{value.name}</span>
																					<Button
																						type="button"
																						variant="ghost"
																						size="sm"
																						className="h-4 w-4 p-0"
																						onClick={() => onChange(undefined)}
																					>
																						<X className="h-3 w-3" />
																					</Button>
																				</div>
																			)}
																		</div>
																	</FormControl>
																</FormItem>
															)}
														/>
														<FormField
															control={form.control}
															name={`assets.${index}.bpTitleNumber`}
															render={({ field }) => (
																<FormItem>
																	<FormControl>
																		<Input
																			placeholder="Número de título (opcional)"
																			{...field}
																		/>
																	</FormControl>
																</FormItem>
															)}
														/>
													</div>

													{/* Pagaré */}
													<div className="space-y-2">
														<Label className="text-xs">Pagaré</Label>
														<FormField
															control={form.control}
															name={`assets.${index}.pagareFile`}
															render={({ field: { value, onChange, ...field } }) => (
																<FormItem>
																	<FormControl>
																		<div className="space-y-2">
																			<Input
																				type="file"
																				accept=".pdf"
																				{...field}
																				onChange={(e) => {
																					const file = e.target.files?.[0];
																					onChange(file || undefined);
																				}}
																			/>
																			{value && (
																				<div className="flex items-center gap-2 text-xs text-muted-foreground">
																					<FileText className="h-3 w-3" />
																					<span className="truncate">{value.name}</span>
																					<Button
																						type="button"
																						variant="ghost"
																						size="sm"
																						className="h-4 w-4 p-0"
																						onClick={() => onChange(undefined)}
																					>
																						<X className="h-3 w-3" />
																					</Button>
																				</div>
																			)}
																		</div>
																	</FormControl>
																</FormItem>
															)}
														/>
														<FormField
															control={form.control}
															name={`assets.${index}.pagareTitleNumber`}
															render={({ field }) => (
																<FormItem>
																	<FormControl>
																		<Input
																			placeholder="Número de título (opcional)"
																			{...field}
																		/>
																	</FormControl>
																</FormItem>
															)}
														/>
													</div>
												</div>
											</div>
										</CardContent>
									</Card>
								))}

								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() =>
										append({
											vinSerial: "",
											description: "",
											quantity: 1,
											location: "",
											value: 0,
											currency: "USD" as const,
											cdFile: undefined,
											bpFile: undefined,
											pagareFile: undefined,
											cdTitleNumber: "",
											bpTitleNumber: "",
											pagareTitleNumber: "",
										})
									}
									className="w-full"
								>
									<Plus className="h-4 w-4 mr-2" />
									Agregar Paquete de Activos
								</Button>
							</div>
						)}

						{/* Step 3: Resumen */}
						{currentStep === 3 && (
							<div className="space-y-6">
								<Card>
									<CardHeader>
										<CardTitle className="text-lg">
											Información de la Operación
										</CardTitle>
									</CardHeader>
									<CardContent className="space-y-4">
										{form.watch("operationNumber") && (
											<div>
												<p className="text-sm text-muted-foreground">
													Número de Operación
												</p>
												<p className="font-medium">
													{form.watch("operationNumber") ||
														"Se generará automáticamente"}
												</p>
											</div>
										)}
										<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
											<div>
												<p className="text-sm text-muted-foreground">
													Warrantera
												</p>
												<p className="font-medium">
													{userWarehouse?.name || "No asignada"}
												</p>
											</div>
											<div>
												<p className="text-sm text-muted-foreground">
													Cliente
												</p>
												<p className="font-medium">
													{getSelectedOrgName(
														form.watch("clientId"),
														"CLIENT"
													)}
												</p>
											</div>
											<div>
												<p className="text-sm text-muted-foreground">
													Entidad Financiera
												</p>
												<p className="font-medium">
													{getSelectedOrgName(
														form.watch("bankId"),
														"BANK"
													)}
												</p>
											</div>
										</div>

										{/* Campos de Financiamiento */}
										{(form.watch("giroValue") || form.watch("endorsementValue") || form.watch("termDays") || form.watch("interestRate") || form.watch("guaranteeRiskRatio")) && (
											<div className="pt-4 border-t space-y-3">
												<h4 className="font-semibold text-sm flex items-center gap-2">
													<Coins className="h-4 w-4" />
													Datos de Financiamiento
												</h4>
												<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
													{form.watch("giroValue") && (
														<div>
															<p className="text-sm text-muted-foreground">Valor de Giro</p>
															<p className="font-medium">${form.watch("giroValue")?.toLocaleString()}</p>
														</div>
													)}
													{form.watch("endorsementValue") && (
														<div>
															<p className="text-sm text-muted-foreground">Valor de Endoso</p>
															<p className="font-medium">${form.watch("endorsementValue")?.toLocaleString()}</p>
														</div>
													)}
													{form.watch("termDays") && (
														<div>
															<p className="text-sm text-muted-foreground">Plazo en Días</p>
															<p className="font-medium">{form.watch("termDays")} días</p>
														</div>
													)}
													{form.watch("interestRate") && (
														<div>
															<p className="text-sm text-muted-foreground">Tasa de Interés</p>
															<p className="font-medium">{form.watch("interestRate")}%</p>
														</div>
													)}
													{form.watch("guaranteeRiskRatio") && (
														<div>
															<p className="text-sm text-muted-foreground">Relación Garantía/Riesgo</p>
															<p className="font-medium">{form.watch("guaranteeRiskRatio")}</p>
														</div>
													)}
												</div>
											</div>
										)}
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle className="text-lg flex items-center justify-between">
											<span>Paquetes de Activos ({fields.length})</span>
											<Badge variant="secondary">
												{totalQuantity} unidades totales
											</Badge>
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="space-y-3">
											{fields.map((field, index) => {
												const asset = form.watch(`assets.${index}`);
												return (
													<div
														key={field.id}
														className="border rounded-lg p-4 space-y-2"
													>
														<div className="flex items-start justify-between">
															<div className="flex items-start gap-3 flex-1">
																<div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mt-1">
																	<Package className="h-4 w-4 text-primary" />
																</div>
																<div className="flex-1 space-y-1">
																	<p className="font-semibold text-sm">
																		Paquete {index + 1}
																	</p>
																	{asset.description && (
																		<p className="text-sm text-foreground">
																			{asset.description}
																		</p>
																	)}
																	{asset.vinSerial && (
																		<p className="text-xs text-muted-foreground font-mono">
																			VIN: {asset.vinSerial}
																		</p>
																	)}
																	<div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
																		{asset.quantity && asset.quantity > 1 && (
																			<span>Qty: {asset.quantity}</span>
																		)}
																		{asset.location && (
																			<span className="flex items-center gap-1">
																				<MapPin className="h-3 w-3" />
																				{asset.location}
																			</span>
																		)}
																		{asset.currency && (
																			<span>Moneda: {asset.currency}</span>
																		)}
																	</div>
																</div>
															</div>
															<Badge variant="secondary" className="text-sm">
																{asset.currency === "BOB" ? "Bs." : "$"}{asset.value?.toLocaleString()}
															</Badge>
														</div>
													</div>
												);
											})}
										</div>
										<div className="mt-4 pt-4 border-t">
											<div className="flex items-center justify-between">
												<p className="font-medium">Valor Total</p>
												<p className="text-xl font-bold">
													${totalValue.toLocaleString()}
												</p>
											</div>
										</div>
									</CardContent>
								</Card>

								<Alert>
									<AlertCircle className="h-4 w-4" />
									<AlertDescription>
										<span className="font-medium">Próximos pasos:</span>
										<p className="text-sm mt-1">
											Después de crear la operación, podrás subir los documentos (CD, BP, Pagaré)
											para cada Paquete de Activos y proceder con las firmas y tokenización.
										</p>
									</AlertDescription>
								</Alert>
							</div>
						)}

						{/* Navigation Buttons */}
						<div className="flex items-center justify-between pt-6 border-t">
							<Button
								type="button"
								variant="outline"
								onClick={prevStep}
								disabled={currentStep === 1}
							>
								<ChevronLeft className="h-4 w-4 mr-2" />
								Anterior
							</Button>

							{currentStep < STEPS.length ? (
								<Button type="button" onClick={nextStep}>
									Siguiente
									<ChevronRight className="h-4 w-4 ml-2" />
								</Button>
							) : (
								<Button
									type="button"
									onClick={handleCreateOperation}
									disabled={createMutation.isPending}
								>
									{createMutation.isPending && (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									)}
									Crear Operación
								</Button>
							)}
						</div>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
}
