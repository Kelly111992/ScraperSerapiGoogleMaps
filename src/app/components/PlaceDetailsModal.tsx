import React, { useEffect, useState } from 'react';
import { X, Star, MapPin, Phone, Globe, Clock, ChevronRight, MessageSquare } from 'lucide-react';
import { cn } from './PlaceCard';

interface PlaceDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    placeId: string | null;
    initialData?: any; // Optional: data we already have from the search result
    fetchDetails: (placeId: string) => Promise<any>;
}

const PlaceDetailsModal: React.FC<PlaceDetailsModalProps> = ({
    isOpen,
    onClose,
    placeId,
    initialData,
    fetchDetails
}) => {
    const [details, setDetails] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'info' | 'reviews' | 'photos'>('info');

    useEffect(() => {
        if (isOpen && placeId) {
            setLoading(true);
            setError(null);
            setDetails(initialData || null); // Show what we have first

            fetchDetails(placeId)
                .then(data => {
                    // Merge initial data with new detailed data if needed, or just set new data
                    // The API 'place' endpoint usually returns a 'place_results' or 'result' object
                    const result = data.place_results || data.result || data;
                    setDetails(result);
                })
                .catch(err => {
                    console.error("Error fetching details:", err);
                    setError("No se pudieron cargar los detalles completos. Intente de nuevo.");
                })
                .finally(() => setLoading(false));
        } else {
            setDetails(null);
        }
    }, [isOpen, placeId, fetchDetails, initialData]);

    if (!isOpen) return null;

    // Determine data source to display (prioritize fetched details)
    const displayData = details || initialData || {};
    const { title, rating, reviews, address, phone, website, open_state, hours, thumbnail, photos_link, reviews_link, description, extensions } = displayData;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#0f111a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">

                {/* Header Image Area */}
                <div className="relative h-48 sm:h-64 bg-gray-800 shrink-0">
                    <img
                        src={thumbnail || 'https://via.placeholder.com/800x400?text=No+Image'}
                        alt={title}
                        className="w-full h-full object-cover opacity-60"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f111a] to-transparent" />

                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-white/20 rounded-full text-white transition-colors backdrop-blur-md"
                    >
                        <X size={24} />
                    </button>

                    <div className="absolute bottom-0 left-0 p-6 sm:p-8 w-full">
                        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2 shadow-sm">{title}</h2>
                        <div className="flex items-center gap-3 text-white/90">
                            {rating && (
                                <div className="flex items-center gap-1 bg-yellow-400/20 px-2 py-0.5 rounded text-yellow-400 border border-yellow-400/30">
                                    <Star size={16} className="fill-current" />
                                    <span className="font-bold">{rating}</span>
                                </div>
                            )}
                            {reviews && <span className="text-gray-300 text-sm">({reviews} opiniones)</span>}
                            {open_state && <span className="text-green-400 text-sm font-medium px-2 py-0.5 bg-green-400/10 rounded border border-green-400/20">{open_state}</span>}
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex bg-white/5 border-b border-white/5 px-6 shrink-0">
                    <button
                        onClick={() => setActiveTab('info')}
                        className={cn("px-4 py-3 text-sm font-medium border-b-2 transition-colors", activeTab === 'info' ? "border-purple-500 text-purple-400" : "border-transparent text-gray-400 hover:text-white")}
                    >
                        Información
                    </button>
                    <button
                        onClick={() => setActiveTab('reviews')}
                        className={cn("px-4 py-3 text-sm font-medium border-b-2 transition-colors", activeTab === 'reviews' ? "border-purple-500 text-purple-400" : "border-transparent text-gray-400 hover:text-white")}
                    >
                        Reseñas
                    </button>
                    {/* Add more tabs if needed like Photos */}
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {loading && !details && (
                        <div className="flex justify-center py-10">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                        </div>
                    )}

                    {activeTab === 'info' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-white mb-4">Detalles</h3>
                                {address && (
                                    <div className="flex items-start gap-3 text-gray-300">
                                        <MapPin size={20} className="text-purple-400 mt-0.5 shrink-0" />
                                        <span>{address}</span>
                                    </div>
                                )}
                                {phone && (
                                    <div className="flex items-center gap-3 text-gray-300">
                                        <Phone size={20} className="text-purple-400 shrink-0" />
                                        <span>{phone}</span>
                                    </div>
                                )}
                                {website && (
                                    <a href={website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-purple-300 hover:text-purple-200 transition-colors">
                                        <Globe size={20} className="text-purple-400 shrink-0" />
                                        <span>Visitar Sitio Web</span>
                                    </a>
                                )}
                                {hours && (
                                    <div className="flex items-start gap-3 text-gray-300">
                                        <Clock size={20} className="text-purple-400 mt-0.5 shrink-0" />
                                        <div className="text-sm space-y-1">
                                            {/* Handle hours structure safely */}
                                            {Array.isArray(hours) ? hours.map((h: any, i: number) => (
                                                <div key={i}>
                                                    {typeof h === 'string' ? h :
                                                        typeof h === 'object' && h !== null ?
                                                            // Try to render object values or a safe property
                                                            Object.entries(h).map(([k, v]) => `${k}: ${v}`).join(', ')
                                                            : JSON.stringify(h)
                                                    }
                                                </div>
                                            )) : typeof hours === 'object' && hours !== null ? Object.entries(hours).map(([day, hr]: [string, any]) => (
                                                <div key={day}>
                                                    <span className="capitalize w-24 inline-block">{day}:</span>
                                                    {typeof hr === 'string' ? hr : Array.isArray(hr) ? hr.join(', ') : JSON.stringify(hr)}
                                                </div>
                                            )) : <span>Horarios disponibles en detalles completos</span>}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-white mb-4">Más Información</h3>
                                {description && <p className="text-gray-400 text-sm leading-relaxed">{description}</p>}
                                {extensions && Array.isArray(extensions) && (
                                    <div className="flex flex-wrap gap-2 mt-4">
                                        {extensions.map((ext: any, i: number) => {
                                            // Safely render extension which might be a string or an object
                                            let text = '';
                                            if (typeof ext === 'string') text = ext;
                                            else if (typeof ext === 'object' && ext !== null) {
                                                // It usually has a key like 'accessibility' or similar
                                                // We'll take the first value or join all values
                                                text = Object.values(ext).join(': ');
                                            }

                                            if (!text) return null;

                                            return (
                                                <span key={i} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-300">
                                                    {text}
                                                </span>
                                            );
                                        })}
                                    </div>
                                )}

                                <div className="mt-8 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                                    <h4 className="text-purple-300 font-medium mb-2 flex items-center gap-2">
                                        <MessageSquare size={16} />
                                        Análisis IA (Simulado)
                                    </h4>
                                    <p className="text-sm text-gray-400">
                                        Este lugar tiene una alta tasa de satisfacción en servicio. Los clientes frecuentemente mencionan la calidad del ambiente.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'reviews' && (
                        <div className="space-y-6">
                            {/* Placeholder for reviews list - needs real data structure */}
                            <div className="text-gray-400 text-center py-10">
                                {loading ? 'Cargando reseñas...' : 'Explora las reseñas detalladas en la versión completa.'}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PlaceDetailsModal;
