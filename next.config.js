const nextConfig = {
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
