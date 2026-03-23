import React from 'react';
import RecipeCard from '../components/RecipeCard';
import { Recipe } from '../types';

interface HomeViewProps {
    onRecipeClick: (recipe: Recipe) => void;
    recipes: Recipe[];
    searchQuery: string;
    category: string;
    fridgeOnly: boolean;
    ingredientTags: string[];
}

const HomeView: React.FC<HomeViewProps> = ({
    onRecipeClick,
    recipes,
    searchQuery,
    category,
    fridgeOnly,
    ingredientTags,
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
                    {recipes.length > 0 ? recipes.map((recipe) => (
                        <div key={recipe.id} onClick={() => onRecipeClick(recipe)} className="cursor-pointer">
                            <RecipeCard recipe={recipe} showWarnings={fridgeOnly || ingredientTags.length > 0} />
                        </div>
                    )) : (
                        <div className="col-span-full py-20 text-center text-secondary dark:text-[#b9a89d] font-mono border-2 border-dashed border-secondary">
                            NO SE ENCONTRARON RECETAS. SÉ EL PRIMERO EN SUBIR UNA.
                        </div>
                    )}
                </div>
            </main >
        </div >
    );
};

export default HomeView;
