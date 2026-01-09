"use client";
import { useState, useEffect } from "react";

interface FilterProps {
  onFilterChange: (filters: FilterState) => void;
  brands: string[];
}

export interface FilterState {
  minPrice: number;
  maxPrice: number;
  selectedBrands: string[];
  minRating: number;
}

export default function FilterSidebar({ onFilterChange, brands }: FilterProps) {
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);

  // Notifica o pai quando os filtros mudam
  useEffect(() => {
    onFilterChange({
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
      selectedBrands,
      minRating
    });
  }, [priceRange, selectedBrands, minRating]);

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev => 
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  return (
    <aside className="w-full md:w-64 p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 h-fit">
      <h3 className="font-bold text-lg mb-4 text-zinc-900 dark:text-white">Filtros</h3>
      
      {/* Filtro de Preço */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold mb-2 text-zinc-500 uppercase">Preço Máximo</h4>
        <div className="flex justify-between text-sm mb-2 font-mono text-zinc-700 dark:text-zinc-300">
          <span>R$ 0</span>
          <span>R$ {priceRange[1]}</span>
        </div>
        <input 
          type="range" 
          min="0" max="10000" step="100"
          value={priceRange[1]}
          onChange={(e) => setPriceRange([0, Number(e.target.value)])}
          className="w-full accent-blue-600 h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      {/* Filtro de Marcas */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold mb-2 text-zinc-500 uppercase">Marcas</h4>
        <div className="space-y-2">
          {brands.map(brand => (
            <label key={brand} className="flex items-center gap-2 cursor-pointer text-sm text-zinc-700 dark:text-zinc-300 hover:text-blue-600">
              <input 
                type="checkbox" 
                className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                checked={selectedBrands.includes(brand)}
                onChange={() => toggleBrand(brand)}
              />
              {brand}
            </label>
          ))}
        </div>
      </div>

      {/* Filtro de Avaliação */}
      <div>
        <h4 className="text-sm font-semibold mb-2 text-zinc-500 uppercase">Avaliação Mínima</h4>
        <div className="flex gap-2">
          {[3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setMinRating(prev => prev === star ? 0 : star)}
              className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                minRating === star 
                ? 'bg-yellow-400 border-yellow-500 text-black' 
                : 'bg-transparent border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 text-zinc-600 dark:text-zinc-300'
              }`}
            >
              {star}+ ⭐
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}