"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth/auth-context";
import { documentsApi } from "@/lib/api/documents";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	FileText,
	CheckCircle,
	Clock,
	Briefcase,
	ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { DocumentViewer } from "@/components/documents/document-viewer";
import { Skeleton } from "@/components/ui/skeleton";
import { Document, DocumentType } from "@/types/document";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Separator } from "@/components/ui/separator";

export default function DocumentsPage() {
	const { user } = useAuth();

	const { data: documents, isLoading } = useQuery({
		queryKey: ["documents"],
		queryFn: documentsApi.getAll,
		enabled: !!user,
	});

	// Separar documentos por estado de firma
	// CD y BP: warehouse y cliente
	// Pagaré: solo banco y cliente
	const pendingDocuments =
		documents?.filter((doc: Document) => {
			if (doc.type === DocumentType.PROMISSORY_NOTE) {
				// Pagaré: solo banco y cliente
				return !doc.signedByBank || !doc.signedByClient;
			}
			// CD y BP: warehouse y cliente
			return !doc.signedByWarehouse || !doc.signedByClient;
		}) || [];

	const signedDocuments =
		documents?.filter((doc: Document) => {
			if (doc.type === DocumentType.PROMISSORY_NOTE) {
				// Pagaré: solo banco y cliente
				return doc.signedByBank && doc.signedByClient;
			}
			// CD y BP: warehouse y cliente
			return doc.signedByWarehouse && doc.signedByClient;
		}) || [];

	const getDocumentTypeName = (type: DocumentType) => {
		switch (type) {
			case DocumentType.CD:
				return "Certificado de Depósito";
			case DocumentType.BP:
				return "Bono de Prenda";
			case DocumentType.PROMISSORY_NOTE:
				return "Pagaré";
			default:
				return type;
		}
	};

	const getDocumentTypeBadge = (type: DocumentType) => {
		const variants: Record<
			DocumentType,
			"default" | "secondary" | "outline" | "destructive"
		> = {
			[DocumentType.CD]: "default",
			[DocumentType.BP]: "secondary",
			[DocumentType.PROMISSORY_NOTE]: "outline",
			[DocumentType.ENDORSEMENT]: "destructive",
		};
		return variants[type] || "default";
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-3xl font-bold">Documentos</h2>
					<p className="text-zinc-500 dark:text-zinc-400">
						Gestiona certificados de depósito, bonos de prenda y
						documentos de endoso
					</p>
				</div>
			</div>

			<div className="grid gap-6">
				{/* Lista de documentos pendientes de firma */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Clock className="h-5 w-5 text-amber-500" />
							Documentos Pendientes de Firma (
							{pendingDocuments.length})
						</CardTitle>
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<div className="space-y-4">
								<Skeleton className="h-32 w-full" />
								<Skeleton className="h-32 w-full" />
							</div>
						) : pendingDocuments.length > 0 ? (
							<div className="space-y-4">
								{pendingDocuments.map((doc: Document) => (
									<Card
										key={doc.id}
										className="border-l-4 border-l-amber-500"
									>
										<CardContent className="pt-6">
											<div className="space-y-4">
												{/* Información del documento */}
												<div className="flex items-start justify-between">
													<Badge
														variant={getDocumentTypeBadge(
															doc.type
														)}
													>
														{getDocumentTypeName(
															doc.type
														)}
													</Badge>
													<Badge
														variant="secondary"
														className="flex items-center gap-1"
													>
														<Clock className="h-3 w-3" />
														Pendiente
													</Badge>
												</div>

												<Separator />

												{/* Información de operación */}
												{(doc as any).operation && (
													<div className="space-y-2">
														<p className="text-sm font-medium text-slate-700 dark:text-slate-300">
															Operación
														</p>
														<div className="flex items-center gap-2 flex-wrap">
															<Briefcase className="h-4 w-4 text-slate-500" />
															<span className="text-sm">
																Operación #
																{
																	(doc as any)
																		.operation
																		.id
																}
															</span>
															{(doc as any)
																.operation
																.operationNumber && (
																<span className="text-sm text-slate-500">
																	(
																	{
																		(
																			doc as any
																		)
																			.operation
																			.operationNumber
																	}
																	)
																</span>
															)}
															<Link
																href={`/dashboard/operations/${
																	(doc as any)
																		.operation
																		.id
																}`}
															>
																<Button
																	variant="ghost"
																	size="sm"
																>
																	Ver
																	Operación
																	<ExternalLink className="ml-2 h-3 w-3" />
																</Button>
															</Link>
														</div>
													</div>
												)}

												<Separator />

												{/* Estado de firmas */}
												<div className="space-y-2">
													<p className="text-sm font-medium">
														Estado de firmas:
													</p>
													<div className="space-y-2">
														{/* CD y BP: warehouse y cliente */}
														{doc.type !==
															DocumentType.PROMISSORY_NOTE && (
															<div className="flex items-center gap-2">
																{doc.signedByWarehouse ? (
																	<CheckCircle className="h-4 w-4 text-green-500" />
																) : (
																	<Clock className="h-4 w-4 text-amber-500" />
																)}
																<span className="text-sm">
																	Almacén
																</span>
																{doc.warehouseSignatureDate && (
																	<span className="text-xs text-slate-500">
																		{format(
																			new Date(
																				doc.warehouseSignatureDate
																			),
																			"PPP",
																			{
																				locale: es,
																			}
																		)}
																	</span>
																)}
															</div>
														)}
														{/* Todos: cliente */}
														<div className="flex items-center gap-2">
															{doc.signedByClient ? (
																<CheckCircle className="h-4 w-4 text-green-500" />
															) : (
																<Clock className="h-4 w-4 text-amber-500" />
															)}
															<span className="text-sm">
																Cliente
															</span>
															{doc.clientSignatureDate && (
																<span className="text-xs text-slate-500">
																	{format(
																		new Date(
																			doc.clientSignatureDate
																		),
																		"PPP",
																		{
																			locale: es,
																		}
																	)}
																</span>
															)}
														</div>
														{/* Pagaré: banco y cliente */}
														{doc.type ===
															DocumentType.PROMISSORY_NOTE && (
															<div className="flex items-center gap-2">
																{doc.signedByBank ? (
																	<CheckCircle className="h-4 w-4 text-green-500" />
																) : (
																	<Clock className="h-4 w-4 text-amber-500" />
																)}
																<span className="text-sm">
																	Entidad
																	Financiera
																</span>
																{doc.bankSignatureDate && (
																	<span className="text-xs text-slate-500">
																		{format(
																			new Date(
																				doc.bankSignatureDate
																			),
																			"PPP",
																			{
																				locale: es,
																			}
																		)}
																	</span>
																)}
															</div>
														)}
													</div>
												</div>

												{/* Acciones */}
												<div className="flex gap-2 pt-2">
													<DocumentViewer
														document={doc}
														canSign={true}
													/>
												</div>
											</div>
										</CardContent>
									</Card>
								))}
							</div>
						) : (
							<div className="text-center text-slate-500 py-8">
								<FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
								<p>No hay documentos pendientes de firma</p>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Lista de documentos firmados */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<CheckCircle className="h-5 w-5 text-green-500" />
							Documentos Firmados ({signedDocuments.length})
						</CardTitle>
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<div className="space-y-4">
								<Skeleton className="h-32 w-full" />
								<Skeleton className="h-32 w-full" />
							</div>
						) : signedDocuments.length > 0 ? (
							<div className="space-y-4">
								{signedDocuments.map((doc: Document) => (
									<Card
										key={doc.id}
										className="border-l-4 border-l-green-500"
									>
										<CardContent className="pt-6">
											<div className="space-y-4">
												{/* Información del documento */}
												<div className="flex items-start justify-between">
													<Badge
														variant={getDocumentTypeBadge(
															doc.type
														)}
													>
														{getDocumentTypeName(
															doc.type
														)}
													</Badge>
													<Badge
														variant="default"
														className="flex items-center gap-1"
													>
														<CheckCircle className="h-3 w-3" />
														Firmado
													</Badge>
												</div>

												<Separator />

												{/* Información de operación */}
												{(doc as any).operation && (
													<div className="space-y-2">
														<p className="text-sm font-medium text-slate-700 dark:text-slate-300">
															Operación
														</p>
														<div className="flex items-center gap-2 flex-wrap">
															<Briefcase className="h-4 w-4 text-slate-500" />
															<span className="text-sm">
																Operación #
																{
																	(doc as any)
																		.operation
																		.id
																}
															</span>
															{(doc as any)
																.operation
																.operationNumber && (
																<span className="text-sm text-slate-500">
																	(
																	{
																		(
																			doc as any
																		)
																			.operation
																			.operationNumber
																	}
																	)
																</span>
															)}
															<Link
																href={`/dashboard/operations/${
																	(doc as any)
																		.operation
																		.id
																}`}
															>
																<Button
																	variant="ghost"
																	size="sm"
																>
																	Ver
																	Operación
																	<ExternalLink className="ml-2 h-3 w-3" />
																</Button>
															</Link>
														</div>
													</div>
												)}

												<Separator />

												{/* Estado de firmas */}
												<div className="space-y-2">
													<p className="text-sm font-medium">
														Firmado por:
													</p>
													<div className="space-y-2">
														{/* CD y BP: warehouse y cliente */}
														{doc.type !==
															DocumentType.PROMISSORY_NOTE &&
															doc.warehouseSignatureDate && (
																<div className="flex items-center gap-2">
																	<CheckCircle className="h-4 w-4 text-green-500" />
																	<span className="text-sm">
																		Almacén
																	</span>
																	<span className="text-xs text-slate-500">
																		{format(
																			new Date(
																				doc.warehouseSignatureDate
																			),
																			"PPP",
																			{
																				locale: es,
																			}
																		)}
																	</span>
																</div>
															)}
														{/* Todos: cliente */}
														{doc.clientSignatureDate && (
															<div className="flex items-center gap-2">
																<CheckCircle className="h-4 w-4 text-green-500" />
																<span className="text-sm">
																	Cliente
																</span>
																<span className="text-xs text-slate-500">
																	{format(
																		new Date(
																			doc.clientSignatureDate
																		),
																		"PPP",
																		{
																			locale: es,
																		}
																	)}
																</span>
															</div>
														)}
														{/* Pagaré: banco y cliente */}
														{doc.type ===
															DocumentType.PROMISSORY_NOTE &&
															doc.bankSignatureDate && (
																<div className="flex items-center gap-2">
																	<CheckCircle className="h-4 w-4 text-green-500" />
																	<span className="text-sm">
																		Entidad
																		Financiera
																	</span>
																	<span className="text-xs text-slate-500">
																		{format(
																			new Date(
																				doc.bankSignatureDate
																			),
																			"PPP",
																			{
																				locale: es,
																			}
																		)}
																	</span>
																</div>
															)}
													</div>
												</div>

												{/* Acciones */}
												<div className="flex gap-2 pt-2">
													<DocumentViewer
														document={doc}
														canSign={false}
													/>
												</div>
											</div>
										</CardContent>
									</Card>
								))}
							</div>
						) : (
							<div className="text-center text-slate-500 py-8">
								<FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
								<p>No hay documentos firmados</p>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
