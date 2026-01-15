// types.ts

export type Category = 'celulares' | 'notebooks' | 'pecas' | 'relogios' | 'games' | 'acessorios' | 'computadores';

export interface Product {
  id: string;
  title: string;
  category: Category;
  subcategory?: string; 
  
  // 👇 MUDANÇAS IMPORTANTES AQUI:
  
  link: string;           // Esse é o link que vai para o usuário (pode virar Afiliado)
  original_link?: string; // <--- NOVO: O link puro para o robô auditar o preço
  
  image: string;
  price: number;
  
  // ⚠️ Atenção: O Supabase retorna "original_price", não "originalPrice". 
  // Se você não tiver uma função que converte, use o nome do banco:
  original_price?: number; 
  
  brand?: string;
  rating: number;
  
  // O Supabase retorna "short_description"
  short_description?: string; 
  
  // O Supabase retorna "full_review"
  full_review?: {
    pros: string[];
    cons: string[];
    specs?: Record<string, string>;
    content: string;
    verdict: string;
  };

  // 👇 NOVO: Essencial para seu Painel Admin saber se precisa revisar
  status?: 'active' | 'pending' | 'deleted'; 
  
  updated_at?: string;
}