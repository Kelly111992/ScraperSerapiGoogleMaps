'use client';

import React, { useState, useMemo } from 'react';
import axios from 'axios';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { MapPin, Zap, Download, CheckSquare, Square, ThumbsUp, Star } from 'lucide-react';
import jsPDF from 'jspdf';
import SearchBar from './components/SearchBar';
import PlaceGrid from './components/PlaceGrid';
import PlaceDetailsModal from './components/PlaceDetailsModal';
import { calculateClaveScore, calculateNicheMatch } from '../utils/score';
import { oregonNiches } from '../data/oregonNiches';

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export default function Home() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* New State for Pagination */
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [nextOffset, setNextOffset] = useState<number>(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentQuery, setCurrentQuery] = useState('');
  const [currentLocation, setCurrentLocation] = useState('');

  // Modal state
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [selectedPlaceInitialData, setSelectedPlaceInitialData] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Selection & Export State
  const [selectedPlaceIds, setSelectedPlaceIds] = useState<Set<string>>(new Set());

  // Sorting State
  const [sortBy, setSortBy] = useState<'relevance' | 'score'>('relevance');

  // Niche State (for local relevance filtering)
  const [selectedNicheId, setSelectedNicheId] = useState<string>('');

  // Get active niche for filtering
  const activeNiche = oregonNiches.find(n => n.id === selectedNicheId);

  // Process and sort results (with niche match if active)
  const displayedResults = useMemo(() => {
    // Add score + niche match to each result
    const scored = results.map(place => {
      const score = calculateClaveScore(place);
      const nicheMatch = activeNiche
        ? calculateNicheMatch(place, activeNiche.keywords, activeNiche.negativeKeywords)
        : undefined;
      return { ...place, score, nicheMatch };
    });

    // Sort: by score, or by relevance (niche discards go to bottom)
    if (sortBy === 'score') {
      return [...scored].sort((a, b) => b.score.total - a.score.total);
    }

    // If niche is active, sort: relevant first, neutral middle, discard last
    if (activeNiche) {
      const order: Record<string, number> = { relevant: 0, neutral: 1, discard: 2 };
      return [...scored].sort((a, b) => {
        const aOrder = a.nicheMatch ? (order[a.nicheMatch.status] ?? 1) : 1;
        const bOrder = b.nicheMatch ? (order[b.nicheMatch.status] ?? 1) : 1;
        return aOrder - bOrder;
      });
    }

    return scored;
  }, [results, sortBy, activeNiche]);

  const handleSearch = async (query: string, location: string) => {
    setLoading(true);
    setError(null);
    setResults([]);
    setNextPageToken(null);
    setNextOffset(0);
    setSelectedPlaceIds(new Set()); // Reset selection on new search

    // Save for pagination
    setCurrentQuery(query);
    setCurrentLocation(location);

    try {
      // Construct query with location context
      // Combining them improves relevance in Google Maps Search
      const fullQuery = location ? `${query} en ${location}` : query;

      console.log(`Searching for: ${fullQuery}`);

      const params = {
        engine: 'google_maps',
        type: 'search',
        q: fullQuery,
        // Removed hardcoded 'll' to allow Google to infer location from query
        // or we could geocode the state, but text search usually works well for "Pizza in Monterrey"
      };

      const response = await axios.post('/api/serpapi', params);

      if (response.data.local_results) {
        setResults(response.data.local_results);

        // Check for pagination - Token OR Start offset
        if (response.data.serpapi_pagination?.next_page_token) {
          setNextPageToken(response.data.serpapi_pagination.next_page_token);
          setNextOffset(0); // Reset offset if we have a token
        } else {
          setNextPageToken(null);
          // If we have full 20 results, assume there might be more and use offset
          if (response.data.local_results.length >= 20) {
            setNextOffset(20);
          } else {
            setNextOffset(0); // End of results
          }
        }
      } else if (response.data.error) {
        setError(response.data.error);
      } else {
        setError('No se encontraron resultados locales.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || err.message || 'Error en la búsqueda');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = async () => {
    // Check if we have a token OR a valid offset
    if (!nextPageToken && nextOffset === 0) return;

    setLoadingMore(true);

    try {
      const fullQuery = currentLocation ? `${currentQuery} en ${currentLocation}` : currentQuery;
      const params: any = {
        engine: 'google_maps',
        type: 'search',
        q: fullQuery,
      };

      if (nextPageToken) {
        params.next_page_token = nextPageToken;
      } else {
        params.start = nextOffset;
      }

      const response = await axios.post('/api/serpapi', params);

      if (response.data.local_results) {
        setResults(prev => [...prev, ...response.data.local_results]);

        // Update pagination state
        if (response.data.serpapi_pagination?.next_page_token) {
          setNextPageToken(response.data.serpapi_pagination.next_page_token);
          setNextOffset(0); // Reset offset logic if we switched to tokens
        } else {
          setNextPageToken(null);
          // Increment offset if we got results
          if (response.data.local_results.length > 0) {
            setNextOffset(prev => prev + 20);
          } else {
            setNextOffset(0); // No more results
          }
        }
      }
    } catch (err: any) {
      console.error("Error loading more:", err);
      // Optional: show toast error
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSelectPlace = (place: any) => {
    // If passed an ID string (legacy safety), find it. If passed object, use it.
    let placeData = place;
    let placeId = place.place_id || place.place_id_search;

    if (typeof place === 'string') {
      placeId = place;
      placeData = results.find(r => r.place_id === placeId || r.place_id_search === placeId);
    }

    // Ensure we have a valid ID
    if (!placeId && placeData) {
      placeId = placeData.place_id || placeData.place_id_search;
    }

    setSelectedPlaceId(placeId);
    setSelectedPlaceInitialData(placeData);
    setIsModalOpen(true);
  };

  const toggleSelection = (placeId: string) => {
    setSelectedPlaceIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(placeId)) {
        newSet.delete(placeId);
      } else {
        newSet.add(placeId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedPlaceIds.size === results.length) {
      setSelectedPlaceIds(new Set());
    } else {
      const newSet = new Set<string>();
      results.forEach(r => {
        const id = r.place_id || r.place_id_search;
        if (id) newSet.add(id);
      });
      setSelectedPlaceIds(newSet);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    let y = 20;

    // Title
    doc.setFontSize(22);
    doc.setTextColor(44, 62, 80);
    doc.text("Reporte de BuscadorPro", 20, y);
    y += 10;

    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Búsqueda: ${currentQuery} ${currentLocation ? `en ${currentLocation}` : ''}`, 20, y);
    y += 5;
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 20, y);
    y += 15;

    const selectedPlaces = results.filter(r => {
      const id = r.place_id || r.place_id_search;
      return id && selectedPlaceIds.has(id);
    });

    selectedPlaces.forEach((place, index) => {
      // Page break check
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      const { title, rating, reviews, address, phone, website, description } = place;

      // Card Background (Simulated)
      doc.setFillColor(245, 247, 250);
      doc.roundedRect(15, y, 180, 50, 3, 3, 'F');

      y += 10;

      // Title
      doc.setFontSize(16);
      doc.setTextColor(0);
      doc.text(`${index + 1}. ${title}`, 20, y);
      y += 7;

      // Details
      doc.setFontSize(10);
      doc.setTextColor(80);

      if (rating) doc.text(`Rating: ${rating} ★ (${reviews || 0} reviews)`, 20, y);
      y += 5;

      if (address) {
        doc.text(`Dirección: ${address}`, 20, y);
        y += 5;
      }

      if (phone) {
        doc.text(`Tel: ${phone}`, 20, y);
        y += 5;
      }

      if (website) {
        doc.setTextColor(0, 0, 255);
        doc.textWithLink("Sitio Web", 20, y, { url: website });
        doc.setTextColor(80);
        y += 5;
      }

      // Add extra spacing for next card
      y += 25;
    });

    doc.save(`reporte_buscador_pro_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const fetchPlaceDetails = async (placeId: string) => {
    // This function is passed to the modal to lazy load details
    try {
      // Sometimes basic search results use 'place_id_search' but details need 'place_id'
      // Standardize to place_id. If it fails, users report "Error".
      const response = await axios.post('/api/serpapi', {
        engine: 'google_maps', // Or specifically reviews engine depending on need, but 'google_maps' with type='place' and place_id gets details
        type: 'place', // Using 'place' type for details
        place_id: placeId
      });

      if (response.data.error) {
        throw new Error(response.data.error);
      }
      return response.data;
    } catch (err) {
      console.error("Detail fetch error:", err);
      throw err;
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-purple-500/30">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col min-h-screen">

        {/* Header / Hero Section */}
        <header className={cn(
          "flex flex-col items-center justify-center transition-all duration-700 ease-out",
          results.length > 0 ? "py-10 min-h-[auto]" : "min-h-[60vh] py-20"
        )}>
          <div className="flex items-center gap-3 mb-6 animate-fade-in-down">
            <div className="p-3 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl shadow-lg shadow-purple-500/20">
              <Zap className="text-white fill-white" size={32} />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 tracking-tight">
              Buscador<span className="text-purple-500">Pro</span>
            </h1>
          </div>

          <p className={cn(
            "text-gray-400 text-center max-w-md mb-10 transition-all duration-500",
            results.length > 0 ? "hidden" : "block"
          )}>
            Descubre lugares increíbles con tecnología de búsqueda visual inteligente. Encuentra, analiza y exporta.
          </p>

          <div className="w-full">
            <SearchBar onSearch={handleSearch} isLoading={loading} onNicheChange={setSelectedNicheId} />
          </div>
        </header>

        {/* Results Section */}
        <main className="flex-1 w-full animate-fade-in-up pb-32">
          {error && (
            <div className="max-w-md mx-auto mb-10 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-200 text-center">
              {error}
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-center px-6 gap-4">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold text-white">Resultados ({results.length})</h2>

                {/* Sorting Links */}
                <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
                  <button
                    onClick={() => setSortBy('relevance')}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2",
                      sortBy === 'relevance' ? "bg-white/10 text-white shadow-sm" : "text-gray-400 hover:text-white"
                    )}
                  >
                    <MapPin size={12} />
                    Relevancia
                  </button>
                  <button
                    onClick={() => setSortBy('score')}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2",
                      sortBy === 'score' ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-sm" : "text-gray-400 hover:text-white"
                    )}
                  >
                    <Star size={12} />
                    Clave Score
                  </button>
                </div>

                {/* Select All Button */}
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  {selectedPlaceIds.size === results.length ? <CheckSquare size={16} /> : <Square size={16} />}
                  {selectedPlaceIds.size === results.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                </button>
              </div>
              <div className="text-sm text-gray-500 flex items-center gap-2">
                <MapPin size={14} />
                <span>Mostrando locales destacados</span>
              </div>
            </div>
          )}

          <PlaceGrid
            places={displayedResults}
            onSelectPlace={handleSelectPlace}
            isLoading={loading}
            selectedIds={selectedPlaceIds}
            onToggleSelect={toggleSelection}
          />

          {/* Pagination Load More */}
          {(nextPageToken || nextOffset > 0) && !loading && (
            <div className="flex justify-center pb-20 mt-[-20px]">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white font-medium transition-all flex items-center gap-2"
              >
                {loadingMore ? 'Cargando más...' : 'Cargar más resultados'}
              </button>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="py-8 text-center text-gray-600 text-sm border-t border-white/5 mt-auto">
          <p>© 2026 BuscadorPro Intelligence. Todos los derechos reservados.</p>
        </footer>

      </div>

      {/* Floating Selection Bar */}
      {selectedPlaceIds.size > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-lg">
          <div className="bg-[#0f111a] border border-white/10 rounded-2xl shadow-2xl p-4 flex items-center justify-between animate-in slide-in-from-bottom duration-300 ring-1 ring-purple-500/20">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-purple-600 rounded-full text-white font-bold shadow-lg shadow-purple-500/30">
                {selectedPlaceIds.size}
              </div>
              <div className="flex flex-col">
                <span className="text-white font-medium">Seleccionados</span>
                <span className="text-xs text-gray-400">Listos para exportar</span>
              </div>
            </div>
            <button
              onClick={generatePDF}
              className="px-6 py-2.5 bg-white text-black hover:bg-gray-100 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg active:scale-95"
            >
              <Download size={18} />
              Descargar PDF
            </button>
          </div>
        </div>
      )}

      {/* Details Modal */}
      <PlaceDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        placeId={selectedPlaceId}
        initialData={selectedPlaceInitialData}
        fetchDetails={fetchPlaceDetails}
      />
    </div>
  );
}
