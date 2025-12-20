"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { assetsApi } from "@/lib/api/assets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, FileText, Coins, Package, Flame } from "lucide-react";
import Link from "next/link";
import { BackButton } from "@/components/ui/back-button";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Separator } from "@/components/ui/separator";
import { TokenizeAssetDialog } from "@/components/assets/tokenize-asset-dialog";
import { WithdrawAssetDialog } from "@/components/assets/withdraw-asset-dialog";
import { useAuth } from "@/lib/auth/auth-context";
import { toast } from "sonner";

export default function AssetDetailPage() {
	const params = useParams();
	const router = useRouter();
	const { user, hasPermission } = useAuth();
	const queryClient = useQueryClient();
	const assetId = Number(params.id);
	const [tokenizeDialogOpen, setTokenizeDialogOpen] = useState(false);
	const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);

	const { data: asset, isLoading } = useQuery({
		queryKey: ["asset", assetId],
		queryFn: () => assetsApi.getById(assetId),
		enabled: !!assetId,
	});

	const tokenizeMutation = useMutation({
		mutationFn: () => assetsApi.tokenize(assetId),
		onSuccess: () => {
			toast.success("Activo tokenizado exitosamente");
			queryClient.invalidateQueries({ queryKey: ["asset", assetId] });
			queryClient.invalidateQueries({ queryKey: ["assets"] });
			queryClient.invalidateQueries({ queryKey: ["tokens"] });
			setTokenizeDialogOpen(false);
		},
		onError: (error: any) => {
			toast.error(
				error.response?.data?.message || "Error al tokenizar el activo"
			);
			// No cerrar el diálogo en caso de error para que el usuario vea el mensaje
		},
	});

	const withdrawMutation = useMutation({
		mutationFn: () => assetsApi.withdraw(assetId),
		onSuccess: () => {
			toast.success("Activo retirado y token quemado exitosamente");
			queryClient.invalidateQueries({ queryKey: ["asset", assetId] });
			queryClient.invalidateQueries({ queryKey: ["assets"] });
			queryClient.invalidateQueries({ queryKey: ["tokens"] });
			setWithdrawDialogOpen(false);
			router.push("/dashboard/assets");
		},
		onError: (error: any) => {
			toast.error(
				error.response?.data?.message || "Error al retirar el activo"
			);
		},
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
					<h2 className="text-3xl font-bold">Detalle del Activo</h2>
					<p className="text-slate-500 dark:text-slate-400">
						VIN/Serial: {asset.vinSerial}
					</p>
				</div>
			</div>

			<div className="grid gap-6 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Información del Activo</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div>
							<p className="text-sm font-medium text-slate-500">
								VIN/Serial
							</p>
							<p className="text-lg font-semibold">
								{asset.vinSerial}
							</p>
						</div>
						<div>
							<p className="text-sm font-medium text-slate-500">
								Descripción
							</p>
							<p>{asset.description || "Sin descripción"}</p>
						</div>
						<div>
							<p className="text-sm font-medium text-slate-500">
								Valor
							</p>
							<p className="text-2xl font-bold">
								${asset.value?.toLocaleString()}
							</p>
						</div>
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
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Token Asociado</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						{asset.token ? (
							<>
								<div className="flex items-center gap-2 mb-4">
									<Coins className="h-5 w-5 text-primary" />
									<span className="font-semibold">
										Activo Tokenizado
									</span>
								</div>
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
										MPTokenIssuanceID
									</p>
									<code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded block break-all">
										{asset.token.xrplIssuanceId}
									</code>
								</div>
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
								{/* Documentos de respaldo del token */}
								{asset.documents &&
									asset.documents.length > 0 && (
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
								{asset.token.documentUrl &&
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
									Este activo aún no ha sido tokenizado
								</p>
								{hasPermission("assets:tokenize") &&
									asset.status === "STORED" && (
										<Button
											onClick={() =>
												setTokenizeDialogOpen(true)
											}
											className="w-full"
										>
											<Coins className="mr-2 h-4 w-4" />
											Tokenizar Activo
										</Button>
									)}
							</div>
						)}

						{/* Acciones adicionales */}
						{asset.token &&
							asset.status === "PLEDGED" &&
							hasPermission("assets:withdraw") && (
								<div className="pt-4 border-t">
									<Button
										variant="destructive"
										onClick={() =>
											setWithdrawDialogOpen(true)
										}
										className="w-full"
									>
										<Flame className="mr-2 h-4 w-4" />
										Retirar Activo y Quemar Token
									</Button>
								</div>
							)}
					</CardContent>
				</Card>
			</div>

			{/* Documentos del Activo */}
			{asset.documents && asset.documents.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<FileText className="h-5 w-5" />
							Documentos del Activo
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{asset.documents.map((doc: any) => {
								// Buscar documento pareado si existe
								const pairedDoc = asset.documents?.find(
									(d: any) => d.id === doc.pairedDocumentId
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
														{doc.type === "CD"
															? "Certificado de Depósito"
															: doc.type === "BP"
															? "Bono de Prenda"
															: "Documento de Endoso"}
													</p>
													{doc.documentNumber && (
														<Badge
															variant="secondary"
															className="text-xs"
														>
															No.{" "}
															{doc.documentNumber}
														</Badge>
													)}
													{pairedDoc && (
														<Badge
															variant="outline"
															className="text-xs"
														>
															Vinculado a{" "}
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
													Versión {doc.version} •
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
								);
							})}
						</div>
						{asset.documents.length === 0 && (
							<div className="text-center py-8 text-slate-500 dark:text-slate-400">
								<FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
								<p>No hay documentos asociados</p>
								<p className="text-sm mt-1">
									Los documentos CD y BP se generan
									automáticamente al crear el activo
								</p>
							</div>
						)}
					</CardContent>
				</Card>
			)}

			{/* Diálogos */}
			<TokenizeAssetDialog
				open={tokenizeDialogOpen}
				onOpenChange={setTokenizeDialogOpen}
				onConfirm={() => tokenizeMutation.mutate()}
				asset={asset}
				isLoading={tokenizeMutation.isPending}
			/>

			<WithdrawAssetDialog
				open={withdrawDialogOpen}
				onOpenChange={setWithdrawDialogOpen}
				onConfirm={() => withdrawMutation.mutate()}
				asset={asset}
				isLoading={withdrawMutation.isPending}
			/>
		</div>
	);
}
