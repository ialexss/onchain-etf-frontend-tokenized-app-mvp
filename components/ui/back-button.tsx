'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BackButtonProps {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showIcon?: boolean;
  children?: React.ReactNode;
}

export function BackButton({
  variant = 'ghost',
  size = 'icon',
  className,
  showIcon = true,
  children,
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  if (children) {
    // Si hay children, mostrar como botón con texto
    return (
      <Button
        variant={variant}
        size={size === 'icon' ? 'default' : size}
        onClick={handleBack}
        className={cn(className)}
      >
        {showIcon && <ArrowLeft className="mr-2 h-4 w-4" />}
        {children}
      </Button>
    );
  }

  // Si no hay children, mostrar solo el icono
  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleBack}
      className={cn(className)}
    >
      <ArrowLeft className="h-4 w-4" />
    </Button>
  );
}

