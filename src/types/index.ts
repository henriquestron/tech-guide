export type Category = 'celulares' | 'notebooks' | 'pecas' | 'relogios' | 'games' | 'acessorios';

export interface Product {
  id: string;
  title: string;
  category: Category;
  link?: string;
  image: string;
  price: number;
  originalPrice?: number; // <--- Adicione esta linha (O "?" diz que é opcional)
  brand?: string;         // Adicionei também marca caso queira usar filtros depois
  rating: number;
  shortDescription: string;
  affiliateLink: string;
  fullReview: {
    pros: string[];
    cons: string[];
    specs: Record<string, string>;
    content: string;
    verdict: string;
  };
}