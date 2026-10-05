import Topbar from './Topbar';

export default function Layout({ children, className = 'layout-main' }) {
  return (
    <>
      <a className="skip-link" href="#main-content">Zum Inhalt springen</a>
      <Topbar />
      <main tabIndex={-1} id="main-content" className={className}>
        {children}
      </main>
    </>
  );
}
