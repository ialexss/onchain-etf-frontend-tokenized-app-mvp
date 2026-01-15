"use client";

import { Badge } from "@/components/ui/badge";
import { Circle } from "lucide-react";

interface DeliveryStatusBadgeProps {
	status: "RED" | "GREEN";
	message?: string;
	className?: string;
}

export function DeliveryStatusBadge({
	status,
	message,
	className,
}: DeliveryStatusBadgeProps) {
	return (
		<div className={`flex items-center gap-2 ${className || ""}`}>
			<div className="relative">
				<Circle
					className={`h-4 w-4 ${
						status === "RED"
							? "fill-red-500 text-red-500"
							: "fill-green-500 text-green-500"
					}`}
				/>
				<Circle
					className={`absolute inset-0 h-4 w-4 animate-ping ${
						status === "RED"
							? "fill-red-500 text-red-500"
							: "fill-green-500 text-green-500"
					} opacity-75`}
				/>
			</div>
			<Badge variant={status === "RED" ? "destructive" : "default"}>
				{status === "RED" ? "BLOQUEADO" : "LIBERADO"}
			</Badge>
			{message && (
				<span className="text-sm text-muted-foreground">{message}</span>
			)}
		</div>
	);
}













