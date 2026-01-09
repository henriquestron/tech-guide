import { products as staticProducts } from "@/data/products";
import { supabase } from "@/lib/supabaseClient";
import ProductShowcase from "@/components/ProductShowcase";

// --- CORREÇÃO DO ERRO DE BUILD ---
// 'force-dynamic' obriga a página a ser gerada no servidor a cada acesso.
// Isso impede que o Next.js tente conectar no banco durante o "Build" estático.
export const dynamic = 'force-dynamic';

export default async function Home() {
  
  // 1. Busca no Banco
  console.log("🔄 Buscando produtos...");
  
  // Adicionamos um try/catch para garantir que o site não caia se o banco falhar
  let dbProducts = [];
  try {
    const { data, error } = await supabase.from('products').select('*');
    if (error) {
      console.error("❌ Erro Supabase:", error);
    } else {
      dbProducts = data || [];
    }
  } catch (err) {
    console.error("❌ Erro fatal na conexão:", err);
  }

  // 2. Formata os dados
  const formattedDbProducts = dbProducts.map((item: any) => ({
    id: item.id,
    title: item.title,
    category: item.category || 'ofertas',
    image: item.image,
    price: Number(item.price),
    originalPrice: Number(item.original_price), 
    rating: Number(item.rating) || 4.5,
    shortDescription: item.short_description || "Selecionado por IA.",
    brand: item.brand || "Tech",
    affiliateLink: item.link || "#", 
    fullReview: item.full_review || {
      verdict: "Análise pendente.",
      pros: [],
      cons: [],
      specs: {},
      content: ""
    }
  }));

  // 3. Junta tudo (Banco + Estático)
  const allProducts = [...formattedDbProducts, ...staticProducts];

  // 4. Entrega para o componente que cuida da tela
  return <ProductShowcase products={allProducts} />;
}