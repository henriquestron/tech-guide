import { supabase } from '@/lib/supabaseClient';
import ProductShowcase from '@/components/ProductShowcase';

// Força a página a ser dinâmica (sem cache estático) para sempre pegar preços novos
export const revalidate = 0;

export default async function Home() {
  // 1. Busca TODOS os produtos APROVADOS ordenados pelos mais novos
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .eq('status', 'approved') // <--- FILTRO DE SEGURANÇA
    .order('id', { ascending: false });

  if (error) {
    console.error("Erro ao carregar produtos da Home:", error);
  }

  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col">
      <ProductShowcase products={products || []} />
    </main>
  );
}