import '../styles/globals.css';
import '../styles/components.css';
import Layout from '../components/Layout';
import ErrorBoundary from '../components/ErrorBoundary';
import { ErrorProvider } from '../contexts/ErrorContext';
import '@fortawesome/fontawesome-free/css/all.min.css';

function MyApp({ Component, pageProps }) {
  return (
    <ErrorProvider>
      <ErrorBoundary>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </ErrorBoundary>
    </ErrorProvider>
  );
}

export default MyApp;
