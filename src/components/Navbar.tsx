"use client";
import Link from 'next/link';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, X, Smartphone, Monitor, Cpu, Watch, Gamepad2, Headphones, Search, Heart } from 'lucide-react';
import { useFavorites } from "@/context/FavoritesContext";

const categories = [
    { name: 'Celulares', href: '/celulares', icon: <Smartphone size={18} /> },
    { name: 'Notebooks', href: '/notebooks', icon: <Monitor size={18} /> },
    { name: 'Peças PC', href: '/pecas', icon: <Cpu size={18} /> },
    { name: 'Relógios', href: '/relogios', icon: <Watch size={18} /> },
    { name: 'Games', href: '/games', icon: <Gamepad2 size={18} /> },
    { name: 'Acessórios', href: '/acessorios', icon: <Headphones size={18} /> },
];

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const router = useRouter();
    const { favorites } = useFavorites();

    const handleSearch = (e: FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            setIsOpen(false);
            router.push(`/busca?q=${encodeURIComponent(searchQuery)}`);
        }
    };

    return (
        <nav className="sticky top-0 z-40 w-full bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16 gap-4">
                    
                    {/* 1. Logo */}
                    <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-zinc-900 dark:text-white shrink-0">
                        <span className="bg-blue-600 text-white px-2 py-1 rounded-lg">Tech</span>Guide
                    </Link>

                    {/* 2. Barra de Pesquisa (Apenas Desktop) */}
                    <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md relative mx-4">
                        <input
                            type="text"
                            placeholder="Buscar produtos..."
                            className="w-full pl-10 pr-4 py-2 rounded-full bg-zinc-100 dark:bg-zinc-900 border-none focus:ring-2 focus:ring-blue-500 text-sm outline-none"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Search className="absolute left-3 top-2.5 text-zinc-400" size={18} />
                    </form>

                    {/* 3. Menu de Links (Apenas Desktop) */}
                    <div className="hidden md:flex space-x-4 lg:space-x-6 items-center">
                        {categories.map((cat) => (
                            <Link
                                key={cat.name}
                                href={cat.href}
                                className="flex flex-col items-center gap-1 text-[10px] uppercase font-bold text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                title={cat.name}
                            >
                                {cat.icon}
                                <span className="hidden lg:inline">{cat.name}</span>
                            </Link>
                        ))}
                    </div>

                    {/* 4. Área de Ações (Favoritos + Botão Mobile) */}
                    {/* Criei esta div para agrupar tudo o que fica na direita */}
                    <div className="flex items-center gap-2 sm:gap-4">
                        
                        {/* Botão de Favoritos (Visível sempre) */}
                        <Link href="/favoritos" className="relative p-2 text-zinc-500 hover:text-red-500 transition-colors">
                            <Heart size={22} />
                            {favorites.length > 0 && (
                                <span className="absolute top-0 right-0 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full">
                                    {favorites.length}
                                </span>
                            )}
                        </Link>

                        {/* Botão Hambúrguer (Apenas Mobile) */}
                        <div className="md:hidden">
                            <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-zinc-600 dark:text-zinc-300">
                                {isOpen ? <X /> : <Menu />}
                            </button>
                        </div>
                    </div>

                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {isOpen && (
                <div className="md:hidden bg-white dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-900 absolute w-full shadow-xl">
                    <div className="p-4">
                        {/* Busca Mobile */}
                        <form onSubmit={handleSearch} className="relative mb-4">
                            <input
                                type="text"
                                placeholder="O que você procura?"
                                className="w-full pl-10 pr-4 py-3 rounded-lg bg-zinc-100 dark:bg-zinc-900 border-none outline-none"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <Search className="absolute left-3 top-3.5 text-zinc-400" size={20} />
                        </form>

                        <div className="grid grid-cols-2 gap-2">
                            {categories.map((cat) => (
                                <Link
                                    key={cat.name}
                                    href={cat.href}
                                    className="flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900 border border-transparent hover:border-zinc-200"
                                    onClick={() => setIsOpen(false)}
                                >
                                    {cat.icon}
                                    {cat.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}