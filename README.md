# Frontend - ONCHAIN ETF Platform

Frontend de la plataforma de tokenización de activos reales construido con Next.js 14, ShadCN UI y Tailwind CSS.

## Características

- ✅ Autenticación JWT con refresh automático
- ✅ Sistema de roles y permisos dinámico
- ✅ Sidebar escalable con navegación por permisos y tipo de organización
- ✅ Dashboards específicos por tipo de organización (ETF, WAREHOUSE, CLIENT, BANK)
- ✅ Firma digital de documentos PDF (CD, BP, Endosos)
- ✅ Visualización de historial blockchain de tokens
- ✅ Modo oscuro/claro con next-themes
- ✅ Diseño responsivo (mobile, tablet, desktop)
- ✅ UI profesional y minimalista con ShadCN

## Configuración

### Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### Instalación

```bash
npm install
```

### Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3001` (o el puerto que Next.js asigne).

## Estructura del Proyecto

```
frontend/
├── app/
│   ├── (auth)/          # Rutas públicas de autenticación
│   │   ├── login/
│   │   └── register/
│   ├── dashboard/       # Rutas protegidas del dashboard
│   │   ├── overview/     # Dashboard principal
│   │   ├── profile/     # Perfil de usuario
│   │   ├── assets/      # Gestión de activos
│   │   ├── tokens/      # Gestión de tokens
│   │   ├── documents/   # Gestión de documentos
│   │   ├── endorsements/# Gestión de endosos
│   │   ├── organizations/# Gestión de organizaciones (ETF only)
│   │   └── users/       # Gestión de usuarios (ETF only)
│   └── providers.tsx    # Providers globales
├── components/
│   ├── auth/            # Componentes de autenticación
│   ├── layout/          # Sidebar, Header
│   ├── documents/       # Componentes de documentos
│   └── ui/              # Componentes ShadCN
├── lib/
│   ├── api/             # Clientes API
│   ├── auth/            # Contexto de autenticación
│   └── navigation/      # Configuración de navegación
└── types/               # Tipos TypeScript
```

## Funcionalidades por Organización

### ETF (Administrador)
- Dashboard completo con métricas
- Ver/crear/editar organizaciones y usuarios
- Ver todos los activos, tokens, documentos y endosos
- Ejecutar tokenización y endosos
- Ver historial blockchain de tokens

### WAREHOUSE (Almacén)
- Dashboard con activos propios
- Crear activos
- Generar CD/BP
- Firmar documentos CD/BP como WAREHOUSE
- Ver estado de activos

### CLIENT (Cliente)
- Auto-registro público
- Dashboard con activos y tokens propios
- Ver documentos de sus activos
- Firmar documentos CD/BP como CLIENT
- Solicitar endosos
- Firmar endosos como CLIENT
- Ver tokens y su historial blockchain
- Retirar activos (withdraw) cuando tenga el token

### BANK (Banco)
- Dashboard con endosos
- Ver endosos donde es beneficiario
- Firmar endosos como BANK
- Ver tokens recibidos como garantía
- Aprobar repago de endosos

## Navegación Escalable

Para agregar nuevos items al sidebar, edita `lib/navigation/nav-config.ts`:

```typescript
{
  title: 'Nueva Sección',
  items: [
    {
      title: 'Nuevo Item',
      href: '/dashboard/nuevo-item',
      icon: IconComponent,
      permission: 'nuevo-item:read', // Opcional
      organizationTypes: [OrganizationType.ETF], // Opcional
    }
  ]
}
```

## Tecnologías

- **Next.js 14** - Framework React con App Router
- **TypeScript** - Tipado estático
- **ShadCN UI** - Componentes UI accesibles
- **Tailwind CSS** - Estilos utilitarios
- **React Query** - Gestión de estado del servidor
- **Axios** - Cliente HTTP
- **next-themes** - Gestión de tema oscuro/claro
- **date-fns** - Manipulación de fechas
- **lucide-react** - Iconos

## Próximos Pasos

- [ ] Implementar formularios completos de CRUD
- [ ] Agregar validaciones exhaustivas con Zod
- [ ] Implementar búsqueda y filtros avanzados
- [ ] Agregar paginación en tablas
- [ ] Implementar notificaciones en tiempo real
- [ ] Agregar exportación de datos a PDF/Excel
- [ ] Implementar dashboard de métricas avanzadas
