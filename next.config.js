import { networkInterfaces } from 'node:os';

const nextConfig = {
  // iPads use the server's LAN address; Next otherwise blocks the development HMR socket.
  allowedDevOrigins: [...new Set(['127.0.0.1', ...Object.values(networkInterfaces())
    .flat().filter(address => address.family === 'IPv4' && !address.internal)
    .map(address => address.address)])],
  distDir: process.env.SPONSORENLAUF_NEXT_DIST_DIR || '.next',
  async redirects() {
    return [
      {
        source: '/',
        destination: '/scan',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
