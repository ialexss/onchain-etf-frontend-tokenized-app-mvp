"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
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
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { organizationsApi } from "@/lib/api/organizations";
import { assetsApi } from "@/lib/api/assets";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const createAssetSchema = z.object({
	vinSerial: z
		.string()
		.min(1, "El VIN/Serial es requerido")
		.max(100, "El VIN/Serial no puede exceder 100 caracteres"),
	description: z.string().optional(),
	value: z
		.number({ message: "El valor es requerido" })
		.positive("El valor debe ser mayor a 0")
		.min(0.01, "El valor debe ser mayor a 0"),
	clientId: z
		.number({ message: "Debe seleccionar un cliente" })
		.positive("Debe seleccionar un cliente"),
});

type CreateAssetFormValues = z.infer<typeof createAssetSchema>;

interface CreateAssetDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function CreateAssetDialog({
	open,
	onOpenChange,
}: CreateAssetDialogProps) {
	const queryClient = useQueryClient();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [iconFile, setIconFile] = useState<File | null>(null);
	const [iconPreview, setIconPreview] = useState<string | null>(null);

	// Obtener lista de clientes usando endpoint específico
	const {
		data: clients = [],
		isLoading: isLoadingClients,
		error: clientsError,
	} = useQuery({
		queryKey: ["organizations", "clients"],
		queryFn: organizationsApi.getClients,
		enabled: open,
		retry: 1,
	});

	const form = useForm<CreateAssetFormValues>({
		resolver: zodResolver(createAssetSchema),
		defaultValues: {
			vinSerial: "",
			description: "",
			value: undefined,
			clientId: undefined,
		},
	});

	const createMutation = useMutation({
		mutationFn: (data: {
			formData: CreateAssetFormValues;
			iconFile?: File | null;
		}) => assetsApi.create(data.formData, data.iconFile || undefined),
		onSuccess: () => {
			toast.success(
				"Activo creado exitosamente. Los documentos CD y BP se han generado automáticamente."
			);
			queryClient.invalidateQueries({ queryKey: ["assets"] });
			form.reset();
			setIconFile(null);
			setIconPreview(null);
			onOpenChange(false);
		},
		onError: (error: any) => {
			toast.error(
				error.response?.data?.message || "Error al crear el activo"
			);
		},
		onSettled: () => {
			setIsSubmitting(false);
		},
	});

	const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			// Validar tipo de archivo
			if (!file.type.match(/^image\/(jpg|jpeg|png|gif|webp)$/)) {
				toast.error(
					"Solo se permiten archivos de imagen (jpg, jpeg, png, gif, webp)"
				);
				return;
			}
			// Validar tamaño (5MB máximo)
			if (file.size > 5 * 1024 * 1024) {
				toast.error("El archivo no puede exceder 5MB");
				return;
			}
			setIconFile(file);
			// Crear preview
			const reader = new FileReader();
			reader.onloadend = () => {
				setIconPreview(reader.result as string);
			};
			reader.readAsDataURL(file);
		}
	};

	const onSubmit = async (data: CreateAssetFormValues) => {
		setIsSubmitting(true);
		createMutation.mutate({ formData: data, iconFile });
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[600px]">
				<DialogHeader>
					<DialogTitle>Crear Nuevo Activo</DialogTitle>
					<DialogDescription>
						Registra un nuevo activo físico para tokenización. El
						activo quedará almacenado y podrá ser tokenizado
						posteriormente.
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="space-y-4"
					>
						<FormField
							control={form.control}
							name="vinSerial"
							render={({ field }) => (
								<FormItem>
									<FormLabel>VIN/Serial *</FormLabel>
									<FormControl>
										<Input
											placeholder="VIN1234567890ABCDE"
											{...field}
										/>
									</FormControl>
									<FormDescription>
										Identificador único del activo (VIN,
										Serial, Chasis, etc.)
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Descripción</FormLabel>
									<FormControl>
										<Textarea
											placeholder="Camioneta Toyota Hilux 2024..."
											{...field}
										/>
									</FormControl>
									<FormDescription>
										Descripción detallada del activo
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="value"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Valor (USD) *</FormLabel>
										<FormControl>
											<Input
												type="number"
												step="0.01"
												min="0.01"
												placeholder="50000.00"
												{...field}
												onChange={(e) =>
													field.onChange(
														parseFloat(
															e.target.value
														) || 0
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
								name="clientId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Cliente *</FormLabel>
										<Select
											onValueChange={(value) => {
												field.onChange(parseInt(value));
											}}
											value={field.value?.toString()}
											disabled={isLoadingClients}
										>
											<FormControl>
												<SelectTrigger className="w-full">
													<SelectValue
														placeholder={
															isLoadingClients
																? "Cargando clientes..."
																: clients.length ===
																  0
																? "No hay clientes disponibles"
																: "Seleccionar cliente"
														}
													/>
												</SelectTrigger>
											</FormControl>
											<SelectContent
												position="popper"
												className="z-[100]"
											>
												{clientsError ? (
													<div className="px-2 py-1.5 text-sm text-red-500">
														Error al cargar clientes
													</div>
												) : clients.length === 0 ? (
													<div className="px-2 py-1.5 text-sm text-slate-500">
														No hay clientes
														disponibles
													</div>
												) : (
													clients.map((client) => (
														<SelectItem
															key={client.id}
															value={client.id.toString()}
														>
															{client.name}
														</SelectItem>
													))
												)}
											</SelectContent>
										</Select>
										<FormDescription>
											Cliente propietario del activo
											{clientsError && (
												<span className="block text-red-500 text-xs mt-1">
													Error:{" "}
													{clientsError instanceof
													Error
														? clientsError.message
														: "Error desconocido"}
												</span>
											)}
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<div>
							<FormLabel>Icono del Activo (Opcional)</FormLabel>
							<div className="space-y-4 mt-2">
								<Input
									type="file"
									accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
									onChange={handleIconChange}
									disabled={isSubmitting}
								/>
								{iconPreview && (
									<div>
										<p className="text-sm text-slate-500 mb-2">
											Vista previa:
										</p>
										<img
											src={iconPreview}
											alt="Preview"
											className="w-32 h-32 object-cover rounded-lg border"
										/>
									</div>
								)}
							</div>
							<p className="text-sm text-slate-500 mt-2">
								Sube una imagen para usar como icono del token.
								Si no se sube, se usará el icono por defecto.
								Máximo 5MB. Formatos: JPG, PNG, GIF, WEBP
							</p>
						</div>

						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => {
									onOpenChange(false);
									setIconFile(null);
									setIconPreview(null);
								}}
								disabled={isSubmitting}
							>
								Cancelar
							</Button>
							<Button type="submit" disabled={isSubmitting}>
								{isSubmitting && (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								)}
								Crear Activo
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
