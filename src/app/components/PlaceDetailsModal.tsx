import React, { useEffect, useState } from 'react';
import { X, Star, MapPin, Phone, Globe, Clock, ChevronRight, MessageSquare, Facebook, Mail, Users, ThumbsUp } from 'lucide-react';
import axios from 'axios';
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
    const [activeTab, setActiveTab] = useState<'info' | 'reviews' | 'photos' | 'facebook'>('info');

    // Facebook Integration State
    const [facebookData, setFacebookData] = useState<any>(null);
    const [loadingFacebook, setLoadingFacebook] = useState(false);
    const [facebookError, setFacebookError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && placeId) {
            setLoading(true);
            setError(null);
            setDetails(initialData || null); // Show what we have first
            setFacebookData(null); // Reset FB data
            setFacebookError(null);
            setActiveTab('info');

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

    // Helper: Extract Facebook ID/Handle from URL
    const getFacebookId = (url: string): string | null => {
        if (!url) return null;
        // Matches facebook.com/page-name or facebook.com/profile.php?id=123
        // Also handles links potentially inside 'links' array if we had it
        // Basic extraction:
        try {
            const urlObj = new URL(url);
            if (!urlObj.hostname.includes('facebook.com')) return null;

            // Case 1: /profile.php?id=123
            const idParam = urlObj.searchParams.get('id');
            if (idParam) return idParam;

            // Case 2: /page-name
            // Pathname might be /page-name/ or /page-name
            const pathParts = urlObj.pathname.split('/').filter(p => p);
            if (pathParts.length > 0) {
                // Avoid reserved paths like 'groups', 'events' if necessary, but usually index 0 is the handle
                return pathParts[0];
            }
        } catch (e) {
            return null;
        }
        return null;
    };

    const facebookUrl = website && getFacebookId(website) ? website : null;
    // We could also check `links` array if it existed in data

    const handleFacebookAnalysis = async () => {
        if (!facebookUrl) return;

        const profileId = getFacebookId(facebookUrl);
        if (!profileId) {
            setFacebookError("No se pudo obtener el ID de Facebook.");
            return;
        }

        setLoadingFacebook(true);
        setFacebookError(null);
        setActiveTab('facebook');

        try {
            const response = await axios.post('/api/serpapi', {
                engine: 'facebook_profile',
                profile_id: profileId,
                type: 'profile' // Just for clarity
            });

            if (response.data.error) {
                throw new Error(response.data.error);
            }

            if (response.data.profile_results) {
                setFacebookData(response.data.profile_results);
            } else {
                setFacebookError("No se encontraron datos del perfil.");
            }
        } catch (err: any) {
            console.error("FB Analysis Error:", err);
            setFacebookError(err.response?.data?.error || err.message || "Error analizando Facebook");
        } finally {
            setLoadingFacebook(false);
        }
    };

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
                        referrerPolicy="no-referrer"
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
                <div className="flex bg-white/5 border-b border-white/5 px-6 shrink-0 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('info')}
                        className={cn("px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap", activeTab === 'info' ? "border-purple-500 text-purple-400" : "border-transparent text-gray-400 hover:text-white")}
                    >
                        Información
                    </button>
                    <button
                        onClick={() => setActiveTab('reviews')}
                        className={cn("px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap", activeTab === 'reviews' ? "border-purple-500 text-purple-400" : "border-transparent text-gray-400 hover:text-white")}
                    >
                        Reseñas
                    </button>
                    {(facebookUrl || facebookData) && (
                        <button
                            onClick={() => setActiveTab('facebook')}
                            className={cn("px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap", activeTab === 'facebook' ? "border-blue-500 text-blue-400" : "border-transparent text-gray-400 hover:text-blue-200")}
                        >
                            <Facebook size={16} />
                            Datos Facebook
                        </button>
                    )}
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
                                    <a href={website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-purple-300 hover:text-purple-200 transition-colors break-all">
                                        <Globe size={20} className="text-purple-400 shrink-0" />
                                        <span>{website}</span>
                                    </a>
                                )}
                                {hours && (
                                    <div className="flex items-start gap-3 text-gray-300">
                                        <Clock size={20} className="text-purple-400 mt-0.5 shrink-0" />
                                        <div className="text-sm space-y-1 w-full">
                                            {/* Handle hours structure safely */}
                                            {Array.isArray(hours) ? hours.map((h: any, i: number) => (
                                                <div key={i}>
                                                    {typeof h === 'string' ? h :
                                                        typeof h === 'object' && h !== null ?
                                                            Object.entries(h).map(([k, v]) => `${k}: ${v}`).join(', ')
                                                            : JSON.stringify(h)
                                                    }
                                                </div>
                                            )) : typeof hours === 'object' && hours !== null ? Object.entries(hours).map(([day, hr]: [string, any]) => (
                                                <div key={day} className="flex justify-between">
                                                    <span className="capitalize">{day}:</span>
                                                    <span>{typeof hr === 'string' ? hr : Array.isArray(hr) ? hr.join(', ') : JSON.stringify(hr)}</span>
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

                                {/* Facebook Promo Box */}
                                {facebookUrl && !facebookData && (
                                    <div className="mt-8 p-5 rounded-xl bg-blue-600/10 border border-blue-600/20">
                                        <h4 className="text-blue-400 font-medium mb-2 flex items-center gap-2">
                                            <Facebook size={18} />
                                            Perfil de Facebook Detectado
                                        </h4>
                                        <p className="text-sm text-gray-400 mb-4">
                                            Este negocio tiene presencia en Facebook. Analiza su perfil para obtener emails, seguidores y más datos de contacto.
                                        </p>
                                        <button
                                            onClick={handleFacebookAnalysis}
                                            disabled={loadingFacebook}
                                            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {loadingFacebook ? (
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            ) : (
                                                <>
                                                    <Users size={16} />
                                                    Extraer Datos de Facebook
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}

                                {!facebookUrl && !loading && (
                                    <div className="mt-8 p-4 rounded-xl bg-white/5 border border-white/10">
                                        <p className="text-xs text-gray-500 text-center">
                                            No se detectó enlace a Facebook en la información de Google Maps.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'facebook' && (
                        <div className="space-y-6">
                            {loadingFacebook && (
                                <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-4"></div>
                                    <p>Conectando con Facebook Graph...</p>
                                </div>
                            )}

                            {facebookError && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-center">
                                    {facebookError}
                                </div>
                            )}

                            {facebookData && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex items-center gap-4 mb-6">
                                        <img
                                            src={facebookData.profile_picture || facebookData.cover_photo}
                                            alt="Profile"
                                            className="w-20 h-20 rounded-full border-2 border-blue-500 object-cover"
                                            referrerPolicy="no-referrer"
                                        />
                                        <div>
                                            <h3 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                                                {facebookData.name}
                                                {facebookData.verified && <span className="text-blue-400" title="Verificado">✓</span>}
                                            </h3>
                                            <a href={facebookData.url} target="_blank" className="text-blue-400 hover:underline text-sm flex items-center gap-1">
                                                {facebookData.url}
                                            </a>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                                        <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center">
                                            <div className="text-blue-400 mb-1 flex justify-center"><Users size={20} /></div>
                                            <div className="text-xl font-bold text-white">{facebookData.followers || 'N/A'}</div>
                                            <div className="text-xs text-gray-400">Seguidores</div>
                                        </div>
                                        <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center">
                                            <div className="text-blue-400 mb-1 flex justify-center"><ThumbsUp size={20} /></div>
                                            <div className="text-xl font-bold text-white">{facebookData.likes || 'N/A'}</div>
                                            <div className="text-xs text-gray-400">Likes</div>
                                        </div>
                                        <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center">
                                            <div className="text-blue-400 mb-1 flex justify-center"><Mail size={20} /></div>
                                            <div className="text-sm font-bold text-white break-all">{facebookData.email || 'No público'}</div>
                                            <div className="text-xs text-gray-400">Email</div>
                                        </div>
                                    </div>

                                    <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-4">
                                        <h4 className="font-semibold text-white">Detalles del Perfil</h4>

                                        {facebookData.phone && (
                                            <div className="flex items-center gap-3 text-gray-300">
                                                <Phone size={18} className="text-blue-500" />
                                                <span>{facebookData.phone}</span>
                                            </div>
                                        )}
                                        {facebookData.category && (
                                            <div className="flex items-center gap-3 text-gray-300">
                                                <span className="text-blue-500 font-bold text-sm bg-blue-500/10 px-2 py-0.5 rounded">CAT</span>
                                                <span>{facebookData.category}</span>
                                            </div>
                                        )}
                                        {facebookData.profile_intro_text && (
                                            <div className="p-4 bg-black/20 rounded-xl text-gray-400 italic text-sm border-l-2 border-blue-500">
                                                "{facebookData.profile_intro_text}"
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
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
