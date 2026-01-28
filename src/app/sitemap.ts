import { MetadataRoute } from 'next';
import { supabase } from "@/lib/supabaseClient";

export const revalidate = 3600; // Atualiza o mapa a cada 1 hora

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.techguidebr.com.br'; // Seu domínio oficial

  // 1. Busca todos os produtos para gerar URLs
  const { data: products } = await supabase
    .from('products')
    .select('id, updated_at');

  // 2. Cria a lista de URLs de produtos
  const productUrls = products?.map((product) => ({
    url: `${baseUrl}/produto/${product.id}`,
    lastModified: new Date(product.updated_at || new Date()),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  })) || [];

  // 3. Retorna as páginas fixas + produtos
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    // Se tiver outras páginas fixas (ex: Sobre, Contato), adicione aqui
    ...productUrls,
  ];
}