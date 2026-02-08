import React from 'react';
import { Star, ThumbsUp, MessageCircle, MoreHorizontal, User, BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming you have a utils file for classnames

interface Review {
    review_id: string;
    user: {
        name: string;
        thumbnail?: string;
        local_guide?: boolean;
        reviews?: number;
    };
    rating: number;
    date: string;
    snippet?: string;
    likes?: number;
    images?: string[];
    response?: {
        date: string;
        snippet: string;
    };
}

interface ReviewsListProps {
    reviews: Review[];
    isLoading?: boolean;
}

const ReviewsList: React.FC<ReviewsListProps> = ({ reviews, isLoading }) => {
    if (isLoading) {
        return (
            <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse flex gap-4 p-4 border-b border-white/10">
                        <div className="w-10 h-10 bg-white/10 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-white/10 rounded w-1/3" />
                            <div className="h-3 bg-white/5 rounded w-1/4" />
                            <div className="h-16 bg-white/5 rounded w-full mt-2" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (!reviews || reviews.length === 0) {
        return (
            <div className="text-center py-10 text-gray-400">
                <MessageCircle className="mx-auto h-12 w-12 opacity-20 mb-3" />
                <p>No hay reseñas disponibles para este lugar.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {reviews.map((review) => (
                <div key={review.review_id} className="border-b border-white/10 pb-6 last:border-0 animation-delay-100 animate-in fade-in slide-in-from-bottom-2">
                    {/* Header: User & Rating */}
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                {review.user.thumbnail ? (
                                    <img
                                        src={review.user.thumbnail}
                                        alt={review.user.name}
                                        className="w-10 h-10 rounded-full object-cover border border-white/10"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300">
                                        <User size={20} />
                                    </div>
                                )}
                                {review.user.local_guide && (
                                    <div className="absolute -bottom-1 -right-1 bg-orange-500 text-white p-[2px] rounded-full" title="Local Guide">
                                        <Star size={8} fill="currentColor" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <h4 className="font-medium text-sm text-gray-200 flex items-center gap-1.5">
                                    {review.user.name}
                                    {review.user.local_guide && (
                                        <span className="text-[10px] text-orange-400 font-normal px-1.5 py-0.5 bg-orange-500/10 rounded-full border border-orange-500/20">
                                            Local Guide
                                        </span>
                                    )}
                                </h4>
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                    <div className="flex text-amber-400">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                size={12}
                                                fill={i < review.rating ? "currentColor" : "none"}
                                                className={i < review.rating ? "" : "text-gray-600"}
                                            />
                                        ))}
                                    </div>
                                    <span>•</span>
                                    <span>{review.date}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="pl-13 ml-13">
                        {review.snippet && (
                            <p className="text-sm text-gray-300 leading-relaxed mb-3 whitespace-pre-line">
                                {review.snippet}
                            </p>
                        )}

                        {/* Photos */}
                        {review.images && review.images.length > 0 && (
                            <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-thin scrollbar-thumb-white/10">
                                {review.images.map((img, idx) => (
                                    <img
                                        key={idx}
                                        src={img}
                                        alt={`Review photo ${idx}`}
                                        className="h-24 w-auto rounded-lg border border-white/10 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                    />
                                ))}
                            </div>
                        )}

                        {/* Owner Response */}
                        {review.response && (
                            <div className="bg-white/5 rounded-lg p-3 mt-3 border-l-2 border-indigo-500">
                                <p className="text-xs font-semibold text-indigo-300 mb-1 flex items-center gap-1">
                                    <BadgeCheck size={12} />
                                    Respuesta del propietario
                                    <span className="text-gray-500 font-normal">• {review.response.date}</span>
                                </p>
                                <p className="text-xs text-gray-400 italic">
                                    "{review.response.snippet}"
                                </p>
                            </div>
                        )}

                        {/* Likes (if any) */}
                        {review.likes !== undefined && review.likes > 0 && (
                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                                <ThumbsUp size={12} />
                                <span>{review.likes}</span>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ReviewsList;
