"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth/auth-context";
import { endorsementsApi } from "@/lib/api/endorsements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateEndorsementDialog } from "@/components/endorsements/create-endorsement-dialog";
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
import { FileText, CheckCircle, Clock, Plus } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function EndorsementsPage() {
	const { user, hasPermission } = useAuth();
	const [createDialogOpen, setCreateDialogOpen] = useState(false);

	const { data: endorsements, isLoading } = useQuery({
		queryKey: ["endorsements"],
		queryFn: endorsementsApi.getAll,
		enabled: !!user,
	});

	const getStatusBadge = (status: string) => {
		const variants: Record<
			string,
			"default" | "secondary" | "destructive" | "outline"
		> = {
			PENDING: "secondary",
			SIGNED: "default",
			TRANSFERRED: "outline",
			COMPLETED: "default",
			CANCELLED: "destructive",
		};
		return (
			<Badge variant={variants[status] || "secondary"}>{status}</Badge>
		);
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-3xl font-bold">Endosos</h2>
					<p className="text-slate-500 dark:text-slate-400">
						Gestiona los endosos de activos tokenizados
					</p>
				</div>
				{hasPermission("endorsements:create") && (
					<Button onClick={() => setCreateDialogOpen(true)}>
						<Plus className="mr-2 h-4 w-4" />
						Crear Endoso
					</Button>
				)}
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Lista de Endosos</CardTitle>
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
									<TableHead>Monto Principal</TableHead>
									<TableHead>Tasa de Interés</TableHead>
									<TableHead>Fecha de Pago</TableHead>
									<TableHead>Estado</TableHead>
									<TableHead>Firmas</TableHead>
									<TableHead>Acciones</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{endorsements && endorsements.length > 0 ? (
									endorsements.map((endorsement: any) => (
										<TableRow key={endorsement.id}>
											<TableCell className="font-medium">
												#{endorsement.id}
											</TableCell>
											<TableCell>
												$
												{endorsement.principalAmount?.toLocaleString()}
											</TableCell>
											<TableCell>
												{endorsement.interestRate}%
											</TableCell>
											<TableCell>
												{format(
													new Date(
														endorsement.repaymentDate
													),
													"PPP",
													{ locale: es }
												)}
											</TableCell>
											<TableCell>
												{getStatusBadge(
													endorsement.status
												)}
											</TableCell>
											<TableCell>
												<div className="flex gap-2">
													{endorsement.signedByClient ? (
														<span title="Firmado por Cliente">
															<CheckCircle className="h-4 w-4 text-green-500" />
														</span>
													) : (
														<span title="Pendiente Cliente">
															<Clock className="h-4 w-4 text-slate-400" />
														</span>
													)}
													{endorsement.signedByBank ? (
														<span title="Firmado por Banco">
															<CheckCircle className="h-4 w-4 text-green-500" />
														</span>
													) : (
														<span title="Pendiente Banco">
															<Clock className="h-4 w-4 text-slate-400" />
														</span>
													)}
												</div>
											</TableCell>
											<TableCell>
												<Link
													href={`/dashboard/endorsements/${endorsement.id}`}
												>
													<Button
														variant="ghost"
														size="sm"
													>
														Ver
													</Button>
												</Link>
											</TableCell>
										</TableRow>
									))
								) : (
									<TableRow>
										<TableCell
											colSpan={7}
											className="text-center text-slate-500 py-8"
										>
											<FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
											<p>No hay endosos registrados</p>
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>

			<CreateEndorsementDialog
				open={createDialogOpen}
				onOpenChange={setCreateDialogOpen}
			/>
		</div>
	);
}
