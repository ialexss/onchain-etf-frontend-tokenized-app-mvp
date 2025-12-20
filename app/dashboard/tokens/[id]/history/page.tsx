'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { tokensApi } from '@/lib/api/tokens';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { BackButton } from '@/components/ui/back-button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function TokenHistoryPage() {
  const params = useParams();
  const tokenId = Number(params.id);

  const { data: history, isLoading, error } = useQuery({
    queryKey: ['token-history', tokenId],
    queryFn: () => tokensApi.getHistory(tokenId),
    enabled: !!tokenId,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-slate-500 mb-2">Error al cargar el historial</p>
        <p className="text-sm text-slate-400 mb-4">
          {error instanceof Error ? error.message : 'Error desconocido'}
        </p>
        <BackButton variant="outline" size="default" showIcon={true}>
          Volver al Token
        </BackButton>
      </div>
    );
  }

  if (!history) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-slate-500 mb-4">No se pudo cargar el historial</p>
        <BackButton variant="outline" size="default" showIcon={true}>
          Volver al Token
        </BackButton>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <BackButton />
        <div>
          <h2 className="text-3xl font-bold">Historial Blockchain</h2>
          <p className="text-slate-500 dark:text-slate-400">
            Trazabilidad completa del token en XRPL
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del Token</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <p className="text-sm font-medium text-slate-500">Issuance ID</p>
            <code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
              {history.issuanceId}
            </code>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Emisor</p>
            <div className="flex items-center gap-2">
              <code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded flex-1">
                {history.issuer}
              </code>
              <a
                href={`https://testnet.xrpl.org/accounts/${history.issuer}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="ghost" size="sm">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transacciones ({history.transactions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>De</TableHead>
                <TableHead>A</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.transactions.map((tx, index) => (
                <TableRow key={`${tx.hash}-${index}`}>
                  <TableCell>
                    {format(new Date(tx.date), 'PPP p', { locale: es })}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{tx.type}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {tx.from ? `${tx.from.substring(0, 12)}...` : '-'}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {tx.to ? `${tx.to.substring(0, 12)}...` : '-'}
                  </TableCell>
                  <TableCell>{tx.amount || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={tx.status === 'tesSUCCESS' ? 'default' : 'destructive'}>
                      {tx.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <a
                      href={`https://testnet.xrpl.org/transactions/${tx.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
