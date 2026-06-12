const nextConfig = {
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
