export interface EnrichedProspectData {
    lastDataCheck: string; // ISO string

    // Google Ads Intelligence (Detector de Dinero)
    hasActiveAds: boolean;
    adsCount: number;
    lastAdDate?: string;

    // Reviews Intelligence (Detector de Vida)
    lastReviewDate?: string; // ISO string
    ownerResponds: boolean;
    reviewCountLast30Days?: number;

    // Social Intelligence (Detector de Identidad)
    facebookUrl?: string;
    facebookFollowers?: number;
    isVerified?: boolean;

    // Calculated Ranking
    premiumRank: 'Diamond' | 'Gold' | 'Silver' | 'Bronze';
    premiumScore: number; // 0-100
    analysisReason: string[]; // Lista de razones para el score
}

export interface Place {
    place_id: string; // Google Place ID
    place_id_search?: string; // SerpApi fallback
    data_id?: string; // SerpApi Data ID for reviews
    title: string;
    address?: string;
    rating?: number;
    reviews?: number;
    type?: string;
    phone?: string;
    website?: string;
    thumbnail?: string;
    latitude?: number;
    longitude?: number;
    description?: string;
    open_state?: string;
    maps_url?: string;

    // Meta
    gps_coordinates?: {
        latitude: number;
        longitude: number;
    };

    // Local Scoring (Clave Score)
    score?: {
        total: number;
        tier: 'Low' | 'Medium' | 'High' | 'Premium';
    };

    // Niche Matching
    nicheMatch?: {
        status: 'relevant' | 'neutral' | 'discard';
        confidence: number;
        reason: string;
        matchedTerms: string[];
        matchedNegatives: string[];
        score: number; // 0-100
        aiVerdict?: string;
    };

    // Deep Analysis (New Feature)
    enrichedData?: EnrichedProspectData;
}
