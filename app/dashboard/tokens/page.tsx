"use client";

import { useQuery } from "@tanstack/react-query";
import { tokensApi } from "@/lib/api/tokens";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import {
	Coins,
	ExternalLink,
	User,
	Building2,
	Briefcase,
	Package,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function TokensPage() {
	const { user } = useAuth();
	const userOrgIds = user?.organizations?.map((org: any) => org.id) || [];

	const { data: tokens, isLoading } = useQuery({
		queryKey: ["tokens"],
		queryFn: tokensApi.getAll,
		enabled: !!user,
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
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-3xl font-bold">Tokens</h2>
					<p className="text-zinc-500 dark:text-zinc-400">
						{user?.organizations?.some(
							(org: any) => org.type === "ETF"
						)
							? "Visualización de todos los tokens del sistema"
							: user?.organizations?.some(
									(org: any) => org.type === "BANK"
							  )
							? "Visualización de todos los tokens del sistema"
							: user?.organizations?.some(
									(org: any) => org.type === "WAREHOUSE"
							  )
							? "Tokens de operaciones donde participas como warrantera"
							: "Tokens emitidos o recibidos por tus organizaciones"}
					</p>
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Lista de Tokens</CardTitle>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="space-y-2">
							<Skeleton className="h-12 w-full" />
							<Skeleton className="h-12 w-full" />
							<Skeleton className="h-12 w-full" />
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Token ID</TableHead>
									<TableHead>Operación</TableHead>
									<TableHead>Activos</TableHead>
									<TableHead>Cantidad</TableHead>
									<TableHead>Emisor</TableHead>
									<TableHead>Holder Actual</TableHead>
									<TableHead>Estado</TableHead>
									<TableHead>Acciones</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{tokens && tokens.length > 0 ? (
									tokens.map((token: any) => {
										const isEmitted =
											token.issuerWallet
												?.organizationId &&
											userOrgIds.includes(
												token.issuerWallet
													.organizationId
											);
										const isReceived =
											token.currentHolderWallet
												?.organizationId &&
											userOrgIds.includes(
												token.currentHolderWallet
													.organizationId
											);
										const tokenType =
											isEmitted && isReceived
												? "Emitido y Recibido"
												: isEmitted
												? "Emitido"
												: "Recibido";

										return (
											<TableRow key={token.id}>
												<TableCell>
													<div>
														<p className="font-medium">
															#{token.id}
														</p>
														<p className="text-xs text-muted-foreground font-mono">
															{token.xrplTokenId?.substring(
																0,
																16
															)}
															...
														</p>
													</div>
												</TableCell>
												<TableCell>
													{token.operationId ? (
														<Link
															href={`/dashboard/operations/${token.operationId}`}
														>
															<Badge
																variant="outline"
																className="cursor-pointer hover:bg-primary/10 flex items-center gap-1 w-fit"
															>
																<Briefcase className="h-3 w-3" />
																OP-
																{
																	token.operationId
																}
															</Badge>
														</Link>
													) : (
														<span className="text-muted-foreground text-sm">
															-
														</span>
													)}
												</TableCell>
												<TableCell>
													{token.assets &&
													token.assets.length > 0 ? (
														<div>
															<Badge
																variant="secondary"
																className="flex items-center gap-1 w-fit"
															>
																<Package className="h-3 w-3" />
																{
																	token.assets
																		.length
																}{" "}
																activo
																{token.assets
																	.length !==
																1
																	? "s"
																	: ""}
															</Badge>
															<p className="text-xs text-muted-foreground mt-1">
																{token.assets[0]
																	?.name ||
																	token
																		.assets[0]
																		?.vinSerial}
															</p>
														</div>
													) : token.asset ? (
														<div>
															<p className="text-sm">
																{token.asset
																	.name ||
																	token.asset
																		.vinSerial}
															</p>
															{token.asset
																.name && (
																<p className="text-xs text-muted-foreground">
																	{
																		token
																			.asset
																			.vinSerial
																	}
																</p>
															)}
														</div>
													) : (
														"-"
													)}
												</TableCell>
												<TableCell>
													<span className="font-semibold">
														{token.amount}
													</span>
												</TableCell>
												<TableCell>
													<div>
														<p className="text-sm font-medium flex items-center gap-1">
															<Building2 className="h-3 w-3" />
															{token.issuerWallet
																?.organization
																?.name ||
																(token
																	.issuerWallet
																	?.organizationId
																	? "Cargando..."
																	: "N/A")}
														</p>
														<p className="text-xs text-muted-foreground font-mono">
															{token.issuerWallet?.publicAddress?.substring(
																0,
																12
															)}
															...
														</p>
													</div>
												</TableCell>
												<TableCell>
													<div>
														<p className="text-sm font-medium flex items-center gap-1">
															<User className="h-3 w-3" />
															{token
																.currentHolderWallet
																?.organization
																?.name ||
																(token
																	.currentHolderWallet
																	?.organizationId
																	? "Cargando..."
																	: "N/A")}
														</p>
														<p className="text-xs text-muted-foreground font-mono">
															{token.currentHolderWallet?.publicAddress?.substring(
																0,
																12
															)}
															...
														</p>
													</div>
												</TableCell>
												<TableCell>
													<div className="flex flex-col gap-1">
														{getStatusBadge(
															token.status
														)}
														{tokenType !==
															"Recibido" && (
															<Badge
																variant={
																	isEmitted
																		? "default"
																		: "secondary"
																}
																className="text-xs w-fit"
															>
																{tokenType}
															</Badge>
														)}
													</div>
												</TableCell>
												<TableCell>
													<div className="flex gap-2">
														<Link
															href={`/dashboard/tokens/${token.id}`}
														>
															<Button
																variant="ghost"
																size="sm"
															>
																Ver
															</Button>
														</Link>
														<a
															href={`https://testnet.xrpl.org/mpt/${token.xrplTokenId}`}
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
												</TableCell>
											</TableRow>
										);
									})
								) : (
									<TableRow>
										<TableCell
											colSpan={6}
											className="text-center text-zinc-500 py-8"
										>
											<Coins className="h-12 w-12 mx-auto mb-2 opacity-50" />
											<p>No hay tokens emitidos</p>
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
