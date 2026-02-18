"use client";

import { useAuth } from "@/lib/auth/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Coins, FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { assetsApi } from "@/lib/api/assets";
import { tokensApi } from "@/lib/api/tokens";
import { Skeleton } from "@/components/ui/skeleton";

export default function OverviewPage() {
	const { user } = useAuth();

	const { data: assets, isLoading: assetsLoading } = useQuery({
		queryKey: ["assets"],
		queryFn: assetsApi.getAll,
		enabled: !!user,
	});

	const { data: tokens, isLoading: tokensLoading } = useQuery({
		queryKey: ["tokens"],
		queryFn: tokensApi.getAll,
		enabled: !!user,
	});


	const stats = [
		{
			title: "Total Activos",
			value: assets?.length || 0,
			icon: Package,
			description: "Activos registrados",
		},
		{
			title: "Tokens",
			value: tokens?.length || 0,
			icon: Coins,
			description: "Tokens emitidos",
		},
	];

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-3xl font-bold">
					Bienvenido, {user?.firstName}
				</h2>
				<p className="text-zinc-500 dark:text-zinc-400">
					Organización:{" "}
					{user?.organizations?.[0]?.name ||
						"Sin organización asignada"}
				</p>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{stats.map((stat) => {
					const Icon = stat.icon;
					const isLoading =
						assetsLoading || tokensLoading;

					return (
						<Card key={stat.title}>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									{stat.title}
								</CardTitle>
								<Icon className="h-4 w-4 text-zinc-500" />
							</CardHeader>
							<CardContent>
								{isLoading ? (
									<Skeleton className="h-8 w-20" />
								) : (
									<>
										<div className="text-2xl font-bold">
											{stat.value}
										</div>
										<p className="text-xs text-zinc-500 dark:text-zinc-400">
											{stat.description}
										</p>
									</>
								)}
							</CardContent>
						</Card>
					);
				})}
			</div>
		</div>
	);
}
