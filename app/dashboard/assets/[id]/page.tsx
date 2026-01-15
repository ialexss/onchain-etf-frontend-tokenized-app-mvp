"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { assetsApi } from "@/lib/api/assets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
	ExternalLink,
	FileText,
	Coins,
	Package,
	Briefcase,
	MapPin,
	Tag,
	Calendar,
} from "lucide-react";
import { operationsApi } from "@/lib/api/operations";
import Link from "next/link";
import { BackButton } from "@/components/ui/back-button";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth/auth-context";

export default function AssetDetailPage() {
	const params = useParams();
	const { user, hasPermission } = useAuth();
	const assetId = Number(params.id);

	const { data: asset, isLoading } = useQuery({
		queryKey: ["asset", assetId],
		queryFn: () => assetsApi.getById(assetId),
		enabled: !!assetId,
	});

	// Obtener operación si está disponible
	const { data: operation } = useQuery({
		queryKey: ["operation", asset?.operationId],
		queryFn: () => operationsApi.getById(asset!.operationId!),
		enabled: !!asset?.operationId,
	});

	const getStatusBadge = (status: string) => {
		const variants: Record<
			string,
			"default" | "secondary" | "destructive" | "outline"
		> = {
			STORED: "secondary",
			PLEDGED: "default",
			DELIVERED: "outline",
			BURNED: "destructive",
		};
		return (
			<Badge variant={variants[status] || "secondary"}>{status}</Badge>
		);
	};

	if (isLoading) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-12 w-full" />
				<Skeleton className="h-64 w-full" />
			</div>
		);
	}

	if (!asset) {
		return (
			<div className="flex flex-col items-center justify-center h-64">
				<p className="text-slate-500 mb-4">Activo no encontrado</p>
				<BackButton variant="outline" size="default" showIcon={true}>
					Volver a Activos
				</BackButton>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<BackButton />
				<div>
					<h2 className="text-3xl font-bold">
						{asset.name || "Detalle del Activo"}
					</h2>
					<p className="text-slate-500 dark:text-slate-400">
						VIN/Serial: {asset.vinSerial}{" "}
						{asset.name && `• ID: #${asset.id}`}
					</p>
				</div>
			</div>

			<div className="grid gap-6 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Información del Activo</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						{asset.name && (
							<div>
								<p className="text-sm font-medium text-slate-500">
									Nombre
								</p>
								<p className="text-lg font-semibold">
									{asset.name}
								</p>
							</div>
						)}
						<div>
							<p className="text-sm font-medium text-slate-500">
								VIN/Serial
							</p>
							<p className="text-lg font-semibold">
								{asset.vinSerial}
							</p>
						</div>
						{asset.description && (
							<div>
								<p className="text-sm font-medium text-slate-500">
									Descripción
								</p>
								<p>{asset.description}</p>
							</div>
						)}
						<div>
							<p className="text-sm font-medium text-slate-500">
								Valor
							</p>
							<p className="text-2xl font-bold">
								${asset.value?.toLocaleString()}
							</p>
						</div>
						{asset.quantity && (
							<div>
								<p className="text-sm font-medium text-slate-500">
									Cantidad
								</p>
								<p className="text-lg font-semibold">
									{Math.floor(Number(asset.quantity))}
								</p>
							</div>
						)}
						{asset.brands && (
							<div>
								<p className="text-sm font-medium text-slate-500 flex items-center gap-1">
									<Tag className="h-4 w-4" />
									Marcas
								</p>
								<p>{asset.brands}</p>
							</div>
						)}
						{asset.location && (
							<div>
								<p className="text-sm font-medium text-slate-500 flex items-center gap-1">
									<MapPin className="h-4 w-4" />
									Localización
								</p>
								<p>{asset.location}</p>
							</div>
						)}
						<div>
							<p className="text-sm font-medium text-slate-500">
								Estado
							</p>
							{getStatusBadge(asset.status)}
						</div>
						<Separator />
						<div>
							<p className="text-sm font-medium text-slate-500">
								Almacén
							</p>
							<p>{asset.warehouse?.name || "-"}</p>
						</div>
						<div>
							<p className="text-sm font-medium text-slate-500">
								Cliente
							</p>
							<p>{asset.client?.name || "-"}</p>
						</div>
						{(asset.createdAt || asset.updatedAt) && (
							<>
								<Separator />
								<div className="space-y-2 text-xs text-muted-foreground">
									{asset.createdAt && (
										<div className="flex items-center gap-1">
											<Calendar className="h-3 w-3" />
											Creado:{" "}
											{format(
												new Date(asset.createdAt),
												"PPP",
												{ locale: es }
											)}
										</div>
									)}
									{asset.updatedAt &&
										asset.updatedAt !== asset.createdAt && (
											<div className="flex items-center gap-1">
												<Calendar className="h-3 w-3" />
												Actualizado:{" "}
												{format(
													new Date(asset.updatedAt),
													"PPP",
													{ locale: es }
												)}
											</div>
										)}
								</div>
							</>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Coins className="h-5 w-5" />
							Token Asociado
							{asset.token?.operationId && (
								<Badge variant="secondary" className="ml-2">
									Compartido
								</Badge>
							)}
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						{asset.token ? (
							<>
								<div>
									<p className="text-sm font-medium text-slate-500">
										Token ID
									</p>
									<p className="text-lg font-semibold">
										#{asset.token.id}
									</p>
								</div>
								<div>
									<p className="text-sm font-medium text-slate-500">
										Estado del Token
									</p>
									<Badge variant="default">
										{asset.token.status}
									</Badge>
								</div>
								<div>
									<p className="text-sm font-medium text-slate-500">
										Cantidad
									</p>
									<p className="text-lg font-semibold">
										{asset.token.amount}
									</p>
								</div>
								<div>
									<p className="text-sm font-medium text-slate-500">
										MPTokenIssuanceID
									</p>
									<code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded block break-all">
										{asset.token.xrplIssuanceId}
									</code>
								</div>
								{asset.token.xrplTokenId && (
									<div>
										<p className="text-sm font-medium text-slate-500">
											Token ID (XRPL)
										</p>
										<code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded block break-all">
											{asset.token.xrplTokenId}
										</code>
									</div>
								)}
								{asset.token.documentHash && (
									<div>
										<p className="text-sm font-medium text-slate-500">
											Hash del Documento
										</p>
										<code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded block break-all">
											{asset.token.documentHash}
										</code>
									</div>
								)}
								{/* Documentos del bundle (prioridad si están disponibles) */}
								{(asset.token?.cdDocumentUrl ||
									asset.token?.bpDocumentUrl ||
									asset.token?.pagareDocumentUrl) && (
									<div>
										<p className="text-sm font-medium text-slate-500 mb-2">
											Documentos del Bundle
										</p>
										<div className="space-y-2">
											{asset.token.cdDocumentUrl && (
												<a
													href={`${
														process.env
															.NEXT_PUBLIC_API_URL ||
														"http://localhost:3001/api"
													}${
														asset.token
															.cdDocumentUrl
													}`}
													target="_blank"
													rel="noopener noreferrer"
												>
													<Button
														variant="outline"
														size="sm"
														className="w-full justify-start"
													>
														<FileText className="mr-2 h-4 w-4" />
														Certificado de Depósito
														(CD)
														{asset.token.cdHash && (
															<span className="ml-2 text-xs text-muted-foreground">
																{asset.token.cdHash.substring(
																	0,
																	8
																)}
																...
															</span>
														)}
													</Button>
												</a>
											)}
											{asset.token.bpDocumentUrl && (
												<a
													href={`${
														process.env
															.NEXT_PUBLIC_API_URL ||
														"http://localhost:3001/api"
													}${
														asset.token
															.bpDocumentUrl
													}`}
													target="_blank"
													rel="noopener noreferrer"
												>
													<Button
														variant="outline"
														size="sm"
														className="w-full justify-start"
													>
														<FileText className="mr-2 h-4 w-4" />
														Bono de Prenda (BP)
														{asset.token.bpHash && (
															<span className="ml-2 text-xs text-muted-foreground">
																{asset.token.bpHash.substring(
																	0,
																	8
																)}
																...
															</span>
														)}
													</Button>
												</a>
											)}
											{asset.token.pagareDocumentUrl && (
												<a
													href={`${
														process.env
															.NEXT_PUBLIC_API_URL ||
														"http://localhost:3001/api"
													}${
														asset.token
															.pagareDocumentUrl
													}`}
													target="_blank"
													rel="noopener noreferrer"
												>
													<Button
														variant="outline"
														size="sm"
														className="w-full justify-start"
													>
														<FileText className="mr-2 h-4 w-4" />
														Pagaré
														{asset.token
															.pagareHash && (
															<span className="ml-2 text-xs text-muted-foreground">
																{asset.token.pagareHash.substring(
																	0,
																	8
																)}
																...
															</span>
														)}
													</Button>
												</a>
											)}
										</div>
									</div>
								)}
								{/* Documentos de respaldo del token (fallback si no hay bundle) */}
								{asset.documents &&
									asset.documents.length > 0 &&
									!asset.token?.cdDocumentUrl &&
									!asset.token?.bpDocumentUrl && (
										<div>
											<p className="text-sm font-medium text-slate-500 mb-2">
												Documentos de Respaldo
											</p>
											<div className="space-y-2">
												{asset.documents
													.filter(
														(doc: any) =>
															doc.type === "CD" ||
															doc.type === "BP"
													)
													.map((doc: any) => (
														<a
															key={doc.id}
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
																variant="outline"
																size="sm"
																className="w-full justify-start"
															>
																<FileText className="mr-2 h-4 w-4" />
																{doc.type ===
																"CD"
																	? "Certificado de Depósito"
																	: "Bono de Prenda"}
																{doc.documentNumber &&
																	` (No. ${doc.documentNumber})`}
															</Button>
														</a>
													))}
											</div>
										</div>
									)}
								{/* Mantener compatibilidad con documentUrl anterior */}
								{asset.token?.documentUrl &&
									!asset.token?.cdDocumentUrl &&
									!asset.token?.bpDocumentUrl &&
									(!asset.documents ||
										asset.documents.length === 0) && (
										<div>
											<p className="text-sm font-medium text-slate-500 mb-2">
												Documento de Respaldo
											</p>
											<a
												href={`${
													process.env
														.NEXT_PUBLIC_API_URL ||
													"http://localhost:3001/api"
												}${asset.token.documentUrl}`}
												target="_blank"
												rel="noopener noreferrer"
											>
												<Button
													variant="outline"
													size="sm"
													className="w-full"
												>
													<FileText className="mr-2 h-4 w-4" />
													Ver Documento PDF
												</Button>
											</a>
										</div>
									)}
								{/* Mostrar información de operación si está tokenizado */}
								{asset.token?.operationId && (
									<div className="pt-4 border-t">
										<p className="text-sm font-medium text-slate-500 mb-2">
											Operación
										</p>
										<Link
											href={`/dashboard/operations/${asset.token.operationId}`}
										>
											<Button
												variant="outline"
												size="sm"
												className="w-full"
											>
												Ver Operación #
												{asset.token.operationId}
											</Button>
										</Link>
									</div>
								)}
								<Link
									href={`/dashboard/tokens/${asset.token.id}`}
								>
									<Button
										variant="default"
										className="w-full"
									>
										Ver Detalle del Token
									</Button>
								</Link>
							</>
						) : (
							<div className="text-center py-8 text-slate-500 dark:text-slate-400">
								<Coins className="h-12 w-12 mx-auto mb-2 opacity-50" />
								<p className="font-medium mb-2">
									Activo no tokenizado
								</p>
								<p className="text-sm mb-4">
									Este activo aún no ha sido tokenizado. Los
									activos se tokenizan a través de las
									operaciones.
								</p>
								{asset.operationId && (
									<Link
										href={`/dashboard/operations/${asset.operationId}`}
									>
										<Button
											variant="outline"
											className="w-full"
										>
											<Briefcase className="mr-2 h-4 w-4" />
											Ver Operación Asociada
										</Button>
									</Link>
								)}
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Operación Asociada */}
			{(asset.operationId || operation) && (
				<Card className="bg-primary/5 border-primary/20">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Briefcase className="h-5 w-5" />
							Operación Asociada
						</CardTitle>
					</CardHeader>
					<CardContent>
						{operation ? (
							<div className="space-y-4">
								<div>
									<p className="text-sm font-medium text-muted-foreground">
										Número de Operación
									</p>
									<p className="text-lg font-semibold">
										{operation.operationNumber ||
											`OP-${operation.id}`}
									</p>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
									<div>
										<p className="text-xs text-muted-foreground">
											Warrantera
										</p>
										<p className="font-medium">
											{operation.warrant?.name || "-"}
										</p>
									</div>
									<div>
										<p className="text-xs text-muted-foreground">
											Cliente
										</p>
										<p className="font-medium">
											{operation.client?.name || "-"}
										</p>
									</div>
									<div>
										<p className="text-xs text-muted-foreground">
											Entidad Financiera
										</p>
										<p className="font-medium">
											{operation.safi?.name || "-"}
										</p>
									</div>
								</div>
								<Link
									href={`/dashboard/operations/${operation.id}`}
								>
									<Button
										variant="default"
										className="w-full"
									>
										<Briefcase className="mr-2 h-4 w-4" />
										Ver Detalle de la Operación
									</Button>
								</Link>
							</div>
						) : (
							<div className="flex items-center justify-between">
								<div>
									<p className="font-medium">
										Operación #{asset.operationId}
									</p>
									<p className="text-sm text-muted-foreground">
										Cargando información...
									</p>
								</div>
								<Link
									href={`/dashboard/operations/${asset.operationId}`}
								>
									<Button variant="outline">
										Ver Operación
									</Button>
								</Link>
							</div>
						)}
					</CardContent>
				</Card>
			)}

			{/* Documentos del Activo */}
			{((asset.documents && asset.documents.length > 0) ||
				asset.token?.cdDocumentUrl ||
				asset.token?.bpDocumentUrl ||
				asset.token?.pagareDocumentUrl) && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<FileText className="h-5 w-5" />
							Documentos Relacionados
							{asset.token?.operationId && (
								<Badge variant="outline" className="ml-2">
									Bundle de Operación
								</Badge>
							)}
						</CardTitle>
					</CardHeader>
					<CardContent>
						{/* Documentos del bundle del token (prioridad) */}
						{(asset.token?.cdDocumentUrl ||
							asset.token?.bpDocumentUrl ||
							asset.token?.pagareDocumentUrl) && (
							<div className="mb-6">
								<p className="text-sm font-medium text-muted-foreground mb-3">
									Documentos del Bundle Tokenizado
								</p>
								<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
									{asset.token.cdDocumentUrl && (
										<a
											href={`${
												process.env
													.NEXT_PUBLIC_API_URL ||
												"http://localhost:3001/api"
											}${asset.token.cdDocumentUrl}`}
											target="_blank"
											rel="noopener noreferrer"
										>
											<Button
												variant="outline"
												className="w-full h-auto py-3 flex flex-col items-start"
											>
												<FileText className="h-5 w-5 mb-2" />
												<span className="font-medium">
													Certificado de Depósito
												</span>
												<span className="text-xs text-muted-foreground mt-1">
													{asset.token.cdHash
														? `Hash: ${asset.token.cdHash.substring(
																0,
																12
														  )}...`
														: "CD"}
												</span>
											</Button>
										</a>
									)}
									{asset.token.bpDocumentUrl && (
										<a
											href={`${
												process.env
													.NEXT_PUBLIC_API_URL ||
												"http://localhost:3001/api"
											}${asset.token.bpDocumentUrl}`}
											target="_blank"
											rel="noopener noreferrer"
										>
											<Button
												variant="outline"
												className="w-full h-auto py-3 flex flex-col items-start"
											>
												<FileText className="h-5 w-5 mb-2" />
												<span className="font-medium">
													Bono de Prenda
												</span>
												<span className="text-xs text-muted-foreground mt-1">
													{asset.token.bpHash
														? `Hash: ${asset.token.bpHash.substring(
																0,
																12
														  )}...`
														: "BP"}
												</span>
											</Button>
										</a>
									)}
									{asset.token.pagareDocumentUrl && (
										<a
											href={`${
												process.env
													.NEXT_PUBLIC_API_URL ||
												"http://localhost:3001/api"
											}${asset.token.pagareDocumentUrl}`}
											target="_blank"
											rel="noopener noreferrer"
										>
											<Button
												variant="outline"
												className="w-full h-auto py-3 flex flex-col items-start"
											>
												<FileText className="h-5 w-5 mb-2" />
												<span className="font-medium">
													Pagaré
												</span>
												<span className="text-xs text-muted-foreground mt-1">
													{asset.token.pagareHash
														? `Hash: ${asset.token.pagareHash.substring(
																0,
																12
														  )}...`
														: "Pagaré"}
												</span>
											</Button>
										</a>
									)}
								</div>
							</div>
						)}

						{/* Documentos individuales del activo */}
						{asset.documents && asset.documents.length > 0 && (
							<>
								{(asset.token?.cdDocumentUrl ||
									asset.token?.bpDocumentUrl ||
									asset.token?.pagareDocumentUrl) && (
									<Separator className="my-6" />
								)}
								<div>
									<p className="text-sm font-medium text-muted-foreground mb-3">
										Documentos Individuales del Activo
									</p>
									<div className="space-y-4">
										{asset.documents.map((doc: any) => {
											// Buscar documento pareado si existe
											const pairedDoc =
												asset.documents?.find(
													(d: any) =>
														d.id ===
														doc.pairedDocumentId
												);

											return (
												<div
													key={doc.id}
													className="flex items-center justify-between p-4 border rounded-lg"
												>
													<div className="flex items-center gap-3 flex-1">
														<FileText className="h-5 w-5 text-slate-400" />
														<div className="flex-1">
															<div className="flex items-center gap-2">
																<p className="font-medium">
																	{doc.type ===
																	"CD"
																		? "Certificado de Depósito"
																		: doc.type ===
																		  "BP"
																		? "Bono de Prenda"
																		: doc.type ===
																				"PROMISSORY_NOTE" ||
																		  doc.type ===
																				"PAGARE"
																		? "Pagaré"
																		: "Documento de Endoso"}
																</p>
																{doc.documentNumber && (
																	<Badge
																		variant="secondary"
																		className="text-xs"
																	>
																		No.{" "}
																		{
																			doc.documentNumber
																		}
																	</Badge>
																)}
																{pairedDoc && (
																	<Badge
																		variant="outline"
																		className="text-xs"
																	>
																		Vinculado
																		a{" "}
																		{pairedDoc.type ===
																		"CD"
																			? "CD"
																			: "BP"}{" "}
																		No.{" "}
																		{
																			pairedDoc.documentNumber
																		}
																	</Badge>
																)}
															</div>
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
															<div className="flex gap-2 mt-2">
																{doc.signedByWarehouse && (
																	<Badge
																		variant="outline"
																		className="text-xs bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
																	>
																		✓
																		Firmado
																		por
																		Almacén
																	</Badge>
																)}
																{doc.signedByClient && (
																	<Badge
																		variant="outline"
																		className="text-xs bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
																	>
																		✓
																		Firmado
																		por
																		Cliente
																	</Badge>
																)}
																{doc.signedByBank && (
																	<Badge
																		variant="outline"
																		className="text-xs bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
																	>
																		✓
																		Firmado
																		por
																		Banco
																	</Badge>
																)}
																{!doc.signedByWarehouse &&
																	!doc.signedByClient &&
																	!doc.signedByBank && (
																		<Badge
																			variant="outline"
																			className="text-xs text-amber-600 dark:text-amber-400"
																		>
																			Pendiente
																			de
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
											);
										})}
									</div>
								</div>
							</>
						)}

						{!asset.documents || asset.documents.length === 0
							? !asset.token?.cdDocumentUrl &&
							  !asset.token?.bpDocumentUrl &&
							  !asset.token?.pagareDocumentUrl && (
									<div className="text-center py-8 text-slate-500 dark:text-slate-400">
										<FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
										<p>No hay documentos asociados</p>
										<p className="text-sm mt-1">
											Los documentos CD y BP se generan
											automáticamente al crear el activo
										</p>
									</div>
							  )
							: null}
					</CardContent>
				</Card>
			)}
		</div>
	);
}
