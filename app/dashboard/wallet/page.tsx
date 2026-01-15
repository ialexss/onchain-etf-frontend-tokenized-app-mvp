"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { tokensApi } from "@/lib/api/tokens";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { TokenWalletCard } from "@/components/tokens/token-wallet-card";
import { useAuth } from "@/lib/auth/auth-context";
import { Wallet, Search, Filter, Coins } from "lucide-react";
import { TokenStatus } from "@/types/token";

export default function WalletPage() {
	const { user } = useAuth();
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");

	const { data: allTokens, isLoading } = useQuery({
		queryKey: ["tokens"],
		queryFn: tokensApi.getMyTokens,
		enabled: !!user,
	});

	// Filtrar solo tokens donde el usuario es el holder actual
	const userOrgIds = user?.organizations?.map((org: any) => org.id) || [];
	const tokens = useMemo(() => {
		if (!allTokens) return [];
		// Filtrar tokens donde currentHolderWallet.organizationId está en las organizaciones del usuario
		return allTokens.filter((token: any) => 
			token.currentHolderWallet?.organizationId && 
			userOrgIds.includes(token.currentHolderWallet.organizationId)
		);
	}, [allTokens, userOrgIds]);

	// Filtrar tokens
	const filteredTokens = useMemo(() => {
		if (!tokens) return [];

		return tokens.filter((token: any) => {
			// Búsqueda en token ID, activos individuales, o múltiples activos
			const searchLower = searchQuery.toLowerCase();
			const matchesTokenId = token.xrplTokenId?.toLowerCase().includes(searchLower);
			
			// Buscar en activo único (compatibilidad)
			const matchesSingleAsset = 
				token.asset?.vinSerial?.toLowerCase().includes(searchLower) ||
				token.asset?.description?.toLowerCase().includes(searchLower);
			
			// Buscar en múltiples activos
			const matchesMultipleAssets = token.assets?.some((asset: any) =>
				asset.vinSerial?.toLowerCase().includes(searchLower) ||
				asset.description?.toLowerCase().includes(searchLower)
			);

			const matchesSearch =
				searchQuery === "" ||
				matchesTokenId ||
				matchesSingleAsset ||
				matchesMultipleAssets;

			const matchesStatus =
				statusFilter === "all" || token.status === statusFilter;

			return matchesSearch && matchesStatus;
		});
	}, [tokens, searchQuery, statusFilter]);

	// Calcular estadísticas
	const stats = useMemo(() => {
		if (!tokens) return { total: 0, active: 0, totalValue: 0 };

		const active = tokens.filter(
			(t: any) => t.status === TokenStatus.MINTED || t.status === TokenStatus.TRANSFERRED
		).length;

		// Calcular valor total considerando múltiples activos por token
		const totalValue = tokens.reduce((sum: number, t: any) => {
			// Si tiene múltiples activos, sumar todos
			if (t.assets && t.assets.length > 0) {
				return sum + t.assets.reduce((assetSum: number, asset: any) => {
					const value = typeof asset.value === 'string' 
						? parseFloat(asset.value) 
						: Number(asset.value) || 0;
					return assetSum + value;
				}, 0);
			}
			// Si tiene un activo único (compatibilidad)
			if (t.asset) {
				const value = typeof t.asset.value === 'string' 
					? parseFloat(t.asset.value) 
					: Number(t.asset.value) || 0;
				return sum + value;
			}
			return sum;
		}, 0);

		return {
			total: tokens.length,
			active,
			totalValue,
		};
	}, [tokens]);

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-3xl font-bold flex items-center gap-2">
					<Wallet className="h-8 w-8" />
					Wallet
				</h2>
				<p className="text-slate-500 dark:text-slate-400">
					Tus tokens MPT - Tokens donde eres el holder actual
				</p>
			</div>

			{/* Resumen */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Total de Tokens
						</CardTitle>
						<Coins className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{stats.total}</div>
						<p className="text-xs text-muted-foreground">
							Tokens en tu wallet
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Tokens Activos
						</CardTitle>
						<Wallet className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{stats.active}</div>
						<p className="text-xs text-muted-foreground">
							Tokens no quemados
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Valor Total
						</CardTitle>
						<Coins className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							${stats.totalValue.toLocaleString()}
						</div>
						<p className="text-xs text-muted-foreground">
							Valor de activos tokenizados
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Filtros */}
			<Card>
				<CardContent className="pt-6">
					<div className="flex flex-col md:flex-row gap-4">
						<div className="flex-1 relative">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Buscar por token ID, VIN, descripción..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-10"
							/>
						</div>
						<Select value={statusFilter} onValueChange={setStatusFilter}>
							<SelectTrigger className="w-full md:w-[200px]">
								<Filter className="h-4 w-4 mr-2" />
								<SelectValue placeholder="Filtrar por estado" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Todos los estados</SelectItem>
								<SelectItem value={TokenStatus.MINTED}>Mintado</SelectItem>
								<SelectItem value={TokenStatus.TRANSFERRED}>
									Transferido
								</SelectItem>
								<SelectItem value={TokenStatus.BURNED}>Quemado</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>

			{/* Lista de Tokens */}
			{isLoading ? (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					<Skeleton className="h-64 w-full" />
					<Skeleton className="h-64 w-full" />
					<Skeleton className="h-64 w-full" />
				</div>
			) : filteredTokens && filteredTokens.length > 0 ? (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{filteredTokens.map((token: any) => (
						<TokenWalletCard key={token.id} token={token} />
					))}
				</div>
			) : (
				<Card>
					<CardContent className="py-12 text-center">
						<Wallet className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
						<p className="text-lg font-medium mb-2">
							No se encontraron tokens
						</p>
						<p className="text-sm text-muted-foreground">
							{searchQuery || statusFilter !== "all"
								? "Intenta ajustar los filtros de búsqueda"
								: "Aún no tienes tokens en tu wallet"}
						</p>
					</CardContent>
				</Card>
			)}
		</div>
	);
}

