"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AtomicAssetBundleSignatures } from "@/components/shared/atomic-asset-bundle-signatures";
import { FileSignature } from "lucide-react";

interface AssetBundleSignaturesProps {
	assetId: number;
	operationId: number;
	canRequestSignatures?: boolean;
}

export function AssetBundleSignatures({
	assetId,
	operationId,
	canRequestSignatures = false,
}: AssetBundleSignaturesProps) {
	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle className="flex items-center gap-2">
							<FileSignature className="h-5 w-5" />
							Estado de Firmas
						</CardTitle>
						<CardDescription>
							Gestión de firmas digitales del Paquete de Activos
						</CardDescription>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<AtomicAssetBundleSignatures
					assetId={assetId}
					operationId={operationId}
				/>
			</CardContent>
		</Card>
	);
}
