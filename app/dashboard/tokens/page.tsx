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
import { Coins, ExternalLink } from "lucide-react";

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
					<p className="text-slate-500 dark:text-slate-400">
						Muestra todos mis tokens
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
									<TableHead>ID</TableHead>
									<TableHead>Activo</TableHead>
									<TableHead>Cantidad</TableHead>
									<TableHead>Tipo</TableHead>
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
												<TableCell className="font-mono text-xs">
													{token.xrplIssuanceId?.substring(
														0,
														16
													)}
													...
												</TableCell>
												<TableCell>
													{token.asset?.vinSerial ||
														"-"}
												</TableCell>
												<TableCell>
													{token.amount}
												</TableCell>
												<TableCell>
													<Badge
														variant={
															isEmitted
																? "default"
																: "secondary"
														}
													>
														{tokenType}
													</Badge>
												</TableCell>
												<TableCell className="font-mono text-xs">
													{token.issuerWallet?.publicAddress?.substring(
														0,
														12
													)}
													...
												</TableCell>
												<TableCell className="font-mono text-xs">
													{token.currentHolderWallet?.publicAddress?.substring(
														0,
														12
													)}
													...
												</TableCell>
												<TableCell>
													{getStatusBadge(
														token.status
													)}
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
														<Link
															href={`/dashboard/tokens/${token.id}/history`}
														>
															<Button
																variant="ghost"
																size="sm"
															>
																<ExternalLink className="h-4 w-4" />
															</Button>
														</Link>
													</div>
												</TableCell>
											</TableRow>
										);
									})
								) : (
									<TableRow>
										<TableCell
											colSpan={6}
											className="text-center text-slate-500 py-8"
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
