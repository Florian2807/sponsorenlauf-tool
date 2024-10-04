import '../styles/globals.css';
import Topbar from '../components/Topbar';
import '@fortawesome/fontawesome-free/css/all.min.css';

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Topbar />
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
