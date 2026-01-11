//helou word

import { products as staticProducts } from "@/data/products";
import { supabase } from "@/lib/supabaseClient";
import ProductShowcase from "@/components/ProductShowcase";

// 'force-dynamic' obriga o Next.js a buscar dados novos a cada acesso (sem cache eterno)
export const dynamic = 'force-dynamic';

export default async function Home() {
  
  console.log("--- INICIANDO HOME PAGE ---");
  
  let dbProducts = [];
  try {
    // Busca produtos no Supabase
    // Ordenamos por ID decrescente para pegar os últimos adicionados
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('id', { ascending: false }); 

    if (error) {
      console.error("❌ Erro ao buscar no Supabase:", error.message);
    } else {
      console.log(`✅ Sucesso! Supabase retornou ${data?.length} produtos.`);
      dbProducts = data || [];
    }
  } catch (err) {
    console.error("❌ Erro fatal na conexão:", err);
  }

  // Formata os dados do banco para o padrão do TypeScript/App
  const formattedDbProducts = dbProducts.map((item: any) => ({
    id: String(item.id), // Converte para String para garantir compatibilidade com favoritos
    title: item.title || "Produto sem título",
    
    // Proteção contra preços nulos ou texto
    price: item.price ? Number(item.price) : 0, 
    originalPrice: item.original_price ? Number(item.original_price) : 0,
    
    image: item.image || "/placeholder.png",
    category: item.category || 'ofertas',
    rating: Number(item.rating) || 4.5,
    shortDescription: item.short_description || "Selecionado por IA.",
    brand: item.brand || "Tech",
    
    // Mapeia o link para os dois campos possíveis para evitar erros
    affiliateLink: item.link || "#", 
    link: item.link || "#",
    
    fullReview: item.full_review || {}
  }));

  // Juntar listas + FILTRO DE SEGURANÇA
  // O .filter remove qualquer item que seja null, undefined ou não tenha ID
  const allMergedProducts = [...formattedDbProducts, ...staticProducts]
    .filter(p => p !== null && p !== undefined && p.id);
  
  console.log(`📊 Total de produtos VÁLIDOS enviados para a vitrine: ${allMergedProducts.length}`);

  // Entrega para o componente visual
// Adicione "as any" aqui 👇
return <ProductShowcase products={allMergedProducts as any} />;
}