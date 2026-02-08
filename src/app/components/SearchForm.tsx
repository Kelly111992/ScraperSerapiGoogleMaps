'use client';

import { useState } from 'react';
import { Search, Map, Star, Image, MapPin } from 'lucide-react';

interface SearchFormProps {
    onSearch: (params: any) => void;
    isLoading: boolean;
}

export default function SearchForm({ onSearch, isLoading }: SearchFormProps) {
    const [query, setQuery] = useState('');
    const [engine, setEngine] = useState('google_maps');
    const [ll, setLl] = useState('@40.7455096,-74.0083695,14z'); // Default: NYC
    const [type, setType] = useState('search');
    const [placeId, setPlaceId] = useState(''); // Serves as data_id or place_id

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const params: any = { engine };

        if (engine === 'google_maps') {
            params.type = type;
            if (type === 'search') {
                params.q = query;
                params.ll = ll;
            } else if (type === 'place') {
                // For place, we need data (deprecated) or place_id/data_cid
                // We'll prioritize place_id if it looks like one, or data_id
                if (placeId.startsWith('!')) {
                    params.data = placeId; // It's likely a data string
                } else {
                    params.place_id = placeId;
                }
            }
        } else if (engine === 'google_maps_reviews' || engine === 'google_maps_photos') {
            // These usually require data_id or place_id
            if (placeId.startsWith('!')) {
                params.data_id = placeId; // It's likely a data string
            } else {
                params.place_id = placeId;
            }
        }

        onSearch(params);
    };

    return (
        <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Engine</label>
                    <select
                        value={engine}
                        onChange={(e) => setEngine(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-600 text-white rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="google_maps">Google Maps (Search/Place)</option>
                        <option value="google_maps_reviews">Google Maps Reviews</option>
                        <option value="google_maps_photos">Google Maps Photos</option>
                    </select>
                </div>

                {engine === 'google_maps' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Search Type</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-600 text-white rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="search">Search (Query + LL)</option>
                            <option value="place">Place Details (Place ID)</option>
                        </select>
                    </div>
                )}
            </div>

            {/* Dynamic Inputs based on Engine/Type */}

            {engine === 'google_maps' && type === 'search' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Search Query (q)</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="e.g. Coffee"
                                className="w-full bg-gray-900 border border-gray-600 text-white rounded-md pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                required
                            />
                            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Coordinates (@lat,long,zoom)</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={ll}
                                onChange={(e) => setLl(e.target.value)}
                                placeholder="@40.745,-74.008,14z"
                                className="w-full bg-gray-900 border border-gray-600 text-white rounded-md pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <Map className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
                        </div>
                    </div>
                </div>
            )}

            {(engine === 'google_maps_reviews' || engine === 'google_maps_photos' || (engine === 'google_maps' && type === 'place')) && (
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-1">Place ID / Data ID</label>
                    <div className="relative">
                        <input
                            type="text"
                            value={placeId}
                            onChange={(e) => setPlaceId(e.target.value)}
                            placeholder="Place ID (ChIJ...) or Data ID (!4m5...)"
                            className="w-full bg-gray-900 border border-gray-600 text-white rounded-md pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            required
                        />
                        <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Found in search results (place_id) or URL (data).</p>
                </div>
            )}

            <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-2 px-4 rounded-md font-bold text-white transition-colors ${isLoading
                        ? 'bg-blue-800 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
            >
                {isLoading ? 'Searching...' : 'Test Endpoint'}
            </button>
        </form>
    );
}
