'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { SignerType } from '@/types/document';

interface SignatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (email: string, signerType: SignerType) => Promise<void>;
  signerType: SignerType;
  documentType: string;
}

export function SignatureDialog({
  open,
  onOpenChange,
  onConfirm,
  signerType,
  documentType
}: SignatureDialogProps) {
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    if (!email) {
      setError('El email es requerido');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onConfirm(email, signerType);
      onOpenChange(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al firmar el documento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Firmar Documento</DialogTitle>
          <DialogDescription>
            Estás a punto de firmar digitalmente este {documentType}.
            Esta acción es irreversible y tiene validez legal.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Tu firma digital será registrada con certificado DigiCert.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="email">Email de confirmación</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading ? 'Firmando...' : 'Confirmar Firma'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

