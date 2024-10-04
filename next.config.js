// next.config.mjs
export default {
    async redirects() {
      return [
        {
          source: '/',
          destination: '/scan',
          permanent: false, // Set to true if it's a permanent redirect (301)
        },
      ];
    },
};  