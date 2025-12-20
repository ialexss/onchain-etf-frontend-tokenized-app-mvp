'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { organizationsApi } from '@/lib/api/organizations';
import { assetsApi } from '@/lib/api/assets';
import { endorsementsApi } from '@/lib/api/endorsements';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const createEndorsementSchema = z.object({
	assetId: z
		.number({
			required_error: 'Debe seleccionar un activo',
			invalid_type_error: 'Debe seleccionar un activo',
		})
		.positive('Debe seleccionar un activo'),
	bankId: z
		.number({
			required_error: 'Debe seleccionar un banco',
			invalid_type_error: 'Debe seleccionar un banco',
		})
		.positive('Debe seleccionar un banco'),
	principalAmount: z
		.number({
			required_error: 'El monto principal es requerido',
			invalid_type_error: 'El monto debe ser un número',
		})
		.positive('El monto debe ser mayor a 0')
		.min(0.01, 'El monto debe ser mayor a 0'),
	interestRate: z
		.number({
			required_error: 'La tasa de interés es requerida',
			invalid_type_error: 'La tasa debe ser un número',
		})
		.positive('La tasa debe ser mayor a 0')
		.max(100, 'La tasa no puede exceder 100%'),
	repaymentDate: z
		.string()
		.min(1, 'La fecha de pago es requerida')
		.refine(
			(date) => new Date(date) > new Date(),
			'La fecha de pago debe ser futura'
		),
});

type CreateEndorsementFormValues = z.infer<typeof createEndorsementSchema>;

interface CreateEndorsementDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function CreateEndorsementDialog({
	open,
	onOpenChange,
}: CreateEndorsementDialogProps) {
	const queryClient = useQueryClient();
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Obtener lista de bancos usando endpoint específico
	const { data: banks = [], isLoading: isLoadingBanks } = useQuery({
		queryKey: ['organizations', 'banks'],
		queryFn: organizationsApi.getBanks,
		enabled: open,
	});

	// Obtener activos tokenizados del usuario
	const { data: assets } = useQuery({
		queryKey: ['assets'],
		queryFn: assetsApi.getAll,
		enabled: open,
	});
	const tokenizedAssets =
		assets?.filter((asset) => asset.token && asset.status === 'PLEDGED') ||
		[];

	const form = useForm<CreateEndorsementFormValues>({
		resolver: zodResolver(createEndorsementSchema),
		defaultValues: {
			assetId: undefined,
			bankId: undefined,
			principalAmount: undefined,
			interestRate: undefined,
			repaymentDate: '',
		},
	});

	const createMutation = useMutation({
		mutationFn: (data: CreateEndorsementFormValues) =>
			endorsementsApi.create({
				...data,
				repaymentDate: new Date(data.repaymentDate).toISOString(),
			}),
		onSuccess: () => {
			toast.success('Endoso creado exitosamente');
			queryClient.invalidateQueries({ queryKey: ['endorsements'] });
			queryClient.invalidateQueries({ queryKey: ['assets'] });
			form.reset();
			onOpenChange(false);
		},
		onError: (error: any) => {
			toast.error(
				error.response?.data?.message || 'Error al crear el endoso'
			);
		},
		onSettled: () => {
			setIsSubmitting(false);
		},
	});

	const onSubmit = async (data: CreateEndorsementFormValues) => {
		setIsSubmitting(true);
		createMutation.mutate(data);
	};

	const selectedAsset = tokenizedAssets.find(
		(asset) => asset.id === form.watch('assetId')
	);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[600px]">
				<DialogHeader>
					<DialogTitle>Crear Nuevo Endoso</DialogTitle>
					<DialogDescription>
						Crea un endoso para un activo tokenizado. El endoso
						permitirá transferir el token al banco como garantía del
						préstamo.
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="space-y-4"
					>
						<FormField
							control={form.control}
							name="assetId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Activo Tokenizado *</FormLabel>
									<Select
										onValueChange={(value) =>
											field.onChange(parseInt(value))
										}
										defaultValue={field.value?.toString()}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Seleccionar activo tokenizado" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{tokenizedAssets.length === 0 ? (
												<div className="px-2 py-1.5 text-sm text-slate-500">
													No hay activos tokenizados disponibles
												</div>
											) : (
												tokenizedAssets.map((asset) => (
													<SelectItem
														key={asset.id}
														value={asset.id.toString()}
													>
														{asset.vinSerial} - $
														{asset.value.toLocaleString()}
													</SelectItem>
												))
											)}
										</SelectContent>
									</Select>
									<FormDescription>
										Solo se muestran activos tokenizados
										(estado PLEDGED)
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						{selectedAsset && (
							<div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg text-sm">
								<p className="font-medium mb-1">
									Información del Activo:
								</p>
								<p>
									<span className="text-slate-500">Cliente:</span>{' '}
									{selectedAsset.client?.name}
								</p>
								<p>
									<span className="text-slate-500">Valor:</span> $
									{selectedAsset.value.toLocaleString()}
								</p>
							</div>
						)}

						<FormField
							control={form.control}
							name="bankId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Banco *</FormLabel>
									<Select
										onValueChange={(value) =>
											field.onChange(parseInt(value))
										}
										defaultValue={field.value?.toString()}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Seleccionar banco" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{isLoadingBanks ? (
												<div className="px-2 py-1.5 text-sm text-slate-500">
													Cargando bancos...
												</div>
											) : banks.length === 0 ? (
												<div className="px-2 py-1.5 text-sm text-slate-500">
													No hay bancos disponibles
												</div>
											) : (
												banks.map((bank) => (
													<SelectItem
														key={bank.id}
														value={bank.id.toString()}
													>
														{bank.name}
													</SelectItem>
												))
											)}
										</SelectContent>
									</Select>
									<FormDescription>
										Banco que recibirá el token como garantía
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="principalAmount"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Monto Principal (USD) *</FormLabel>
										<FormControl>
											<Input
												type="number"
												step="0.01"
												min="0.01"
												placeholder="45000.00"
												{...field}
												onChange={(e) =>
													field.onChange(
														parseFloat(e.target.value) || 0
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
								name="interestRate"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Tasa de Interés (%) *</FormLabel>
										<FormControl>
											<Input
												type="number"
												step="0.1"
												min="0.1"
												max="100"
												placeholder="12.5"
												{...field}
												onChange={(e) =>
													field.onChange(
														parseFloat(e.target.value) || 0
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
							name="repaymentDate"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Fecha de Pago *</FormLabel>
									<FormControl>
										<Input
											type="date"
											min={new Date().toISOString().split('T')[0]}
											{...field}
										/>
									</FormControl>
									<FormDescription>
										Fecha límite para el pago del endoso
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
								disabled={isSubmitting}
							>
								Cancelar
							</Button>
							<Button
								type="submit"
								disabled={isSubmitting || tokenizedAssets.length === 0}
							>
								{isSubmitting && (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								)}
								Crear Endoso
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}

