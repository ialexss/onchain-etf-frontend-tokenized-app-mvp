"use client";

import { CheckCircle2, Circle, ShieldCheck, FileText, AlertCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface BundleValidationStatusProps {
	validation: {
		cdExists: boolean;
		bpExists: boolean;
		pagareExists: boolean | null;
		cdSignedByWarehouse: boolean;
		cdSignedByClient: boolean;
		bpSignedByWarehouse: boolean;
		bpSignedByClient: boolean;
		pagareSignedByClient: boolean | null;
		pagareSignedByBank: boolean | null;
		merkleRootCalculated: boolean;
	};
}

export function BundleValidationStatus({ validation }: BundleValidationStatusProps) {
	const StatusIcon = ({ status, tooltip }: { status: boolean; tooltip: string }) => (
		<TooltipProvider delayDuration={300}>
			<Tooltip>
				<TooltipTrigger asChild>
					<div className={cn("flex items-center gap-1", status ? "text-green-500" : "text-muted-foreground")}>
						{status ? (
							<CheckCircle2 className="h-3.5 w-3.5" />
						) : (
							<Circle className="h-3.5 w-3.5 text-muted-foreground/30" />
						)}
					</div>
				</TooltipTrigger>
				<TooltipContent side="bottom" className="text-xs">
					<p>{tooltip}: {status ? "Completo" : "Pendiente"}</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);

	return (
		<div className="space-y-3 mt-4 border-t pt-3">
			<h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
				Estado de Validación
			</h4>
			
			<div className="grid gap-2">
				{/* CD Status */}
				<div className="flex items-center justify-between text-sm bg-muted/30 p-2 rounded-md border border-muted/50">
					<div className="flex items-center gap-2">
						<FileText className="h-4 w-4 text-blue-500" />
						<span className="font-medium text-xs">Certificado de Depósito</span>
					</div>
					<div className="flex items-center gap-3">
						<div className="flex items-center gap-1.5" title="Documento Subido">
							<span className="text-[10px] text-muted-foreground uppercase">Doc</span>
							{validation.cdExists ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> : <XCircle className="h-3.5 w-3.5 text-red-400" />}
						</div>
						<div className="h-3 w-px bg-border mx-1"></div>
						<div className="flex items-center gap-1.5" title="Firmas: Almacenadora / Cliente">
							<span className="text-[10px] text-muted-foreground uppercase">Firmas</span>
							<StatusIcon status={validation.cdSignedByWarehouse} tooltip="Almacenadora" />
							<StatusIcon status={validation.cdSignedByClient} tooltip="Cliente" />
						</div>
					</div>
				</div>

				{/* BP Status */}
				<div className="flex items-center justify-between text-sm bg-muted/30 p-2 rounded-md border border-muted/50">
					<div className="flex items-center gap-2">
						<FileText className="h-4 w-4 text-purple-500" />
						<span className="font-medium text-xs">Bono de Prenda</span>
					</div>
					<div className="flex items-center gap-3">
						<div className="flex items-center gap-1.5" title="Documento Subido">
							<span className="text-[10px] text-muted-foreground uppercase">Doc</span>
							{validation.bpExists ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> : <XCircle className="h-3.5 w-3.5 text-red-400" />}
						</div>
						<div className="h-3 w-px bg-border mx-1"></div>
						<div className="flex items-center gap-1.5" title="Firmas: Almacenadora / Cliente">
							<span className="text-[10px] text-muted-foreground uppercase">Firmas</span>
							<StatusIcon status={validation.bpSignedByWarehouse} tooltip="Almacenadora" />
							<StatusIcon status={validation.bpSignedByClient} tooltip="Cliente" />
						</div>
					</div>
				</div>

				{/* Pagaré Status - Only show if it exists or is required */}
				<div className="flex items-center justify-between text-sm bg-muted/30 p-2 rounded-md border border-muted/50">
					<div className="flex items-center gap-2">
						<FileText className="h-4 w-4 text-orange-500" />
						<span className="font-medium text-xs">Pagaré (Opcional)</span>
					</div>
					<div className="flex items-center gap-3">
						<div className="flex items-center gap-1.5" title="Documento Subido">
							<span className="text-[10px] text-muted-foreground uppercase">Doc</span>
							{validation.pagareExists === true ? (
								<CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
							) : validation.pagareExists === false ? (
								<Circle className="h-3.5 w-3.5 text-muted-foreground/30" />
							) : (
								<span className="text-[10px] text-muted-foreground">-</span>
							)}
						</div>
						<div className="h-3 w-px bg-border mx-1"></div>
						<div className="flex items-center gap-1.5" title="Firmas: Cliente / Banco">
							<span className="text-[10px] text-muted-foreground uppercase">Firmas</span>
							{validation.pagareExists ? (
								<>
									<StatusIcon status={validation.pagareSignedByClient === true} tooltip="Cliente" />
									<StatusIcon status={validation.pagareSignedByBank === true} tooltip="Banco (Opcional)" />
								</>
							) : (
								<span className="text-[10px] text-muted-foreground italic">No requiere</span>
							)}
						</div>
					</div>
				</div>
                
                {/* Merkle Root Warning if missing but docs present */}
                {!validation.merkleRootCalculated && validation.cdExists && validation.bpExists && (
                    <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200 dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-400">
                        <AlertCircle className="h-3.5 w-3.5" />
                        <span>Merkle Root pendiente de cálculo</span>
                    </div>
                )}
			</div>
		</div>
	);
}
