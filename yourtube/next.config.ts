import process from 'process';

const nextConfig = {
  /* config options here */
  reactStrictMode: true,
  env: {
    BACKEND_URL: process.env.BACKEND_URL,
  },
};

export default nextConfig;
