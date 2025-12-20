'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth/auth-context';
import { documentsApi } from '@/lib/api/documents';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { DocumentViewer } from '@/components/documents/document-viewer';
import { Skeleton } from '@/components/ui/skeleton';

export default function DocumentsPage() {
  const { user } = useAuth();
  
  const { data: documents, isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: documentsApi.getAll,
    enabled: !!user,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Documentos</h2>
          <p className="text-slate-500 dark:text-slate-400">
            Gestiona certificados de depósito, bonos de prenda y documentos de endoso
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {/* Lista de documentos pendientes de firma */}
        <Card>
          <CardHeader>
            <CardTitle>Documentos Pendientes de Firma</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : documents && documents.length > 0 ? (
              <div className="space-y-4">
                {documents.map((doc: any) => (
                  <DocumentViewer key={doc.id} document={doc} canSign={true} />
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
            <CardTitle>Documentos Firmados</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
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
