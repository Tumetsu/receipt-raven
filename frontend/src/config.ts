// Environment variables with fallbacks
const config = {
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
  },
};

export default config;
