import React, { useState, useEffect } from 'react';
import { Search, MapPin, Loader2, Navigation } from 'lucide-react';
import { mexicoLocations, MexicoState } from '@/data/mexicoLocations';

interface SearchBarProps {
    onSearch: (query: string, location: string) => void;
    isLoading: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading }) => {
    const [query, setQuery] = useState('');
    const [locationMode, setLocationMode] = useState<'state' | 'custom'>('state');
    const [selectedState, setSelectedState] = useState<string>('');
    const [selectedCity, setSelectedCity] = useState<string>('');
    const [customLocation, setCustomLocation] = useState('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        let finalLocation = '';
        if (locationMode === 'state') {
            if (selectedCity && selectedState) {
                finalLocation = `${selectedCity}, ${selectedState}`;
            } else {
                finalLocation = selectedState;
            }
        } else {
            finalLocation = customLocation;
        }

        onSearch(query, finalLocation);
    };

    const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedState(e.target.value);
        setSelectedCity(''); // Reset city when state changes
    };

    const availableCities = selectedState && (mexicoLocations as any)[selectedState]
        ? (mexicoLocations as any)[selectedState]
        : [];

    return (
        <form onSubmit={handleSearch} className="w-full max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row gap-3 p-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl transition-all focus-within:bg-white/10 focus-within:border-white/20">

                {/* Keyword Input */}
                <div className="flex-1 flex items-center px-4 h-14 bg-transparent group">
                    <Search className="text-gray-400 group-focus-within:text-purple-400 transition-colors mr-3" size={20} />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="¿Qué estás buscando? (ej. Tacos, Dentista...)"
                        className="w-full bg-transparent text-white placeholder-gray-400 outline-none text-lg selection:bg-purple-500/30"
                    />
                </div>

                <div className="h-px md:h-10 w-full md:w-px bg-white/10 mx-1" />

                {/* Location Section */}
                <div className="flex flex-col sm:flex-row gap-2 md:w-[45%]">

                    {/* Toggle Mode Button (Small) */}
                    {/* We could add a toggle here, but for now let's keep it simple with dropdowns or input */}

                    {locationMode === 'state' ? (
                        <div className="flex flex-1 gap-2">
                            {/* State Dropdown */}
                            <div className="relative flex-1 group">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-400 pointer-events-none transition-colors" size={16} />
                                <select
                                    value={selectedState}
                                    onChange={handleStateChange}
                                    className="w-full h-14 pl-9 pr-4 bg-white/5 border border-transparent rounded-2xl text-white outline-none focus:bg-white/10 focus:border-blue-500/30 appearance-none cursor-pointer transition-all text-sm"
                                >
                                    <option value="" className="bg-gray-900 text-gray-400">Estado...</option>
                                    {Object.keys(mexicoLocations).sort().map((state) => (
                                        <option key={state} value={state} className="bg-gray-900 text-white">
                                            {state}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Municipality Dropdown */}
                            <div className="relative flex-1 group">
                                <select
                                    value={selectedCity}
                                    onChange={(e) => setSelectedCity(e.target.value)}
                                    disabled={!selectedState}
                                    className="w-full h-14 px-4 bg-white/5 border border-transparent rounded-2xl text-white outline-none focus:bg-white/10 focus:border-blue-500/30 appearance-none cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                >
                                    <option value="" className="bg-gray-900 text-gray-400">Municipio...</option>
                                    {availableCities.map((city: string) => (
                                        <option key={city} value={city} className="bg-gray-900 text-white">
                                            {city}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    ) : (
                        <div className="relative flex-1 group">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-400 transition-colors" size={20} />
                            <input
                                type="text"
                                value={customLocation}
                                onChange={(e) => setCustomLocation(e.target.value)}
                                placeholder="Ubicación personalizada..."
                                className="w-full h-14 pl-12 pr-4 bg-white/5 border border-transparent rounded-2xl text-white outline-none focus:bg-white/10 text-sm"
                            />
                        </div>
                    )}

                    {/* Mode Toggle (Subtle) */}
                    <button
                        type="button"
                        onClick={() => setLocationMode(prev => prev === 'state' ? 'custom' : 'state')}
                        className="p-2 text-gray-500 hover:text-white transition-colors"
                        title={locationMode === 'state' ? "Usar ubicación manual" : "Usar lista de estados"}
                    >
                        <Navigation size={16} />
                    </button>
                </div>

                {/* Search Button */}
                <button
                    type="submit"
                    disabled={isLoading || !query}
                    className="md:w-32 h-14 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold rounded-2xl shadow-lg shadow-purple-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                >
                    {isLoading ? (
                        <Loader2 className="animate-spin" size={20} />
                    ) : (
                        <>
                            <span className="hidden md:inline">Buscar</span>
                            <Search size={20} className="md:hidden" />
                        </>
                    )}
                </button>
            </div>
        </form>
    );
};

export default SearchBar;
