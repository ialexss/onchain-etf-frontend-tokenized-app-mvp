"use client";

import { useState, useEffect } from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
	AlertCircle,
	Coins,
	FileText,
	Loader2,
	CheckCircle2,
} from "lucide-react";

interface TokenizeAssetDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
	asset?: {
		vinSerial: string;
		description?: string;
		value: number;
	};
	isLoading?: boolean;
}

export function TokenizeAssetDialog({
	open,
	onOpenChange,
	onConfirm,
	asset,
	isLoading = false,
}: TokenizeAssetDialogProps) {
	// Estado local para controlar la pantalla de carga
	const [showLoading, setShowLoading] = useState(false);
	// Estado para rastrear el paso actual (0-4, donde 4 es el último paso)
	const [currentStep, setCurrentStep] = useState(0);

	// Sincronizar el estado local con el prop isLoading
	useEffect(() => {
		if (isLoading) {
			setShowLoading(true);
			setCurrentStep(0); // Reiniciar al primer paso

			// Avanzar los pasos automáticamente con intervalos
			// Los tiempos reflejan el proceso real: verificación rápida, emisión más lenta
			const stepIntervals = [
				800, // Paso 1: Verificando documentos (rápido, ~0.8s)
				1000, // Paso 2: Verificando firmas (rápido, ~1s)
				4000, // Paso 3: Emitiendo token en XRPL (más lento, ~4s - incluye conexión y transacción)
				3000, // Paso 4: Transfiriendo token (moderado, ~3s - incluye autorización si es necesaria)
				1000, // Paso 5: Actualizando estado (rápido, ~1s)
			];

			let accumulatedTime = 0;
			const timers: NodeJS.Timeout[] = [];

			stepIntervals.forEach((interval, index) => {
				accumulatedTime += interval;
				const timer = setTimeout(() => {
					setCurrentStep(index + 1);
				}, accumulatedTime);
				timers.push(timer);
			});

			// Limpiar timers cuando termine la carga
			return () => {
				timers.forEach((timer) => clearTimeout(timer));
			};
		} else if (!isLoading && showLoading) {
			// Asegurar que todos los pasos estén completados
			setCurrentStep(5); // 5 pasos en total (índices 0-4, completar = 5)
			// Mantener la pantalla de carga visible brevemente después de que termine
			// para que el usuario vea el resultado
			const timer = setTimeout(() => {
				setShowLoading(false);
				setCurrentStep(0); // Reiniciar para la próxima vez
			}, 1000);
			return () => clearTimeout(timer);
		}
	}, [isLoading, showLoading]);

	// Prevenir cierre del diálogo mientras se está cargando
	const handleOpenChange = (newOpen: boolean) => {
		if (!isLoading && !showLoading) {
			onOpenChange(newOpen);
		}
	};

	const steps = [
		{ id: 1, label: "Verificando documentos CD y BP" },
		{ id: 2, label: "Verificando firmas (Warehouse y Client)" },
		{ id: 3, label: "Emitiendo token MPT en XRPL" },
		{ id: 4, label: "Transfiriendo token a billetera del cliente" },
		{ id: 5, label: "Actualizando estado del activo" },
	] as const;

	return (
		<AlertDialog open={open} onOpenChange={handleOpenChange}>
			<AlertDialogContent className="sm:max-w-[500px]">
				{showLoading || isLoading ? (
					// Pantalla de carga
					<>
						<AlertDialogHeader>
							<AlertDialogTitle className="flex items-center gap-2">
								<Loader2 className="h-5 w-5 text-primary animate-spin" />
								Tokenizando Activo
							</AlertDialogTitle>
							<AlertDialogDescription>
								<p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
									El proceso de tokenización está en curso.
									Por favor, no cierres esta ventana.
								</p>
							</AlertDialogDescription>
						</AlertDialogHeader>

						<div className="space-y-3 py-4">
							{steps.map((step, index) => {
								// Determinar el estado de cada paso
								const isCompleted = index < currentStep;
								const isProcessing =
									index === currentStep &&
									currentStep < steps.length;
								const isPending = index > currentStep;

								return (
									<div
										key={step.id}
										className={`flex items-start gap-3 p-3 rounded-lg transition-all duration-300 ${
											isProcessing
												? "bg-primary/5 border border-primary/20"
												: isCompleted
												? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
												: "bg-slate-50 dark:bg-slate-900 opacity-60"
										}`}
									>
										<div className="shrink-0 mt-0.5">
											{isCompleted ? (
												<CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
											) : isProcessing ? (
												<Loader2 className="h-5 w-5 text-primary animate-spin" />
											) : (
												<div className="h-5 w-5 rounded-full border-2 border-slate-300 dark:border-slate-600" />
											)}
										</div>
										<div className="flex-1">
											<p
												className={`text-sm font-medium transition-colors ${
													isProcessing
														? "text-primary"
														: isCompleted
														? "text-green-700 dark:text-green-300"
														: "text-slate-500 dark:text-slate-400"
												}`}
											>
												{step.label}
											</p>
											{isProcessing && (
												<p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
													Procesando...
												</p>
											)}
											{isCompleted && (
												<p className="text-xs text-green-600 dark:text-green-400 mt-1">
													Completado
												</p>
											)}
										</div>
									</div>
								);
							})}
						</div>

						<Alert className="mt-4">
							<AlertCircle className="h-4 w-4" />
							<AlertDescription className="text-xs">
								Este proceso puede tardar varios segundos. Por
								favor, espera hasta que se complete.
							</AlertDescription>
						</Alert>
					</>
				) : (
					// Pantalla de confirmación
					<>
						<AlertDialogHeader>
							<AlertDialogTitle className="flex items-center gap-2">
								<Coins className="h-5 w-5 text-primary" />
								Tokenizar Activo
							</AlertDialogTitle>
							<AlertDialogDescription className="space-y-4">
								<div>
									<p className="text-sm font-medium mb-2">
										Estás a punto de tokenizar el siguiente
										activo:
									</p>
									<div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg space-y-2">
										<p className="text-sm">
											<span className="font-medium">
												VIN/Serial:
											</span>{" "}
											{asset?.vinSerial}
										</p>
										{asset?.description && (
											<p className="text-sm">
												<span className="font-medium">
													Descripción:
												</span>{" "}
												{asset.description}
											</p>
										)}
										<p className="text-sm">
											<span className="font-medium">
												Valor:
											</span>{" "}
											${asset?.value.toLocaleString()}
										</p>
									</div>
								</div>

								<Alert>
									<AlertCircle className="h-4 w-4" />
									<AlertDescription>
										Este proceso realizará las siguientes
										acciones:
										<ul className="list-disc list-inside mt-2 space-y-1 text-xs">
											<li>
												Verificará que los documentos CD
												y BP estén generados y firmados
											</li>
											<li>
												La ETF emitirá el token MPT en
												XRPL con metadata de ambos
												documentos
											</li>
											<li>
												La ETF transferirá el token a la
												billetera del cliente
											</li>
											<li>
												El estado del activo cambiará a{" "}
												<strong>PLEDGED</strong>
											</li>
										</ul>
										<p className="mt-2 text-xs text-slate-500">
											<strong>Nota:</strong> Los
											documentos CD y BP deben estar
											generados y firmados por Warehouse y
											Client antes de tokenizar.
										</p>
									</AlertDescription>
								</Alert>

								<p className="text-sm text-slate-600 dark:text-slate-400">
									Esta acción es <strong>irreversible</strong>
									. ¿Deseas continuar?
								</p>
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel
								disabled={isLoading || showLoading}
							>
								Cancelar
							</AlertDialogCancel>
							<AlertDialogAction
								onClick={(e) => {
									e.preventDefault();
									setShowLoading(true);
									onConfirm();
								}}
								disabled={isLoading || showLoading}
								className="bg-primary"
							>
								{isLoading || showLoading ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Iniciando...
									</>
								) : (
									<>
										<FileText className="mr-2 h-4 w-4" />
										Confirmar Tokenización
									</>
								)}
							</AlertDialogAction>
						</AlertDialogFooter>
					</>
				)}
			</AlertDialogContent>
		</AlertDialog>
	);
}
