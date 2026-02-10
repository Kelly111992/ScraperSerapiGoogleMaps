import React, { useState } from 'react';
import { Star, MapPin, Navigation, Check, ShieldCheck, ShieldX, Gem, FastForward, Facebook, Globe, AlertCircle, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Place } from '@/types';

interface PlaceCardProps {
    place: Place;
    onSelect: (place: Place) => void;
    selectable?: boolean;
    isSelected?: boolean;
    onToggleSelect?: (id: string) => void;
    onEnrich?: (place: Place) => Promise<void>;
    className?: string;
}

export function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

const PlaceCard: React.FC<PlaceCardProps> = ({
    place,
    onSelect,
    selectable = false,
    isSelected = false,
    onToggleSelect,
    onEnrich,
    className
}) => {
    const [enriching, setEnriching] = useState(false);
    const { title, thumbnail, rating, reviews, address, website, nicheMatch, enrichedData } = place;

    const isDiscard = nicheMatch?.status === 'discard';

    const handleEnrich = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!onEnrich || enriching) return;

        console.log("Button clicked for:", title);
        setEnriching(true);
        try {
            await onEnrich(place);
            console.log("Enrichment finished for:", title);
        } catch (err) {
            console.error("Enrichment call failed:", err);
        } finally {
            setEnriching(false);
        }
    };

    // Estilos por Rango (Solo si vienen de enrichedData real)
    const rankConfig = {
        'Diamond': { color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', icon: <Gem size={14} className="animate-pulse" /> },
        'Gold': { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', icon: <Star size={14} /> },
        'Silver': { color: 'text-slate-300', bg: 'bg-slate-500/10', border: 'border-slate-500/30', icon: <ShieldCheck size={14} /> },
        'Bronze': { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', icon: <AlertCircle size={14} /> },
    };

    // Asegurarnos de que el rank viene de nuestro análisis profundo
    const hasBeenEnriched = !!enrichedData;
    const currentRank = enrichedData?.premiumRank ? rankConfig[enrichedData.premiumRank] : null;

    return (
        <div
            className={cn(
                "group relative bg-[#0f111a] rounded-2xl overflow-hidden border transition-all duration-500 flex flex-col h-full",
                isSelected ? "border-purple-500 ring-1 ring-purple-500" : "border-white/5 hover:border-purple-500/50",
                isDiscard && "opacity-50 hover:opacity-80",
                enrichedData?.premiumRank === 'Diamond' && "shadow-[0_0_20px_rgba(34,211,238,0.1)] border-cyan-500/40",
                className
            )}
            onClick={() => onSelect(place)}
        >
            {/* Diamond Glow Effect */}
            {enrichedData?.premiumRank === 'Diamond' && (
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent pointer-events-none" />
            )}

            {/* Selection Checkbox Overlay */}
            {selectable && (
                <div className="absolute top-3 left-3 z-20">
                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleSelect?.(place.place_id || place.place_id_search || "");
                        }}
                        className={cn(
                            "w-6 h-6 rounded-md border flex items-center justify-center cursor-pointer transition-colors backdrop-blur-sm",
                            isSelected
                                ? "bg-purple-600 border-purple-600 text-white"
                                : "bg-black/40 border-white/30 hover:bg-black/60 text-transparent"
                        )}
                    >
                        <Check size={14} strokeWidth={3} />
                    </div>
                </div>
            )}

            <div className="relative h-48 w-full overflow-hidden bg-gray-800">
                {thumbnail ? (
                    <img
                        src={thumbnail}
                        alt={title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        referrerPolicy="no-referrer"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <MapPin size={48} className="opacity-20" />
                    </div>
                )}

                {/* Ranking Badge Overlay - SOLO SI HA SIDO ENRIQUECIDO */}
                {hasBeenEnriched && currentRank && (
                    <div className={cn(
                        "absolute top-3 left-3 z-10 px-2 py-1 rounded-lg backdrop-blur-md border flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase",
                        currentRank.bg, currentRank.color, currentRank.border
                    )}>
                        {currentRank.icon}
                        {enrichedData?.premiumRank}
                    </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                    {rating && (
                        <div className="bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1 border border-white/10">
                            <Star size={14} className="text-yellow-400 fill-yellow-400" />
                            <span className="text-white font-bold text-sm">{rating}</span>
                            <span className="text-gray-400 text-[10px]">({reviews || 0})</span>
                        </div>
                    )}

                    <div className="flex gap-1.5">
                        {website && <div className="p-1.5 bg-white/10 backdrop-blur-md rounded-lg text-white/70 border border-white/5" title="Sitio Web"><Globe size={14} /></div>}
                        {enrichedData?.facebookUrl && <div className="p-1.5 bg-blue-600/20 backdrop-blur-md rounded-lg text-blue-400 border border-blue-500/20" title="Facebook"><Facebook size={14} /></div>}
                    </div>
                </div>
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                    <h3 className={cn(
                        "text-lg font-bold text-white mb-2 leading-tight transition-colors line-clamp-2",
                        enrichedData?.premiumRank === 'Diamond' ? "group-hover:text-cyan-300" : "group-hover:text-purple-300"
                    )}>
                        {title}
                    </h3>

                    {address && (
                        <div className="flex items-start gap-2 text-gray-400 text-xs mb-4">
                            <MapPin size={14} className="mt-0.5 flex-shrink-0 text-purple-400" />
                            <p className="line-clamp-1">{address}</p>
                        </div>
                    )}

                    {/* Niche Match Badge */}
                    {nicheMatch && nicheMatch.status !== 'neutral' && (
                        <div className={cn(
                            "flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-medium mb-4 border",
                            nicheMatch.status === 'relevant' && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                            nicheMatch.status === 'discard' && "bg-red-500/10 text-red-400 border-red-500/20"
                        )}>
                            {nicheMatch.status === 'relevant' && <ShieldCheck size={12} />}
                            {nicheMatch.status === 'discard' && <ShieldX size={12} />}
                            <span className="truncate">{nicheMatch.reason}</span>
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-2">
                    {/* Botón de Analizar - Solo si no hay datos enriquecidos */}
                    {!hasBeenEnriched && onEnrich && (
                        <button
                            onClick={handleEnrich}
                            disabled={enriching}
                            className="w-full py-2 px-4 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500 hover:text-white transition-all duration-300 text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {enriching ? (
                                <>
                                    <Loader2 size={14} className="animate-spin" />
                                    <span>ANALIZANDO...</span>
                                </>
                            ) : (
                                <>
                                    <FastForward size={14} />
                                    <span>ANALIZAR PREMIUM</span>
                                </>
                            )}
                        </button>
                    )}

                    <button
                        onClick={(e) => { e.stopPropagation(); onSelect(place); }}
                        className={cn(
                            "w-full py-2 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all duration-300",
                            enrichedData?.premiumRank === 'Diamond'
                                ? "bg-cyan-600 text-white hover:bg-cyan-500 shadow-lg shadow-cyan-900/20"
                                : "bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600 hover:text-white"
                        )}
                    >
                        <Navigation size={14} />
                        VER DETALLES
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PlaceCard;
