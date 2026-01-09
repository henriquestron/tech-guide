"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { products as staticProducts } from "@/data/products"; // Renomeei para evitar confusão
import ProductCard from "@/components/ProductCard";
import ReviewModal from "@/components/ReviewModal";
import { Product } from "@/types";
import { supabase } from "@/lib/supabaseClient"; // Importando a conexão que criamos

export default function CategoryPage() {
  const params = useParams();
  
  // Garante que seja string e segura contra nulos
  const categorySlug = typeof params?.category === 'string' ? params.category : '';

  // Estado para armazenar os produtos vindos do Banco de Dados
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados do Modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- EFEITO: Buscar dados no Supabase quando a categoria mudar ---
  useEffect(() => {
    async function fetchSupabaseProducts() {
      if (!categorySlug) return;

      console.log(`🔄 Buscando no banco categoria: ${categorySlug}`);

      const { data, error } = await supabase
        .from('products')
        .select('*')
        // .ilike é crucial: ignora maiúsculas/minúsculas (Celulares == celulares)
        .ilike('category', categorySlug); 

      if (error) {
        console.error("Erro ao buscar:", error);
      }

      if (data) {
        // Formata os dados do banco para o formato do seu site (Product Type)
        const formattedData: Product[] = data.map((item: any) => ({
          id: item.id,
          title: item.title,
          category: item.category,
          image: item.image,
          price: Number(item.price),
          originalPrice: Number(item.original_price), // Converte snake_case
          rating: Number(item.rating) || 4.5,
          shortDescription: item.short_description || "",
          brand: item.brand || "Tech",
          affiliateLink: item.link || "#",
          fullReview: item.full_review
        }));
        
        setDbProducts(formattedData);
      }
      setLoading(false);
    }

    fetchSupabaseProducts();
  }, [categorySlug]);

  // --- FILTROS ---
  
  // 1. Filtra os produtos manuais (estáticos)
  const filteredStaticProducts = staticProducts.filter(
    p => p.category.toLowerCase() === categorySlug.toLowerCase()
  );

  // 2. Junta tudo: Produtos do Banco + Produtos Manuais
  const allProducts = [...dbProducts, ...filteredStaticProducts];

  // --- FUNÇÕES DO MODAL ---
  const handleOpenReview = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pt-8 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Cabeçalho */}
        <div className="mb-8 border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <h1 className="text-3xl font-bold capitalize text-zinc-900 dark:text-white">
            {categorySlug === 'pecas' ? 'Peças de PC' : categorySlug}
          </h1>
          <p className="text-zinc-500 mt-1">
            {loading ? (
              "Carregando ofertas..."
            ) : allProducts.length > 0 ? (
              `${allProducts.length} produtos encontrados`
            ) : (
              "Nenhum produto encontrado nesta categoria"
            )}
          </p>
        </div>

        {/* Lista de Produtos */}
        {allProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {allProducts.map((product, index) => (
              <ProductCard 
                // Usamos index no key para evitar conflito se tiver IDs repetidos
                key={`${product.id}-${index}`} 
                product={product} 
                onOpenReview={handleOpenReview} 
              />
            ))}
          </div>
        ) : (
          !loading && (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-zinc-900 rounded-xl border border-dashed border-zinc-300">
              <h2 className="text-xl font-bold text-zinc-600 mb-2">Ops! Categoria Vazia.</h2>
              <p className="text-zinc-500 mb-4 text-center max-w-md">
                Não encontramos produtos para <strong>"{categorySlug}"</strong>.
              </p>
            </div>
          )
        )}
      </div>

      {/* Modal de Review */}
      {selectedProduct && (
        <ReviewModal 
          product={selectedProduct} 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)}
          onSwitchProduct={(newProduct) => setSelectedProduct(newProduct)} 
        />
      )}
    </div>
  );
}