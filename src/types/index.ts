export type Category = 'celulares' | 'notebooks' | 'pecas' | 'relogios' | 'games' | 'acessorios';

export interface Product {
  id: string;
  title: string;
  category: Category;
  subcategory?: string; // <--- NOVO: Permite filtrar por "placa-video", "processador", etc.
  link?: string;
  image: string;
  price: number;
  originalPrice?: number;
  brand?: string;
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