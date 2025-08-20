import '../styles/globals.css';
import '../styles/components.css';
import Layout from '../components/Layout';
import ErrorBoundary from '../components/ErrorBoundary';
import { ErrorProvider } from '../contexts/ErrorContext';
import { DonationDisplayModeProvider } from '../contexts/DonationDisplayModeContext';
import { ModuleConfigProvider } from '../contexts/ModuleConfigContext';
import '@fortawesome/fontawesome-free/css/all.min.css';

function MyApp({ Component, pageProps }) {
  return (
    <ErrorProvider>
      <ModuleConfigProvider>
        <DonationDisplayModeProvider>
          <ErrorBoundary>
            <Layout>
              <Component {...pageProps} />
            </Layout>
          </ErrorBoundary>
        </DonationDisplayModeProvider>
      </ModuleConfigProvider>
    </ErrorProvider>
  );
}

export default MyApp;
