"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
	Copy,
	Check,
	KeyRound,
	ShieldOff,
	RefreshCw,
	Plus,
	Eye,
	EyeOff,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { useAuth } from "@/lib/auth/auth-context";
import { apiKeysApi } from "@/lib/api/api-keys";
import { organizationsApi } from "@/lib/api/organizations";
import { rolesApi } from "@/lib/api/roles";
import {
	ApiKey,
	CreateApiKeyPayload,
	CreateApiKeyResponse,
} from "@/types/api-key";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

// ─── One-time raw key display ────────────────────────────────────────────────

function RawKeyDialog({
	open,
	onClose,
	result,
}: {
	open: boolean;
	onClose: () => void;
	result: CreateApiKeyResponse | null;
}) {
	const [copied, setCopied] = useState(false);
	const [visible, setVisible] = useState(false);

	const copy = () => {
		if (!result) return;
		navigator.clipboard.writeText(result.rawKey);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const handleClose = () => {
		setVisible(false);
		onClose();
	};

	return (
		<Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<KeyRound className="h-5 w-5 text-green-500" />
						API Key generada exitosamente
					</DialogTitle>
					<DialogDescription>
						Copia y guarda tu API Key en un lugar seguro.{" "}
						<span className="font-semibold text-destructive">
							No podrás volver a verla.
						</span>
					</DialogDescription>
				</DialogHeader>

				{result && (
					<div className="space-y-4">
						<div className="grid grid-cols-2 gap-4 text-sm">
							<div className="space-y-1">
								<p className="text-xs text-muted-foreground">
									Nombre
								</p>
								<p className="font-medium">{result.name}</p>
							</div>
							<div className="space-y-1">
								<p className="text-xs text-muted-foreground">
									Rol asignado
								</p>
								<p className="font-medium">{result.roleName}</p>
							</div>
							<div className="space-y-1">
								<p className="text-xs text-muted-foreground">
									Organización
								</p>
								<p className="font-medium">
									{result.organizationName}
								</p>
							</div>
							<div className="space-y-1">
								<p className="text-xs text-muted-foreground">
									Expira
								</p>
								<p className="font-medium">
									{result.expiresAt
										? format(
												new Date(result.expiresAt),
												"dd MMM yyyy",
												{ locale: es },
											)
										: "Nunca"}
								</p>
							</div>
						</div>

						<div className="space-y-2">
							<Label className="text-xs text-muted-foreground">
								API Key — valor secreto
							</Label>
							<div className="flex gap-2">
								<div className="relative flex-1">
									<Input
										readOnly
										value={result.rawKey}
										type={visible ? "text" : "password"}
										className="font-mono text-xs pr-10"
										onClick={(e) =>
											(
												e.target as HTMLInputElement
											).select()
										}
									/>
									<button
										type="button"
										onClick={() => setVisible((v) => !v)}
										className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
									>
										{visible ? (
											<EyeOff className="h-4 w-4" />
										) : (
											<Eye className="h-4 w-4" />
										)}
									</button>
								</div>
								<Button
									size="icon"
									variant="outline"
									onClick={copy}
									title="Copiar"
								>
									{copied ? (
										<Check className="h-4 w-4 text-green-500" />
									) : (
										<Copy className="h-4 w-4" />
									)}
								</Button>
							</div>
						</div>

						<div className="rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-3 text-xs text-amber-800 dark:text-amber-200">
							Envía este valor a tu integración B2B. Si lo pierdes
							deberás crear una nueva API Key o rotar la actual.
						</div>
					</div>
				)}

				<DialogFooter>
					<Button onClick={handleClose}>Entendido, cerrar</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

// ─── Create dialog ───────────────────────────────────────────────────────────

function CreateApiKeyDialog({
	orgId,
	onCreated,
}: {
	orgId: number;
	onCreated: (result: CreateApiKeyResponse) => void;
}) {
	const [open, setOpen] = useState(false);
	const [name, setName] = useState("");
	const [roleId, setRoleId] = useState("");
	const [expiresIn, setExpiresIn] =
		useState<NonNullable<CreateApiKeyPayload["expiresIn"]>>("365d");

	const { data: roles = [], isLoading: loadingRoles } = useQuery({
		queryKey: ["roles"],
		queryFn: rolesApi.getAll,
		enabled: open,
	});

	const mutation = useMutation({
		mutationFn: (payload: CreateApiKeyPayload) =>
			apiKeysApi.create(orgId, payload),
		onSuccess: (result) => {
			setOpen(false);
			setName("");
			setRoleId("");
			setExpiresIn("365d");
			onCreated(result);
		},
		onError: () => toast.error("Error al crear la API Key"),
	});

	const handleSubmit = () => {
		if (!name.trim() || !roleId) return;
		mutation.mutate({
			name: name.trim(),
			roleId: Number(roleId),
			expiresIn,
		});
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button>
					<Plus className="h-4 w-4 mr-2" />
					Nueva API Key
				</Button>
			</DialogTrigger>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>Crear API Key</DialogTitle>
					<DialogDescription>
						Genera una credencial de larga duración para integración
						B2B. La clave solo se mostrará una vez.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="key-name">Nombre descriptivo</Label>
						<Input
							id="key-name"
							placeholder="Ej: Integración ERP Aranda"
							value={name}
							onChange={(e) => setName(e.target.value)}
							maxLength={100}
						/>
						<p className="text-xs text-muted-foreground">
							Identifica para qué integración se usará esta clave.
						</p>
					</div>

					<div className="space-y-2">
						<Label>Rol (define los permisos heredados)</Label>
						<Select value={roleId} onValueChange={setRoleId}>
							<SelectTrigger>
								<SelectValue
									placeholder={
										loadingRoles
											? "Cargando roles..."
											: "Selecciona un rol"
									}
								/>
							</SelectTrigger>
							<SelectContent>
								{roles
									.filter((r) => r.isActive)
									.map((r) => (
										<SelectItem
											key={r.id}
											value={String(r.id)}
										>
											<span className="font-medium">
												{r.name}
											</span>
											{r.description && (
												<span className="text-muted-foreground text-xs ml-2">
													— {r.description}
												</span>
											)}
										</SelectItem>
									))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label>Duración de validez</Label>
						<Select
							value={expiresIn}
							onValueChange={(v) =>
								setExpiresIn(
									v as NonNullable<
										CreateApiKeyPayload["expiresIn"]
									>,
								)
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="30d">30 días</SelectItem>
								<SelectItem value="90d">90 días</SelectItem>
								<SelectItem value="365d">1 año</SelectItem>
								<SelectItem value="never">
									Sin expiración
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => setOpen(false)}>
						Cancelar
					</Button>
					<Button
						onClick={handleSubmit}
						disabled={!name.trim() || !roleId || mutation.isPending}
					>
						{mutation.isPending
							? "Generando..."
							: "Generar API Key"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

// ─── Key row actions ─────────────────────────────────────────────────────────

function KeyActions({
	apiKey,
	orgId,
	canDelete,
	onRotated,
}: {
	apiKey: ApiKey;
	orgId: number;
	canDelete: boolean;
	onRotated: (result: CreateApiKeyResponse) => void;
}) {
	const queryClient = useQueryClient();

	const revokeMutation = useMutation({
		mutationFn: () => apiKeysApi.revoke(orgId, apiKey.id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["api-keys", orgId] });
			toast.success("API Key revocada");
		},
		onError: () => toast.error("Error al revocar la API Key"),
	});

	const rotateMutation = useMutation({
		mutationFn: () => apiKeysApi.rotate(orgId, apiKey.id),
		onSuccess: (result) => {
			queryClient.invalidateQueries({ queryKey: ["api-keys", orgId] });
			onRotated(result);
		},
		onError: () => toast.error("Error al rotar la API Key"),
	});

	if (!apiKey.isActive) return null;

	return (
		<div className="flex justify-end gap-2">
			{/* Rotate */}
			<AlertDialog>
				<AlertDialogTrigger asChild>
					<Button
						variant="outline"
						size="sm"
						disabled={rotateMutation.isPending}
					>
						<RefreshCw className="h-3.5 w-3.5 mr-1" />
						Rotar
					</Button>
				</AlertDialogTrigger>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							¿Rotar &quot;{apiKey.name}&quot;?
						</AlertDialogTitle>
						<AlertDialogDescription>
							Se revocará la clave actual y se generará una nueva
							con la misma configuración. Cualquier integración
							que use la clave actual dejará de funcionar
							inmediatamente.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancelar</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => rotateMutation.mutate()}
						>
							Rotar
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Revoke */}
			{canDelete && (
				<AlertDialog>
					<AlertDialogTrigger asChild>
						<Button
							variant="destructive"
							size="sm"
							disabled={revokeMutation.isPending}
						>
							<ShieldOff className="h-3.5 w-3.5 mr-1" />
							Revocar
						</Button>
					</AlertDialogTrigger>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>
								¿Revocar &quot;{apiKey.name}&quot;?
							</AlertDialogTitle>
							<AlertDialogDescription>
								Esta acción desactiva la API Key de forma
								permanente. Cualquier integración que la use
								dejará de funcionar. No se puede deshacer.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancelar</AlertDialogCancel>
							<AlertDialogAction
								className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
								onClick={() => revokeMutation.mutate()}
							>
								Revocar definitivamente
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			)}
		</div>
	);
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function ApiKeysPage() {
	const { user, hasPermission } = useAuth();
	const queryClient = useQueryClient();
	const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
	const [rawKeyResult, setRawKeyResult] =
		useState<CreateApiKeyResponse | null>(null);

	const { data: organizations = [], isLoading: loadingOrgs } = useQuery({
		queryKey: ["organizations"],
		queryFn: organizationsApi.getAll,
		enabled: !!user && hasPermission("organizations:read"),
	});

	const effectiveOrgId = selectedOrgId ?? organizations[0]?.id ?? null;
	const selectedOrg = organizations.find((o) => o.id === effectiveOrgId);

	const { data: apiKeys = [], isLoading: loadingKeys } = useQuery({
		queryKey: ["api-keys", effectiveOrgId],
		queryFn: () => apiKeysApi.list(effectiveOrgId!),
		enabled: !!effectiveOrgId && hasPermission("api_keys:read"),
	});

	const handleCreated = (result: CreateApiKeyResponse) => {
		queryClient.invalidateQueries({
			queryKey: ["api-keys", effectiveOrgId],
		});
		setRawKeyResult(result);
	};

	if (!hasPermission("api_keys:read")) {
		return (
			<div className="flex items-center justify-center h-64">
				<p className="text-slate-500">
					No tienes permisos para ver API Keys
				</p>
			</div>
		);
	}

	const activeKeys = apiKeys.filter((k: ApiKey) => k.isActive);
	const revokedKeys = apiKeys.filter((k: ApiKey) => !k.isActive);

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-3xl font-bold">API Keys</h2>
					<p className="text-slate-500 dark:text-slate-400">
						Gestiona las credenciales B2B de las organizaciones
					</p>
				</div>
				{effectiveOrgId && hasPermission("api_keys:create") && (
					<CreateApiKeyDialog
						orgId={effectiveOrgId}
						onCreated={handleCreated}
					/>
				)}
			</div>

			{/* Stats row */}
			<div className="grid grid-cols-3 gap-4">
				<Card>
					<CardContent className="pt-6">
						<p className="text-2xl font-bold">{apiKeys.length}</p>
						<p className="text-xs text-muted-foreground mt-1">
							Total keys
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<p className="text-2xl font-bold text-green-600">
							{activeKeys.length}
						</p>
						<p className="text-xs text-muted-foreground mt-1">
							Activas
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<p className="text-2xl font-bold text-slate-400">
							{revokedKeys.length}
						</p>
						<p className="text-xs text-muted-foreground mt-1">
							Revocadas
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Organization selector */}
			<Card>
				<CardHeader>
					<CardTitle className="text-base">Organización</CardTitle>
				</CardHeader>
				<CardContent>
					{loadingOrgs ? (
						<Skeleton className="h-10 w-72" />
					) : (
						<Select
							value={
								effectiveOrgId
									? String(effectiveOrgId)
									: undefined
							}
							onValueChange={(v) => setSelectedOrgId(Number(v))}
						>
							<SelectTrigger className="w-full max-w-sm">
								<SelectValue placeholder="Selecciona una organización" />
							</SelectTrigger>
							<SelectContent>
								{organizations.map((org: any) => (
									<SelectItem
										key={org.id}
										value={String(org.id)}
									>
										<span className="font-medium">
											{org.name}
										</span>
										<span className="text-muted-foreground text-xs ml-2">
											({org.type})
										</span>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					)}
				</CardContent>
			</Card>

			{/* Keys table */}
			{effectiveOrgId && (
				<Card>
					<CardHeader>
						<CardTitle>
							API Keys
							{selectedOrg && (
								<span className="font-normal text-sm text-muted-foreground ml-2">
									— {selectedOrg.name}
								</span>
							)}
						</CardTitle>
					</CardHeader>
					<CardContent>
						{loadingKeys ? (
							<div className="space-y-2">
								{[...Array(3)].map((_, i) => (
									<Skeleton key={i} className="h-12 w-full" />
								))}
							</div>
						) : (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Nombre</TableHead>
										<TableHead>Prefijo</TableHead>
										<TableHead>Rol</TableHead>
										<TableHead>Estado</TableHead>
										<TableHead>Expira</TableHead>
										<TableHead>Último uso</TableHead>
										<TableHead>Creada</TableHead>
										<TableHead className="text-right">
											Acciones
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{apiKeys.length > 0 ? (
										apiKeys.map((key: ApiKey) => (
											<TableRow
												key={key.id}
												className={
													!key.isActive
														? "opacity-50"
														: ""
												}
											>
												<TableCell className="font-medium">
													{key.name}
												</TableCell>
												<TableCell>
													<code className="rounded bg-muted px-1.5 py-0.5 text-xs">
														{key.keyPrefix}…
													</code>
												</TableCell>
												<TableCell>
													<Badge variant="outline">
														{key.roleName}
													</Badge>
												</TableCell>
												<TableCell>
													{key.isActive ? (
														<Badge variant="default">
															Activa
														</Badge>
													) : (
														<Badge variant="destructive">
															Revocada
														</Badge>
													)}
												</TableCell>
												<TableCell className="text-sm text-muted-foreground">
													{key.expiresAt
														? format(
																new Date(
																	key.expiresAt,
																),
																"dd MMM yyyy",
																{
																	locale: es,
																},
															)
														: "—"}
												</TableCell>
												<TableCell className="text-sm text-muted-foreground">
													{key.lastUsedAt
														? format(
																new Date(
																	key.lastUsedAt,
																),
																"dd MMM yyyy HH:mm",
																{ locale: es },
															)
														: "Nunca"}
												</TableCell>
												<TableCell className="text-sm text-muted-foreground">
													{format(
														new Date(key.createdAt),
														"dd MMM yyyy",
														{
															locale: es,
														},
													)}
												</TableCell>
												<TableCell>
													<KeyActions
														apiKey={key}
														orgId={effectiveOrgId}
														canDelete={hasPermission(
															"api_keys:delete",
														)}
														onRotated={
															handleCreated
														}
													/>
												</TableCell>
											</TableRow>
										))
									) : (
										<TableRow>
											<TableCell
												colSpan={8}
												className="py-12 text-center text-slate-500"
											>
												<KeyRound className="mx-auto mb-3 h-12 w-12 opacity-30" />
												<p className="font-medium">
													Sin API Keys
												</p>
												<p className="mt-1 text-xs text-muted-foreground">
													Crea una API Key para
													permitir integraciones B2B
													con esta organización.
												</p>
											</TableCell>
										</TableRow>
									)}
								</TableBody>
							</Table>
						)}
					</CardContent>
				</Card>
			)}

			{/* One-time raw key reveal dialog */}
			<RawKeyDialog
				open={!!rawKeyResult}
				result={rawKeyResult}
				onClose={() => setRawKeyResult(null)}
			/>
		</div>
	);
}
