"use client";

import Link from 'next/link';
import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Menu, X, Smartphone, Monitor, Cpu, Watch, Gamepad2, Headphones, 
  Search, Heart, ChevronDown, ChevronUp, Sparkles, Bot, MessageCircle
} from 'lucide-react';
import { useFavorites } from "@/context/FavoritesContext";
import AiSearchModal from './AiSearchModal';

// ... (Mantenha as definições de CategoryItem e categories aqui igual ao anterior) ...
type CategoryItem = {
  name: string;
  href: string;
  icon: React.ReactNode;
  subcategories?: { name: string; slug: string }[];
};

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
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  
  // Estados da IA
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [showAiTooltip, setShowAiTooltip] = useState(false);

  const router = useRouter();
  const { favorites } = useFavorites();

  // Efeito para mostrar a mensagem "Use a IA" após 2 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      // Verifica se o usuário já fechou isso antes (opcional, usando localStorage)
      const hasSeen = localStorage.getItem('seenAiTooltip');
      if (!hasSeen) {
        setShowAiTooltip(true);
      }
    }, 2000); // Aparece após 2 segundos

    return () => clearTimeout(timer);
  }, []);

  const closeTooltip = () => {
    setShowAiTooltip(false);
    localStorage.setItem('seenAiTooltip', 'true'); // Não mostra mais nessa sessão
  };

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
    <>
      <nav className="sticky top-0 z-40 w-full bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 gap-4">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-zinc-900 dark:text-white shrink-0">
              <span className="bg-blue-600 text-white px-2 py-1 rounded-lg">Tech</span>
              Guide
            </Link>

            {/* Busca Desktop + Botão IA (Só visível em telas grandes) */}
            <div className="hidden md:flex flex-1 max-w-md relative mx-4 items-center gap-2">
              <form onSubmit={handleSearch} className="relative flex-1">
                <input
                  type="text"
                  placeholder="Buscar produtos..."
                  className="w-full pl-10 pr-4 py-2 rounded-full bg-zinc-100 dark:bg-zinc-900 border-none focus:ring-2 focus:ring-blue-500 text-sm outline-none transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute left-3 top-2.5 text-zinc-400" size={18} />
              </form>

              {/* Botão IA Desktop (Com Tooltip Relativo) */}
              <div className="relative">
                <button
                  onClick={() => {
                    setIsAiModalOpen(true);
                    setShowAiTooltip(false);
                  }}
                  className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full hover:shadow-lg hover:scale-105 transition-all"
                >
                  <Sparkles size={18} />
                </button>
                
                {/* Tooltip Desktop */}
                {showAiTooltip && (
                  <div className="absolute top-12 right-0 w-64 bg-white dark:bg-zinc-800 p-3 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-700 animate-in fade-in slide-in-from-top-2 z-50">
                    <div className="flex justify-between items-start gap-2">
                      <p className="text-xs text-zinc-600 dark:text-zinc-300 font-medium">
                        ✨ Não sabe qual escolher? <strong>Peça ajuda para nossa IA!</strong>
                      </p>
                      <button onClick={closeTooltip} className="text-zinc-400 hover:text-zinc-600">
                        <X size={14} />
                      </button>
                    </div>
                    {/* Setinha do balão */}
                    <div className="absolute -top-1 right-3 w-3 h-3 bg-white dark:bg-zinc-800 border-l border-t border-zinc-200 dark:border-zinc-700 rotate-45"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Menu Desktop */}
            <div className="hidden md:flex items-center h-full gap-1">
              {categories.map((cat) => (
                <div key={cat.name} className="relative group h-full">
                  <Link href={cat.href} className="flex flex-col items-center justify-center h-full px-3 py-1 text-[11px] font-bold text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors gap-1">
                    <div className="mb-0.5 text-zinc-700 dark:text-zinc-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {cat.icon}
                    </div>
                    <span className="flex items-center gap-0.5 uppercase tracking-wide leading-none text-center whitespace-nowrap">
                      {cat.name}
                      {cat.subcategories && <ChevronDown size={10} strokeWidth={3} />}
                    </span>
                  </Link>
                  {cat.subcategories && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-56 pt-0 hidden group-hover:block z-50">
                      <div className="mt-1 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-100 dark:border-zinc-800 overflow-hidden py-1">
                        {cat.subcategories.map((sub) => (
                          <Link key={sub.slug} href={`${cat.href}?sub=${sub.slug}`} className="block px-4 py-2 text-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-blue-600 text-left capitalize font-medium">
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Ações Mobile */}
            <div className="flex items-center gap-2 sm:gap-4">
              <Link href="/favoritos" className="relative p-2 text-zinc-500 hover:text-red-500 transition-colors">
                <Heart size={22} />
                {favorites.length > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full">
                    {favorites.length}
                  </span>
                )}
              </Link>
              <button onClick={() => setIsOpen(!isOpen)} className="md:hidden p-2 text-zinc-600 dark:text-zinc-300">
                {isOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </div>

        {/* Menu Mobile (Accordion) */}
        {isOpen && (
          <div className="md:hidden bg-white dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-900 absolute w-full shadow-xl h-[calc(100vh-64px)] overflow-y-auto">
            <div className="p-4 pb-20">
              <form onSubmit={handleSearch} className="relative mb-6">
                <input type="text" placeholder="O que você procura?" className="w-full pl-10 pr-4 py-3 rounded-lg bg-zinc-100 dark:bg-zinc-900 border-none outline-none" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                <Search className="absolute left-3 top-3.5 text-zinc-400" size={20} />
              </form>
              <div className="space-y-2">
                {categories.map((cat) => (
                  <div key={cat.name} className="flex flex-col bg-zinc-50 dark:bg-zinc-900/50 rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3">
                      <Link href={cat.href} className="flex items-center gap-3 font-bold text-zinc-800 dark:text-white flex-1" onClick={() => setIsOpen(false)}>
                        {cat.icon} {cat.name}
                      </Link>
                      {cat.subcategories && (
                        <button onClick={(e) => { e.preventDefault(); toggleCategory(cat.name); }} className="p-2 text-zinc-400 hover:text-blue-600">
                           {expandedCategory === cat.name ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                      )}
                    </div>
                    {cat.subcategories && expandedCategory === cat.name && (
                      <div className="bg-zinc-100 dark:bg-zinc-950 px-4 py-2 space-y-2 border-t border-zinc-200 dark:border-zinc-800 animate-in slide-in-from-top-2 duration-200">
                        {cat.subcategories.map((sub) => (
                          <Link key={sub.slug} href={`${cat.href}?sub=${sub.slug}`} className="block py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-blue-600 border-l-2 border-transparent hover:border-blue-600 pl-3" onClick={() => setIsOpen(false)}>
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

      {/* --- BOTÃO FLUTUANTE MOBILE (FAB) --- */}
      {/* Só aparece em telas pequenas (md:hidden) */}
      <div className="md:hidden fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        
        {/* Balão de Mensagem (Tooltip Mobile) */}
        {showAiTooltip && (
          <div className="bg-white dark:bg-zinc-800 p-3 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-700 w-48 mb-2 animate-in slide-in-from-right-10 duration-500 relative">
            <button 
              onClick={closeTooltip} 
              className="absolute -top-2 -left-2 bg-zinc-200 dark:bg-zinc-700 rounded-full p-1 text-zinc-500 hover:text-red-500 shadow-sm"
            >
              <X size={12} />
            </button>
            <p className="text-xs text-zinc-700 dark:text-zinc-200 leading-relaxed">
              👋 Ei! Experimente pedir recomendações para nossa <strong>IA Inteligente</strong>.
            </p>
            {/* Setinha apontando para baixo */}
            <div className="absolute -bottom-1 right-6 w-3 h-3 bg-white dark:bg-zinc-800 rotate-45 border-r border-b border-zinc-200 dark:border-zinc-700"></div>
          </div>
        )}

        {/* Botão Redondo Pulsante */}
        <button
          onClick={() => {
            setIsAiModalOpen(true);
            closeTooltip();
          }}
          className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-600/30 hover:scale-110 active:scale-95 transition-all"
        >
          {/* Animação de Pulse ("Ondinha" saindo do botão) */}
          <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75 animate-ping group-hover:hidden"></span>
          
          <Sparkles size={24} className="relative z-10" />
        </button>
      </div>

      <AiSearchModal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} />
    </>
  );
}