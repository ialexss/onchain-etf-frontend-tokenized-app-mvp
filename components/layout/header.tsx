'use client';

import { useAuth } from '@/lib/auth/auth-context';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { operationsApi } from '@/lib/api/operations';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Moon, Sun, LogOut, User, Briefcase } from 'lucide-react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { MobileSidebarTrigger } from './app-sidebar';
import { Breadcrumbs } from './breadcrumbs';

export function Header() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();

  // Detectar si estamos en una página de operación
  const operationIdMatch = pathname.match(/\/operations\/(\d+)/);
  const operationId = operationIdMatch ? parseInt(operationIdMatch[1]) : null;

  // Obtener información de la operación si estamos en una página de detalle
  const { data: operation } = useQuery({
    queryKey: ['operations', operationId],
    queryFn: () => operationsApi.getById(operationId!),
    enabled: !!operationId,
  });

  const getInitials = () => {
    if (!user) return '?';
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  };

  const getUserOrgName = () => {
    return user?.organizations?.[0]?.name || 'Sin organización';
  };

  const showBreadcrumbs = pathname.startsWith('/dashboard') && pathname !== '/dashboard/overview';

  return (
    <header className="flex flex-col border-b bg-white dark:bg-zinc-950">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <MobileSidebarTrigger />
          <div>
            <h1 className="text-xl font-semibold">Dashboard</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{getUserOrgName()}</p>
          </div>
          {operation && (
            <div className="ml-4 flex items-center gap-2 border-l pl-4">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  {operation.operationNumber || `OP-${operation.id}`}
                </p>
                <Badge variant="outline" className="text-xs">
                  {operation.status}
                </Badge>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar>
                  <AvatarFallback>{getInitials()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-zinc-500">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile" className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  Perfil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {showBreadcrumbs && (
        <div className="border-t bg-slate-50 px-4 py-2 dark:bg-zinc-900 md:px-6">
          <Breadcrumbs />
        </div>
      )}
    </header>
  );
}

