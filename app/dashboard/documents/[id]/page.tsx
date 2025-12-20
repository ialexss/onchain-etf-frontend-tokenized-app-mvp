'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { documentsApi } from '@/lib/api/documents';
import { useAuth } from '@/lib/auth/auth-context';
import { DocumentViewer } from '@/components/documents/document-viewer';
import { SignatureDialog } from '@/components/documents/signature-dialog';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SignerType } from '@/types/document';
import { toast } from 'sonner';
import { BackButton } from '@/components/ui/back-button';

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const documentId = Number(params.id);
  const [signDialogOpen, setSignDialogOpen] = useState(false);

  const { data: document, isLoading } = useQuery({
    queryKey: ['document', documentId],
    queryFn: () => documentsApi.getById(documentId),
    enabled: !!documentId,
  });

  const signMutation = useMutation({
    mutationFn: ({ email, signerType }: { email: string; signerType: SignerType }) =>
      documentsApi.signDocument(documentId, { signerEmail: email, signerType }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', documentId] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Documento firmado exitosamente');
      setSignDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al firmar el documento');
    },
  });

  const canSign = () => {
    if (!user || !document) return false;
    const orgType = user.organizations?.[0]?.type;
    
    if (document.type === 'CD' || document.type === 'BP') {
      if (orgType === 'WAREHOUSE' && !document.signedByWarehouse) return true;
      if (orgType === 'CLIENT' && !document.signedByClient) return true;
    }
    
    if (document.type === 'ENDORSEMENT') {
      if (orgType === 'CLIENT' && !document.signedByClient) return true;
      if (orgType === 'BANK' && !document.signedByBank) return true;
    }
    
    return false;
  };

  const getSignerType = (): SignerType | null => {
    if (!user) return null;
    const orgType = user.organizations?.[0]?.type;
    if (orgType === 'WAREHOUSE') return SignerType.WAREHOUSE;
    if (orgType === 'CLIENT') return SignerType.CLIENT;
    if (orgType === 'BANK') return SignerType.BANK;
    return null;
  };

  const handleSign = async (email: string, signerType: SignerType) => {
    await signMutation.mutateAsync({ email, signerType });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-slate-500 mb-4">Documento no encontrado</p>
        <BackButton variant="outline" size="default" showIcon={true}>
          Volver a Documentos
        </BackButton>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <BackButton />
        <div>
          <h2 className="text-3xl font-bold">Detalle del Documento</h2>
          <p className="text-slate-500 dark:text-slate-400">
            ID: {document.id} - Versión: {document.version}
          </p>
        </div>
      </div>

      <DocumentViewer
        document={document}
        canSign={canSign()}
        onSign={() => setSignDialogOpen(true)}
      />

      {signDialogOpen && getSignerType() && (
        <SignatureDialog
          open={signDialogOpen}
          onOpenChange={setSignDialogOpen}
          onConfirm={handleSign}
          signerType={getSignerType()!}
          documentType={document.type}
        />
      )}
    </div>
  );
}
