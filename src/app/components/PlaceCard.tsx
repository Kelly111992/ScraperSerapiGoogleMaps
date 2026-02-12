import React from 'react';
import { Star, MapPin, Navigation, Check, Gem, AlertCircle, TrendingUp, Activity, Globe, Facebook, DollarSign, ShieldCheck } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Place } from '@/types';

interface PlaceCardProps {
    place: Place;
    onSelect: (place: Place) => void;
    selectable?: boolean;
    isSelected?: boolean;
    onToggleSelect?: (id: string) => void;
    className?: string;
    rankIndex?: number;
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
    className,
    rankIndex
}) => {
    const { title, rating, reviews, address, website, nicheMatch, enrichedData, score: basicScore } = place;
    // Detección robusta de imagen (SerpApi usa varios campos según el motor y versión)
    const thumbnail = place.thumbnail ||
        (place as any).thumbnail_url ||
        (place as any).image ||
        (place as any).photo ||
        ((place as any).photos?.[0]?.thumbnail);

    // Estilos por Rango
    const rankConfig = {
        'Diamond': { label: 'MARVELSA DIAMOND', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/50', icon: <Gem size={16} className="animate-pulse" /> },
        'Gold': { label: 'MARVELSA GOLD', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/50', icon: <TrendingUp size={16} /> },
        'Silver': { label: 'Prospecto Silver', color: 'text-slate-300', bg: 'bg-slate-500/10', border: 'border-slate-500/30', icon: <Activity size={16} /> },
        'Bronze': { label: 'Bajo Perfil', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', icon: <AlertCircle size={16} /> },
    };

    const currentRank = enrichedData?.premiumRank ? rankConfig[enrichedData.premiumRank] : null;

    return (
        <div
            className={cn(
                "group relative bg-[#0f111a] rounded-2xl overflow-hidden border transition-all duration-500 flex flex-col h-full",
                isSelected ? "border-purple-500 ring-2 ring-purple-500/50" : "border-white/5 hover:border-white/20",
                enrichedData?.premiumRank === 'Diamond' && "border-cyan-500/60 shadow-[0_0_25px_rgba(34,211,238,0.15)]",
                enrichedData?.premiumRank === 'Gold' && "border-yellow-500/40 shadow-[0_0_20px_rgba(234,179,8,0.1)]",
                className
            )}
            onClick={() => onSelect(place)}
        >
            {/* Header Image Section */}
            <div className="relative h-40 w-full overflow-hidden bg-gray-900">
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
                        "absolute top-3 left-3 z-10 px-3 py-1.5 rounded-full backdrop-blur-xl border flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider",
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
                        "text-base font-bold text-white leading-tight line-clamp-2",
                        enrichedData?.premiumRank === 'Diamond' && "text-cyan-100 font-black"
                    )}>
                        {title}
                    </h3>
                    <div className="flex flex-col items-end">
                        <span className={cn("text-xl font-black", currentRank?.color || "text-purple-400")}>
                            {enrichedData?.premiumScore || basicScore?.total || 0}
                        </span>
                        <span className="text-[8px] text-gray-500 uppercase tracking-tighter">Priority</span>
                    </div>
                </div>

                {rankIndex !== undefined && (
                    <div className="absolute top-2 right-12 z-20 flex items-center justify-center w-8 h-8 rounded-full bg-white/10 text-white font-black text-xs border border-white/10 shadow-lg">
                        #{rankIndex + 1}
                    </div>
                )}

                <div className="space-y-2 mb-4">
                    {address && (
                        <div className="flex items-start gap-2 text-gray-500 text-[10px]">
                            <MapPin size={12} className="mt-0.5 flex-shrink-0 text-purple-400/50" />
                            <p className="line-clamp-1">{address}</p>
                        </div>
                    )}
                    <div className="flex items-center gap-3">
                        {rating && (
                            <div className="flex items-center gap-1">
                                <Star size={12} className="text-yellow-400 fill-yellow-400" />
                                <span className="text-white font-bold text-[10px]">{rating}</span>
                                <span className="text-gray-600 text-[9px]">({reviews || 0})</span>
                            </div>
                        )}
                        <div className="flex gap-2 ml-auto">
                            {website && <Globe size={13} className="text-gray-500 hover:text-white transition-colors" />}
                            {enrichedData?.facebookUrl && <Facebook size={13} className="text-blue-400" />}
                            {enrichedData?.hasActiveAds && <DollarSign size={13} className="text-emerald-400 font-bold" />}
                        </div>
                    </div>
                </div>

                {/* Ranking Explanation (WHY #1, #2...) */}
                {rankIndex !== undefined && rankIndex < 3 && (
                    <div className="mb-4 p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[9px] text-purple-200 italic leading-relaxed">
                        <span className="font-black text-purple-400 not-italic uppercase mr-1">
                            {rankIndex === 0 ? "🏆 Top Match:" : "💎 Recomendado:"}
                        </span>
                        {rankIndex === 0
                            ? "Dominancia total en mercado local con señales digitales de alta conversión."
                            : rankIndex === 1
                                ? "Excelente balance entre reputación y presencia en redes sociales."
                                : "Fuerte presencia local con alto volumen de interacción de clientes."
                        }
                    </div>
                )}

                {/* Analysis Reasons (THE WHY) */}
                <div className="bg-white/[0.03] rounded-xl p-3 mb-4 border border-white/5 space-y-1.5 min-h-[60px]">
                    <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest mb-1.5 flex items-center justify-between">
                        Audit Automático:
                        {(nicheMatch?.aiVerdict === 'prospect' || enrichedData?.premiumRank === 'Diamond') && <ShieldCheck size={10} className="text-emerald-400" />}
                    </p>

                    {enrichedData ? (
                        enrichedData.analysisReason.slice(0, 3).map((reason, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-[10px] text-gray-300">
                                <Check size={10} className="text-emerald-500 flex-shrink-0" />
                                <span className="line-clamp-1">{reason}</span>
                            </div>
                        ))
                    ) : nicheMatch ? (
                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2 text-[10px] text-gray-300">
                                <Check size={10} className="text-emerald-500 flex-shrink-0 opacity-50" />
                                <span className="line-clamp-1 italic">{nicheMatch.reason}</span>
                            </div>
                            <div className="flex items-center gap-1.5 pl-4">
                                <div className="h-1 w-full bg-white/5 rounded overflow-hidden">
                                    <div className="h-full bg-emerald-500/50 animate-pulse" style={{ width: '40%' }} />
                                </div>
                                <span className="text-[7px] text-gray-600 uppercase">Analizando...</span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            <div className="h-2 w-24 bg-white/5 rounded animate-pulse" />
                            <div className="h-2 w-32 bg-white/5 rounded animate-pulse" />
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="mt-auto flex gap-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); onSelect(place); }}
                        className={cn(
                            "flex-1 py-2.5 px-4 rounded-xl text-[10px] font-black tracking-widest flex items-center justify-center gap-2 transition-all duration-300",
                            enrichedData?.premiumRank === 'Diamond'
                                ? "bg-cyan-600 text-white shadow-lg shadow-cyan-900/40"
                                : "bg-white/5 text-white border border-white/10 hover:bg-white/10"
                        )}
                    >
                        <Navigation size={14} />
                        VER DETALLES
                    </button>
                    {(place.maps_url || (place as any).link) && (
                        <a
                            href={place.maps_url || (place as any).link}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 p-2.5 rounded-xl border border-red-500/20 transition-all duration-300 group"
                            title="Ver en Google Maps"
                        >
                            <MapPin size={16} className="group-hover:scale-110 transition-transform" />
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PlaceCard;
