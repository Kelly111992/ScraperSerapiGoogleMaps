import React from 'react';
import { Star, MapPin, Navigation, Check } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface PlaceCardProps {
    place: {
        title: string;
        thumbnail?: string;
        rating?: number;
        reviews?: number;
        address?: string;
        place_id?: string;
        place_id_search?: string;
        gps_coordinates?: {
            latitude: number;
            longitude: number;
        };
    };
    onSelect: (placeId: string) => void; // Open details
    isSelected?: boolean;
    onToggleSelect?: (placeId: string) => void; // Toggle selection for export
    className?: string;
}

export function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

const PlaceCard: React.FC<PlaceCardProps> = ({ place, onSelect, isSelected, onToggleSelect, className }) => {
    const { title, thumbnail, rating, reviews, address, place_id, place_id_search } = place;
    const idToUse = place_id || place_id_search;

    return (
        <div
            className={cn(
                "group relative bg-white/5 backdrop-blur-sm border rounded-2xl overflow-hidden hover:bg-white/10 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10 cursor-pointer flex flex-col h-full",
                isSelected ? "border-purple-500 ring-1 ring-purple-500 bg-purple-500/10" : "border-white/10",
                className
            )}
            onClick={() => idToUse && onSelect(idToUse)}
        >
            {/* Selection Checkbox */}
            {onToggleSelect && idToUse && (
                <div
                    className="absolute top-3 left-3 z-20"
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleSelect(idToUse);
                    }}
                >
                    <div className={cn(
                        "w-6 h-6 rounded-lg border flex items-center justify-center transition-all shadow-md",
                        isSelected
                            ? "bg-purple-500 border-purple-500 text-white"
                            : "bg-black/40 border-white/30 text-transparent hover:border-white/60"
                    )}>
                        <Check size={14} strokeWidth={3} />
                    </div>
                </div>
            )}

            <div className="relative h-48 w-full overflow-hidden bg-gray-800">
                {thumbnail ? (
                    <img
                        src={thumbnail}
                        alt={title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement?.classList.add('flex', 'items-center', 'justify-center');
                            const fallbackIcon = document.createElement('div');
                            fallbackIcon.innerHTML = `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin opacity-20 text-gray-500"><path d="M20 10c0 6-9 13-9 13s-9-7-9-13a9 9 0 0 1 18 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;
                            e.currentTarget.parentElement?.appendChild(fallbackIcon);
                        }}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <MapPin size={48} className="opacity-20" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />

                {rating && (
                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1 border border-white/10">
                        <Star size={14} className="text-yellow-400 fill-yellow-400" />
                        <span className="text-white font-bold text-sm">{rating}</span>
                        <span className="text-gray-400 text-xs">({reviews || 0})</span>
                    </div>
                )}
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors line-clamp-2">
                        {title}
                    </h3>
                    {address && (
                        <div className="flex items-start gap-2 text-gray-400 text-sm mb-4">
                            <MapPin size={16} className="mt-1 flex-shrink-0 text-purple-400" />
                            <p className="line-clamp-2">{address}</p>
                        </div>
                    )}
                </div>

                <button
                    className="w-full mt-4 py-2 px-4 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600 hover:text-white transition-all duration-300 font-medium flex items-center justify-center gap-2 group-hover:border-purple-500"
                >
                    <Navigation size={16} />
                    Ver Detalles
                </button>
            </div>
        </div>
    );
};

export default PlaceCard;
