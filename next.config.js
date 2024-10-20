export default {
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