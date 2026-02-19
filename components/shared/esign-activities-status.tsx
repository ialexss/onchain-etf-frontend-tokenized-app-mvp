"use client";

import { useQuery } from "@tanstack/react-query";
import {
	esignApi,
	ActivityStatus as ActivityStatusType,
} from "@/lib/api/esign";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
	User,
	Building2,
	Landmark,
	Loader2,
	CheckCircle2,
	Clock,
	XCircle,
	AlertCircle,
	RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface EsignActivitiesStatusProps {
	envelopeId: string;
	envelopeStatus?: string;
	autoRefresh?: boolean;
}

const getActorIcon = (actorType: string) => {
	switch (actorType) {
		case "CLIENT":
			return User;
		case "WAREHOUSE":
			return Building2;
		case "BANK":
			return Landmark;
		default:
			return User;
	}
};

const getActorLabel = (actorType: string) => {
	switch (actorType) {
		case "CLIENT":
			return "Cliente";
		case "WAREHOUSE":
			return "Almacén General";
		case "BANK":
			return "Entidad Financiera";
		default:
			return actorType;
	}
};

const getStatusBadge = (status: string) => {
	switch (status) {
		case "COMPLETED":
			return (
				<Badge className="bg-green-500 hover:bg-green-600">
					<CheckCircle2 className="h-3 w-3 mr-1" />
					Firmado
				</Badge>
			);
		case "ACTIVE":
			return (
				<Badge className="bg-blue-500 hover:bg-blue-600">
					<Clock className="h-3 w-3 mr-1" />
					En Proceso
				</Badge>
			);
		case "REJECTED":
			return (
				<Badge variant="destructive">
					<XCircle className="h-3 w-3 mr-1" />
					Rechazado
				</Badge>
			);
		case "PENDING":
		default:
			return (
				<Badge variant="outline">
					<AlertCircle className="h-3 w-3 mr-1" />
					Pendiente
				</Badge>
			);
	}
};

export function EsignActivitiesStatus({
	envelopeId,
	envelopeStatus,
	autoRefresh = true,
}: EsignActivitiesStatusProps) {
	// Only auto-refresh if envelope is active/in-progress
	const shouldRefresh =
		autoRefresh &&
		envelopeStatus &&
		!["COMPLETED", "REJECTED", "EXPIRED"].includes(envelopeStatus);

	const {
		data: activities,
		isLoading,
		refetch,
		isFetching,
	} = useQuery({
		queryKey: ["esign-activities", envelopeId],
		queryFn: () => esignApi.getEnvelopeActivities(envelopeId),
		refetchInterval: shouldRefresh ? 30000 : false, // 30 seconds
		enabled: !!envelopeId,
	});

	if (isLoading) {
		return (
			<div className="flex items-center justify-center p-8">
				<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (!activities || activities.length === 0) {
		return (
			<Card className="bg-blue-50 border-blue-200">
				<CardContent className="pt-6">
					<p className="text-sm text-blue-900">
						No hay información de actividades disponible.
					</p>
				</CardContent>
			</Card>
		);
	}

	// Calculate progress
	const completedCount = activities.filter(
		(a) => a.status === "COMPLETED",
	).length;
	const totalCount = activities.length;
	const progressPercentage = (completedCount / totalCount) * 100;

	return (
		<div className="space-y-4 ">
			{/* Progress Overview */}
			<Card className="bg-linear-to-r from-blue-50 to-indigo-50 border-blue-200 sticky top-0 z-10">
				<CardHeader className="pb-3">
					<div className="flex items-center justify-between">
						<CardTitle className="text-base font-semibold text-blue-900">
							Progreso de Firmas Oficiales
						</CardTitle>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => refetch()}
							disabled={isFetching}
							className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-100"
						>
							<RefreshCw
								className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
							/>
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					<div className="space-y-2">
						<div className="flex items-center justify-between text-sm">
							<span className="text-blue-700">
								{completedCount} de {totalCount} firmantes
								completados
							</span>
							<span className="font-semibold text-blue-900">
								{Math.round(progressPercentage)}%
							</span>
						</div>
						<Progress
							value={progressPercentage}
							className="h-2 bg-blue-100"
						/>
					</div>
				</CardContent>
			</Card>

			{/* Activity Details */}
			<div className="grid gap-3">
				{activities.map((activity, index) => {
					const Icon = getActorIcon(activity.actorType);
					return (
						<Card
							key={index}
							className={`transition-all ${
								activity.status === "COMPLETED"
									? "bg-green-50/30 border-green-200"
									: activity.status === "ACTIVE"
										? "bg-blue-50/30 border-blue-200"
										: "bg-gray-50/30 border-gray-200"
							}`}
						>
							<CardContent className="p-4">
								<div className="flex items-start justify-between gap-4">
									<div className="flex items-start gap-3 flex-1">
										<div
											className={`p-2 rounded-lg ${
												activity.status === "COMPLETED"
													? "bg-green-100"
													: activity.status ===
														  "ACTIVE"
														? "bg-blue-100"
														: "bg-gray-100"
											}`}
										>
											<Icon
												className={`h-5 w-5 ${
													activity.status ===
													"COMPLETED"
														? "text-green-600"
														: activity.status ===
															  "ACTIVE"
															? "text-blue-600"
															: "text-gray-600"
												}`}
											/>
										</div>
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-2 mb-1">
												<h4 className="font-semibold text-sm">
													{getActorLabel(
														activity.actorType,
													)}
												</h4>
												{getStatusBadge(
													activity.status,
												)}
											</div>
											<p className="text-xs text-muted-foreground mb-1">
												{activity.actorName}
											</p>
											<p className="text-xs text-muted-foreground truncate">
												{activity.actorEmail}
											</p>
											{activity.openedDate && (
												<p className="text-xs text-blue-600 mt-2">
													Abierto:{" "}
													{format(
														new Date(
															activity.openedDate,
														),
														"dd/MM/yyyy HH:mm",
														{ locale: es },
													)}
												</p>
											)}
											{activity.finishedDate && (
												<p className="text-xs text-green-600 mt-1">
													Firmado:{" "}
													{format(
														new Date(
															activity.finishedDate,
														),
														"dd/MM/yyyy HH:mm",
														{ locale: es },
													)}
												</p>
											)}
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					);
				})}
			</div>

			{shouldRefresh && (
				<p className="text-xs text-center text-muted-foreground italic">
					Actualizando automáticamente cada 30 segundos...
				</p>
			)}
		</div>
	);
}
