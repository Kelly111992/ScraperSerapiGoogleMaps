import React, { useState, useEffect } from 'react';
import { Search, MapPin, Loader2, Navigation, Target, Briefcase, ChevronRight } from 'lucide-react';
import { mexicoLocations, MexicoState } from '@/data/mexicoLocations';
import { oregonNiches } from '@/data/oregonNiches';
import { cn } from '@/lib/utils';

interface SearchBarProps {
    onSearch: (query: string, location: string) => void;
    isLoading: boolean;
    onNicheChange?: (nicheId: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading, onNicheChange }) => {
    // Mode State
    const [searchMode, setSearchMode] = useState<'free' | 'strategic'>('free');

    // Free Mode State
    const [query, setQuery] = useState('');

    // Strategic Mode State
    const [selectedNicheId, setSelectedNicheId] = useState('');
    const [selectedKeyword, setSelectedKeyword] = useState('');

    // Location State
    const [locationMode, setLocationMode] = useState<'state' | 'custom'>('state');
    const [selectedState, setSelectedState] = useState<string>('');
    const [selectedCity, setSelectedCity] = useState<string>('');
    const [customLocation, setCustomLocation] = useState('');

    const activeNiche = oregonNiches.find(n => n.id === selectedNicheId);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();

        let finalQuery = '';
        if (searchMode === 'free') {
            finalQuery = query;
        } else {
            finalQuery = selectedKeyword;
        }

        if (!finalQuery.trim()) return;

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

        onSearch(finalQuery, finalLocation);
    };

    const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedState(e.target.value);
        setSelectedCity(''); // Reset city when state changes
    };

    const availableCities = selectedState && (mexicoLocations as any)[selectedState]
        ? (mexicoLocations as any)[selectedState]
        : [];

    return (
        <div className="w-full max-w-4xl mx-auto space-y-4">
            {/* Mode Toggles */}
            <div className="flex justify-center gap-4">
                <button
                    onClick={() => setSearchMode('free')}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                        searchMode === 'free'
                            ? "bg-purple-600/20 text-purple-400 border border-purple-500/30"
                            : "text-gray-400 hover:text-white hover:bg-white/5"
                    )}
                >
                    <Search size={16} />
                    Búsqueda Libre
                </button>
                <button
                    onClick={() => setSearchMode('strategic')}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                        searchMode === 'strategic'
                            ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
                            : "text-gray-400 hover:text-white hover:bg-white/5"
                    )}
                >
                    <Target size={16} />
                    Modo Estratégico (Oregon)
                </button>
            </div>

            <form onSubmit={handleSearch} className={cn(
                "flex flex-col md:flex-row gap-3 p-2 border rounded-3xl shadow-2xl transition-all duration-300",
                searchMode === 'strategic'
                    ? "bg-[#0f111a]/80 backdrop-blur-xl border-emerald-500/20 shadow-emerald-900/10"
                    : "bg-white/5 backdrop-blur-xl border-white/10"
            )}>

                {/* Query Section */}
                <div className="flex-[1.5] flex flex-col justify-center px-2">
                    {searchMode === 'free' ? (
                        <div className="flex items-center px-2 h-14 bg-transparent group">
                            <Search className="text-gray-400 group-focus-within:text-purple-400 transition-colors mr-3 shrink-0" size={20} />
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="¿Qué estás buscando? (ej. Tacos, Dentista...)"
                                className="w-full bg-transparent text-white placeholder-gray-400 outline-none text-lg selection:bg-purple-500/30"
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2 py-1">
                            {/* Niche Selector */}
                            <div className="relative group">
                                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500/70 pointer-events-none" size={18} />
                                <select
                                    value={selectedNicheId}
                                    onChange={(e) => {
                                        setSelectedNicheId(e.target.value);
                                        setSelectedKeyword(''); // Reset keyword
                                        onNicheChange?.(e.target.value);
                                    }}
                                    className="w-full h-10 pl-10 pr-4 bg-white/5 border border-white/5 rounded-xl text-white outline-none focus:bg-white/10 focus:border-emerald-500/30 appearance-none cursor-pointer transition-all text-sm font-medium"
                                >
                                    <option value="" className="bg-gray-900 text-gray-500">Selecciona un Nicho Estratégico...</option>
                                    {oregonNiches.map(niche => (
                                        <option key={niche.id} value={niche.id} className="bg-gray-900 text-white">
                                            {niche.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Keyword Selector */}
                            <div className="relative group">
                                <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors", selectedNicheId ? "text-emerald-400" : "text-gray-600")} size={18} />
                                <select
                                    value={selectedKeyword}
                                    onChange={(e) => setSelectedKeyword(e.target.value)}
                                    disabled={!selectedNicheId}
                                    className="w-full h-10 pl-10 pr-4 bg-white/5 border border-white/5 rounded-xl text-white outline-none focus:bg-white/10 focus:border-emerald-500/30 appearance-none cursor-pointer transition-all text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <option value="" className="bg-gray-900 text-gray-500">
                                        {selectedNicheId ? "Selecciona Keyword..." : "Primero selecciona un nicho"}
                                    </option>
                                    {activeNiche?.keywords.map(kw => (
                                        <option key={kw} value={kw} className="bg-gray-900 text-white">
                                            {kw}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                <div className="h-px md:h-auto w-full md:w-px bg-white/10 mx-1 md:my-2" />

                {/* Location Section */}
                <div className="flex flex-col sm:flex-row gap-2 md:w-[40%] items-center">

                    {locationMode === 'state' ? (
                        <div className="flex flex-col w-full gap-2 py-1">
                            {/* State Dropdown */}
                            <div className="relative w-full group">
                                <MapPin className={cn("absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors", searchMode === 'strategic' && activeNiche ? "text-emerald-500/70" : "text-gray-400")} size={16} />
                                <select
                                    value={selectedState}
                                    onChange={handleStateChange}
                                    className="w-full h-10 pl-9 pr-4 bg-white/5 border border-transparent rounded-xl text-white outline-none focus:bg-white/10 focus:border-blue-500/30 appearance-none cursor-pointer transition-all text-sm"
                                >
                                    <option value="" className="bg-gray-900 text-gray-400">Estado...</option>
                                    {/* Prioritize states if in strategic mode */}
                                    {searchMode === 'strategic' && activeNiche?.priorityStates && (
                                        <>
                                            <optgroup label="📍 Estados Prioritarios (Oregon)" className="bg-gray-900 text-emerald-400 font-bold">
                                                {activeNiche.priorityStates.map(state => (
                                                    <option key={state} value={state} className="bg-gray-900 text-white font-normal">
                                                        {state}
                                                    </option>
                                                ))}
                                            </optgroup>
                                            <optgroup label="Otros Estados" className="bg-gray-900 text-gray-400">
                                                {Object.keys(mexicoLocations).filter(s => !activeNiche.priorityStates.includes(s)).sort().map(state => (
                                                    <option key={state} value={state} className="bg-gray-900 text-white font-normal">
                                                        {state}
                                                    </option>
                                                ))}
                                            </optgroup>
                                        </>
                                    )}
                                    {/* Standard alphabetical list if not strategic or no niche selected */}
                                    {(!searchMode || searchMode === 'free' || !activeNiche) && Object.keys(mexicoLocations).sort().map((state) => (
                                        <option key={state} value={state} className="bg-gray-900 text-white">
                                            {state}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Municipality Dropdown */}
                            <div className="relative w-full group">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 flex justify-center pointer-events-none">
                                    <span className="text-gray-600 text-xs">└</span>
                                </div>
                                <select
                                    value={selectedCity}
                                    onChange={(e) => setSelectedCity(e.target.value)}
                                    disabled={!selectedState}
                                    className="w-full h-10 pl-9 pr-4 bg-white/5 border border-transparent rounded-xl text-white outline-none focus:bg-white/10 focus:border-blue-500/30 appearance-none cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed text-sm"
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
                        <div className="relative w-full h-14 group">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-400 transition-colors" size={20} />
                            <input
                                type="text"
                                value={customLocation}
                                onChange={(e) => setCustomLocation(e.target.value)}
                                placeholder="Ubicación personalizada..."
                                className="w-full h-full pl-12 pr-4 bg-white/5 border border-transparent rounded-2xl text-white outline-none focus:bg-white/10 text-sm"
                            />
                        </div>
                    )}

                    {/* Mode Toggle (Subtle) */}
                    <button
                        type="button"
                        onClick={() => setLocationMode(prev => prev === 'state' ? 'custom' : 'state')}
                        className="p-2 text-gray-500 hover:text-white transition-colors shrink-0"
                        title={locationMode === 'state' ? "Usar ubicación manual" : "Usar lista de estados"}
                    >
                        <Navigation size={16} />
                    </button>
                </div>

                {/* Search Button */}
                <button
                    type="submit"
                    disabled={isLoading || (searchMode === 'free' ? !query : !selectedKeyword)}
                    className={cn(
                        "md:w-32 h-auto py-2 md:py-0 bg-gradient-to-r text-white font-semibold rounded-2xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group",
                        searchMode === 'strategic'
                            ? "from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-900/20"
                            : "from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 shadow-purple-900/20"
                    )}
                >
                    {isLoading ? (
                        <Loader2 className="animate-spin" size={20} />
                    ) : (
                        <>
                            <span className="md:hidden lg:inline">Buscar</span>
                            <Search size={20} className="hidden md:block lg:hidden" />
                        </>
                    )}
                </button>
            </form>

            {/* Strategic Mode Info */}
            {searchMode === 'strategic' && activeNiche && (
                <div className="flex items-start gap-3 p-4 bg-emerald-900/10 border border-emerald-500/20 rounded-2xl animate-in fade-in slide-in-from-top-2">
                    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 shrink-0">
                        <Target size={20} />
                    </div>
                    <div>
                        <h4 className="text-emerald-400 font-medium text-sm mb-1">{activeNiche.name}</h4>
                        <p className="text-gray-400 text-xs leading-relaxed">{activeNiche.description}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchBar;
