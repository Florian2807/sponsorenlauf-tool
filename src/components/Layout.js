import Topbar from './Topbar';

export default function Layout({ children, className = 'layout-main' }) {
  return (
    <>
      <Topbar />
      <main id="main-content" className={className}>
        {children}
      </main>
    </>
  );
}
