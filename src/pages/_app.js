import '../styles/globals.css';
import '../styles/components.css';
import '../styles/stations.css';
import '../styles/module-manager.css';
import '../styles/app-theme.css';
import '../styles/live.css';
import Layout from '../components/Layout';
import ErrorBoundary from '../components/ErrorBoundary';
import { ErrorProvider } from '../contexts/ErrorContext';
import { DonationDisplayModeProvider } from '../contexts/DonationDisplayModeContext';
import { ScannerStationProvider } from '../contexts/ScannerStationContext';
import { ModuleConfigProvider } from '../contexts/ModuleConfigContext';
import { AdminAuthProvider } from '../contexts/AdminAuthContext';
import FirstRunGate from '../components/FirstRunGate';
import FirstRunTour from '../components/FirstRunTour';
import UpdateNotice from '../components/UpdateNotice';
import MaintenanceProgress from '../components/MaintenanceProgress';
import '@fortawesome/fontawesome-free/css/all.min.css';

function MyApp({ Component, pageProps }) {
  return (
    <ErrorProvider>
      <AdminAuthProvider>
        <UpdateNotice />
        <MaintenanceProgress />
        <ModuleConfigProvider>
          <FirstRunGate>
            <ScannerStationProvider active={!Component.fullScreen}>
            <DonationDisplayModeProvider>
              <ErrorBoundary>
                <Layout fullScreen={Component.fullScreen} className={Component.fullScreen ? 'display-layout' : 'layout-main'}>
                  <Component {...pageProps} />
                </Layout>
                <FirstRunTour />
              </ErrorBoundary>
            </DonationDisplayModeProvider>
            </ScannerStationProvider>
          </FirstRunGate>
        </ModuleConfigProvider>
      </AdminAuthProvider>
    </ErrorProvider>
  );
}

export default MyApp;
