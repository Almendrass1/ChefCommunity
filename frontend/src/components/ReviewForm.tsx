import React from 'react';

interface ReviewFormProps {
    submittingReview: boolean;
    newRating: number;
    newComment: string;
    photoPreview: string | null;
    onRatingChange: (rating: number) => void;
    onCommentChange: (comment: string) => void;
    onPhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemovePhoto: () => void;
    onSubmit: (e: React.FormEvent) => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({
    submittingReview,
    newRating,
    newComment,
    photoPreview,
    onRatingChange,
    onCommentChange,
    onPhotoChange,
    onRemovePhoto,
    onSubmit
}) => {
    return (
        <div className="bg-primary/5 border-4 border-primary p-8 rounded-xl shadow-retro-sm sticky top-24">
            <h4 className="text-2xl font-black text-primary mb-6 uppercase tracking-tighter">Comparte tu opinión</h4>

            <form onSubmit={onSubmit} className="space-y-6">
                <div>
                    <span className="block font-mono text-[10px] font-bold uppercase tracking-wider mb-2 text-primary">Tu Calificación</span>
                    <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(star => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => onRatingChange(star)}
                                className="focus:outline-none group/star"
                                aria-label={`Calificar con ${star} estrellas`}
                            >
                                <span translate="no" className={`material-symbols-outlined notranslate text-3xl transition-all scale-100 hover:scale-110 ${star <= newRating ? 'text-amber-400 fill-current' : 'text-gray-300'}`}>star</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label 
                        htmlFor="comment-input"
                        className="block font-mono text-[10px] font-bold uppercase tracking-wider mb-2 text-primary"
                    >
                        Tu Comentario
                    </label>
                    <textarea
                        id="comment-input"
                        value={newComment}
                        onChange={(e) => onCommentChange(e.target.value)}
                        placeholder="¿Qué te ha parecido la receta?..."
                        className="w-full bg-white text-black border-2 border-black p-4 font-bold focus:outline-none focus:border-black focus:ring-4 focus:ring-primary/10 transition-all h-32 resize-none rounded-lg italic"
                        required
                    ></textarea>
                </div>

                {/* Camera Icon & Hidden Input & Boton Publicar */}
                <div className="flex items-center gap-4 mt-2">
                    <button
                        type="submit"
                        disabled={submittingReview}
                        className="w-full btn-primary py-4 text-sm font-black uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {submittingReview ? 'ENVIANDO...' : 'PUBLICAR COMENTARIO'}
                    </button>
                    <label className="cursor-pointer group flex items-center gap-2">
                        <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={onPhotoChange}
                            aria-label="Añadir foto"
                        />
                        <div className="w-10 h-10 rounded-full bg-white border-2 border-black flex items-center justify-center shadow-retro-sm group-hover:translate-y-[-2px] group-hover:shadow-retro transition-all group-active:translate-y-px group-active:shadow-none">
                            <span translate="no" className="material-symbols-outlined notranslate text-primary text-xl">photo_camera</span>
                        </div>
                    </label>

                    {photoPreview && (
                        <div className="relative w-12 h-12 rounded border-2 border-primary overflow-hidden animate-fade-in">
                            <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                            <button
                                type="button"
                                onClick={onRemovePhoto}
                                className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl-md hover:bg-red-600"
                                aria-label="Eliminar foto"
                            >
                                <span translate="no" className="material-symbols-outlined notranslate text-[10px]">close</span>
                            </button>
                        </div>
                    )}
                </div>
            </form>
        </div>
    );
};

export default ReviewForm;
