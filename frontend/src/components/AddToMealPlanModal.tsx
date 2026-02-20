import { useState } from 'react';

interface AddToMealPlanModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (date: string, mealTime: string) => Promise<void>;
    recipeTitle: string;
}

const AddToMealPlanModal: React.FC<AddToMealPlanModalProps> = ({ isOpen, onClose, onAdd, recipeTitle }) => {
    const [date, setDate] = useState('');
    const [mealTime, setMealTime] = useState('Comida');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (!date) {
                setError('Por favor selecciona una fecha');
                setLoading(false);
                return;
            }
            await onAdd(date, mealTime);
            // If successful, onAdd should handle closing or parent will close
            onClose();
        } catch (err: any) {
            setError(err.message || 'Error al añadir al plan');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#221810] border-4 border-black dark:border-[#5D4037] p-6 rounded-xl shadow-retro-lg max-w-md w-full relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-[#5D4037] hover:text-red-500"
                >
                    <span className="material-symbols-outlined">close</span>
                </button>

                <h3 className="text-2xl font-bold uppercase text-primary mb-4">Añadir al Plan Semanal</h3>
                <p className="font-mono text-sm text-[#5D4037] dark:text-[#b9a89d] mb-6">
                    Agendando: <span className="font-bold">"{recipeTitle}"</span>
                </p>

                {error && (
                    <div className="bg-red-100 text-red-700 p-2 mb-4 text-sm font-mono border-l-4 border-red-500">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold uppercase mb-1 text-[#5D4037] dark:text-[#b9a89d]">Fecha</label>
                        <input
                            type="date"
                            required
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full bg-[#f0f0f0] border-2 border-black p-2 font-mono focus:border-primary focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold uppercase mb-1 text-[#5D4037] dark:text-[#b9a89d]">Comida</label>
                        <select
                            value={mealTime}
                            onChange={(e) => setMealTime(e.target.value)}
                            className="w-full bg-[#f0f0f0] border-2 border-black p-2 font-mono focus:border-primary focus:outline-none"
                        >
                            <option value="Desayuno">Desayuno</option>
                            <option value="Comida">Comida</option>
                            <option value="Cena">Cena</option>
                        </select>
                    </div>

                    <div className="flex gap-4 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-gray-200 hover:bg-gray-300 text-black font-bold py-2 px-4 rounded border-2 border-black uppercase"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-primary hover:bg-[#d95d00] text-white font-bold py-2 px-4 rounded border-2 border-black uppercase shadow-retro-sm active:translate-y-0.5 active:shadow-none"
                        >
                            {loading ? 'Guardando...' : 'Confirmar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddToMealPlanModal;
