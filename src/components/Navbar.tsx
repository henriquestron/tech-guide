"use client";
import Link from 'next/link';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Menu, X, Smartphone, Monitor, Cpu, Watch, Gamepad2, Headphones, 
  Search, Heart, ChevronDown, ChevronUp
} from 'lucide-react';
import { useFavorites } from "@/context/FavoritesContext";

// Definição da estrutura do Menu com Subcategorias
type CategoryItem = {
  name: string;
  href: string;
  icon: React.ReactNode;
  subcategories?: { name: string; slug: string }[];
};

// Configuração das Categorias e Subcategorias
const categories: CategoryItem[] = [
  { 
    name: 'Celulares', 
    href: '/celulares', 
    icon: <Smartphone size={18} />,
    subcategories: [
      { name: 'Android', slug: 'android' },
      { name: 'iPhone (iOS)', slug: 'iphone' },
    ]
  },
  { 
    name: 'Notebooks', 
    href: '/notebooks', 
    icon: <Monitor size={18} />,
    subcategories: [
      { name: 'Notebooks Gamer', slug: 'gamer' },
      { name: 'Notebooks para Trabalho', slug: 'trabalho' },
      { name: 'Acessórios para Notebook', slug: 'acessorios' },
    ]
  },
  { 
    name: 'Peças PC', 
    href: '/pecas', 
    icon: <Cpu size={18} />,
    subcategories: [
      { name: 'Processadores', slug: 'processador' },
      { name: 'Placas de Vídeo', slug: 'placa-video' },
      { name: 'Memória RAM', slug: 'memoria-ram' },
      { name: 'Armazenamento', slug: 'ssd-hd' },
    ]
  },
  { 
    name: 'Relógios', 
    href: '/relogios', 
    icon: <Watch size={18} />,
    subcategories: [
      { name: 'Smartwatch', slug: 'smartwatch' },
      { name: 'Relógios Esportivos', slug: 'esportivo' },
      { name: 'Pulseiras & Acessórios', slug: 'acessorios' },
    ]
  },
  { 
    name: 'Games', 
    href: '/games', 
    icon: <Gamepad2 size={18} />,
    subcategories: [
      { name: 'Consoles', slug: 'console' },
      { name: 'Controles', slug: 'controle' },
      { name: 'Jogos', slug: 'jogos' },
      { name: 'Acessórios Gamer', slug: 'acessorios' },
    ]
  },
  { 
    name: 'Acessórios', 
    href: '/acessorios', 
    icon: <Headphones size={18} />,
    subcategories: [
      { name: 'Mouses', slug: 'mouse' },
      { name: 'Teclados', slug: 'teclado' },
      { name: 'Headsets', slug: 'headset' },
    ]
  },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  // Estado para controlar qual categoria está expandida no mobile
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const router = useRouter();
  const { favorites } = useFavorites();

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsOpen(false);
      router.push(`/busca?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const toggleCategory = (categoryName: string) => {
    if (expandedCategory === categoryName) {
      setExpandedCategory(null);
    } else {
      setExpandedCategory(categoryName);
    }
  };

  return (
    <nav className="sticky top-0 z-40 w-full bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-4">

          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-xl tracking-tight text-zinc-900 dark:text-white shrink-0"
          >
            <span className="bg-blue-600 text-white px-2 py-1 rounded-lg">
              Tech
            </span>
            Guide
          </Link>

          {/* Busca Desktop */}
          <form
            onSubmit={handleSearch}
            className="hidden md:flex flex-1 max-w-md relative mx-4"
          >
            <input
              type="text"
              placeholder="Buscar produtos..."
              className="w-full pl-10 pr-4 py-2 rounded-full bg-zinc-100 dark:bg-zinc-900 border-none focus:ring-2 focus:ring-blue-500 text-sm outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 text-zinc-400" size={18} />
          </form>

          {/* Menu Desktop (Corrigido: Alinhamento Centralizado) */}
          <div className="hidden md:flex items-center h-full gap-1">
            {categories.map((cat) => (
              <div key={cat.name} className="relative group h-full">
                <Link
                  href={cat.href}
                  className="flex flex-col items-center justify-center h-full px-3 py-1 text-[11px] font-bold text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors gap-1"
                >
                  {/* Ícone Centralizado */}
                  <div className="mb-0.5 text-zinc-700 dark:text-zinc-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {cat.icon}
                  </div>

                  {/* Texto + Setinha */}
                  <span className="flex items-center gap-0.5 uppercase tracking-wide leading-none text-center whitespace-nowrap">
                    {cat.name}
                    {cat.subcategories && <ChevronDown size={10} strokeWidth={3} />}
                  </span>
                </Link>

                {/* Dropdown Desktop */}
                {cat.subcategories && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-56 pt-0 hidden group-hover:block z-50">
                    <div className="mt-1 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-100 dark:border-zinc-800 overflow-hidden py-1">
                      {cat.subcategories.map((sub) => (
                        <Link
                          key={sub.slug}
                          href={`${cat.href}?sub=${sub.slug}`}
                          className="block px-4 py-2 text-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-blue-600 text-left capitalize font-medium"
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Ações */}
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/favoritos"
              className="relative p-2 text-zinc-500 hover:text-red-500 transition-colors"
            >
              <Heart size={22} />
              {favorites.length > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full">
                  {favorites.length}
                </span>
              )}
            </Link>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 text-zinc-600 dark:text-zinc-300"
            >
              {isOpen ? <X /> : <Menu />}
            </button>
          </div>

        </div>
      </div>

      {/* Menu Mobile (Corrigido: Accordion/Sanfona) */}
      {isOpen && (
        <div className="md:hidden bg-white dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-900 absolute w-full shadow-xl h-[calc(100vh-64px)] overflow-y-auto">
          <div className="p-4 pb-20">

            <form onSubmit={handleSearch} className="relative mb-6">
              <input
                type="text"
                placeholder="O que você procura?"
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-zinc-100 dark:bg-zinc-900 border-none outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-3.5 text-zinc-400" size={20} />
            </form>

            <div className="space-y-2">
              {categories.map((cat) => (
                <div key={cat.name} className="flex flex-col bg-zinc-50 dark:bg-zinc-900/50 rounded-lg overflow-hidden">
                  
                  {/* Cabeçalho da Categoria Mobile */}
                  <div className="flex items-center justify-between px-4 py-3">
                    <Link
                      href={cat.href}
                      className="flex items-center gap-3 font-bold text-zinc-800 dark:text-white flex-1"
                      onClick={() => setIsOpen(false)}
                    >
                      {cat.icon}
                      {cat.name}
                    </Link>
                    
                    {/* Botão de Expandir (Só aparece se tiver subcategorias) */}
                    {cat.subcategories && (
                      <button 
                        onClick={(e) => {
                          e.preventDefault(); 
                          toggleCategory(cat.name);
                        }}
                        className="p-2 text-zinc-400 hover:text-blue-600"
                      >
                         {expandedCategory === cat.name ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    )}
                  </div>

                  {/* Subcategorias (Efeito Sanfona) */}
                  {cat.subcategories && expandedCategory === cat.name && (
                    <div className="bg-zinc-100 dark:bg-zinc-950 px-4 py-2 space-y-2 border-t border-zinc-200 dark:border-zinc-800 animate-in slide-in-from-top-2 duration-200">
                      {cat.subcategories.map((sub) => (
                        <Link
                          key={sub.slug}
                          href={`${cat.href}?sub=${sub.slug}`}
                          className="block py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-blue-600 border-l-2 border-transparent hover:border-blue-600 pl-3"
                          onClick={() => setIsOpen(false)}
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

          </div>
        </div>
      )}
    </nav>
  );
}