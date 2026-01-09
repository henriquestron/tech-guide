import { products as staticProducts } from "@/data/products";
import { supabase } from "@/lib/supabaseClient";
import ProductShowcase from "@/components/ProductShowcase";

// Garante dados frescos a cada refresh
export const revalidate = 0;

export default async function Home() {
  
  // 1. Busca no Banco
  console.log("🔄 Buscando produtos...");
  const { data: dbProducts, error } = await supabase.from('products').select('*');

  if (error) console.error("❌ Erro Supabase:", error);

  // 2. Formata os dados
  const formattedDbProducts = dbProducts?.map((item: any) => ({
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
  })) || [];

  // 3. Junta tudo
  const allProducts = [...formattedDbProducts, ...staticProducts];

  // 4. Entrega para o componente que cuida da tela (Client Component)
  return <ProductShowcase products={allProducts} />;
}