import { supabase } from '@/lib/supabaseClient';
import ProductShowcase from '@/components/ProductShowcase';
import AiCuratorSection from '@/components/AiCuratorSection'; // <--- IMPORTAR

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Home() {
  const { data: allProducts, error } = await supabase
    .from('products')
    .select('*')
    .eq('status', 'approved')
    .order('id', { ascending: false });

  if (error || !allProducts) return <div>Erro ao carregar</div>;

  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col pb-20">
      
      {/* HEADER */}
      <div className="w-full bg-gradient-to-b from-blue-900/20 to-zinc-950 py-12 px-6 text-center border-b border-white/5">
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 tracking-tight">
          Tech<span className="text-blue-500">Guide</span>
        </h1>
        <p className="text-zinc-400">Ofertas monitoradas por Inteligência Artificial</p>
      </div>

      <div className="container mx-auto px-4 mt-8">
        
        {/* 🤖 AQUI ENTRA A SEÇÃO DA IA QUE ANALISA O SITE */}
        <AiCuratorSection allProducts={allProducts} />

        {/* Aqui continua o seu showcase normal (que organiza por categorias fixas) */}
        <div className="mt-16 pt-16 border-t border-zinc-800">
            <h3 className="text-xl font-bold text-zinc-500 mb-8 px-4 uppercase tracking-widest">
                Catálogo Geral
            </h3>
            <ProductShowcase products={allProducts} />
        </div>

      </div>
    </main>
  );
}