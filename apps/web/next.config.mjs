/** @type {import('next').NextConfig} */
import { fileURLToPath } from "node:url"
import { dirname } from "node:path"

const __dirname = dirname(fileURLToPath(import.meta.url))

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
