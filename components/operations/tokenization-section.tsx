"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { operationsApi } from "@/lib/api/operations";
import { tokensApi } from "@/lib/api/tokens";
import {
	VerifyTokenizationResponse,
	TokenizationData,
} from "@/types/operation";
import { TokenizationPreviewDialog } from "./tokenization-preview-dialog";
import { toast } from "sonner";
import {
	Coins,
	CheckCircle,
	XCircle,
	Loader2,
	AlertCircle,
	ExternalLink,
	Wallet,
	FileText,
	Copy,
	Info,
	Download,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { documentsApi } from "@/lib/api/documents";

interface TokenizationSectionProps {
	operationId: number;
}

export function TokenizationSection({ operationId }: TokenizationSectionProps) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [verificationResult, setVerificationResult] =
		useState<VerifyTokenizationResponse | null>(null);
	const [showPreviewDialog, setShowPreviewDialog] = useState(false);

	const { data: operation, isLoading: isLoadingOperation } = useQuery({
		queryKey: ["operations", operationId],
		queryFn: () => operationsApi.getById(operationId),
		enabled: !!operationId,
	});

	const verifyMutation = useMutation({
		mutationFn: () => operationsApi.verifyReadyForTokenization(operationId),
		onSuccess: (data) => {
			setVerificationResult(data);
			if (data.ready) {
				toast.success("Operación lista para tokenización");
			} else {
				toast.warning(
					"La operación aún no está lista para tokenización"
				);
			}
		},
		onError: (error: any) => {
			toast.error(
				error.response?.data?.message ||
					"Error al verificar la operación"
			);
		},
	});

	const { data: previewData, isError: previewError, error: previewErrorData } = useQuery({
		queryKey: ["operations", operationId, "tokenization-preview"],
		queryFn: () => operationsApi.getTokenizationPreview(operationId),
		enabled: showPreviewDialog && !!operationId,
		retry: 1,
	});

	const tokenizeMutation = useMutation({
		mutationFn: (data?: TokenizationData) =>
			operationsApi.tokenizeBundle(operationId, data),
		onSuccess: (data) => {
			toast.success("Bundle tokenizado exitosamente");
			setShowPreviewDialog(false);
			queryClient.invalidateQueries({
				queryKey: ["operations", operationId],
			});
			queryClient.invalidateQueries({ queryKey: ["tokens"] });
			if (data?.tokenId) {
				router.push(`/dashboard/tokens/${data.tokenId}`);
			}
		},
		onError: (error: any) => {
			toast.error(
				error.response?.data?.message || "Error al tokenizar el bundle"
			);
		},
	});

	const handleVerify = () => {
		verifyMutation.mutate();
	};

	const handleTokenize = () => {
		if (!verificationResult?.ready) {
			toast.error("La operación no está lista para tokenización");
			return;
		}

		setShowPreviewDialog(true);
	};

	const handleTokenizeWithData = (data: TokenizationData) => {
		tokenizeMutation.mutate(data);
	};

	const { data: operationStatus } = useQuery({
		queryKey: ["operations", operationId, "status"],
		queryFn: () => operationsApi.getOperationStatus(operationId),
		enabled: !!operationId,
	});

	const bundle =
		operationStatus?.bundle || (operation as any)?.documentBundle;

	const isTokenized =
		operation?.status === "TOKENIZED" ||
		operation?.status === "ACTIVE" ||
		operation?.status === "LIQUIDATED" ||
		operation?.status === "RELEASED";

	// Obtener detalles del token si está tokenizado
	const { data: tokenDetails, isLoading: isLoadingTokenDetails } = useQuery({
		queryKey: ["tokens", "operation", operationId],
		queryFn: () => tokensApi.getByOperation(operationId),
		enabled: isTokenized && !!operationId,
	});

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center justify-between">
					<span>Tokenización</span>
					{isTokenized && (
						<Badge variant="default" className="bg-green-500">
							<CheckCircle className="h-3 w-3 mr-1" />
							Tokenizado
						</Badge>
					)}
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{isLoadingOperation ? (
					<div className="text-center py-4">
						<Loader2 className="h-6 w-6 mx-auto animate-spin text-muted-foreground" />
					</div>
				) : isTokenized ? (
					<div className="space-y-4">
						<Alert className="bg-green-50 border-green-200">
							<CheckCircle className="h-4 w-4 text-green-600" />
							<AlertDescription className="text-green-800">
								Esta operación ya ha sido tokenizada. El token
								está en posesión de{" "}
								{tokenDetails?.currentHolder.organization ||
									"Entidad Financiera"}
								.
							</AlertDescription>
						</Alert>

						{isLoadingTokenDetails ? (
							<div className="text-center py-4">
								<Loader2 className="h-6 w-6 mx-auto animate-spin text-muted-foreground" />
							</div>
						) : tokenDetails ? (
							<>
								{/* Detalles del Token */}
								<Card>
									<CardHeader>
										<CardTitle className="flex items-center gap-2">
											<Coins className="h-5 w-5" />
											Detalles del Token
										</CardTitle>
									</CardHeader>
									<CardContent className="space-y-4">
										{tokenDetails.metadata && (
											<div className="space-y-3">
												<div>
													<p className="text-sm font-medium mb-1">
														Ticker
													</p>
													<p className="font-mono text-sm">
														{tokenDetails.metadata
															.ticker || "N/A"}
													</p>
												</div>
												<div>
													<p className="text-sm font-medium mb-1">
														Nombre
													</p>
													<p className="text-sm">
														{tokenDetails.metadata
															.name || "N/A"}
													</p>
												</div>
												{tokenDetails.metadata
													.description && (
													<div>
														<p className="text-sm font-medium mb-1">
															Descripción
														</p>
														<p className="text-sm text-muted-foreground">
															{
																tokenDetails
																	.metadata
																	.description
															}
														</p>
													</div>
												)}
												<div className="grid grid-cols-2 gap-4">
													<div>
														<p className="text-sm font-medium mb-1">
															Balance
														</p>
														<p className="text-sm">
															{tokenDetails.balance ||
																"0"}
														</p>
													</div>
													<div>
														<p className="text-sm font-medium mb-1">
															Estado
														</p>
														<Badge>
															{
																tokenDetails
																	.token
																	.status
															}
														</Badge>
													</div>
												</div>
												{tokenDetails.metadata
													.additionalInfo && (
													<div className="border-t pt-4 space-y-2">
														<p className="text-sm font-medium mb-2">
															Información
															Adicional
														</p>
														<div className="grid grid-cols-2 gap-3 text-sm">
															{tokenDetails
																.metadata
																.additionalInfo
																.opNo && (
																<div>
																	<p className="text-muted-foreground">
																		Número
																		de
																		Operación
																	</p>
																	<p className="font-medium">
																		{
																			tokenDetails
																				.metadata
																				.additionalInfo
																				.opNo
																		}
																	</p>
																</div>
															)}
															{tokenDetails
																.metadata
																.additionalInfo
																.val && (
																<div>
																	<p className="text-muted-foreground">
																		Valor
																		Total
																	</p>
																	<p className="font-medium">
																		$
																		{Number(
																			tokenDetails
																				.metadata
																				.additionalInfo
																				.val
																		).toLocaleString()}
																	</p>
																</div>
															)}
															{tokenDetails
																.metadata
																.additionalInfo
																.financed && (
																<div>
																	<p className="text-muted-foreground">
																		Monto
																		Financiado
																	</p>
																	<p className="font-medium">
																		$
																		{Number(
																			tokenDetails
																				.metadata
																				.additionalInfo
																				.financed
																		).toLocaleString()}
																	</p>
																</div>
															)}
															{tokenDetails
																.metadata
																.additionalInfo
																.rate && (
																<div>
																	<p className="text-muted-foreground">
																		Tasa
																		Anual
																	</p>
																	<p className="font-medium">
																		{
																			tokenDetails
																				.metadata
																				.additionalInfo
																				.rate
																		}
																		%
																	</p>
																</div>
															)}
															{tokenDetails
																.metadata
																.additionalInfo
																.maturity && (
																<div>
																	<p className="text-muted-foreground">
																		Fecha de
																		Vencimiento
																	</p>
																	<p className="font-medium">
																		{new Date(
																			tokenDetails.metadata.additionalInfo.maturity
																		).toLocaleDateString(
																			"es-BO"
																		)}
																	</p>
																</div>
															)}
															{tokenDetails
																.metadata
																.additionalInfo
																.wh && (
																<div>
																	<p className="text-muted-foreground">
																		Warrantera
																	</p>
																	<p className="font-medium">
																		{
																			tokenDetails
																				.metadata
																				.additionalInfo
																				.wh
																		}
																	</p>
																</div>
															)}
															{tokenDetails
																.metadata
																.additionalInfo
																.cli && (
																<div>
																	<p className="text-muted-foreground">
																		Cliente
																	</p>
																	<p className="font-medium">
																		{
																			tokenDetails
																				.metadata
																				.additionalInfo
																				.cli
																		}
																	</p>
																</div>
															)}
															{tokenDetails
																.metadata
																.additionalInfo
																.bank && (
																<div>
																	<p className="text-muted-foreground">
																		Entidad
																		Financiera
																	</p>
																	<p className="font-medium">
																		{
																			tokenDetails
																				.metadata
																				.additionalInfo
																				.bank
																		}
																	</p>
																</div>
															)}
														</div>
													</div>
												)}
												<div className="border-t pt-4">
													<p className="text-sm font-medium mb-2">
														Documentos
													</p>
													<div className="space-y-3">
														{/* CD Document */}
														{tokenDetails.token
															.cdDocumentId && (
															<div className="flex items-center justify-between p-3 border rounded-lg">
																<div className="flex items-center gap-3">
																	<FileText className="h-5 w-5 text-blue-500" />
																	<div>
																		<p className="text-sm font-medium">
																			CD -
																			Certificado
																			de
																			Depósito
																		</p>
																		{tokenDetails
																			.metadata
																			.additionalInfo
																			?.cdNo && (
																			<p className="text-xs text-muted-foreground">
																				No.{" "}
																				{
																					tokenDetails
																						.metadata
																						.additionalInfo
																						.cdNo
																				}
																			</p>
																		)}
																	</div>
																</div>
																<Button
																	variant="outline"
																	size="sm"
																	onClick={async () => {
																		try {
																			const blob =
																				await documentsApi.downloadPDF(
																					tokenDetails
																						.token
																						.cdDocumentId
																				);
																			const url =
																				window.URL.createObjectURL(
																					blob
																				);
																			const a =
																				window.document.createElement(
																					"a"
																				);
																			a.href =
																				url;
																			a.download = `CD-${tokenDetails.token.cdDocumentId}.pdf`;
																			window.document.body.appendChild(
																				a
																			);
																			a.click();
																			window.URL.revokeObjectURL(
																				url
																			);
																			window.document.body.removeChild(
																				a
																			);
																			toast.success(
																				"CD descargado exitosamente"
																			);
																		} catch (error: any) {
																			toast.error(
																				"Error al descargar el CD"
																			);
																		}
																	}}
																>
																	<Download className="h-4 w-4 mr-2" />
																	Descargar
																</Button>
															</div>
														)}

														{/* BP Document */}
														{tokenDetails.token
															.bpDocumentId && (
															<div className="flex items-center justify-between p-3 border rounded-lg">
																<div className="flex items-center gap-3">
																	<FileText className="h-5 w-5 text-green-500" />
																	<div>
																		<p className="text-sm font-medium">
																			BP -
																			Bono
																			de
																			Prenda
																		</p>
																		{tokenDetails
																			.metadata
																			.additionalInfo
																			?.bpNo && (
																			<p className="text-xs text-muted-foreground">
																				No.{" "}
																				{
																					tokenDetails
																						.metadata
																						.additionalInfo
																						.bpNo
																				}
																			</p>
																		)}
																	</div>
																</div>
																<Button
																	variant="outline"
																	size="sm"
																	onClick={async () => {
																		try {
																			const blob =
																				await documentsApi.downloadPDF(
																					tokenDetails
																						.token
																						.bpDocumentId
																				);
																			const url =
																				window.URL.createObjectURL(
																					blob
																				);
																			const a =
																				window.document.createElement(
																					"a"
																				);
																			a.href =
																				url;
																			a.download = `BP-${tokenDetails.token.bpDocumentId}.pdf`;
																			window.document.body.appendChild(
																				a
																			);
																			a.click();
																			window.URL.revokeObjectURL(
																				url
																			);
																			window.document.body.removeChild(
																				a
																			);
																			toast.success(
																				"BP descargado exitosamente"
																			);
																		} catch (error: any) {
																			toast.error(
																				"Error al descargar el BP"
																			);
																		}
																	}}
																>
																	<Download className="h-4 w-4 mr-2" />
																	Descargar
																</Button>
															</div>
														)}

														{/* Pagaré Document */}
														{tokenDetails.token
															.pagareDocumentId && (
															<div className="flex items-center justify-between p-3 border rounded-lg">
																<div className="flex items-center gap-3">
																	<FileText className="h-5 w-5 text-purple-500" />
																	<div>
																		<p className="text-sm font-medium">
																			Pagaré
																		</p>
																		{tokenDetails
																			.metadata
																			.additionalInfo
																			?.pagNo && (
																			<p className="text-xs text-muted-foreground">
																				No.{" "}
																				{
																					tokenDetails
																						.metadata
																						.additionalInfo
																						.pagNo
																				}
																			</p>
																		)}
																	</div>
																</div>
																<Button
																	variant="outline"
																	size="sm"
																	onClick={async () => {
																		try {
																			const blob =
																				await documentsApi.downloadPDF(
																					tokenDetails
																						.token
																						.pagareDocumentId
																				);
																			const url =
																				window.URL.createObjectURL(
																					blob
																				);
																			const a =
																				window.document.createElement(
																					"a"
																				);
																			a.href =
																				url;
																			a.download = `Pagare-${tokenDetails.token.pagareDocumentId}.pdf`;
																			window.document.body.appendChild(
																				a
																			);
																			a.click();
																			window.URL.revokeObjectURL(
																				url
																			);
																			window.document.body.removeChild(
																				a
																			);
																			toast.success(
																				"Pagaré descargado exitosamente"
																			);
																		} catch (error: any) {
																			toast.error(
																				"Error al descargar el Pagaré"
																			);
																		}
																	}}
																>
																	<Download className="h-4 w-4 mr-2" />
																	Descargar
																</Button>
															</div>
														)}
													</div>
												</div>
											</div>
										)}
										<div className="border-t pt-4 space-y-2">
											<div>
												<p className="text-sm font-medium mb-1">
													Token ID (XRPL)
												</p>
												<div className="flex items-center gap-2">
													<code className="flex-1 bg-muted px-3 py-2 rounded text-xs break-all">
														{
															tokenDetails.token
																.xrplTokenId
														}
													</code>
													<Button
														variant="ghost"
														size="icon"
														onClick={() => {
															navigator.clipboard.writeText(
																tokenDetails
																	.token
																	.xrplTokenId
															);
															toast.success(
																"Token ID copiado"
															);
														}}
													>
														<Copy className="h-4 w-4" />
													</Button>
												</div>
											</div>
											<div>
												<p className="text-sm font-medium mb-1">
													Issuance ID (XRPL)
												</p>
												<div className="flex items-center gap-2">
													<code className="flex-1 bg-muted px-3 py-2 rounded text-xs break-all">
														{
															tokenDetails.token
																.xrplIssuanceId
														}
													</code>
													<Button
														variant="ghost"
														size="icon"
														onClick={() => {
															navigator.clipboard.writeText(
																tokenDetails
																	.token
																	.xrplIssuanceId
															);
															toast.success(
																"Issuance ID copiado"
															);
														}}
													>
														<Copy className="h-4 w-4" />
													</Button>
												</div>
											</div>
											<div className="grid grid-cols-2 gap-4 text-sm">
												<div>
													<p className="text-muted-foreground">
														Poseedor Actual
													</p>
													<p className="font-medium">
														{
															tokenDetails
																.currentHolder
																.organization
														}
													</p>
													<code className="text-xs text-muted-foreground">
														{tokenDetails.currentHolder.address.substring(
															0,
															20
														)}
														...
													</code>
												</div>
												<div>
													<p className="text-muted-foreground">
														Emisor
													</p>
													<p className="font-medium">
														{
															tokenDetails.issuer
																.organization
														}
													</p>
													<code className="text-xs text-muted-foreground">
														{tokenDetails.issuer.address.substring(
															0,
															20
														)}
														...
													</code>
												</div>
											</div>
										</div>
									</CardContent>
								</Card>

								{bundle && (
									<Card>
										<CardHeader>
											<CardTitle>
												Información del Bundle
											</CardTitle>
										</CardHeader>
										<CardContent className="space-y-4">
											{bundle.merkleRoot && (
												<div>
													<p className="text-sm font-medium mb-2">
														Merkle Root:
													</p>
													<div className="flex items-center gap-2">
														<code className="flex-1 bg-muted px-3 py-2 rounded text-xs break-all">
															{bundle.merkleRoot}
														</code>
														<Button
															variant="ghost"
															size="icon"
															onClick={() => {
																navigator.clipboard.writeText(
																	bundle.merkleRoot
																);
																toast.success(
																	"Merkle Root copiado"
																);
															}}
														>
															<Copy className="h-4 w-4" />
														</Button>
													</div>
												</div>
											)}

											<div className="grid grid-cols-3 gap-4 text-sm">
												<div>
													<p className="text-muted-foreground">
														CD Hash
													</p>
													<code className="text-xs break-all">
														{bundle.cdHash?.substring(
															0,
															16
														)}
														...
													</code>
												</div>
												<div>
													<p className="text-muted-foreground">
														BP Hash
													</p>
													<code className="text-xs break-all">
														{bundle.bpHash?.substring(
															0,
															16
														)}
														...
													</code>
												</div>
												<div>
													<p className="text-muted-foreground">
														Pagaré Hash
													</p>
													<code className="text-xs break-all">
														{bundle.pagareHash?.substring(
															0,
															16
														)}
														...
													</code>
												</div>
											</div>

											{bundle.bundleTokenizedAt && (
												<div>
													<p className="text-sm text-muted-foreground">
														Tokenizado el:{" "}
														{new Date(
															bundle.bundleTokenizedAt
														).toLocaleString(
															"es-BO"
														)}
													</p>
												</div>
											)}
										</CardContent>
									</Card>
								)}
							</>
						) : (
							<Alert>
								<AlertCircle className="h-4 w-4" />
								<AlertDescription>
									No se pudieron cargar los detalles del
									token.
								</AlertDescription>
							</Alert>
						)}
					</div>
				) : (
					<>
						<div className="flex gap-2">
							<Button
								variant="outline"
								onClick={handleVerify}
								disabled={verifyMutation.isPending}
							>
								{verifyMutation.isPending && (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								)}
								<CheckCircle className="mr-2 h-4 w-4" />
								Verificar Estado
							</Button>
						</div>

						{verificationResult && (
							<div className="space-y-4">
								{verificationResult.ready ? (
									<Alert className="bg-green-50 border-green-200">
										<CheckCircle className="h-4 w-4 text-green-600" />
										<AlertDescription className="text-green-800">
											<div className="font-medium mb-2">
												La operación está lista para
												tokenización
											</div>
											<ul className="list-disc list-inside space-y-1 text-sm">
												<li>
													Todos los documentos están
													subidos: ✓
												</li>
												<li>
													Todos los documentos están
													firmados: ✓
												</li>
											</ul>
										</AlertDescription>
									</Alert>
								) : (
									<Alert>
										<XCircle className="h-4 w-4" />
										<AlertDescription>
											<div className="font-medium mb-2">
												La operación no está lista para
												tokenización
											</div>
											{!verificationResult.allDocumentsUploaded && (
												<div className="mb-2">
													<div className="font-medium text-sm">
														Documentos faltantes:
													</div>
													<ul className="list-disc list-inside space-y-1 text-sm">
														{verificationResult.missingDocuments.map(
															(doc) => (
																<li key={doc}>
																	{doc}
																</li>
															)
														)}
													</ul>
												</div>
											)}
											{!verificationResult.allDocumentsSigned && (
												<div>
													<div className="font-medium text-sm">
														Firmas faltantes:
													</div>
													<ul className="list-disc list-inside space-y-1 text-sm">
														{verificationResult.missingSignatures.map(
															(sig) => (
																<li key={sig}>
																	{sig}
																</li>
															)
														)}
													</ul>
												</div>
											)}
										</AlertDescription>
									</Alert>
								)}

								{verificationResult.ready && (
									<Button
										onClick={handleTokenize}
										disabled={tokenizeMutation.isPending}
										className="w-full"
									>
										{tokenizeMutation.isPending && (
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										)}
										<Coins className="mr-2 h-4 w-4" />
										Tokenizar Bundle
									</Button>
								)}
							</div>
						)}

						{!verificationResult && (
							<Alert>
								<AlertCircle className="h-4 w-4" />
								<AlertDescription>
									Haga clic en "Verificar Estado" para
									comprobar si la operación está lista para
									tokenización.
								</AlertDescription>
							</Alert>
						)}
					</>
				)}

				<TokenizationPreviewDialog
					open={showPreviewDialog}
					onOpenChange={setShowPreviewDialog}
					operationId={operationId}
					previewData={previewData || null}
					onTokenize={handleTokenizeWithData}
					isTokenizing={tokenizeMutation.isPending}
					isError={previewError}
					error={previewErrorData}
				/>
			</CardContent>
		</Card>
	);
}
