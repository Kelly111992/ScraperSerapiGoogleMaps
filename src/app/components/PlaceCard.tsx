import React, { useState } from 'react';
import { Star, MapPin, Navigation, Check, ShieldCheck, ShieldX, Gem, FastForward, Facebook, Globe, AlertCircle, Loader2, TrendingUp, DollarSign, Activity } from 'lucide-react';
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
        setEnriching(true);
        try {
            await onEnrich(place);
        } finally {
            setEnriching(false);
        }
    };

    // Estilos por Rango
    const rankConfig = {
        'Diamond': { label: 'Oportunidad Diamante', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/50', icon: <Gem size={16} className="animate-pulse" /> },
        'Gold': { label: 'Prospecto de Oro', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/50', icon: <TrendingUp size={16} /> },
        'Silver': { label: 'Interés Medio', color: 'text-slate-300', bg: 'bg-slate-500/10', border: 'border-slate-500/30', icon: <Activity size={16} /> },
        'Bronze': { label: 'Bajo Perfil', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', icon: <AlertCircle size={16} /> },
    };

    const currentRank = enrichedData?.premiumRank ? rankConfig[enrichedData.premiumRank] : null;

    return (
        <div
            className={cn(
                "group relative bg-[#0f111a] rounded-2xl overflow-hidden border transition-all duration-500 flex flex-col h-full",
                isSelected ? "border-purple-500 ring-2 ring-purple-500/50" : "border-white/5 hover:border-white/20",
                isDiscard && "opacity-40 grayscale hover:grayscale-0 transition-all",
                enrichedData?.premiumRank === 'Diamond' && "border-cyan-500/60 shadow-[0_0_25px_rgba(34,211,238,0.15)]",
                enrichedData?.premiumRank === 'Gold' && "border-yellow-500/40 shadow-[0_0_20px_rgba(234,179,8,0.1)]",
                className
            )}
            onClick={() => onSelect(place)}
        >
            {/* Header Image Section */}
            <div className="relative h-44 w-full overflow-hidden bg-gray-900">
                {thumbnail ? (
                    <img
                        src={thumbnail}
                        alt={title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        referrerPolicy="no-referrer"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-700">
                        <MapPin size={40} className="opacity-20" />
                    </div>
                )}

                {/* Ranking Badge Overlay */}
                {currentRank && (
                    <div className={cn(
                        "absolute top-3 left-3 z-10 px-3 py-1.5 rounded-full backdrop-blur-xl border flex items-center gap-2 text-xs font-bold uppercase tracking-wider",
                        currentRank.bg, currentRank.color, currentRank.border
                    )}>
                        {currentRank.icon}
                        {currentRank.label}
                    </div>
                )}

                {/* Selection Checkbox */}
                {selectable && (
                    <div className="absolute top-3 right-3 z-20">
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleSelect?.(place.place_id || place.place_id_search || "");
                            }}
                            className={cn(
                                "w-7 h-7 rounded-full border flex items-center justify-center cursor-pointer transition-all",
                                isSelected
                                    ? "bg-purple-600 border-purple-600 text-white scale-110"
                                    : "bg-black/40 border-white/30 hover:bg-black/60 text-transparent"
                            )}
                        >
                            <Check size={16} strokeWidth={3} />
                        </div>
                    </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-[#0f111a] via-transparent to-transparent" />
            </div>

            {/* Content Section */}
            <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-3 gap-2">
                    <h3 className={cn(
                        "text-lg font-bold text-white leading-tight line-clamp-2",
                        enrichedData?.premiumRank === 'Diamond' && "text-cyan-100"
                    )}>
                        {title}
                    </h3>
                    {enrichedData?.premiumScore !== undefined && (
                        <div className="flex flex-col items-end">
                            <span className={cn("text-xl font-black", currentRank?.color || "text-purple-400")}>
                                {enrichedData.premiumScore}
                            </span>
                            <span className="text-[8px] text-gray-500 uppercase tracking-tighter">Priority Score</span>
                        </div>
                    )}
                </div>

                <div className="space-y-2 mb-4">
                    {address && (
                        <div className="flex items-start gap-2 text-gray-400 text-xs">
                            <MapPin size={14} className="mt-0.5 flex-shrink-0 text-purple-400" />
                            <p className="line-clamp-1">{address}</p>
                        </div>
                    )}
                    <div className="flex items-center gap-3">
                        {rating && (
                            <div className="flex items-center gap-1">
                                <Star size={12} className="text-yellow-400 fill-yellow-400" />
                                <span className="text-white font-bold text-xs">{rating}</span>
                                <span className="text-gray-500 text-[10px]">({reviews || 0})</span>
                            </div>
                        )}
                        <div className="flex gap-1.5 ml-auto">
                            {website && <Globe size={14} className="text-gray-500 hover:text-white transition-colors" />}
                            {enrichedData?.facebookUrl && <Facebook size={14} className="text-blue-400" />}
                            {enrichedData?.hasActiveAds && <DollarSign size={14} className="text-emerald-400" />}
                        </div>
                    </div>
                </div>

                {/* EXPLICIT REASONS (THE "WHY") */}
                {enrichedData && (
                    <div className="bg-white/5 rounded-xl p-3 mb-4 border border-white/5 space-y-1.5">
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Análisis de Potencial:</p>
                        {enrichedData.analysisReason.slice(0, 3).map((reason, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-[11px] text-gray-300">
                                <Check size={10} className="text-emerald-500 flex-shrink-0" />
                                <span className="line-clamp-1">{reason}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Niche Match (Strictness) */}
                {nicheMatch && nicheMatch.status !== 'neutral' && !enrichedData && (
                    <div className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-bold mb-4 border uppercase tracking-wider",
                        nicheMatch.status === 'relevant' && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                        nicheMatch.status === 'discard' && "bg-red-500/10 text-red-400 border-red-500/20"
                    )}>
                        {nicheMatch.status === 'relevant' ? <ShieldCheck size={14} /> : <ShieldX size={14} />}
                        <span className="truncate">{nicheMatch.reason}</span>
                    </div>
                )}

                {/* Actions */}
                <div className="flex flex-col gap-2 mt-auto">
                    {!enrichedData && (
                        <button
                            onClick={handleEnrich}
                            disabled={enriching}
                            className="w-full py-2.5 px-4 rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-600 hover:text-white transition-all duration-300 text-[11px] font-black tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {enriching ? (
                                <><Loader2 size={16} className="animate-spin" /> ESCANEANDO...</>
                            ) : (
                                <><FastForward size={16} /> ANALIZAR PREMIUM</>
                            )}
                        </button>
                    )}

                    <button
                        onClick={(e) => { e.stopPropagation(); onSelect(place); }}
                        className={cn(
                            "w-full py-2.5 px-4 rounded-xl text-[11px] font-black tracking-widest flex items-center justify-center gap-2 transition-all duration-300",
                            enrichedData?.premiumRank === 'Diamond'
                                ? "bg-cyan-600 text-white hover:bg-cyan-500 shadow-lg shadow-cyan-900/40"
                                : "bg-white/5 text-white border border-white/10 hover:bg-white/10"
                        )}
                    >
                        <Navigation size={16} />
                        DETALLES COMPLETOS
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PlaceCard;
