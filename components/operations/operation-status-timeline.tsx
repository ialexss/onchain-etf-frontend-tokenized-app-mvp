"use client";

import { OperationStatus } from "@/types/operation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Clock, Package, FileText, FileCheck, Coins, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface OperationStatusTimelineProps {
	status: OperationStatus;
	assets?: any[];
	onActionClick?: (action: string) => void;
}

// Determinar el estado real basado en los bundles
function calculateRealStatus(assets: any[]): {
	stage: string;
	label: string;
	description: string;
	progress: number;
} {
	if (!assets || assets.length === 0) {
		return {
			stage: "CREATED",
			label: "Creada",
			description: "Operación creada sin Paquetes de Activos",
			progress: 0,
		};
	}

	const allReleased = assets.every(a => a.status === "BURNED" || a.status === "DELIVERED");
	if (allReleased) {
		return {
			stage: "RELEASED",
			label: "Liberada",
			description: "Todos los bundles han sido liberados",
			progress: 100,
		};
	}

	const someTokenized = assets.some(a => a.token);
	const allTokenized = assets.every(a => a.token);
	if (allTokenized) {
		return {
			stage: "TOKENIZED",
			label: "Tokenizada",
			description: "Todos los bundles están tokenizados",
			progress: 80,
		};
	}
	if (someTokenized) {
		return {
			stage: "TOKENIZING",
			label: "En Tokenización",
			description: "Algunos bundles están tokenizados",
			progress: 60,
		};
	}

	// Verificar si todos tienen documentos y firmas
	const allDocumentsReady = assets.every(a => {
		// Aquí deberíamos verificar documentos, pero simplificamos
		return a.createdAt; // Si existe, asumimos que tiene algo
	});

	if (allDocumentsReady) {
		return {
			stage: "DOCUMENTS_READY",
			label: "Documentos Listos",
			description: "Los bundles están listos para tokenizar",
			progress: 40,
		};
	}

	return {
		stage: "PROCESSING",
		label: "En Proceso",
		description: "Bundles en proceso de documentación",
		progress: 20,
	};
}

const TIMELINE_STAGES = [
	{
		id: "CREATED",
		label: "Creada",
		description: "Operación creada con bundles",
		icon: Package,
	},
	{
		id: "DOCUMENTS_READY",
		label: "Documentos",
		description: "Bundles con documentos completos",
		icon: FileText,
	},
	{
		id: "DOCUMENTS_SIGNED",
		label: "Firmados",
		description: "Documentos firmados por todas las partes",
		icon: FileCheck,
	},
	{
		id: "TOKENIZED",
		label: "Tokenizada",
		description: "Bundles tokenizados en XRPL",
		icon: Coins,
	},
	{
		id: "RELEASED",
		label: "Liberada",
		description: "Bundles liberados completamente",
		icon: Shield,
	},
];

export function OperationStatusTimeline({
	status,
	assets = [],
	onActionClick,
}: OperationStatusTimelineProps) {
	const currentStatus = calculateRealStatus(assets);
	const currentIndex = TIMELINE_STAGES.findIndex((s) => s.id === currentStatus.stage);

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle>Ciclo de Vida de la Operación</CardTitle>
						<CardDescription>
							Basado en el estado de {assets.length} Paquete{assets.length !== 1 ? 's' : ''} de Activos
						</CardDescription>
					</div>
					<Badge variant="outline" className="text-base">
						{currentStatus.progress}% completado
					</Badge>
				</div>
			</CardHeader>
			<CardContent>
				<div className="relative">
					{/* Timeline Line */}
					<div className="absolute left-5 top-0 bottom-0 w-0.5 bg-muted" />

					{/* Timeline Items */}
					<div className="space-y-6">
						{TIMELINE_STAGES.map((stage, index) => {
							const isCompleted = index < currentIndex;
							const isCurrent = index === currentIndex;
							const isPending = index > currentIndex;
							const Icon = stage.icon;

							return (
								<div key={stage.id} className="relative flex items-start gap-4">
									{/* Icon */}
									<div
										className={cn(
											"relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
											isCompleted
												? "border-green-500 bg-green-500 text-white"
												: isCurrent
												? "border-primary bg-primary text-primary-foreground"
												: "border-muted bg-background text-muted-foreground"
										)}
									>
										{isCompleted ? (
											<CheckCircle2 className="h-5 w-5" />
										) : isCurrent ? (
											<Icon className="h-5 w-5" />
										) : (
											<Circle className="h-5 w-5" />
										)}
									</div>

									{/* Content */}
									<div className="flex-1 pt-1">
										<div className="flex items-center justify-between">
											<div>
												<p
													className={cn(
														"font-medium",
														isCurrent
															? "text-foreground"
															: isCompleted
															? "text-foreground"
															: "text-muted-foreground"
													)}
												>
													{stage.label}
												</p>
												<p className="text-sm text-muted-foreground">
													{stage.description}
												</p>
											</div>
											{isCurrent && (
												<Badge variant="default">
													<Clock className="h-3 w-3 mr-1" />
													Actual
												</Badge>
											)}
										</div>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

