'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { assetsApi } from '@/lib/api/assets';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context';
import { Package, Plus } from 'lucide-react';
import { CreateAssetDialog } from '@/components/assets/create-asset-dialog';

export default function AssetsPage() {
  const { user, hasPermission } = useAuth();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  
  const { data: assets, isLoading } = useQuery({
    queryKey: ['assets'],
    queryFn: assetsApi.getAll,
    enabled: !!user,
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      STORED: 'secondary',
      PLEDGED: 'default',
      DELIVERED: 'outline',
      BURNED: 'destructive',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Activos</h2>
          <p className="text-slate-500 dark:text-slate-400">
            Gestiona los activos físicos tokenizados
          </p>
        </div>
        {hasPermission('assets:create') && (
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Crear Activo
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Activos</CardTitle>
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
                  <TableHead>VIN/Serial</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Token</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets && assets.length > 0 ? (
                  assets.map((asset: any) => (
                    <TableRow key={asset.id}>
                      <TableCell className="font-medium">{asset.vinSerial}</TableCell>
                      <TableCell>{asset.description || '-'}</TableCell>
                      <TableCell>${asset.value?.toLocaleString()}</TableCell>
                      <TableCell>{asset.client?.name || '-'}</TableCell>
                      <TableCell>{getStatusBadge(asset.status)}</TableCell>
                      <TableCell>
                        {asset.token ? (
                          <Link href={`/dashboard/tokens/${asset.token.id}`}>
                            <Badge variant="default" className="cursor-pointer hover:bg-primary/80">
                              Token #{asset.token.id}
                            </Badge>
                          </Link>
                        ) : (
                          <Badge variant="secondary">No tokenizado</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Link href={`/dashboard/assets/${asset.id}`}>
                          <Button variant="ghost" size="sm">Ver</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                      <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No hay activos registrados</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CreateAssetDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  );
}
