import React from 'react';

interface Ingredient {
    name: string;
    quantity?: string;
    unit?: string;
}

interface IngredientListProps {
    ingredients: (Ingredient | string)[];
    loading?: boolean;
}

const IngredientList: React.FC<IngredientListProps> = ({ ingredients, loading }) => {
    return (
        <div className="bg-[#fef9c3] text-gray-800 p-1 rounded-sm shadow-retro -rotate-1 transform transition hover:rotate-0 duration-300 relative">
            {/* Tape effect */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-8 bg-white/40 rotate-1 backdrop-blur-sm border-l border-r border-white/20 shadow-sm z-10"></div>

            <div className="bg-[repeating-linear-gradient(#fef9c3,#fef9c3_31px,#9ca3af_32px)] p-6 min-h-[500px] font-mono relative">
                {/* Red margin line */}
                <div className="absolute top-0 bottom-0 left-12 w-[2px] bg-red-300/50"></div>

                <h3 className="text-2xl font-bold text-[#181411] mb-8 underline decoration-wavy decoration-primary underline-offset-4 pl-8">
                    Ingredientes {loading && <span className="animate-pulse opacity-50 text-sm ml-2 font-normal">(Cargando...)</span>}
                </h3>

                <ul className="space-y-0 pl-2 relative z-10">
                    {ingredients.length > 0 ? ingredients.map((item, i) => {
                        const name = typeof item === 'string' ? item : item.name;
                        const detail = typeof item === 'object' && (item.quantity || item.unit) 
                            ? ` (${item.quantity || ''} ${item.unit || ''})`.trim() 
                            : '';
                        const id = `ingredient-${i}`;
                        
                        return (
                            <li key={id} className="flex items-start gap-3 group cursor-pointer h-8 pt-1">
                                <input 
                                    id={id}
                                    className="retro-checkbox w-5 h-5 border-2 border-black rounded-none focus:ring-0 text-primary mt-0.5" 
                                    type="checkbox" 
                                />
                                <label 
                                    htmlFor={id}
                                    className="text-lg leading-tight group-hover:text-primary transition-colors decoration-2 cursor-pointer"
                                >
                                    {name}{detail}
                                </label>
                            </li>
                        );
                    }) : (
                        <div className="py-4 text-center font-mono opacity-60 italic text-[#5D4037]">
                            Receta sin ingredientes registrados.
                        </div>
                    )}
                </ul>

                {/* Handwritten note at bottom */}
                <div className="absolute bottom-6 right-6 font-mono text-[#5D4037] transform -rotate-6 opacity-80 font-bold text-sm">
                    * ¡No olvides el perejil fresco!
                </div>
            </div>
        </div>
    );
};

export default IngredientList;
