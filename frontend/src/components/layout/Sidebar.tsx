import React, { useState } from 'react';
import { User } from '../../types';

interface SidebarProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    category: string;
    setCategory: (val: string) => void;
    difficulty: string;
    setDifficulty: (val: string) => void;
    fridgeOnly: boolean;
    setFridgeOnly: (val: boolean) => void;
    ingredientTags: string[];
    setIngredientTags: (tags: string[]) => void;
    ingInput: string;
    setIngInput: (val: string) => void;
    addIngredientTag: () => void;
    removeIngredientTag: (tag: string) => void;
    isPopular: boolean;
    setIsPopular: (val: boolean) => void;
    maxTime: number | undefined;
    setMaxTime: (val: number | undefined) => void;
    user: User | null;
}

const Sidebar: React.FC<SidebarProps> = ({
    searchQuery,
    setSearchQuery,
    category,
    setCategory,
    difficulty,
    setDifficulty,
    fridgeOnly,
    setFridgeOnly,
    ingredientTags,
    removeIngredientTag,
    ingInput,
    setIngInput,
    addIngredientTag,
    isPopular,
    setIsPopular,
    maxTime,
    setMaxTime,
    user
}) => {
    const [isMobileExpanded, setIsMobileExpanded] = useState(false);

    return (
        <aside className="w-full md:w-80 h-auto md:h-full border-b-4 md:border-b-0 md:border-r-4 border-black bg-black/30 flex flex-col overflow-y-auto no-scrollbar glass-retro flex-none transition-all duration-300">
            {/* Mobile Toggle Button */}
            <div className="md:hidden p-4 border-b border-white/5 flex items-center justify-between">
                <button
                    onClick={() => setIsMobileExpanded(!isMobileExpanded)}
                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-bold text-xs shadow-retro-sm active:translate-y-px active:shadow-none"
                >
                    <span translate="no" className="material-symbols-outlined notranslate text-lg">
                        {isMobileExpanded ? 'close' : 'search'}
                    </span>
                    <span>{isMobileExpanded ? 'CERRAR FILTROS' : 'BUSCAR Y FILTRAR'}</span>
                </button>
                {!isMobileExpanded && searchQuery && (
                    <span className="text-[10px] font-mono text-white/40 truncate ml-4 italic">"{searchQuery}"</span>
                )}
            </div>

            <div className={`${isMobileExpanded ? 'flex' : 'hidden md:flex'} p-6 flex-col gap-8`}>
                {/* Search Section */}
                <div className="flex flex-col gap-2">
                    <label className="block font-mono text-[9px] font-bold uppercase tracking-wider text-primary opacity-80">Buscar Receta</label>
                    <div className="relative group">
                        <span translate="no" className="material-symbols-outlined notranslate absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-lg group-focus-within:text-primary transition-colors">search</span>
                        <input
                            type="text"
                            placeholder="¿Qué te apetece hoy?..."
                            className="w-full bg-black/40 border-2 border-white/10 p-2.5 pl-10 rounded font-bold text-xs text-white focus:outline-none focus:border-primary transition-all placeholder:font-normal placeholder:italic placeholder:text-white/50"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-primary transition-colors"
                            >
                                <span translate="no" className="material-symbols-outlined text-lg">close</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Quick Filters */}
                <div className="flex flex-col gap-3">
                    <label className="block font-mono text-[9px] font-bold uppercase tracking-wider text-primary opacity-80">Filtros Rápidos</label>
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={() => setIsPopular(!isPopular)}
                            className={`w-full text-left px-4 py-2.5 rounded border-2 text-[11px] font-bold transition-all uppercase tracking-wider flex items-center justify-between
                            ${isPopular ? 'bg-amber-100/10 border-amber-500 text-amber-500 shadow-retro-sm translate-y-0.5' : 'bg-white/5 border-white/10 text-white/70 hover:border-amber-500/50'}`}
                        >
                            <span>Más Valorados</span>
                            <span translate="no" className="material-symbols-outlined notranslate text-lg">{isPopular ? 'star_rate' : 'grade'}</span>
                        </button>
                        <button
                            onClick={() => setCategory(category === 'Vegetariano' ? '' : 'Vegetariano')}
                            className={`w-full text-left px-4 py-2.5 rounded border-2 text-[11px] font-bold transition-all uppercase tracking-wider flex items-center justify-between
                            ${category === 'Vegetariano' ? 'bg-green-100/10 border-retro-green text-retro-green shadow-retro-sm translate-y-0.5' : 'bg-white/5 border-white/10 text-white/70 hover:border-retro-green/50'}`}
                        >
                            <span>Vegetariano</span>
                            <span translate="no" className="material-symbols-outlined notranslate text-lg">eco</span>
                        </button>
                        <button
                            onClick={() => setMaxTime(maxTime === 30 ? undefined : 30)}
                            className={`w-full text-left px-4 py-2.5 rounded border-2 text-[11px] font-bold transition-all uppercase tracking-wider flex items-center justify-between
                            ${maxTime === 30 ? 'bg-blue-100/10 border-blue-500 text-blue-400 shadow-retro-sm translate-y-0.5' : 'bg-white/5 border-white/10 text-white/70 hover:border-blue-500/50'}`}
                        >
                            <span>Rápido (30m)</span>
                            <span translate="no" className="material-symbols-outlined notranslate text-lg">timer</span>
                        </button>
                    </div>
                </div>

                {/* Advanced Selects */}
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="block font-mono text-[9px] font-bold uppercase tracking-wider text-primary opacity-80">Categoría</label>
                        <select
                            className="w-full bg-black/40 border-2 border-white/10 p-2.5 rounded font-bold text-xs text-white appearance-none cursor-pointer focus:border-primary transition-colors"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                        >
                            <option value="" className="bg-background-dark">Todas</option>
                            <option value="Postres" className="bg-background-dark">Postres</option>
                            <option value="Ensaladas" className="bg-background-dark">Ensaladas</option>
                            <option value="Plato Principal" className="bg-background-dark">Plato Principal</option>
                            <option value="Desayunos" className="bg-background-dark">Desayunos</option>
                            <option value="Aperitivos" className="bg-background-dark">Aperitivos</option>
                        </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="block font-mono text-[9px] font-bold uppercase tracking-wider text-primary opacity-80">Dificultad</label>
                        <select
                            className="w-full bg-black/40 border-2 border-white/10 p-2.5 rounded font-bold text-xs text-white appearance-none cursor-pointer focus:border-primary transition-colors"
                            value={difficulty}
                            onChange={(e) => setDifficulty(e.target.value)}
                        >
                            <option value="" className="bg-background-dark">Todas</option>
                            <option value="Fácil" className="bg-background-dark">Fácil</option>
                            <option value="Media" className="bg-background-dark">Media</option>
                            <option value="Difícil" className="bg-background-dark">Difícil</option>
                        </select>
                    </div>
                </div>

                {/* Fridge Section */}
                {user && (
                    <div className="flex flex-col gap-4 border-t-2 border-white/5 pt-8 mt-2">
                        <div className="flex flex-col gap-1.5">
                            <label className="block font-mono text-[9px] font-bold uppercase tracking-wider text-primary opacity-80">Mi Nevera</label>
                            <button
                                onClick={() => setFridgeOnly(!fridgeOnly)}
                                className={`flex items-center gap-3 p-3 px-6 border-2 font-bold uppercase tracking-tighter rounded transition-all shadow-retro-sm active:translate-y-0.5 active:shadow-none whitespace-nowrap text-[11px] w-full ${fridgeOnly
                                    ? 'bg-retro-green border-black text-black'
                                    : 'bg-black/40 border-white/10 text-white/70 hover:border-retro-green hover:text-retro-green'}`}
                            >
                                <span translate="no" className="material-symbols-outlined notranslate text-xl fill-current">kitchen</span>
                                <span>Activar Despensa</span>
                            </button>
                        </div>

                        {/* Ingredients Tag System Source */}
                        <div className="flex flex-col gap-3">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Añadir ingrediente..."
                                    className="flex-1 bg-black/40 border-2 border-white/10 p-2 px-4 font-bold text-white focus:outline-none focus:border-primary transition-all text-xs rounded"
                                    value={ingInput}
                                    onChange={(e) => setIngInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addIngredientTag()}
                                />
                                <button
                                    onClick={addIngredientTag}
                                    className="bg-primary text-white p-2 px-4 hover:bg-[#d95d00] transition-all border-2 border-black shadow-retro-sm text-[10px] font-black uppercase rounded"
                                >
                                    +
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {ingredientTags.map(tag => (
                                    <span
                                        key={tag}
                                        onClick={() => removeIngredientTag(tag)}
                                        className="vhs-badge cursor-pointer hover:bg-red-500 hover:text-white hover:border-red-500 transition-all flex items-center gap-1 group py-1"
                                    >
                                        {tag}
                                        <span translate="no" className="material-symbols-outlined notranslate text-[12px]">close</span>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Apply Button (Especially for Mobile) */}
                <div className="pt-4 mt-auto">
                    <button
                        onClick={() => setIsMobileExpanded(false)}
                        className="w-full btn-primary py-4 flex items-center justify-center gap-2 group"
                    >
                        <span translate="no" className="material-symbols-outlined notranslate group-hover:rotate-12 transition-transform">search_check</span>
                        <span>BUSCAR AHORA</span>
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
