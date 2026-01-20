"use client";

import { useState } from "react";
import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
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
import { organizationsApi } from "@/lib/api/organizations";
import { operationsApi } from "@/lib/api/operations";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";

const createOperationSchema = z.object({
	operationNumber: z.string().min(1, "El número de operación es requerido"),
	titleNumber: z.string().optional(),
	warrantId: z.number().positive("Debe seleccionar una warrantera"),
	clientId: z.number().positive("Debe seleccionar un cliente"),
	bankId: z.number().positive("Debe seleccionar una Entidad Financiera"),
	assets: z
		.array(
			z.object({
				vinSerial: z.string().min(1, "VIN/Serial es requerido"),
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

interface CreateOperationDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function CreateOperationDialog({
	open,
	onOpenChange,
}: CreateOperationDialogProps) {
	const queryClient = useQueryClient();
	const { user } = useAuth();

	const form = useForm<CreateOperationFormValues>({
		resolver: zodResolver(createOperationSchema),
		defaultValues: {
			operationNumber: "",
			titleNumber: "",
			assets: [
				{
					vinSerial: "",
					description: "",
					value: 0,
				},
			],
		},
	});

	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: "assets",
	});

	// Obtener organizaciones
	const { data: organizations = [], isLoading: isLoadingOrgs } = useQuery({
		queryKey: ["organizations"],
		queryFn: organizationsApi.getAll,
		enabled: open,
	});

	// Obtener clientes y Entidades Financieras usando endpoints específicos
	const { data: clients = [], isLoading: isLoadingClients } = useQuery({
		queryKey: ["organizations", "clients"],
		queryFn: organizationsApi.getClients,
		enabled: open,
	});

	const { data: banks = [], isLoading: isLoadingBanks } = useQuery({
		queryKey: ["organizations", "banks"],
		queryFn: organizationsApi.getBanks,
		enabled: open,
	});

	const warehouses = organizations.filter((org) => org.type === "WAREHOUSE");
	const isLoadingAllOrgs = isLoadingOrgs || isLoadingClients || isLoadingBanks;

	// Auto-seleccionar warrantera si el usuario es warehouse
	const userWarehouse = user?.organizations?.find(
		(org: any) => org.type === "WAREHOUSE"
	);

	// Efecto para auto-seleccionar la warrantera
	React.useEffect(() => {
		if (userWarehouse && open && !form.getValues("warrantId")) {
			form.setValue("warrantId", userWarehouse.id);
		}
	}, [userWarehouse, open, form]);

	const createMutation = useMutation({
		mutationFn: operationsApi.create,
		onSuccess: () => {
			toast.success("Operación creada exitosamente");
			queryClient.invalidateQueries({ queryKey: ["operations"] });
			form.reset();
			onOpenChange(false);
		},
		onError: (error: any) => {
			toast.error(
				error.response?.data?.message || "Error al crear la operación"
			);
		},
	});

	const onSubmit = (values: CreateOperationFormValues) => {
		createMutation.mutate(values);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Crear Nueva Operación</DialogTitle>
					<DialogDescription>
						Crea una nueva operación de depósito para tokenización
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="space-y-6"
					>
						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="operationNumber"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											Número de Operación *
										</FormLabel>
										<FormControl>
											<Input
												placeholder="OP-2024-001"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="titleNumber"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Número de Título</FormLabel>
										<FormControl>
											<Input
												placeholder="TIT-001"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<div className="grid grid-cols-3 gap-4">
							<FormField
								control={form.control}
								name="warrantId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Warrantera *</FormLabel>
										<Select
											onValueChange={(value) =>
												field.onChange(parseInt(value))
											}
											value={field.value?.toString()}
											disabled={isLoadingAllOrgs || !!userWarehouse}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Seleccionar warrantera" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{warehouses.map((org) => (
													<SelectItem
														key={org.id}
														value={org.id.toString()}
													>
														{org.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										{userWarehouse && (
											<p className="text-xs text-muted-foreground">
												Tu organización: {userWarehouse.name}
											</p>
										)}
										<FormMessage />
									</FormItem>
								)}
							/>

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

						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<FormLabel>Activos</FormLabel>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() =>
										append({
											vinSerial: "",
											description: "",
											value: 0,
										})
									}
								>
									<Plus className="h-4 w-4 mr-2" />
									Agregar Activo
								</Button>
							</div>

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
												onClick={() => remove(index)}
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
															onChange={(e) =>
																field.onChange(
																	parseFloat(
																		e.target
																			.value
																	) || 0
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
										name={`assets.${index}.description`}
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													Descripción
												</FormLabel>
												<FormControl>
													<Input
														placeholder="Descripción del activo"
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
															placeholder="1"
															{...field}
															onChange={(e) =>
																field.onChange(
																	e.target
																		.value
																		? parseFloat(
																				e
																					.target
																					.value
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
						</div>

						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
								disabled={createMutation.isPending}
							>
								Cancelar
							</Button>
							<Button
								type="submit"
								disabled={createMutation.isPending}
							>
								{createMutation.isPending && (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								)}
								Crear Operación
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}




