"use client";

import { OperationStatus } from "@/types/operation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface OperationStatusTimelineProps {
	status: OperationStatus;
	onActionClick?: (action: string) => void;
}

const STATUSES: Array<{
	status: OperationStatus;
	label: string;
	description: string;
	action?: string;
}> = [
	{
		status: OperationStatus.PENDING,
		label: "Pendiente",
		description: "Operación creada, esperando documentos",
	},
	{
		status: OperationStatus.DOCUMENTS_UPLOADED,
		label: "Documentos Subidos",
		description: "Todos los documentos han sido subidos",
	},
	{
		status: OperationStatus.SIGNED,
		label: "Firmado",
		description: "Todos los documentos están firmados",
	},
	{
		status: OperationStatus.TOKENIZED,
		label: "Tokenizado",
		description: "Bundle tokenizado en XRPL",
	},
	{
		status: OperationStatus.ACTIVE,
		label: "Activo",
		description: "Token en posesión de Entidad Financiera",
	},
	{
		status: OperationStatus.LIQUIDATED,
		label: "Liquidado",
		description: "Token transferido a la warehouse",
	},
	{
		status: OperationStatus.RELEASED,
		label: "Liberado",
		description: "Operación completada",
	},
];

export function OperationStatusTimeline({
	status,
	onActionClick,
}: OperationStatusTimelineProps) {
	const currentIndex = STATUSES.findIndex((s) => s.status === status);

	return (
		<Card>
			<CardHeader>
				<CardTitle>Estado de la Operación</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="relative">
					{/* Timeline Line */}
					<div className="absolute left-5 top-0 bottom-0 w-0.5 bg-muted" />

					{/* Timeline Items */}
					<div className="space-y-6">
						{STATUSES.map((item, index) => {
							const isCompleted = index < currentIndex;
							const isCurrent = index === currentIndex;
							const isPending = index > currentIndex;

							return (
								<div key={item.status} className="relative flex items-start gap-4">
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
											<Clock className="h-5 w-5" />
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
													{item.label}
												</p>
												<p className="text-sm text-muted-foreground">
													{item.description}
												</p>
											</div>
											{isCurrent && (
												<Badge variant="default">
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

