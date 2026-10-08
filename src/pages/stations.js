export default function StationsPage() { return null; }

export function getServerSideProps() {
    return { redirect: { destination: '/scan', permanent: false } };
}
