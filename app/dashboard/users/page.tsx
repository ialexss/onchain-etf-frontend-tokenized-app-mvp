'use client';

import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/lib/api/users';
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
import { Users } from 'lucide-react';

export default function UsersPage() {
  const { user, hasPermission } = useAuth();
  
  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.getAll,
    enabled: !!user && hasPermission('users:read'),
  });

  if (!hasPermission('users:read')) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500">No tienes permisos para ver usuarios</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Usuarios</h2>
          <p className="text-slate-500 dark:text-slate-400">
            Gestiona los usuarios del sistema
          </p>
        </div>
        {hasPermission('users:create') && (
          <Button>Crear Usuario</Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuarios</CardTitle>
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
                  <TableHead>Email</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users && users.length > 0 ? (
                  users.map((usr: any) => (
                    <TableRow key={usr.id}>
                      <TableCell className="font-medium">
                        {usr.firstName} {usr.lastName}
                      </TableCell>
                      <TableCell>{usr.email}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {usr.roles?.map((role: any) => (
                            <Badge key={role.id} variant="secondary" className="text-xs">
                              {role.name}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={usr.isActive ? 'default' : 'secondary'}>
                          {usr.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">Ver</Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-slate-500 py-8">
                      <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No hay usuarios registrados</p>
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
