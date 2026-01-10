"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { products as staticProducts } from "@/data/products";
import ProductCard from "@/components/ProductCard";
import ReviewModal from "@/components/ReviewModal";
import { Product } from "@/types";
import { supabase } from "@/lib/supabaseClient";

export default function CategoryPage() {
  const params = useParams();
  
  // Segurança para evitar crash se params for null
  const categorySlug = params?.category && typeof params.category === 'string' 
    ? params.category 
    : '';

  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    async function fetchSupabaseProducts() {
      if (!categorySlug) return;

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .ilike('category', categorySlug); 

      if (error) {
        console.error("Erro Supabase:", error);
      } else if (data) {
        
        // --- MAPPER: O SEGREDO PARA NÃO DAR ERRO ---
        const formattedData: Product[] = data.map((item: any) => ({
          id: String(item.id), // String para funcionar os favoritos
          title: item.title,
          category: item.category,
          image: item.image,
          
          // Converte para Number e evita NaN/Null
          price: item.price ? Number(item.price) : 0,
          originalPrice: item.original_price ? Number(item.original_price) : 0,
          
          rating: Number(item.rating) || 4.5,
          shortDescription: item.short_description || "",
          brand: item.brand || "Tech",
          
          // IMPORTANTE: Preenche affiliateLink com o link do banco
          affiliateLink: item.link || "#", 
          // @ts-ignore (Caso sua interface tenha 'link' tbm, preenchemos)
          link: item.link || "#",
          
          fullReview: item.full_review
        }));
        
        setDbProducts(formattedData);
      }
      setLoading(false);
    }

    fetchSupabaseProducts();
  }, [categorySlug]);

  // Filtra estáticos
  const filteredStaticProducts = staticProducts.filter(
    p => p.category.toLowerCase() === categorySlug.toLowerCase()
  );

  // Junta tudo
  const allProducts = [...dbProducts, ...filteredStaticProducts];

  const handleOpenReview = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pt-8 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-8 border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <h1 className="text-3xl font-bold capitalize text-zinc-900 dark:text-white">
            {categorySlug === 'pecas' ? 'Peças de PC' : categorySlug}
          </h1>
          <p className="text-zinc-500 mt-1">
            {loading ? "Carregando ofertas..." : `${allProducts.length} produtos encontrados`}
          </p>
        </div>

        {allProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {allProducts.map((product, index) => (
              <ProductCard 
                key={`${product.id}-${index}`} 
                product={product} 
                onOpenReview={handleOpenReview} 
              />
            ))}
          </div>
        ) : (
          !loading && (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-zinc-900 rounded-xl border border-dashed border-zinc-300">
              <h2 className="text-xl font-bold text-zinc-600 mb-2">Categoria Vazia</h2>
              <p className="text-zinc-500">Nenhum produto encontrado para "{categorySlug}".</p>
            </div>
          )
        )}
      </div>

      {selectedProduct && (
        <ReviewModal 
          product={selectedProduct} 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)}
          allProducts={allProducts} 
          onSwitchProduct={(newProduct) => setSelectedProduct(newProduct)} 
        />
      )}
    </div>
  );
}