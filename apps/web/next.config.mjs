/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  transpilePackages: ["@globalwealth/ui"],
  images: {
    unoptimized: true,
  },
}

export default nextConfig