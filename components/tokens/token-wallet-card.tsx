"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Token } from "@/types/token";
import { operationsApi } from "@/lib/api/operations";
import { tokensApi } from "@/lib/api/tokens";
import Link from "next/link";
import {
	ChevronDown,
	ChevronUp,
	Package,
	FileText,
	ExternalLink,
	Eye,
	Coins,
	Building2,
	User,
	Briefcase,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface TokenWalletCardProps {
	token: Token;
}

export function TokenWalletCard({ token }: TokenWalletCardProps) {
	const [isOpen, setIsOpen] = useState(false);

	// Obtener operación asociada (usar operationId del token si está disponible)
	const { data: operation } = useQuery({
		queryKey: ["operation-by-token", token.operationId],
		queryFn: async () => {
			if (token.operationId) {
				return operationsApi.getById(token.operationId);
			}
			// Fallback: buscar por assetId si no hay operationId (compatibilidad)
			if (token.assetId && token.asset) {
				const operationId = (token.asset as any).operationId;
				if (operationId) {
					return operationsApi.getById(operationId);
				}
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
		<Collapsible open={isOpen} onOpenChange={setIsOpen}>
			<Card className="hover:shadow-lg transition-shadow">
				<CardHeader>
					<div className="flex items-center justify-between">
						<div className="flex-1">
							<CardTitle className="text-lg flex items-center gap-2">
								<Coins className="h-5 w-5" />
								Token #{token.id}
							</CardTitle>
							<p className="text-xs text-muted-foreground mt-1">
								{token.xrplTokenId.substring(0, 16)}...
							</p>
						</div>
						{getStatusBadge(token.status)}
					</div>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* Información básica */}
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<span className="text-sm text-muted-foreground">
								Cantidad
							</span>
							<span className="font-medium">{token.amount}</span>
						</div>
						{/* Calcular valor total de activos */}
						{(token.assets && token.assets.length > 0) || token.asset ? (
							<div className="flex items-center justify-between">
								<span className="text-sm text-muted-foreground">
									{token.assets && token.assets.length > 1
										? `Valor Total (${token.assets.length} activos)`
										: "Valor del Activo"}
								</span>
								<span className="font-medium">
									{token.assets && token.assets.length > 0
										? `$${token.assets
												.reduce((sum: number, asset: any) => {
													const value = typeof asset.value === 'string' 
														? parseFloat(asset.value) 
														: Number(asset.value) || 0;
													return sum + value;
												}, 0)
												.toLocaleString()}`
										: token.asset
										? `$${token.asset.value?.toLocaleString() || "0"}`
										: "$0"}
								</span>
							</div>
						) : null}
						{/* Información de Emisor y Holder */}
						<div className="space-y-2 border-t pt-3">
							{token.issuerWallet && (
								<div>
									<p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
										<Building2 className="h-3 w-3" />
										Emisor
									</p>
									<p className="text-sm font-medium">
										{token.issuerWallet.organization?.name || "N/A"}
									</p>
									<p className="text-xs text-muted-foreground font-mono">
										{token.issuerWallet.publicAddress?.substring(0, 16)}...
									</p>
								</div>
							)}
							{token.currentHolderWallet && (
								<div>
									<p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
										<User className="h-3 w-3" />
										Holder Actual
									</p>
									<p className="text-sm font-medium">
										{token.currentHolderWallet.organization?.name || "N/A"}
									</p>
									<p className="text-xs text-muted-foreground font-mono">
										{token.currentHolderWallet.publicAddress?.substring(0, 16)}...
									</p>
								</div>
							)}
						</div>
					</div>

					{/* Operación Asociada */}
					{operation && (
						<div className="border-t pt-3">
							<p className="text-xs text-muted-foreground mb-2">
								Operación Asociada
							</p>
							<Link
								href={`/dashboard/operations/${operation.id}`}
								className="block"
							>
								<Button variant="outline" size="sm" className="w-full">
									{operation.operationNumber || `OP-${operation.id}`}
								</Button>
							</Link>
						</div>
					)}

					{/* Botón para expandir */}
					<CollapsibleTrigger asChild>
						<Button variant="ghost" className="w-full" size="sm">
							{isOpen ? (
								<>
									<ChevronUp className="h-4 w-4 mr-2" />
									Ocultar Detalles
								</>
							) : (
								<>
									<ChevronDown className="h-4 w-4 mr-2" />
									Ver Detalles
								</>
							)}
						</Button>
					</CollapsibleTrigger>

					{/* Contenido expandible */}
					<CollapsibleContent className="space-y-4">
						{/* Activos Representados */}
						{token.assets && token.assets.length > 0 ? (
							<div className="border-t pt-3">
								<p className="text-sm font-medium mb-2 flex items-center gap-2">
									<Package className="h-4 w-4" />
									Activos Representados ({token.assets.length})
								</p>
								<div className="space-y-3 text-sm">
									{token.assets.map((asset: any) => (
										<div key={asset.id} className="p-2 border rounded">
											<div>
												<p className="text-muted-foreground text-xs">VIN/Serial</p>
												<p className="font-medium">{asset.vinSerial}</p>
											</div>
											{asset.description && (
												<div className="mt-1">
													<p className="text-muted-foreground text-xs">Descripción</p>
													<p className="font-medium text-xs">{asset.description}</p>
												</div>
											)}
											<div className="mt-2">
												<Link href={`/dashboard/assets/${asset.id}`}>
													<Button variant="ghost" size="sm" className="w-full text-xs">
														<Eye className="h-3 w-3 mr-1" />
														Ver Activo
													</Button>
												</Link>
											</div>
										</div>
									))}
								</div>
							</div>
						) : token.asset ? (
							<div className="border-t pt-3">
								<p className="text-sm font-medium mb-2 flex items-center gap-2">
									<Package className="h-4 w-4" />
									Activo Representado
								</p>
								<div className="space-y-2 text-sm">
									<div>
										<p className="text-muted-foreground">VIN/Serial</p>
										<p className="font-medium">{token.asset.vinSerial}</p>
									</div>
									{token.asset.description && (
										<div>
											<p className="text-muted-foreground">Descripción</p>
											<p className="font-medium">{token.asset.description}</p>
										</div>
									)}
									{token.asset.brands && (
										<div>
											<p className="text-muted-foreground">Marcas</p>
											<p className="font-medium">{token.asset.brands}</p>
										</div>
									)}
									<Link href={`/dashboard/assets/${token.asset.id}`}>
										<Button variant="ghost" size="sm" className="w-full">
											<Eye className="h-4 w-4 mr-2" />
											Ver Activo Completo
										</Button>
									</Link>
								</div>
							</div>
						) : null}

						{/* Documentos del Bundle */}
						{(token.cdDocumentUrl || token.bpDocumentUrl || token.pagareDocumentUrl || operation) && (
							<div className="border-t pt-3">
								<p className="text-sm font-medium mb-2 flex items-center gap-2">
									<FileText className="h-4 w-4" />
									Documentos del Bundle
								</p>
								<div className="space-y-2 text-sm">
									{/* Mostrar documentos directamente si están disponibles en el token */}
									{token.cdDocumentUrl && (
										<a
											href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}${token.cdDocumentUrl}`}
											target="_blank"
											rel="noopener noreferrer"
										>
											<Button variant="outline" size="sm" className="w-full justify-start">
												<FileText className="h-3 w-3 mr-2" />
												CD
												{token.cdHash && (
													<span className="ml-2 text-xs text-muted-foreground">
														{token.cdHash.substring(0, 8)}...
													</span>
												)}
											</Button>
										</a>
									)}
									{token.bpDocumentUrl && (
										<a
											href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}${token.bpDocumentUrl}`}
											target="_blank"
											rel="noopener noreferrer"
										>
											<Button variant="outline" size="sm" className="w-full justify-start">
												<FileText className="h-3 w-3 mr-2" />
												BP
												{token.bpHash && (
													<span className="ml-2 text-xs text-muted-foreground">
														{token.bpHash.substring(0, 8)}...
													</span>
												)}
											</Button>
										</a>
									)}
									{token.pagareDocumentUrl && (
										<a
											href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}${token.pagareDocumentUrl}`}
											target="_blank"
											rel="noopener noreferrer"
										>
											<Button variant="outline" size="sm" className="w-full justify-start">
												<FileText className="h-3 w-3 mr-2" />
												Pagaré
												{token.pagareHash && (
													<span className="ml-2 text-xs text-muted-foreground">
														{token.pagareHash.substring(0, 8)}...
													</span>
												)}
											</Button>
										</a>
									)}
									{/* Enlace a operación si está disponible */}
									{operation && (
										<Link href={`/dashboard/operations/${operation.id}#documents`}>
											<Button variant="outline" size="sm" className="w-full">
												Ver Todos los Documentos
											</Button>
										</Link>
									)}
								</div>
							</div>
						)}

						{/* Metadata */}
						<div className="border-t pt-3">
							<p className="text-sm font-medium mb-2">Metadata</p>
							<div className="space-y-2 text-xs">
								{token.metadataHash && (
									<div>
										<p className="text-muted-foreground">Metadata Hash (Merkle Root)</p>
										<code className="bg-muted px-2 py-1 rounded block break-all">
											{token.metadataHash.substring(0, 32)}...
										</code>
									</div>
								)}
								{/* Mostrar hashes de los 3 documentos si están disponibles */}
								{token.cdHash && (
									<div>
										<p className="text-muted-foreground">CD Hash</p>
										<code className="bg-muted px-2 py-1 rounded block break-all">
											{token.cdHash.substring(0, 32)}...
										</code>
									</div>
								)}
								{token.bpHash && (
									<div>
										<p className="text-muted-foreground">BP Hash</p>
										<code className="bg-muted px-2 py-1 rounded block break-all">
											{token.bpHash.substring(0, 32)}...
										</code>
									</div>
								)}
								{token.pagareHash && (
									<div>
										<p className="text-muted-foreground">Pagaré Hash</p>
										<code className="bg-muted px-2 py-1 rounded block break-all">
											{token.pagareHash.substring(0, 32)}...
										</code>
									</div>
								)}
								{/* Mantener compatibilidad con documentHash antiguo */}
								{token.documentHash && !token.bpHash && (
									<div>
										<p className="text-muted-foreground">Document Hash</p>
										<code className="bg-muted px-2 py-1 rounded block break-all">
											{token.documentHash.substring(0, 32)}...
										</code>
									</div>
								)}
							</div>
						</div>

						{/* Acciones */}
						<div className="border-t pt-3 space-y-2">
							<Link href={`/dashboard/tokens/${token.id}`}>
								<Button variant="default" className="w-full" size="sm">
									<Eye className="h-4 w-4 mr-2" />
									Ver Detalle Completo
								</Button>
							</Link>
							<a
								href={`https://testnet.xrpl.org/mpt/${token.xrplTokenId}`}
								target="_blank"
								rel="noopener noreferrer"
							>
								<Button variant="outline" className="w-full" size="sm">
									<ExternalLink className="h-4 w-4 mr-2" />
									Ver en XRPL Explorer
								</Button>
							</a>
						</div>
					</CollapsibleContent>
				</CardContent>
			</Card>
		</Collapsible>
	);
}

