'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { endorsementsApi } from '@/lib/api/endorsements';
import { useAuth } from '@/lib/auth/auth-context';
import { SignatureDialog } from '@/components/documents/signature-dialog';
import { SignerType } from '@/types/document';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { CheckCircle, Clock, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { BackButton } from '@/components/ui/back-button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function EndorsementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const endorsementId = Number(params.id);
  const [signDialogOpen, setSignDialogOpen] = useState(false);

  const { data: endorsement, isLoading } = useQuery({
    queryKey: ['endorsement', endorsementId],
    queryFn: () => endorsementsApi.getById(endorsementId),
    enabled: !!endorsementId,
  });

  const signMutation = useMutation({
    mutationFn: ({ email, signerType }: { email: string; signerType: 'CLIENT' | 'BANK' }) =>
      endorsementsApi.sign(endorsementId, { 
        signerEmail: email, 
        signerType: signerType
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['endorsement', endorsementId] });
      queryClient.invalidateQueries({ queryKey: ['endorsements'] });
      toast.success('Endoso firmado exitosamente');
      setSignDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al firmar el endoso');
    },
  });

  const executeMutation = useMutation({
    mutationFn: () => endorsementsApi.execute(endorsementId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['endorsement', endorsementId] });
      queryClient.invalidateQueries({ queryKey: ['endorsements'] });
      toast.success('Endoso ejecutado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al ejecutar el endoso');
    },
  });

  const repayMutation = useMutation({
    mutationFn: () => endorsementsApi.repay(endorsementId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['endorsement', endorsementId] });
      queryClient.invalidateQueries({ queryKey: ['endorsements'] });
      toast.success('Endoso pagado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al pagar el endoso');
    },
  });

  const canSign = () => {
    if (!user || !endorsement) return false;
    const orgType = user.organizations?.[0]?.type;
    
    if (orgType === 'CLIENT' && !endorsement.signedByClient) return true;
    if (orgType === 'BANK' && !endorsement.signedByBank) return true;
    
    return false;
  };

  const getSignerType = (): SignerType | null => {
    if (!user) return null;
    const orgType = user.organizations?.[0]?.type;
    if (orgType === 'CLIENT') return SignerType.CLIENT;
    if (orgType === 'BANK') return SignerType.BANK;
    return null;
  };

  const handleSign = async (email: string, signerType: SignerType) => {
    // Los endosos solo pueden ser firmados por CLIENT o BANK
    if (signerType !== SignerType.CLIENT && signerType !== SignerType.BANK) {
      throw new Error('Los endosos solo pueden ser firmados por CLIENT o BANK');
    }
    await signMutation.mutateAsync({ 
      email, 
      signerType: signerType as 'CLIENT' | 'BANK'
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!endorsement) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-slate-500 mb-4">Endoso no encontrado</p>
        <BackButton variant="outline" size="default" showIcon={true}>
          Volver a Endosos
        </BackButton>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <BackButton />
        <div>
          <h2 className="text-3xl font-bold">Detalle del Endoso</h2>
          <p className="text-slate-500 dark:text-slate-400">
            ID: {endorsement.id}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Información del Endoso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Monto Principal</p>
              <p className="text-2xl font-bold">${endorsement.principalAmount?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Tasa de Interés</p>
              <p className="text-xl font-semibold">{endorsement.interestRate}%</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Fecha de Pago</p>
              <p className="text-lg">
                {format(new Date(endorsement.repaymentDate), 'PPP', { locale: es })}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Estado</p>
              <Badge variant="default">{endorsement.status}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estado de Firmas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {endorsement.signedByClient ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <Clock className="h-5 w-5 text-slate-400" />
                )}
                <span>Cliente (CLIENT)</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {endorsement.signedByBank ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <Clock className="h-5 w-5 text-slate-400" />
                )}
                <span>Banco (BANK)</span>
              </div>
            </div>
            
            {canSign() && getSignerType() && (
              <Button onClick={() => setSignDialogOpen(true)} className="w-full">
                Firmar Endoso
              </Button>
            )}

            {endorsement.status === 'SIGNED' && hasPermission('endorsements:execute') && (
              <Button 
                onClick={() => executeMutation.mutate()} 
                disabled={executeMutation.isPending}
                className="w-full"
              >
                {executeMutation.isPending ? 'Ejecutando...' : 'Ejecutar Endoso'}
              </Button>
            )}

            {endorsement.status === 'TRANSFERRED' && hasPermission('endorsements:repay') && (
              <Button 
                onClick={() => repayMutation.mutate()} 
                disabled={repayMutation.isPending}
                variant="outline"
                className="w-full"
              >
                {repayMutation.isPending ? 'Pagando...' : 'Pagar Endoso'}
              </Button>
            )}

            {endorsement.transferTxHash && (
              <div className="pt-4 border-t">
                <p className="text-sm font-medium text-slate-500 mb-2">Transacción Blockchain</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                    {endorsement.transferTxHash.substring(0, 16)}...
                  </code>
                  <a
                    href={`https://testnet.xrpl.org/transactions/${endorsement.transferTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </a>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {signDialogOpen && getSignerType() && (
        <SignatureDialog
          open={signDialogOpen}
          onOpenChange={setSignDialogOpen}
          onConfirm={handleSign}
          signerType={getSignerType()!}
          documentType="endoso"
        />
      )}
    </div>
  );
}
