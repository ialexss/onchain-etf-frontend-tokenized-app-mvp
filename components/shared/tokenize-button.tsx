"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { operationsApi } from "@/lib/api/operations";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
	Coins,
	Loader2,
	CheckCircle,
	XCircle,
	FileCheck,
	Hash,
	Sparkles,
	RefreshCw,
} from "lucide-react";

interface TokenizeButtonProps {
	assetId: number;
	operationId: number;
	assetVinSerial: string;
	disabled?: boolean;
	onSuccess?: () => void;
	variant?: "default" | "outline" | "ghost";
	size?: "default" | "sm" | "lg";
	className?: string;
}

type TokenizationStep = {
	id: string;
	label: string;
	icon: any;
	status: "pending" | "loading" | "success" | "error";
};

export function TokenizeButton({
	assetId,
	operationId,
	assetVinSerial,
	disabled = false,
	onSuccess,
	variant = "default",
	size = "default",
	className = "",
}: TokenizeButtonProps) {
	const queryClient = useQueryClient();
	const [showDialog, setShowDialog] = useState(false);
	const [currentStepIndex, setCurrentStepIndex] = useState(0);
	const [steps, setSteps] = useState<TokenizationStep[]>([
		{
			id: "validate",
			label: "Validando documentos y firmas",
			icon: FileCheck,
			status: "pending",
		},
		{
			id: "merkle",
			label: "Calculando Merkle Root",
			icon: Hash,
			status: "pending",
		},
		{
			id: "update",
			label: "Actualizando estado del asset",
			icon: RefreshCw,
			status: "pending",
		},
		{
			id: "mint-transfer",
			label: "Minteando y transfiriendo token",
			icon: Sparkles,
			status: "pending",
		},
	]);

	const tokenizeMutation = useMutation({
		mutationFn: async () => {
			// Simulate step progression
			for (let i = 0; i < steps.length; i++) {
				setCurrentStepIndex(i);
				updateStepStatus(i, "loading");
				
				// Simulate delay for each step (except the last one which is the actual API call)
				if (i < steps.length - 1) {
					await new Promise(resolve => setTimeout(resolve, 800));
					updateStepStatus(i, "success");
				}
			}
			
			// Make the actual API call
			return operationsApi.tokenizeAsset(assetId);
		},
		onSuccess: () => {
			updateStepStatus(steps.length - 1, "success");
			
			// Invalidate all relevant queries
			queryClient.invalidateQueries({
				queryKey: ["operations", operationId],
			});
			queryClient.invalidateQueries({
				queryKey: ["operations", operationId, "status"],
			});
			queryClient.invalidateQueries({
				queryKey: ["operations", operationId, "asset-token-bundles-status"],
			});
			queryClient.invalidateQueries({
				queryKey: ["asset-token-bundle", assetId],
			});
			queryClient.invalidateQueries({
				queryKey: ["asset-bundle", assetId, "documents"],
			});
			
			toast.success(`Asset ${assetVinSerial} tokenizado exitosamente`);
			
			setTimeout(() => {
				setShowDialog(false);
				resetSteps();
				onSuccess?.();
			}, 1500);
		},
		onError: (error: any) => {
			updateStepStatus(currentStepIndex, "error");
			toast.error(
				error.response?.data?.message || "Error al tokenizar asset"
			);
		},
	});

	const updateStepStatus = (index: number, status: TokenizationStep["status"]) => {
		setSteps(prev =>
			prev.map((step, i) => (i === index ? { ...step, status } : step))
		);
	};

	const resetSteps = () => {
		setSteps(prev => prev.map(step => ({ ...step, status: "pending" })));
		setCurrentStepIndex(0);
	};

	const handleTokenize = () => {
		setShowDialog(true);
		resetSteps();
		tokenizeMutation.mutate();
	};

	const progress = ((currentStepIndex + 1) / steps.length) * 100;
	const isCompleted = steps.every(step => step.status === "success");
	const hasError = steps.some(step => step.status === "error");

	return (
		<>
			<Button
				variant={variant}
				size={size}
				onClick={handleTokenize}
				disabled={disabled || tokenizeMutation.isPending}
				className={className}
			>
				<Coins className="h-4 w-4 mr-2" />
				Tokenizar
			</Button>

			<Dialog open={showDialog} onOpenChange={setShowDialog}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<Coins className="h-5 w-5" />
							Tokenizando Asset
						</DialogTitle>
						<DialogDescription>
							{assetVinSerial}
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-4">
						{/* Progress bar */}
						<div className="space-y-2">
							<Progress value={progress} className="h-2" />
							<p className="text-xs text-muted-foreground text-center">
								{isCompleted
									? "¡Completado!"
									: hasError
									? "Error en el proceso"
									: `Paso ${currentStepIndex + 1} de ${steps.length}`}
							</p>
						</div>

						{/* Steps */}
						<div className="space-y-3">
							{steps.map((step, index) => {
								const Icon = step.icon;
								return (
									<div
										key={step.id}
										className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
											step.status === "loading"
												? "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800"
												: step.status === "success"
												? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
												: step.status === "error"
												? "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"
												: "bg-muted/50"
										}`}
									>
										<div className="flex-shrink-0">
											{step.status === "loading" ? (
												<Loader2 className="h-5 w-5 animate-spin text-blue-600" />
											) : step.status === "success" ? (
												<CheckCircle className="h-5 w-5 text-green-600" />
											) : step.status === "error" ? (
												<XCircle className="h-5 w-5 text-red-600" />
											) : (
												<Icon className="h-5 w-5 text-muted-foreground" />
											)}
										</div>
										<div className="flex-1">
											<p
												className={`text-sm font-medium ${
													step.status === "pending"
														? "text-muted-foreground"
														: ""
												}`}
											>
												{step.label}
											</p>
										</div>
									</div>
								);
							})}
						</div>

						{/* Action buttons */}
						{(isCompleted || hasError) && (
							<div className="flex justify-end gap-2 pt-2">
								<Button
									variant="outline"
									onClick={() => {
										setShowDialog(false);
										resetSteps();
									}}
								>
									Cerrar
								</Button>
								{hasError && (
									<Button onClick={handleTokenize}>
										Reintentar
									</Button>
								)}
							</div>
						)}
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
