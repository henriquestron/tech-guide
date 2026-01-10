import { products as staticProducts } from "@/data/products";
import { supabase } from "@/lib/supabaseClient";
import ProductShowcase from "@/components/ProductShowcase";

export const dynamic = 'force-dynamic';

// ATUALIZAÇÃO NEXT.JS 15: searchParams agora é uma Promise
interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage(props: SearchPageProps) {
  // 1. Desembrulha a promessa (Correção do erro)
  const searchParams = await props.searchParams;
  const query = searchParams.q || "";
  
  // 2. Busca no Banco de Dados (Supabase)
  let dbProducts: any[] = [];
  
  if (query) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .or(`title.ilike.%${query}%,category.ilike.%${query}%,short_description.ilike.%${query}%`)
        .order('id', { ascending: false });

      if (!error && data) {
        dbProducts = data;
      }
    } catch (err) {
      console.error("Erro na busca Supabase:", err);
    }
  }

  // 3. Formata os dados do Banco
  const formattedDbProducts = dbProducts.map((item: any) => ({
    id: String(item.id),
    title: item.title,
    category: item.category || 'ofertas',
    image: item.image || "/placeholder.png",
    price: Number(item.price) || 0,
    originalPrice: Number(item.original_price) || 0,
    rating: Number(item.rating) || 4.5,
    shortDescription: item.short_description || "",
    brand: item.brand || "Tech",
    affiliateLink: item.link || "#", 
    link: item.link || "#",
    fullReview: item.full_review || {}
  }));

  // 4. Busca nos Produtos Estáticos (Manual)
  const filteredStatic = staticProducts.filter((product) => {
    if (!query) return false;
    const term = query.toLowerCase();
    return (
      product.title.toLowerCase().includes(term) ||
      product.category.toLowerCase().includes(term) ||
      product.shortDescription?.toLowerCase().includes(term) ||
      (product.brand && product.brand.toLowerCase().includes(term))
    );
  });

  // 5. Junta tudo e protege contra nulos (Filtro de Segurança)
  const allFoundProducts = [...formattedDbProducts, ...filteredStatic]
    .filter(p => p && p.id);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pt-8 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Cabeçalho da Busca */}
        <div className="mb-8 border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            Resultados para "{query}"
          </h1>
          <p className="text-zinc-500 mt-1">
            {allFoundProducts.length} produtos encontrados
          </p>
        </div>

        {/* Exibição dos Produtos */}
        <div className="-mt-10"> 
           <ProductShowcase products={allFoundProducts as any} />
        </div>

      </div>
    </div>
  );
}