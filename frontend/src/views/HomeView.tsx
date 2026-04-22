import React from 'react';
import RecipeCard from '../components/RecipeCard';
import { Recipe } from '../types';

interface HomeViewProps {
    onRecipeClick: (recipe: Recipe) => void;
    recipes: Recipe[];
    searchQuery: string;
    category: string;
    fridgeOnly: boolean;
}

const HomeView: React.FC<HomeViewProps> = ({
    onRecipeClick,
    recipes,
    searchQuery,
    category,
    fridgeOnly,
}) => {
    return (
        <div className="flex flex-col grow min-h-0">
            <main className="grow px-8 py-8 w-full overflow-y-auto no-scrollbar">
                <div className="flex items-center justify-between mb-8 ">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-4xl text-primary font-bold uppercase tracking-tighter whitespace-nowrap">
                            {searchQuery || category || fridgeOnly ? 'Resultados' : 'Explorar'}
                        </h2>
                        {recipes.length > 0 && (
                            <span className="font-mono text-[10px] text-secondary dark:text-amber-500/70 opacity-50 uppercase tracking-widest">{recipes.length} RECETAS ENCONTRADAS</span>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
                    {recipes.filter(r => !r.is_suggestion).length > 0 ? recipes.filter(r => !r.is_suggestion).map((recipe) => (
                        <div key={recipe.id} onClick={() => onRecipeClick(recipe)} className="cursor-pointer">
                            <RecipeCard recipe={recipe} showWarnings={fridgeOnly} />
                        </div>
                    )) : (
                        <div className="col-span-full py-20 text-center text-secondary dark:text-[#b9a89d] font-mono border-2 border-dashed border-secondary">
                            NO SE ENCONTRARON RECETAS EXACTAS. SÉ EL PRIMERO EN SUBIR UNA.
                        </div>
                    )}
                </div>

                {recipes.filter(r => r.is_suggestion).length > 0 && (
                    <div className="mt-12">
                        <div className="flex items-center gap-2 mb-6">
                            <span translate="no" className="material-symbols-outlined text-amber-500">auto_awesome</span>
                            <h3 className="text-xl font-bold uppercase tracking-widest text-amber-500">SUGERENCIAS: Quizás te interese esto con tus ingredientes</h3>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
                            {recipes.filter(r => r.is_suggestion).map((recipe) => (
                                <div key={`sug-${recipe.id}`} onClick={() => onRecipeClick(recipe)} className="cursor-pointer">
                                    <RecipeCard recipe={recipe} showWarnings={true} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main >
        </div >
    );
};

export default HomeView;
