import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { useAdminAuth } from '../contexts/AdminAuthContext';

export default function FirstRunGate({ children }) {
  const router = useRouter();
  const { authenticated, loading: authLoading } = useAdminAuth();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!router.isReady || authLoading) return;

    let cancelled = false;

    const checkFirstRun = async () => {
      try {
        const response = await axios.get('/api/setupStatus', { timeout: 5000 });
        const setupCompleted = Boolean(response.data?.data?.isSetupCompleted);

        if (!cancelled && !setupCompleted && !authenticated && router.pathname !== '/admin-login') {
          await router.replace('/admin-login?next=/setup');
        }
      } catch {
        // A temporary status-check failure must not make the whole application unusable.
      } finally {
        if (!cancelled) setChecking(false);
      }
    };

    checkFirstRun();

    return () => {
      cancelled = true;
    };
  }, [authenticated, authLoading, router, router.isReady, router.pathname]);

  if (checking && router.pathname !== '/admin-login') {
    return (
      <main className="page-container">
        <p>Ersteinrichtung wird vorbereitet…</p>
      </main>
    );
  }

  return children;
}
