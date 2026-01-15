"use client";

import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { operationsApi } from "@/lib/api/operations";
import { TokenizationPreview, TokenizationData } from "@/types/operation";
import { toast } from "sonner";
import { Loader2, FileText, Coins, Building2, Users, Landmark } from "lucide-react";

interface TokenizationPreviewDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	operationId: number;
	previewData: TokenizationPreview | null;
	onTokenize: (data: TokenizationData) => void;
	isTokenizing: boolean;
	isError?: boolean;
	error?: any;
}

export function TokenizationPreviewDialog({
	open,
	onOpenChange,
	operationId,
	previewData,
	onTokenize,
	isTokenizing,
	isError,
	error,
}: TokenizationPreviewDialogProps) {
	const [description, setDescription] = useState<string>("");
	const [annualRate, setAnnualRate] = useState<number | undefined>(undefined);
	const [principalAmount, setPrincipalAmount] = useState<number | undefined>(
		undefined
	);
	const [maturityDate, setMaturityDate] = useState<string>("");

	useEffect(() => {
		if (previewData) {
			setDescription(previewData.tokenPreview.description || "");
			setAnnualRate(previewData.tokenPreview.interestRate);
			setPrincipalAmount(previewData.tokenPreview.principalAmount);
			setMaturityDate(
				previewData.tokenPreview.maturityDate
					? new Date(previewData.tokenPreview.maturityDate)
							.toISOString()
							.split("T")[0]
					: ""
			);
		}
	}, [previewData]);

	const handleTokenize = () => {
		if (!previewData) {
			toast.error("Cargando datos de preview...");
			return;
		}
		const tokenizationData: TokenizationData = {
			description: description || undefined,
			annualRate: annualRate !== undefined ? annualRate : undefined,
			principalAmount:
				principalAmount !== undefined ? principalAmount : undefined,
			maturityDate: maturityDate || undefined,
		};

		onTokenize(tokenizationData);
	};

	const isFromPagare = (field: "rate" | "principal" | "maturity") => {
		if (!previewData) return false;
		
		if (field === "rate") {
			return (
				previewData.operation.annualRate === null ||
				previewData.operation.annualRate === undefined
			);
		}
		if (field === "principal") {
			return (
				previewData.operation.principalAmount === null ||
				previewData.operation.principalAmount === undefined
			);
		}
		if (field === "maturity") {
			return !previewData.operation.maturityDate;
		}
		return false;
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-4xl max-h-[90vh]">
				<DialogHeader>
					<DialogTitle>Preview de Tokenización</DialogTitle>
					<DialogDescription>
						Revisa y edita los datos que se usarán para crear el token
					</DialogDescription>
				</DialogHeader>

			{isError ? (
				<div className="flex flex-col items-center justify-center p-8 space-y-4">
					<p className="text-red-600">Error al cargar datos de preview:</p>
					<p className="text-sm text-gray-600">
						{error?.response?.data?.message || error?.message || "Error desconocido"}
					</p>
					<Button onClick={() => onOpenChange(false)}>Cerrar</Button>
				</div>
			) : !previewData ? (
				<div className="flex items-center justify-center p-8">
					<Loader2 className="h-8 w-8 animate-spin" />
					<span className="ml-2">Cargando datos...</span>
				</div>
			) : (
				<>
				<ScrollArea className="max-h-[calc(90vh-200px)] pr-4">
					<div className="space-y-6">
						{/* Sección 1: Información de Operación */}
						<Card>
							<CardHeader>
								<CardTitle className="text-lg flex items-center gap-2">
									<Building2 className="h-5 w-5" />
									Información de Operación
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid grid-cols-2 gap-4">
									<div>
										<Label>Número de Operación</Label>
										<p className="font-medium">
											{previewData.operation.operationNumber}
										</p>
									</div>
									{previewData.operation.titleNumber && (
										<div>
											<Label>Número de Título</Label>
											<p className="font-medium">
												{previewData.operation.titleNumber}
											</p>
										</div>
									)}
								</div>

								<div className="grid grid-cols-3 gap-4">
									<div>
										<Label className="flex items-center gap-2">
											<Building2 className="h-4 w-4" />
											Warrantera
										</Label>
										<p className="text-sm">
											{previewData.operation.warrant.name}
										</p>
									</div>
									<div>
										<Label className="flex items-center gap-2">
											<Users className="h-4 w-4" />
											Cliente
										</Label>
										<p className="text-sm">
											{previewData.operation.client.name}
										</p>
									</div>
									<div>
										<Label className="flex items-center gap-2">
											<Landmark className="h-4 w-4" />
											Entidad Financiera
										</Label>
										<p className="text-sm">
											{previewData.operation.safi.name}
										</p>
									</div>
								</div>

								<div>
									<Label htmlFor="description">
										Descripción de la Operación
									</Label>
									<Textarea
										id="description"
										value={description}
										onChange={(e) => setDescription(e.target.value)}
										placeholder="Descripción de la operación..."
										className="mt-1"
										rows={3}
									/>
								</div>
							</CardContent>
						</Card>

						{/* Sección 2: Información de Activos */}
						<Card>
							<CardHeader>
								<CardTitle className="text-lg">Activos</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-2">
									{previewData.assets.map((asset) => (
										<div
											key={asset.id}
											className="flex items-center justify-between p-2 border rounded"
										>
											<div>
												<p className="font-medium">{asset.vinSerial}</p>
												<p className="text-sm text-muted-foreground">
													${asset.value.toLocaleString()} - {asset.status}
												</p>
											</div>
										</div>
									))}
								</div>
							</CardContent>
						</Card>

						{/* Sección 3: Documentos */}
						<Card>
							<CardHeader>
								<CardTitle className="text-lg flex items-center gap-2">
									<FileText className="h-5 w-5" />
									Documentos
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-3 gap-4">
									<div>
										<Label>CD</Label>
										<div className="space-y-1">
											<p className="text-sm font-medium">
												No. {previewData.documents.cd.documentNumber || "N/A"}
											</p>
											<Badge
												variant={
													previewData.documents.cd.signedByWarehouse &&
													previewData.documents.cd.signedByClient
														? "default"
														: "secondary"
												}
											>
												{previewData.documents.cd.signedByWarehouse &&
												previewData.documents.cd.signedByClient
													? "Firmado"
													: "Pendiente"}
											</Badge>
										</div>
									</div>
									<div>
										<Label>BP</Label>
										<div className="space-y-1">
											<p className="text-sm font-medium">
												No. {previewData.documents.bp.documentNumber || "N/A"}
											</p>
											<Badge
												variant={
													previewData.documents.bp.signedByWarehouse &&
													previewData.documents.bp.signedByClient
														? "default"
														: "secondary"
												}
											>
												{previewData.documents.bp.signedByWarehouse &&
												previewData.documents.bp.signedByClient
													? "Firmado"
													: "Pendiente"}
											</Badge>
										</div>
									</div>
									{previewData.documents.pagare && (
										<div>
											<Label>Pagaré</Label>
											<div className="space-y-1">
												<p className="text-sm font-medium">
													No.{" "}
													{previewData.documents.pagare.documentNumber || "N/A"}
												</p>
												<Badge
													variant={
														previewData.documents.pagare.signedByClient &&
														previewData.documents.pagare.signedByBank
															? "default"
															: "secondary"
													}
												>
													{previewData.documents.pagare.signedByClient &&
													previewData.documents.pagare.signedByBank
														? "Firmado"
														: "Pendiente"}
												</Badge>
											</div>
										</div>
									)}
								</div>
							</CardContent>
						</Card>

						{/* Sección 4: Datos de Financiamiento */}
						<Card>
							<CardHeader>
								<CardTitle className="text-lg flex items-center gap-2">
									<Coins className="h-5 w-5" />
									Datos de Financiamiento
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div>
									<Label htmlFor="annualRate">
										Tasa Anual (%)
										{isFromPagare("rate") && (
											<Badge variant="outline" className="ml-2">
												Del Pagaré
											</Badge>
										)}
									</Label>
									<Input
										id="annualRate"
										type="number"
										step="0.01"
										value={annualRate !== undefined ? annualRate : ""}
										onChange={(e) =>
											setAnnualRate(
												e.target.value ? parseFloat(e.target.value) : undefined
											)
										}
										placeholder="Ej: 12.5"
										className="mt-1"
									/>
								</div>

								<div>
									<Label htmlFor="principalAmount">
										Monto Principal
										{isFromPagare("principal") && (
											<Badge variant="outline" className="ml-2">
												Del Pagaré
											</Badge>
										)}
									</Label>
									<Input
										id="principalAmount"
										type="number"
										step="0.01"
										value={principalAmount !== undefined ? principalAmount : ""}
										onChange={(e) =>
											setPrincipalAmount(
												e.target.value ? parseFloat(e.target.value) : undefined
											)
										}
										placeholder="Ej: 100000"
										className="mt-1"
									/>
								</div>

								<div>
									<Label htmlFor="maturityDate">
										Fecha de Vencimiento
										{isFromPagare("maturity") && (
											<Badge variant="outline" className="ml-2">
												Del Pagaré
											</Badge>
										)}
									</Label>
									<Input
										id="maturityDate"
										type="date"
										value={maturityDate}
										onChange={(e) => setMaturityDate(e.target.value)}
										className="mt-1"
									/>
								</div>
							</CardContent>
						</Card>

						{/* Sección 5: Preview del Token */}
						<Card>
							<CardHeader>
								<CardTitle className="text-lg">Preview del Token</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div>
									<Label>Ticker</Label>
									<p className="font-mono text-sm">{previewData.tokenPreview.ticker}</p>
								</div>
								<div>
									<Label>Nombre</Label>
									<p className="font-medium">{previewData.tokenPreview.name}</p>
								</div>
								<div>
									<Label>Descripción</Label>
									<p className="text-sm text-muted-foreground">
										{description || previewData.tokenPreview.description || "Sin descripción"}
									</p>
								</div>
								<div>
									<Label>URIs de Documentos</Label>
									<div className="space-y-1 mt-1">
										{previewData.tokenPreview.uris.map((uri, index) => (
											<div key={index} className="text-sm">
												<Badge variant="outline">{uri.title}</Badge>
											</div>
										))}
									</div>
								</div>
							</CardContent>
					</Card>
				</div>
			</ScrollArea>

			<Separator />

			<DialogFooter>
				<Button
					variant="outline"
					onClick={() => onOpenChange(false)}
					disabled={isTokenizing}
				>
					Cancelar
				</Button>
				<Button onClick={handleTokenize} disabled={isTokenizing}>
					{isTokenizing && (
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
					)}
					<Coins className="mr-2 h-4 w-4" />
					Tokenizar con estos Datos
				</Button>
			</DialogFooter>
			</>
			)}
		</DialogContent>
	</Dialog>
	);
}


