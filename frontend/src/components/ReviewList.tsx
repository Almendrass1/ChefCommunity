import React from 'react';

interface Review {
    id: number;
    username: string;
    user_avatar?: string;
    rating: number;
    comment: string;
    image_url?: string;
    created_at: string;
}

interface ReviewListProps {
    reviews: Review[];
}

const ReviewList: React.FC<ReviewListProps> = ({ reviews }) => {
    return (
        <div className="space-y-6">
            {reviews.length > 0 ? reviews.map((rev) => (
                <div key={rev.id} className="bg-white border-2 border-black p-6 rounded-xl shadow-retro-sm relative group overflow-hidden">
                    {/* VHS Scanline */}
                    <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(transparent_50%,rgba(0,0,0,1)_50%)] bg-size-[100%_4px]"></div>

                    <div className="flex gap-4 items-start relative z-10">
                        <img
                            src={rev.user_avatar || `https://ui-avatars.com/api/?name=${rev.username}&background=random`}
                            alt={rev.username}
                            className="w-12 h-12 rounded-full border-2 border-black shrink-0"
                        />
                        <div className="grow">
                            <div className="flex justify-between items-center mb-1">
                                <h4 className="font-bold text-lg text-secondary">{rev.username}</h4>
                                <div className="flex gap-0.5">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <span translate="no" key={star} className={`material-symbols-outlined notranslate text-sm ${star <= rev.rating ? 'text-amber-400 fill-current' : 'text-gray-200'}`}>star</span>
                                    ))}
                                </div>
                            </div>
                            <p className="text-gray-600 font-medium leading-relaxed italic">"{rev.comment}"</p>

                            {rev.image_url && (
                                <div className="mt-4 rounded-lg overflow-hidden border-2 border-black/5 max-w-sm">
                                    <img
                                        src={rev.image_url}
                                        alt="Foto del comentario"
                                        className="w-full h-auto object-cover hover:scale-105 transition-transform cursor-pointer"
                                        onClick={() => window.open(rev.image_url, '_blank')}
                                    />
                                </div>
                            )}

                            <div className="mt-2 text-[10px] font-mono text-gray-400 uppercase tracking-widest">
                                {new Date(rev.created_at).toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                </div>
            )) : (
                <div className="text-center py-10 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl font-mono text-gray-400 italic">
                    Nadie ha comentado todavía. ¡Sé el primero!
                </div>
            )}
        </div>
    );
};

export default ReviewList;
