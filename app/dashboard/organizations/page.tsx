'use client';

import { useQuery } from '@tanstack/react-query';
import { organizationsApi } from '@/lib/api/organizations';
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
import { useAuth } from '@/lib/auth/auth-context';
import { Building2 } from 'lucide-react';
import { OrganizationType } from '@/types/organization';

export default function OrganizationsPage() {
  const { user, hasPermission } = useAuth();
  
  const { data: organizations, isLoading } = useQuery({
    queryKey: ['organizations'],
    queryFn: organizationsApi.getAll,
    enabled: !!user && hasPermission('organizations:read'),
  });

  const getTypeBadge = (type: OrganizationType) => {
    const colors: Record<OrganizationType, "default" | "secondary" | "destructive" | "outline"> = {
      ETF: 'default',
      WAREHOUSE: 'secondary',
      CLIENT: 'outline',
      BANK: 'secondary',
    };
    return <Badge variant={colors[type] || 'secondary'}>{type}</Badge>;
  };

  if (!hasPermission('organizations:read')) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500">No tienes permisos para ver organizaciones</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Organizaciones</h2>
          <p className="text-slate-500 dark:text-slate-400">
            Gestiona las organizaciones del sistema
          </p>
        </div>
        {hasPermission('organizations:create') && (
          <Button>Crear Organización</Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Organizaciones</CardTitle>
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
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>RUC</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizations && organizations.length > 0 ? (
                  organizations.map((org: any) => (
                    <TableRow key={org.id}>
                      <TableCell className="font-medium">{org.name}</TableCell>
                      <TableCell>{getTypeBadge(org.type)}</TableCell>
                      <TableCell>{org.taxId}</TableCell>
                      <TableCell>{org.contactEmail || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={org.isActive ? 'default' : 'secondary'}>
                          {org.isActive ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">Ver</Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                      <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No hay organizaciones registradas</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
