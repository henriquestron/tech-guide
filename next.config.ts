import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'http2.mlstatic.com', // Mercado Livre
      },
      {
        protocol: 'https',
        hostname: 'm.media-amazon.com', // Amazon
      },
      {
        protocol: 'https',
        hostname: 'images-na.ssl-images-amazon.com', // Variação Amazon
      },
      // Adicione outros sites aqui se precisar
    ],
  },
};

export default nextConfig;