/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['images.unsplash.com', 'placeholder.com'],
    unoptimized: true
  }
};

export default nextConfig;
