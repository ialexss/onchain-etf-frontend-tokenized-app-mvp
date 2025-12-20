"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { tokensApi } from "@/lib/api/tokens";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, History, FileText } from "lucide-react";
import Link from "next/link";
import { BackButton } from "@/components/ui/back-button";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Document, DocumentType } from "@/types/document";

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
						<div>
							<p className="text-sm font-medium text-slate-500">
								Activo Representado
							</p>
							<div className="flex items-center gap-2">
								<p className="font-medium">
									{token.asset?.vinSerial || "-"}
								</p>
								{token.asset?.id && (
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
								Holder Actual
							</p>
							<div className="flex items-center gap-2">
								<code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded flex-1">
									{token.currentHolderWallet?.publicAddress ||
										"-"}
								</code>
								{token.currentHolderWallet?.publicAddress && (
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

			{/* Documentos del Token (CD y BP) */}
			{token.asset?.documents && token.asset.documents.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<FileText className="h-5 w-5" />
							Documentos que Respaldan el Token
						</CardTitle>
					</CardHeader>
					<CardContent>
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
													{doc.pairedDocumentId &&
														doc.pairedDocument && (
															<span className="text-xs text-slate-400 ml-2">
																(Vinculado a{" "}
																{
																	doc
																		.pairedDocument
																		.type
																}{" "}
																No.{" "}
																{
																	doc
																		.pairedDocument
																		.documentNumber
																}
																)
															</span>
														)}
												</p>
												<p className="text-sm text-slate-500 mt-1">
													Versión {doc.version} •
													Hash:{" "}
													{doc.pdfHash.substring(
														0,
														16
													)}
													...
												</p>
												<div className="flex gap-2 mt-2 flex-wrap">
													{doc.signedByWarehouse && (
														<Badge
															variant="outline"
															className="text-xs bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
														>
															✓ Firmado por
															Almacén
														</Badge>
													)}
													{doc.signedByClient && (
														<Badge
															variant="outline"
															className="text-xs bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
														>
															✓ Firmado por
															Cliente
														</Badge>
													)}
													{doc.signedByBank && (
														<Badge
															variant="outline"
															className="text-xs bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
														>
															✓ Firmado por Banco
														</Badge>
													)}
													{!doc.signedByWarehouse &&
														!doc.signedByClient &&
														!doc.signedByBank && (
															<Badge
																variant="outline"
																className="text-xs text-amber-600 dark:text-amber-400"
															>
																Pendiente de
																firma
															</Badge>
														)}
												</div>
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
						{token.asset.documents.filter(
							(doc: Document) =>
								doc.type === DocumentType.CD ||
								doc.type === DocumentType.BP
						).length === 0 && (
							<div className="text-center py-8 text-slate-500 dark:text-slate-400">
								<FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
								<p>No hay documentos CD o BP asociados</p>
								<p className="text-sm mt-1">
									Los documentos CD y BP se generan
									automáticamente al crear el activo
								</p>
							</div>
						)}
					</CardContent>
				</Card>
			)}
		</div>
	);
}
