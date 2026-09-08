import '../styles/globals.css';
import '../styles/components.css';
import Layout from '../components/Layout';
import ErrorBoundary from '../components/ErrorBoundary';
import { ErrorProvider } from '../contexts/ErrorContext';
import { DonationDisplayModeProvider } from '../contexts/DonationDisplayModeContext';
import { ModuleConfigProvider } from '../contexts/ModuleConfigContext';
import { AdminAuthProvider } from '../contexts/AdminAuthContext';
import FirstRunGate from '../components/FirstRunGate';
import FirstRunTour from '../components/FirstRunTour';
import '@fortawesome/fontawesome-free/css/all.min.css';

function MyApp({ Component, pageProps }) {
  return (
    <ErrorProvider>
      <AdminAuthProvider>
        <FirstRunGate>
          <ModuleConfigProvider>
            <DonationDisplayModeProvider>
              <ErrorBoundary>
                <Layout>
                  <Component {...pageProps} />
                </Layout>
                <FirstRunTour />
              </ErrorBoundary>
            </DonationDisplayModeProvider>
          </ModuleConfigProvider>
        </FirstRunGate>
      </AdminAuthProvider>
    </ErrorProvider>
  );
}

export default MyApp;
