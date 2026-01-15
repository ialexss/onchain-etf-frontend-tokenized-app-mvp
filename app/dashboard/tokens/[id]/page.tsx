"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { tokensApi } from "@/lib/api/tokens";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, History, FileText, User, Building2 } from "lucide-react";
import Link from "next/link";
import { BackButton } from "@/components/ui/back-button";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Document, DocumentType } from "@/types/document";
import { operationsApi } from "@/lib/api/operations";
import { Briefcase } from "lucide-react";

export default function TokenDetailPage() {
	const params = useParams();
	const tokenId = Number(params.id);

	const { data: token, isLoading } = useQuery({
		queryKey: ["token", tokenId],
		queryFn: () => tokensApi.getById(tokenId),
		enabled: !!tokenId,
	});

	const { data: status } = useQuery({
		queryKey: ["token-status", tokenId],
		queryFn: () => tokensApi.getStatus(tokenId),
		enabled: !!tokenId,
	});

	// Obtener operación asociada (usar operationId del token si está disponible)
	const { data: operation } = useQuery({
		queryKey: ["operation-by-token", token?.operationId],
		queryFn: async () => {
			if (token?.operationId) {
				return operationsApi.getById(token.operationId);
			}
			// Fallback: buscar por assetId si no hay operationId
			if (token?.assetId) {
				const allOperations = await operationsApi.getAll();
				const operationWithAsset = allOperations.find((op: any) =>
					op.assets?.some((asset: any) => asset.id === token.assetId)
				);
				return operationWithAsset || null;
			}
			return null;
		},
		enabled: !!token,
	});

	// Obtener todos los activos asociados al token (a través de operationId)
	const { data: operationAssets } = useQuery({
		queryKey: ["operation-assets", operation?.id],
		queryFn: async () => {
			if (!operation?.id) return [];
			const op = await operationsApi.getById(operation.id);
			return op.assets || [];
		},
		enabled: !!operation?.id,
	});

	if (isLoading) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-12 w-full" />
				<Skeleton className="h-64 w-full" />
			</div>
		);
	}

	if (!token) {
		return (
			<div className="flex flex-col items-center justify-center h-64">
				<p className="text-slate-500 mb-4">Token no encontrado</p>
				<BackButton variant="outline" size="default" showIcon={true}>
					Volver a Tokens
				</BackButton>
			</div>
		);
	}

	const getStatusBadge = (status: string) => {
		const variants: Record<
			string,
			"default" | "secondary" | "destructive" | "outline"
		> = {
			MINTED: "default",
			TRANSFERRED: "secondary",
			BURNED: "destructive",
		};
		return (
			<Badge variant={variants[status] || "secondary"}>{status}</Badge>
		);
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<BackButton />
				<div>
					<h2 className="text-3xl font-bold">Detalle del Token</h2>
					<p className="text-slate-500 dark:text-slate-400">
						Token ID: {token.id}
					</p>
				</div>
			</div>

			{/* Operación Asociada */}
			{operation && (
				<Card className="bg-primary/5 border-primary/20">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Briefcase className="h-5 w-5" />
							Operación Asociada
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex items-center justify-between">
							<div>
								<p className="font-medium">
									{operation.operationNumber ||
										`OP-${operation.id}`}
								</p>
								<p className="text-sm text-muted-foreground">
									{operation.warrant?.name} →{" "}
									{operation.client?.name} →{" "}
									{operation.safi?.name}
								</p>
							</div>
							<Link
								href={`/dashboard/operations/${operation.id}`}
							>
								<Button variant="outline">Ver Operación</Button>
							</Link>
						</div>
					</CardContent>
				</Card>
			)}

			<div className="grid gap-6 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Información del Token</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div>
							<p className="text-sm font-medium text-slate-500">
								Cantidad
							</p>
							<p className="text-2xl font-bold">{token.amount}</p>
						</div>
						<div>
							<p className="text-sm font-medium text-slate-500">
								Estado
							</p>
							{getStatusBadge(token.status)}
						</div>
						{token.operationId && (
							<div>
								<p className="text-sm font-medium text-slate-500">
									Operación
								</p>
								<p className="font-medium">
									{operation?.operationNumber ||
										`OP-${token.operationId}`}
								</p>
							</div>
						)}
						{token.assets && token.assets.length > 0 ? (
							<div>
								<p className="text-sm font-medium text-slate-500">
									Activos Representados ({token.assets.length}
									)
								</p>
								<div className="space-y-2 mt-2">
									{token.assets.map((asset) => (
										<div
											key={asset.id}
											className="flex items-center justify-between p-2 border rounded"
										>
											<span className="font-medium">
												{asset.vinSerial}
											</span>
											<Link
												href={`/dashboard/assets/${asset.id}`}
											>
												<Button
													variant="ghost"
													size="sm"
												>
													Ver
												</Button>
											</Link>
										</div>
									))}
								</div>
							</div>
						) : operationAssets && operationAssets.length > 0 ? (
							<div>
								<p className="text-sm font-medium text-slate-500">
									Activos Representados (
									{operationAssets.length})
								</p>
								<div className="space-y-2 mt-2">
									{operationAssets.map((asset: any) => (
										<div
											key={asset.id}
											className="flex items-center justify-between p-2 border rounded"
										>
											<span className="font-medium">
												{asset.vinSerial}
											</span>
											<Link
												href={`/dashboard/assets/${asset.id}`}
											>
												<Button
													variant="ghost"
													size="sm"
												>
													Ver
												</Button>
											</Link>
										</div>
									))}
								</div>
							</div>
						) : token.asset ? (
							<div>
								<p className="text-sm font-medium text-slate-500">
									Activo Representado
								</p>
								<div className="flex items-center gap-2">
									<p className="font-medium">
										{token.asset.vinSerial || "-"}
									</p>
									{token.asset.id && (
										<Link
											href={`/dashboard/assets/${token.asset.id}`}
										>
											<Button variant="ghost" size="sm">
												Ver Activo
											</Button>
										</Link>
									)}
								</div>
							</div>
						) : null}
						{token.metadataHash && (
							<div>
								<p className="text-sm font-medium text-slate-500">
									Hash de Metadata
								</p>
								<code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded block break-all">
									{token.metadataHash.substring(0, 32)}...
								</code>
							</div>
						)}
						{token.burnedAt && (
							<div>
								<p className="text-sm font-medium text-slate-500">
									Fecha de Quemado
								</p>
								<p>
									{format(new Date(token.burnedAt), "PPP p", {
										locale: es,
									})}
								</p>
							</div>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Información Blockchain</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div>
							<p className="text-sm font-medium text-slate-500">
								MPTokenIssuanceID
							</p>
							<div className="flex items-center gap-2">
								<code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded flex-1">
									{token.xrplIssuanceId}
								</code>
								<a
									href={`https://testnet.xrpl.org/mpt/${token.xrplIssuanceId}`}
									target="_blank"
									rel="noopener noreferrer"
								>
									<Button variant="ghost" size="sm">
										<ExternalLink className="h-4 w-4" />
									</Button>
								</a>
							</div>
						</div>
						<div>
							<p className="text-sm font-medium text-slate-500">
								TokenID
							</p>
							<div className="flex items-center gap-2">
								<code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded flex-1">
									{token.xrplTokenId}
								</code>
								<a
									href={`https://testnet.xrpl.org/mpt/${token.xrplTokenId}`}
									target="_blank"
									rel="noopener noreferrer"
								>
									<Button variant="ghost" size="sm">
										<ExternalLink className="h-4 w-4" />
									</Button>
								</a>
							</div>
						</div>
						<div>
							<p className="text-sm font-medium text-slate-500">
								En Posesión de
							</p>
							<div className="space-y-2">
								<div>
									<p className="font-medium flex items-center gap-2">
										<User className="h-4 w-4" />
										{token.currentHolderWallet?.organization
											?.name ||
											(token.currentHolderWallet
												?.organizationId
												? "Cargando..."
												: "N/A")}
									</p>
									{token.currentHolderWallet?.organization
										?.type && (
										<Badge
											variant="outline"
											className="text-xs mt-1"
										>
											{
												token.currentHolderWallet
													.organization.type
											}
										</Badge>
									)}
								</div>
								<div className="flex items-center gap-2">
									<code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded flex-1">
										{token.currentHolderWallet
											?.publicAddress || "-"}
									</code>
									{token.currentHolderWallet
										?.publicAddress && (
										<a
											href={`https://testnet.xrpl.org/accounts/${token.currentHolderWallet.publicAddress}`}
											target="_blank"
											rel="noopener noreferrer"
										>
											<Button variant="ghost" size="sm">
												<ExternalLink className="h-4 w-4" />
											</Button>
										</a>
									)}
								</div>
							</div>
						</div>
						<div>
							<p className="text-sm font-medium text-slate-500">
								Emitido por
							</p>
							<div className="space-y-2">
								<div>
									<p className="font-medium flex items-center gap-2">
										<Building2 className="h-4 w-4" />
										{token.issuerWallet?.organization
											?.name ||
											(token.issuerWallet?.organizationId
												? "Cargando..."
												: "N/A")}
									</p>
									{token.issuerWallet?.organization?.type && (
										<Badge
											variant="outline"
											className="text-xs mt-1"
										>
											{
												token.issuerWallet.organization
													.type
											}
										</Badge>
									)}
								</div>
								<div className="flex items-center gap-2">
									<code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded flex-1">
										{token.issuerWallet?.publicAddress ||
											"-"}
									</code>
									{token.issuerWallet?.publicAddress && (
										<a
											href={`https://testnet.xrpl.org/accounts/${token.issuerWallet.publicAddress}`}
											target="_blank"
											rel="noopener noreferrer"
										>
											<Button variant="ghost" size="sm">
												<ExternalLink className="h-4 w-4" />
											</Button>
										</a>
									)}
								</div>
							</div>
						</div>
						{status && (
							<div>
								<p className="text-sm font-medium text-slate-500">
									Balance en Blockchain
								</p>
								<p className="text-lg font-semibold">
									{status.balance}
								</p>
							</div>
						)}
						<Link href={`/dashboard/tokens/${tokenId}/history`}>
							<Button variant="outline" className="w-full">
								<History className="mr-2 h-4 w-4" />
								Ver Historial Completo
							</Button>
						</Link>
					</CardContent>
				</Card>
			</div>

			{/* Documentos del Bundle (CD, BP, Pagaré) */}
			{(token.cdDocumentUrl ||
				token.bpDocumentUrl ||
				token.pagareDocumentUrl ||
				(token.asset?.documents &&
					token.asset.documents.length > 0)) && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<FileText className="h-5 w-5" />
							Documentos del Bundle
						</CardTitle>
					</CardHeader>
					<CardContent>
						{/* Prioridad: mostrar documentos del bundle del token */}
						{(token.cdDocumentUrl ||
							token.bpDocumentUrl ||
							token.pagareDocumentUrl) && (
							<div className="space-y-4">
								{token.cdDocumentUrl && (
									<div className="flex items-center justify-between p-4 border rounded-lg">
										<div className="flex items-center gap-3 flex-1">
											<FileText className="h-5 w-5 text-slate-400" />
											<div className="flex-1">
												<p className="font-medium">
													Certificado de Depósito (CD)
												</p>
												{token.cdHash && (
													<p className="text-sm text-slate-500 mt-1">
														Hash:{" "}
														{token.cdHash.substring(
															0,
															32
														)}
														...
													</p>
												)}
											</div>
										</div>
										<div className="flex gap-2">
											<a
												href={`${
													process.env
														.NEXT_PUBLIC_API_URL ||
													"http://localhost:3001/api"
												}${token.cdDocumentUrl}`}
												target="_blank"
												rel="noopener noreferrer"
											>
												<Button
													variant="outline"
													size="sm"
												>
													Ver PDF
												</Button>
											</a>
										</div>
									</div>
								)}
								{token.bpDocumentUrl && (
									<div className="flex items-center justify-between p-4 border rounded-lg">
										<div className="flex items-center gap-3 flex-1">
											<FileText className="h-5 w-5 text-slate-400" />
											<div className="flex-1">
												<p className="font-medium">
													Bono de Prenda (BP)
												</p>
												{token.bpHash && (
													<p className="text-sm text-slate-500 mt-1">
														Hash:{" "}
														{token.bpHash.substring(
															0,
															32
														)}
														...
													</p>
												)}
											</div>
										</div>
										<div className="flex gap-2">
											<a
												href={`${
													process.env
														.NEXT_PUBLIC_API_URL ||
													"http://localhost:3001/api"
												}${token.bpDocumentUrl}`}
												target="_blank"
												rel="noopener noreferrer"
											>
												<Button
													variant="outline"
													size="sm"
												>
													Ver PDF
												</Button>
											</a>
										</div>
									</div>
								)}
								{token.pagareDocumentUrl && (
									<div className="flex items-center justify-between p-4 border rounded-lg">
										<div className="flex items-center gap-3 flex-1">
											<FileText className="h-5 w-5 text-slate-400" />
											<div className="flex-1">
												<p className="font-medium">
													Pagaré
												</p>
												{token.pagareHash && (
													<p className="text-sm text-slate-500 mt-1">
														Hash:{" "}
														{token.pagareHash.substring(
															0,
															32
														)}
														...
													</p>
												)}
											</div>
										</div>
										<div className="flex gap-2">
											<a
												href={`${
													process.env
														.NEXT_PUBLIC_API_URL ||
													"http://localhost:3001/api"
												}${token.pagareDocumentUrl}`}
												target="_blank"
												rel="noopener noreferrer"
											>
												<Button
													variant="outline"
													size="sm"
												>
													Ver PDF
												</Button>
											</a>
										</div>
									</div>
								)}
							</div>
						)}
						{/* Fallback: mostrar documentos del activo si no hay bundle */}
						{!token.cdDocumentUrl &&
							!token.bpDocumentUrl &&
							!token.pagareDocumentUrl &&
							token.asset?.documents &&
							token.asset.documents.length > 0 && (
								<div className="space-y-4">
									{token.asset.documents
										.filter(
											(doc: Document) =>
												doc.type === DocumentType.CD ||
												doc.type === DocumentType.BP
										)
										.map((doc: Document) => (
											<div
												key={doc.id}
												className="flex items-center justify-between p-4 border rounded-lg"
											>
												<div className="flex items-center gap-3 flex-1">
													<FileText className="h-5 w-5 text-slate-400" />
													<div className="flex-1">
														<p className="font-medium">
															{doc.type ===
															DocumentType.CD
																? `Certificado de Depósito No. ${
																		doc.documentNumber ||
																		"N/A"
																  }`
																: `Bono de Prenda No. ${
																		doc.documentNumber ||
																		"N/A"
																  }`}
														</p>
														<p className="text-sm text-slate-500 mt-1">
															Versión{" "}
															{doc.version} •
															Hash:{" "}
															{doc.pdfHash.substring(
																0,
																16
															)}
															...
														</p>
													</div>
												</div>
												<div className="flex gap-2">
													<Link
														href={`/dashboard/documents/${doc.id}`}
													>
														<Button
															variant="outline"
															size="sm"
														>
															Ver Detalle
														</Button>
													</Link>
													<a
														href={`${
															process.env
																.NEXT_PUBLIC_API_URL ||
															"http://localhost:3001/api"
														}/documents/public/${
															doc.id
														}/download`}
														target="_blank"
														rel="noopener noreferrer"
													>
														<Button
															variant="ghost"
															size="sm"
														>
															<ExternalLink className="h-4 w-4" />
														</Button>
													</a>
												</div>
											</div>
										))}
								</div>
							)}
					</CardContent>
				</Card>
			)}
		</div>
	);
}
