'use client';

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Package, Flame } from 'lucide-react';

interface WithdrawAssetDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
	asset?: {
		vinSerial: string;
		token?: {
			id: number;
			status: string;
		};
	};
	isLoading?: boolean;
}

export function WithdrawAssetDialog({
	open,
	onOpenChange,
	onConfirm,
	asset,
	isLoading = false,
}: WithdrawAssetDialogProps) {
	const hasToken = !!asset?.token;

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle className="flex items-center gap-2">
						<Package className="h-5 w-5 text-primary" />
						Retirar Activo
					</AlertDialogTitle>
					<AlertDialogDescription className="space-y-4">
						<div>
							<p className="text-sm font-medium mb-2">
								Estás a punto de retirar el siguiente activo:
							</p>
							<div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
								<p className="text-sm">
									<span className="font-medium">VIN/Serial:</span>{' '}
									{asset?.vinSerial}
								</p>
							</div>
						</div>

						{hasToken ? (
							<Alert variant="destructive">
								<Flame className="h-4 w-4" />
								<AlertDescription>
									<strong>⚠️ Acción Crítica:</strong> Este proceso
									realizará las siguientes acciones:
									<ul className="list-disc list-inside mt-2 space-y-1 text-xs">
										<li>
											Validará que el cliente posee el token
										</li>
										<li>
											Validará el balance del token en la
											blockchain XRPL
										</li>
										<li>
											Confirmará el retiro físico del activo
										</li>
										<li>
											<strong>
												Quemará el token MPT en XRPL
											</strong>
										</li>
										<li>
											El estado del activo cambiará a{' '}
											<strong>BURNED</strong>
										</li>
									</ul>
									<p className="mt-2 text-xs font-medium">
										Nota: El token solo puede ser quemado si
										está en la billetera del cliente. Si el
										token está en el banco (después de un
										endoso), primero debe ser devuelto al
										cliente mediante el pago del endoso.
									</p>
								</AlertDescription>
							</Alert>
						) : (
							<Alert>
								<AlertCircle className="h-4 w-4" />
								<AlertDescription>
									Este activo no está tokenizado. Solo se
									confirmará el retiro físico del activo.
								</AlertDescription>
							</Alert>
						)}

						<p className="text-sm text-slate-600 dark:text-slate-400">
							Esta acción es <strong>irreversible</strong>. ¿Deseas
							continuar?
						</p>
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isLoading}>
						Cancelar
					</AlertDialogCancel>
					<AlertDialogAction
						onClick={onConfirm}
						disabled={isLoading}
						className={hasToken ? 'bg-destructive hover:bg-destructive/90' : ''}
					>
						{isLoading ? (
							<>
								<Package className="mr-2 h-4 w-4 animate-pulse" />
								Procesando...
							</>
						) : (
							<>
								{hasToken ? (
									<>
										<Flame className="mr-2 h-4 w-4" />
										Confirmar Retiro y Quemar Token
									</>
								) : (
									<>
										<Package className="mr-2 h-4 w-4" />
										Confirmar Retiro
									</>
								)}
							</>
						)}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

