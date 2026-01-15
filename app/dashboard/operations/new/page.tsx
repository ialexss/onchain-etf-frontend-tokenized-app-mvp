"use client";

import { CreateOperationWizard } from "@/components/operations/create-operation-wizard";
import { BackButton } from "@/components/ui/back-button";

export default function NewOperationPage() {
	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<BackButton href="/dashboard/operations" />
				<div>
					<h2 className="text-3xl font-bold">Nueva Operación</h2>
					<p className="text-slate-500 dark:text-slate-400">
						Crear una nueva operación de depósito para tokenización
					</p>
				</div>
			</div>

			<CreateOperationWizard />
		</div>
	);
}
