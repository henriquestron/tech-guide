import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ignora erros de TypeScript na build
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // @ts-expect-error - A propriedade existe no runtime do Next.js, mas o TS pode reclamar
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Configuração de Imagens (Mercado Livre e Amazon)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'http2.mlstatic.com',
      },
      {
        protocol: 'https',
        hostname: 'm.media-amazon.com',
      },
      {
        protocol: 'https',
        hostname: 'images-na.ssl-images-amazon.com',
      },
    ],
  },
};

export default nextConfig;