"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { ChevronRight, Filter } from "lucide-react";

// --- CONFIGURAÇÃO DAS SUBCATEGORIAS ---
const subcategoryOptions: Record<string, { label: string; slug: string }[]> = {
  pecas: [
    { label: "Processadores", slug: "processador" },
    { label: "Placas de Vídeo", slug: "placa-video" },
    { label: "Placas Mãe", slug: "placa-mae" },
    { label: "Memória RAM", slug: "memoria-ram" },
    { label: "Armazenamento", slug: "ssd-hd" },
    { label: "Fontes", slug: "fonte" },
  ],

  acessorios: [
    { label: "Mouses", slug: "mouse" },
    { label: "Teclados", slug: "teclado" },
    { label: "Headsets", slug: "headset" },
    { label: "Monitores", slug: "monitor" },
  ],

  celulares: [
    { label: "Android", slug: "android" },
    { label: "iPhone (iOS)", slug: "iphone" },
  ],

  notebooks: [
    { label: "Notebooks Gamer", slug: "gamer" },
    { label: "Notebooks para Trabalho", slug: "trabalho" },
    { label: "Acessórios para Notebook", slug: "acessorios" },
  ],
};

// 🔑 ALIASES para garantir compatibilidade total
const categoryAliasMap: Record<string, string> = {
  celular: "celulares",
  celulares: "celulares",
  smartphone: "celulares",

  notebook: "notebooks",
  notebooks: "notebooks",

  peca: "pecas",
  pecas: "pecas",

  acessorio: "acessorios",
  acessorios: "acessorios",
};

interface FilterProps {
  onFilterChange: (filters: FilterState) => void;
  brands: string[];
  categorySlug: string;
}

export interface FilterState {
  minPrice: number;
  maxPrice: number;
  selectedBrands: string[];
  minRating: number;
}

export default function FilterSidebar({
  onFilterChange,
  brands,
  categorySlug,
}: FilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // --- NORMALIZAÇÃO DO SLUG ---
  const normalizedCategory = useMemo(() => {
    const slug = categorySlug?.toLowerCase();
    return categoryAliasMap[slug] ?? slug;
  }, [categorySlug]);

  const subOptions = subcategoryOptions[normalizedCategory];

  // Estados
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);

  const currentSub = searchParams.get("sub");

  // Notifica o pai
  useEffect(() => {
    onFilterChange({
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
      selectedBrands,
      minRating,
    });
  }, [priceRange, selectedBrands, minRating, onFilterChange]);

  const handleSubcategoryClick = (slug: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (currentSub === slug) {
      params.delete("sub");
    } else {
      params.set("sub", slug);
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  const clearSubcategory = () => {
    router.push(pathname);
  };

  const toggleBrand = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand)
        ? prev.filter((b) => b !== brand)
        : [...prev, brand]
    );
  };

  return (
    <aside className="w-full h-fit space-y-6">

      {/* CATEGORIAS / SUBCATEGORIAS */}
      {subOptions && (
        <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <h3 className="font-bold text-lg mb-4 text-zinc-900 dark:text-white">
            Categorias
          </h3>

          <div className="space-y-1">
            <button
              onClick={clearSubcategory}
              className={`w-full text-left px-3 py-2 rounded-md text-sm flex justify-between ${
                !currentSub
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 font-medium"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              Ver Todos
              {!currentSub && <ChevronRight size={14} />}
            </button>

            {subOptions.map((opt) => (
              <button
                key={opt.slug}
                onClick={() => handleSubcategoryClick(opt.slug)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm flex justify-between ${
                  currentSub === opt.slug
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 font-medium"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                {opt.label}
                {currentSub === opt.slug && <ChevronRight size={14} />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* FILTROS */}
      <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
        <h3 className="font-bold text-lg mb-4 text-zinc-900 dark:text-white flex items-center gap-2">
          <Filter size={18} /> Filtros
        </h3>

        {/* Preço */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold mb-2 text-zinc-500 uppercase">
            Preço Máximo
          </h4>
          <div className="flex justify-between text-sm mb-2">
            <span>R$ 0</span>
            <span>R$ {priceRange[1]}</span>
          </div>
          <input
            type="range"
            min="0"
            max="10000"
            step="100"
            value={priceRange[1]}
            onChange={(e) => setPriceRange([0, Number(e.target.value)])}
            className="w-full accent-blue-600"
          />
        </div>

        {/* Marcas */}
        {brands.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold mb-2 text-zinc-500 uppercase">
              Marcas
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {brands.map((brand) => (
                <label key={brand} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(brand)}
                    onChange={() => toggleBrand(brand)}
                  />
                  {brand}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Avaliação */}
        <div>
          <h4 className="text-sm font-semibold mb-2 text-zinc-500 uppercase">
            Avaliação Mínima
          </h4>
          <div className="flex gap-2">
            {[3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() =>
                  setMinRating((prev) => (prev === star ? 0 : star))
                }
                className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  minRating === star
                    ? "bg-yellow-400 border-yellow-500 text-black"
                    : "border-zinc-300"
                }`}
              >
                {star}+ ⭐
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
