import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useModuleConfig } from '../contexts/ModuleConfigContext';
import { useAdminAuth } from '../contexts/AdminAuthContext';

export default function FirstRunGate({ children }) {
  const router = useRouter();
  const { authenticated, loading: authLoading } = useAdminAuth();
  const { setupCompleted, isLoading: checking } = useModuleConfig();
  useEffect(() => {
    if (!router.isReady || authLoading || checking || setupCompleted !== false || authenticated || router.pathname === '/admin-login') return;
    router.replace('/admin-login?next=/setup');
  }, [authenticated, authLoading, checking, setupCompleted, router]);

  if (checking && router.pathname !== '/admin-login') {
    return (
      <main className="page-container">
        <p>Ersteinrichtung wird vorbereitet…</p>
      </main>
    );
  }

  return children;
}
