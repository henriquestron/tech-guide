import { supabase } from "@/lib/supabaseClient";
import { ExternalLink, CheckCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";
import ShareButton from "@/components/ShareButton"; 

// 1. Tipagem atualizada para Promise
type Props = {
  params: Promise<{ id: string }>
}

// 2. Correção no generateMetadata
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params; // <--- O SEGREDO ESTÁ AQUI (AWAIT)
  
  const { data: product } = await supabase.from('products').select('*').eq('id', id).single();
  
  if (!product) return { title: 'Produto não encontrado' };

  return {
    title: `${product.title} | Tech Guide`,
    description: `Oferta por R$ ${product.price}. Veja a análise completa.`,
    openGraph: {
      images: [product.image || ''],
    },
  };
}

// 3. Correção no Componente da Página
export default async function ProductPage({ params }: Props) {
  const { id } = await params; // <--- O SEGREDO ESTÁ AQUI (AWAIT)

  const { data: product } = await supabase.from('products').select('*').eq('id', id).single();

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-zinc-500">
        <AlertTriangle size={48} className="mb-4 text-yellow-500"/>
        <h1 className="text-2xl font-bold">Produto não encontrado</h1>
        <Link href="/" className="text-blue-500 hover:underline mt-4">Voltar para a Home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-12 px-4">
      <div className="max-w-5xl mx-auto bg-white dark:bg-zinc-900 rounded-2xl shadow-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row">
        
        {/* LADO ESQUERDO: FOTO */}
        <div className="md:w-1/2 p-8 flex items-center justify-center bg-white">
           <img 
             src={product.image} 
             alt={product.title} 
             className="max-h-[400px] object-contain hover:scale-105 transition-transform duration-300"
           />
        </div>

        {/* LADO DIREITO: DETALHES */}
        <div className="md:w-1/2 p-8 flex flex-col">
           <div className="mb-4">
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                {product.category}
              </span>
           </div>

           <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-4 leading-tight">
             {product.title}
           </h1>

           <div className="flex items-end gap-2 mb-6">
              <span className="text-4xl font-extrabold text-green-600 dark:text-green-500">
                R$ {product.price}
              </span>
              {product.original_price > product.price && (
                <span className="text-zinc-400 line-through mb-1">
                  R$ {product.original_price}
                </span>
              )}
           </div>

           {/* REVIEW DA IA */}
           <div className="bg-zinc-50 dark:bg-zinc-950 p-6 rounded-xl border border-zinc-100 dark:border-zinc-800 mb-8">
              <h3 className="font-bold text-zinc-700 dark:text-zinc-300 mb-2 flex items-center gap-2">
                <CheckCircle size={18} className="text-purple-500"/> Análise Tech Guide
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
                {product.full_review?.content || product.short_description || "Produto analisado pela nossa equipe."}
              </p>
              
              {/* Prós e Contras */}
              {product.full_review?.pros && (
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                   <div>
                     <span className="font-bold text-green-600 block mb-1">👍 Prós</span>
                     <ul className="list-disc list-inside text-zinc-500">
                       {product.full_review.pros.slice(0,3).map((p:string, i:number) => <li key={i}>{p}</li>)}
                     </ul>
                   </div>
                   {product.full_review?.cons && (
                     <div>
                       <span className="font-bold text-red-500 block mb-1">👎 Contras</span>
                       <ul className="list-disc list-inside text-zinc-500">
                         {product.full_review.cons.slice(0,3).map((c:string, i:number) => <li key={i}>{c}</li>)}
                       </ul>
                     </div>
                   )}
                </div>
              )}
           </div>

           {/* BOTÕES DE AÇÃO */}
           <div className="mt-auto flex gap-3 flex-col sm:flex-row">
              <a 
                href={product.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
              >
                Comprar Agora <ExternalLink size={20}/>
              </a>

              {/* SHARE BUTTON */}
              <ShareButton title={product.title} />
           </div>
        </div>
      </div>
    </div>
  );
}