import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/'], // Protege admin e API
    },
    sitemap: 'https://www.techguidebr.com.br/sitemap.xml',
  };
}