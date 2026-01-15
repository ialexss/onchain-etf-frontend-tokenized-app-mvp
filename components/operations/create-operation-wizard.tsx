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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";

const createOperationSchema = z.object({
	operationNumber: z.string().optional(),
	clientId: z.number().min(1, "Debe seleccionar un cliente"),
	safiId: z.number().min(1, "Debe seleccionar una Entidad Financiera"),
	assets: z
		.array(
			z.object({
				vinSerial: z.string().min(1, "VIN/Serial es requerido"),
				name: z.string().optional(),
				description: z.string().optional(),
				brands: z.string().optional(),
				quantity: z.number().optional(),
				location: z.string().optional(),
				value: z.number().positive("El valor debe ser mayor a 0"),
			})
		)
		.min(1, "Debe agregar al menos un activo"),
});

type CreateOperationFormValues = z.infer<typeof createOperationSchema>;

const STEPS = [
	{ id: 1, title: "Información Básica", icon: FileText },
	{ id: 2, title: "Agregar Activos", icon: Package },
	{ id: 3, title: "Resumen", icon: CheckCircle2 },
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
			assets: [
				{
					vinSerial: "",
					name: "",
					description: "",
					value: 0,
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

	// Obtener clientes y SAFIs usando endpoints específicos
	const { data: clients = [], isLoading: isLoadingClients } = useQuery({
		queryKey: ["organizations", "clients"],
		queryFn: organizationsApi.getClients,
	});

	const { data: safis = [], isLoading: isLoadingSafis } = useQuery({
		queryKey: ["organizations", "banks"],
		queryFn: organizationsApi.getBanks,
	});

	const warehouses = organizations.filter((org) => org.type === "WAREHOUSE");
	const isLoadingAllOrgs =
		isLoadingOrgs || isLoadingClients || isLoadingSafis;

	// Verificar que el usuario pertenezca a una organización WAREHOUSE
	const userWarehouse = user?.organizations?.find(
		(org: any) => org.type === "WAREHOUSE"
	);

	const createMutation = useMutation({
		mutationFn: operationsApi.create,
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
		// Validar el formulario antes de enviar
		const isValid = await form.trigger();
		if (!isValid) {
			return;
		}

		const values = form.getValues();
		// El backend no acepta warrantId ni titleNumber, solo operationNumber, clientId, safiId y assets
		const { operationNumber, clientId, safiId, assets } = values;
		createMutation.mutate({
			...(operationNumber && { operationNumber }),
			clientId,
			safiId,
			assets,
		});
	};

	const onSubmit = (
		values: CreateOperationFormValues,
		e?: React.BaseSyntheticEvent
	) => {
		// Prevenir envío automático del formulario
		e?.preventDefault();
		// No hacer nada aquí, solo prevenir el comportamiento por defecto
	};

	const nextStep = async () => {
		let isValid = false;

		if (currentStep === 1) {
			isValid = await form.trigger(["clientId", "safiId"]);
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
				: safis;
		return orgs.find((org) => org.id === id)?.name || "-";
	};

	const totalValue =
		form
			.watch("assets")
			?.reduce((sum, asset) => sum + (asset.value || 0), 0) || 0;

	return (
		<Card className="max-w-8xl mx-auto">
			<CardHeader>
				<CardTitle>Crear Nueva Operación</CardTitle>
				<CardDescription>
					Complete los pasos para crear una nueva operación de
					depósito
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
										className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
											isCompleted
												? "bg-green-500 border-green-500 text-white"
												: isActive
												? "border-primary text-primary bg-primary/10"
												: "border-muted text-muted-foreground"
										}`}
									>
										{isCompleted ? (
											<CheckCircle2 className="h-5 w-5" />
										) : (
											<StepIcon className="h-5 w-5" />
										)}
									</div>
									<p
										className={`mt-2 text-sm font-medium ${
											isActive
												? "text-foreground"
												: "text-muted-foreground"
										}`}
									>
										{step.title}
									</p>
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
							// Solo permitir submit si estamos en el último paso
							if (currentStep === STEPS.length) {
								form.handleSubmit(onSubmit)(e);
							}
						}}
						className="space-y-6"
					>
						{/* Step 1: Información Básica */}
						{currentStep === 1 && (
							<div className="space-y-6">
								{/* Información de Warrantera (solo lectura) */}
								{userWarehouse && (
									<div className="p-4 bg-muted rounded-lg">
										<p className="text-sm font-medium mb-1">
											Warrantera
										</p>
										<p className="text-sm text-muted-foreground">
											{userWarehouse.name}
										</p>
										<p className="text-xs text-muted-foreground mt-1">
											La warrantera se determina
											automáticamente según tu
											organización
										</p>
									</div>
								)}

								{/* Número de Operación (opcional) */}
								<FormField
									control={form.control}
									name="operationNumber"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Número de Operación
											</FormLabel>
											<FormControl>
												<Input
													placeholder="0001/25 (opcional)"
													{...field}
												/>
											</FormControl>
											<FormDescription>
												Si no se proporciona, se
												generará automáticamente
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								{/* Cliente y SAFI */}
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									<FormField
										control={form.control}
										name="clientId"
										render={({ field }) => (
											<FormItem className="w-full">
												<FormLabel>Cliente *</FormLabel>
												<Select
													onValueChange={(value) =>
														field.onChange(
															parseInt(value)
														)
													}
													value={field.value?.toString()}
													disabled={isLoadingAllOrgs}
												>
													<FormControl>
														<SelectTrigger className="w-full">
															<SelectValue placeholder="Seleccionar cliente" />
														</SelectTrigger>
													</FormControl>
													<SelectContent position="popper">
														{clients.length === 0 &&
														!isLoadingClients ? (
															<SelectItem
																value="none"
																disabled
															>
																No hay clientes
																disponibles
															</SelectItem>
														) : (
															clients.map(
																(org) => (
																	<SelectItem
																		key={
																			org.id
																		}
																		value={org.id.toString()}
																	>
																		{
																			org.name
																		}
																	</SelectItem>
																)
															)
														)}
													</SelectContent>
												</Select>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="safiId"
										render={({ field }) => (
											<FormItem className="w-full">
												<FormLabel>Entidad Financiera *</FormLabel>
												<Select
													onValueChange={(value) =>
														field.onChange(
															parseInt(value)
														)
													}
													value={field.value?.toString()}
													disabled={isLoadingAllOrgs}
												>
													<FormControl>
														<SelectTrigger className="w-full">
															<SelectValue placeholder="Seleccionar Entidad Financiera" />
														</SelectTrigger>
													</FormControl>
													<SelectContent position="popper">
														{safis.length === 0 &&
														!isLoadingSafis ? (
															<SelectItem
																value="none"
																disabled
															>
																No hay Entidades Financieras
																disponibles
															</SelectItem>
														) : (
															safis.map((org) => (
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
							</div>
						)}

						{/* Step 2: Agregar Activos */}
						{currentStep === 2 && (
							<div className="space-y-4">
								<FormLabel>Activos</FormLabel>

								{fields.map((field, index) => (
									<div
										key={field.id}
										className="border rounded-lg p-4 space-y-4"
									>
										<div className="flex items-center justify-between">
											<h4 className="font-medium">
												Activo {index + 1}
											</h4>
											{fields.length > 1 && (
												<Button
													type="button"
													variant="ghost"
													size="sm"
													onClick={() =>
														remove(index)
													}
												>
													<Trash2 className="h-4 w-4 text-destructive" />
												</Button>
											)}
										</div>

										<div className="grid grid-cols-2 gap-4">
											<FormField
												control={form.control}
												name={`assets.${index}.vinSerial`}
												render={({ field }) => (
													<FormItem>
														<FormLabel>
															VIN/Serial *
														</FormLabel>
														<FormControl>
															<Input
																placeholder="VIN123456789"
																{...field}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={form.control}
												name={`assets.${index}.value`}
												render={({ field }) => (
													<FormItem>
														<FormLabel>
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
																		parseFloat(
																			e
																				.target
																				.value
																		)
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
											name={`assets.${index}.name`}
											render={({ field }) => (
												<FormItem>
													<FormLabel>
														Nombre del Activo
													</FormLabel>
													<FormControl>
														<Input
															placeholder="Ej: Camión Toyota Hilux"
															{...field}
														/>
													</FormControl>
													<FormDescription>
														Nombre descriptivo del
														activo
													</FormDescription>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name={`assets.${index}.description`}
											render={({ field }) => (
												<FormItem>
													<FormLabel>
														Descripción
													</FormLabel>
													<FormControl>
														<Input
															placeholder="Descripción detallada del activo"
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										<div className="grid grid-cols-3 gap-4">
											<FormField
												control={form.control}
												name={`assets.${index}.brands`}
												render={({ field }) => (
													<FormItem>
														<FormLabel>
															Marcas
														</FormLabel>
														<FormControl>
															<Input
																placeholder="Toyota, Nissan"
																{...field}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={form.control}
												name={`assets.${index}.quantity`}
												render={({ field }) => (
													<FormItem>
														<FormLabel>
															Cantidad
														</FormLabel>
														<FormControl>
															<Input
																type="number"
																step="1"
																min="1"
																placeholder="1"
																{...field}
																onChange={(e) =>
																	field.onChange(
																		e.target
																			.value
																			? parseInt(
																					e
																						.target
																						.value,
																					10
																			  )
																			: undefined
																	)
																}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={form.control}
												name={`assets.${index}.location`}
												render={({ field }) => (
													<FormItem>
														<FormLabel>
															Localización
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
									</div>
								))}

								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() =>
										append({
											vinSerial: "",
											name: "",
											description: "",
											value: 0,
										})
									}
									className="w-full"
								>
									<Plus className="h-4 w-4 mr-2" />
									Agregar Activo
								</Button>
							</div>
						)}

						{/* Step 3: Resumen */}
						{currentStep === 3 && (
							<div className="space-y-6">
								<Card>
									<CardHeader>
										<CardTitle>
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
													{form.watch(
														"operationNumber"
													) ||
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
													{userWarehouse?.name ||
														"No asignada"}
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
														form.watch("safiId"),
														"BANK"
													)}
												</p>
											</div>
										</div>
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle>
											Activos ({fields.length})
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="space-y-3">
											{fields.map((field, index) => {
												const asset = form.watch(
													`assets.${index}`
												);
												return (
													<div
														key={field.id}
														className="flex items-center justify-between border rounded-lg p-3"
													>
														<div>
															<p className="font-medium">
																{asset.name ||
																	asset.vinSerial}
															</p>
															{asset.name && (
																<p className="text-xs text-muted-foreground">
																	VIN/Serial:{" "}
																	{
																		asset.vinSerial
																	}
																</p>
															)}
															{asset.description && (
																<p className="text-sm text-muted-foreground">
																	{
																		asset.description
																	}
																</p>
															)}
														</div>
														<Badge variant="secondary">
															$
															{asset.value?.toLocaleString()}
														</Badge>
													</div>
												);
											})}
										</div>
										<div className="mt-4 pt-4 border-t">
											<div className="flex items-center justify-between">
												<p className="font-medium">
													Valor Total
												</p>
												<p className="text-lg font-bold">
													$
													{totalValue.toLocaleString()}
												</p>
											</div>
										</div>
									</CardContent>
								</Card>
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
