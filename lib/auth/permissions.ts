import { AuthUser } from '@/types/auth';
import { OrganizationType } from '@/types/organization';

/**
 * Verifica si un usuario tiene un permiso específico
 */
export function hasPermission(user: AuthUser | null, permission: string): boolean {
  if (!user) return false;
  return user.permissions?.includes(permission) ?? false;
}

/**
 * Verifica si un usuario tiene alguno de los roles especificados
 */
export function hasAnyRole(user: AuthUser | null, roles: string[]): boolean {
  if (!user) return false;
  return user.roles?.some(r => roles.includes(r.name)) ?? false;
}

/**
 * Obtiene el tipo de organización del usuario
 */
export function getUserOrganizationType(user: AuthUser | null): OrganizationType | null {
  if (!user || !user.organizations || user.organizations.length === 0) {
    return null;
  }
  return user.organizations[0].type;
}

/**
 * Verifica si el usuario pertenece a un tipo de organización específico
 */
export function isOrganizationType(user: AuthUser | null, type: OrganizationType): boolean {
  return getUserOrganizationType(user) === type;
}

