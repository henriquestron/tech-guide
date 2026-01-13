"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { products as staticProducts } from "@/data/products";
import ProductCard from "@/components/ProductCard";
import ReviewModal from "@/components/ReviewModal";
import FilterSidebar, { FilterState } from "@/components/FilterSidebar"; 
import { Product } from "@/types";
import { supabase } from "@/lib/supabaseClient";

export default function CategoryPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // 1. Captura Categoria e Subcategoria da URL
  const categorySlug = params?.category && typeof params.category === 'string' 
    ? params.category 
    : '';

  const subcategorySlug = searchParams.get('sub');

  // 2. Estados
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Estado dos Filtros (Vêm da Sidebar)
  const [activeFilters, setActiveFilters] = useState<FilterState>({
    minPrice: 0,
    maxPrice: 30000, // Ajustado para bater com seu sidebar novo
    selectedBrands: [],
    minRating: 0
  });

  // 3. Busca Dados no Supabase (Roda quando muda Categoria ou Subcategoria)
  useEffect(() => {
    async function fetchSupabaseProducts() {
      if (!categorySlug) return;
      setLoading(true);

      // Query Base
      let query = supabase
        .from('products')
        .select('*')
        .ilike('category', categorySlug);

      // Filtro de Subcategoria (se existir na URL)
      if (subcategorySlug) {
        query = query.eq('subcategory', subcategorySlug);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Erro Supabase:", error);
      } else if (data) {
        // Mapeamento dos dados do banco para o tipo Product
        const formattedData: Product[] = data.map((item: any) => ({
          id: String(item.id),
          title: item.title,
          category: item.category,
          subcategory: item.subcategory,
          image: item.image,
          price: item.price ? Number(item.price) : 0,
          originalPrice: item.original_price ? Number(item.original_price) : 0,
          rating: Number(item.rating) || 4.5,
          shortDescription: item.short_description || "",
          brand: item.brand || "Genérico",
          affiliateLink: item.link || "#", 
          link: item.link || "#",
          fullReview: item.full_review
        }));
        
        setDbProducts(formattedData);
      }
      setLoading(false);
    }

    fetchSupabaseProducts();
  }, [categorySlug, subcategorySlug]);

  // 4. Lógica de Filtragem Local (Combina Banco + Estáticos + Filtros da Sidebar)
  const displayedProducts = useMemo(() => {
    // a. Filtra estáticos pela categoria/subcategoria
    const filteredStatic = staticProducts.filter(p => {
      const matchCat = p.category.toLowerCase() === categorySlug.toLowerCase();
      const matchSub = subcategorySlug ? p.subcategory === subcategorySlug : true;
      return matchCat && matchSub;
    });

    // b. Junta Banco + Estáticos
    const combined = [...dbProducts, ...filteredStatic];

    // c. Aplica os filtros da Sidebar (Preço, Marca, Rating)
    return combined.filter(product => {
      const price = product.price;
      const rating = product.rating;
      const brand = product.brand || "Outros";

      // Filtro de Preço
      if (price < activeFilters.minPrice || price > activeFilters.maxPrice) return false;

      // Filtro de Avaliação
      if (rating < activeFilters.minRating) return false;

      // Filtro de Marca (Só aplica se tiver alguma selecionada)
      if (activeFilters.selectedBrands.length > 0) {
        if (!activeFilters.selectedBrands.includes(brand)) return false;
      }

      return true;
    });
  }, [dbProducts, subcategorySlug, categorySlug, activeFilters]);

  // 5. Extrai marcas disponíveis para passar para a Sidebar
  const availableBrands = useMemo(() => {
    const combined = [...dbProducts, ...staticProducts.filter(p => p.category === categorySlug)];
    const brands = new Set(combined.map(p => p.brand || "Outros"));
    return Array.from(brands).sort(); 
  }, [dbProducts, categorySlug]);

  // Handlers
  const handleOpenReview = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const formatTitle = (slug: string) => slug.replace(/-/g, ' ');

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pt-8 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Cabeçalho */}
        <div className="mb-8 border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <h1 className="text-3xl font-bold capitalize text-zinc-900 dark:text-white flex items-center gap-2">
            <span className={subcategorySlug ? "opacity-50" : ""}>
              {categorySlug === 'pecas' ? 'Peças de PC' : categorySlug}
            </span>
            {subcategorySlug && (
                <>
                    <span className="opacity-30">/</span>
                    <span className="text-blue-600 dark:text-blue-400 capitalize">
                        {formatTitle(subcategorySlug)}
                    </span>
                </>
            )}
          </h1>
        </div>

        {/* Layout Principal: Sidebar + Grid */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
            
            {/* 🛑 CORREÇÃO AQUI 
               - sticky top-24 -> lg:sticky lg:top-24
               - Assim ele não gruda no mobile, evitando o overlap.
               - z-10 garante prioridade no desktop.
            */}
            <div className="w-full lg:w-64 flex-shrink-0 lg:sticky lg:top-24 z-10">
                <FilterSidebar 
                  categorySlug={categorySlug}
                  brands={availableBrands}
                  onFilterChange={setActiveFilters}
                />
            </div>

            {/* Coluna Direita: Produtos */}
            <div className="flex-1 w-full">
                 <div className="flex justify-between items-center mb-4">
                    <p className="text-zinc-500 text-sm">
                        {loading 
                          ? "Carregando ofertas..." 
                          : `${displayedProducts.length} produtos encontrados`
                        }
                    </p>
                 </div>

                {displayedProducts.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {displayedProducts.map((product, index) => (
                      <ProductCard 
                          key={`${product.id}-${index}`} 
                          product={product} 
                          onOpenReview={handleOpenReview} 
                      />
                      ))}
                  </div>
                ) : (
                  !loading && (
                      <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-zinc-900 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700">
                      <h2 className="text-xl font-bold text-zinc-600 dark:text-zinc-400 mb-2">
                          Nenhum produto encontrado
                      </h2>
                      <p className="text-zinc-500 text-center max-w-md">
                          Não encontramos resultados para essa combinação de filtros em "{subcategorySlug ? formatTitle(subcategorySlug) : categorySlug}".
                      </p>
                      
                      {(activeFilters.selectedBrands.length > 0 || subcategorySlug) && (
                          <button 
                              onClick={() => {
                                if(subcategorySlug) router.push(`/${categorySlug}`);
                              }}
                              className="mt-4 text-blue-600 hover:underline text-sm font-medium"
                          >
                              Limpar filtros e categorias
                          </button>
                      )}
                      </div>
                  )
                )}
            </div>
        </div>
      </div>

      {/* Modal de Detalhes */}
      {selectedProduct && (
        <ReviewModal 
          product={selectedProduct} 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)}
          allProducts={displayedProducts} 
          onSwitchProduct={(newProduct) => setSelectedProduct(newProduct)} 
        />
      )}
    </div>
  );
}