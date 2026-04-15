/** @type {import('next').NextConfig} */
const nextConfig = {
  // Needed because iCloud Drive directory contains multiple lockfiles across parent dirs
  experimental: {
    outputFileTracingRoot: __dirname,
  },
};

module.exports = nextConfig;
