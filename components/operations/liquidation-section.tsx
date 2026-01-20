"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { operationsApi } from "@/lib/api/operations";
import { PaymentLetterStatus } from "@/types/operation";
import { toast } from "sonner";
import {
	FileCheck,
	CheckCircle,
	XCircle,
	Loader2,
	AlertCircle,
	Truck,
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";

interface LiquidationSectionProps {
	operationId: number;
}

export function LiquidationSection({ operationId }: LiquidationSectionProps) {
	const { user } = useAuth();
	const queryClient = useQueryClient();

	const { data: operation, isLoading: isLoadingOperation } = useQuery({
		queryKey: ["operations", operationId],
		queryFn: () => operationsApi.getById(operationId),
		enabled: !!operationId,
	});

	const { data: paymentLetter } = useQuery({
		queryKey: ["payment-letter", operationId],
		queryFn: () => operationsApi.getPaymentLetter(operationId),
		enabled: !!operationId,
	});

	const liquidateMutation = useMutation({
		mutationFn: () => operationsApi.liquidateOperation(operationId),
		onSuccess: async () => {
			toast.success("Operación liquidada exitosamente");
			
			// Invalidar todas las queries relacionadas para forzar recarga
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: ["operations", operationId],
				}),
				queryClient.invalidateQueries({ queryKey: ["operations"] }),
				queryClient.invalidateQueries({
					queryKey: ["tokens", "operation", operationId],
				}),
				queryClient.invalidateQueries({ queryKey: ["tokens"] }),
				queryClient.invalidateQueries({
					queryKey: ["operations", operationId, "tokenization-preview"],
				}),
			]);
			
			// Forzar refetch de la operación y tokens
			queryClient.refetchQueries({
				queryKey: ["operations", operationId],
			});
			queryClient.refetchQueries({
				queryKey: ["tokens", "operation", operationId],
			});
		},
		onError: (error: any) => {
			toast.error(
				error.response?.data?.message ||
					"Error al liquidar la operación"
			);
		},
	});

	const certifyDeliveryMutation = useMutation({
		mutationFn: () => operationsApi.certifyDelivery(operationId),
		onSuccess: async () => {
			toast.success("Entrega física certificada exitosamente");
			
			// Invalidar todas las queries relacionadas para forzar recarga
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: ["operations", operationId],
				}),
				queryClient.invalidateQueries({ queryKey: ["operations"] }),
				queryClient.invalidateQueries({
					queryKey: ["tokens", "operation", operationId],
				}),
				queryClient.invalidateQueries({ queryKey: ["tokens"] }),
				queryClient.invalidateQueries({
					queryKey: ["operations", operationId, "tokenization-preview"],
				}),
			]);
			
			// Forzar refetch de la operación y tokens
			queryClient.refetchQueries({
				queryKey: ["operations", operationId],
			});
			queryClient.refetchQueries({
				queryKey: ["tokens", "operation", operationId],
			});
		},
		onError: (error: any) => {
			toast.error(
				error.response?.data?.message ||
					"Error al certificar la entrega"
			);
		},
	});

	const handleLiquidate = () => {
		if (
			!window.confirm(
				"¿Está seguro de que desea liquidar esta operación? El token será transferido a la warehouse para liberación de activos."
			)
		) {
			return;
		}

		liquidateMutation.mutate();
	};

	const handleCertifyDelivery = () => {
		if (
			!window.confirm(
				"¿Confirma que la mercadería ha sido entregada físicamente al cliente?"
			)
		) {
			return;
		}

		certifyDeliveryMutation.mutate();
	};

	const isBank = user?.organizations?.some((org) => org.type === "BANK");
	const isWarrant = user?.organizations?.some(
		(org) => org.type === "WAREHOUSE"
	);

	const isLiquidated = operation?.status === "LIQUIDATED";
	const isReleased = operation?.status === "RELEASED";

	const paymentLetterApproved =
		paymentLetter?.status === PaymentLetterStatus.APPROVED;

	if (isLoadingOperation) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Liquidación</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-center py-4">
						<Loader2 className="h-6 w-6 mx-auto animate-spin text-muted-foreground" />
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center justify-between">
					<span>Liquidación</span>
					{isLiquidated && (
						<Badge variant="default" className="bg-yellow-500">
							<CheckCircle className="h-3 w-3 mr-1" />
							Liquidada
						</Badge>
					)}
					{isReleased && (
						<Badge variant="default" className="bg-green-500">
							<CheckCircle className="h-3 w-3 mr-1" />
							Finalizada
						</Badge>
					)}
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Estado de carta de pago */}
				<div className="border rounded-lg p-4 space-y-2">
					<div className="flex items-center justify-between">
						<h4 className="font-medium">Carta de Pago</h4>
						{paymentLetter ? (
							<Badge
								variant={
									paymentLetter.status ===
									PaymentLetterStatus.APPROVED
										? "default"
										: "outline"
								}
							>
								{paymentLetter.status ===
								PaymentLetterStatus.APPROVED ? (
									<>
										<CheckCircle className="h-3 w-3 mr-1" />
										Aprobada
									</>
								) : (
									<>
										<XCircle className="h-3 w-3 mr-1" />
										Pendiente
									</>
								)}
							</Badge>
						) : (
							<Badge variant="outline">
								<XCircle className="h-3 w-3 mr-1" />
								No disponible
							</Badge>
						)}
					</div>
					{!paymentLetterApproved && (
						<p className="text-sm text-muted-foreground">
							La carta de pago debe estar aprobada antes de
							liquidar la operación.
						</p>
					)}
				</div>

				{/* Acciones para Entidad Financiera */}
				{isBank && operation?.status === "ACTIVE" && (
					<div className="space-y-2">
						{!paymentLetterApproved ? (
							<Alert>
								<AlertCircle className="h-4 w-4" />
								<AlertDescription>
									Debe aprobar la carta de pago antes de
									liquidar la operación.
								</AlertDescription>
							</Alert>
						) : (
							<Button
								onClick={handleLiquidate}
								disabled={
									liquidateMutation.isPending ||
									!paymentLetterApproved
								}
								className="w-full"
							>
								{liquidateMutation.isPending && (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								)}
								<FileCheck className="mr-2 h-4 w-4" />
								Liquidar Operación
							</Button>
						)}
					</div>
				)}

				{/* Acciones para Warrant */}
				{isWarrant && isLiquidated && (
					<div className="space-y-2">
						<Alert className="bg-green-50 border-green-200">
							<CheckCircle className="h-4 w-4 text-green-600" />
							<AlertDescription className="text-green-800">
								<strong>Activos disponibles para retiro</strong>
								<br />
								El token está en posesión de esta warehouse y la
								carta de pago ha sido aprobada. Los activos están
								disponibles para retiro. Puede proceder a certificar
								la entrega física y quemar el token para finalizar
								la operación.
							</AlertDescription>
						</Alert>
						<Button
							onClick={handleCertifyDelivery}
							disabled={certifyDeliveryMutation.isPending}
							className="w-full bg-green-600 hover:bg-green-700"
						>
							{certifyDeliveryMutation.isPending && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							<Truck className="mr-2 h-4 w-4" />
							Certificar Entrega y Finalizar Operación
						</Button>
					</div>
				)}

				{/* Estado final */}
				{operation?.status === "RELEASED" && (
					<Alert className="bg-green-50 border-green-200">
						<CheckCircle className="h-4 w-4 text-green-600" />
						<AlertDescription className="text-green-800">
							La operación ha sido completamente finalizada. La
							mercadería ha sido entregada y el token ha sido
							liquidado.
						</AlertDescription>
					</Alert>
				)}

				{/* Información para otros usuarios */}
				{!isBank && !isWarrant && isLiquidated && (
					<Alert>
						<CheckCircle className="h-4 w-4" />
						<AlertDescription>
							Esta operación ha sido liquidada. El token ha sido
							transferido a la warehouse para liberación de
							activos.
						</AlertDescription>
					</Alert>
				)}
				{!isBank && !isWarrant && isReleased && (
					<Alert>
						<CheckCircle className="h-4 w-4" />
						<AlertDescription>
							Esta operación ha sido completamente finalizada. El
							token ha sido quemado y los activos han sido
							liberados.
						</AlertDescription>
					</Alert>
				)}
			</CardContent>
		</Card>
	);
}
