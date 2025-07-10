import Topbar from './Topbar';

export default function Layout({ children, className = 'page-container' }) {
  return (
    <>
      <Topbar />
      {children}
    </>
  );
}
