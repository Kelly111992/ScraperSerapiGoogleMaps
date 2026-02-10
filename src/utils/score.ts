export interface ScoreBreakdown {
    ratingScore: number;
    reviewScore: number;
    websiteScore: number;
    phoneScore: number;
    photoScore: number;
    total: number;
    tier: 'Premium' | 'High' | 'Medium' | 'Low';
}

export function calculateClaveScore(place: any): ScoreBreakdown {
    let total = 0;

    // 1. Rating (0-5) -> Max 40 points
    // 5.0 = 40, 4.0 = 32, 3.0 = 24
    const rating = place.rating || 0;
    const ratingScore = Math.min(Math.round(rating * 8), 40);
    total += ratingScore;

    // 2. Reviews (Logarithmic scale) -> Max 20 points
    // 10 reviews = 5pts
    // 100 reviews = 10pts
    // 1000 reviews = 15pts
    // 10000+ reviews = 20pts
    const reviews = place.reviews || 0;
    const reviewScore = Math.min(Math.round(Math.log10(reviews + 1) * 5), 20);
    total += reviewScore;

    // 3. Website -> 15 points
    const websiteScore = place.website ? 15 : 0;
    total += websiteScore;

    // 4. Phone -> 15 points
    const phoneScore = place.phone ? 15 : 0;
    total += phoneScore;

    // 5. Thumbnail/Photo -> 10 points
    const photoScore = place.thumbnail ? 10 : 0;
    total += photoScore;

    // Cap at 100 just in case
    total = Math.min(total, 100);

    let tier: ScoreBreakdown['tier'] = 'Low';
    if (total >= 80) tier = 'Premium';
    else if (total >= 60) tier = 'High';
    else if (total >= 40) tier = 'Medium';

    return {
        ratingScore,
        reviewScore,
        websiteScore,
        phoneScore,
        photoScore,
        total,
        tier
    };
}

// --- Niche Relevance Match ---

export interface NicheMatchResult {
    status: 'relevant' | 'neutral' | 'discard';
    confidence: number; // 0-100
    reason: string;
    matchedKeywords: string[];
    matchedNegatives: string[];
}

export function calculateNicheMatch(
    place: any,
    nicheKeywords: string[],
    negativeKeywords: string[]
): NicheMatchResult {
    // Text to analyze (lowercase for comparison)
    const title = (place.title || '').toLowerCase();
    const type = (place.type || '').toLowerCase();
    const address = (place.address || '').toLowerCase();
    const description = (place.description || '').toLowerCase();
    const combined = `${title} ${type} ${address} ${description}`;

    const matchedKeywords: string[] = [];
    const matchedNegatives: string[] = [];

    // Check positive keywords (split into individual words for partial matching)
    for (const kw of nicheKeywords) {
        const kwWords = kw.toLowerCase().split(/\s+/);
        // A keyword matches if at least 2 of its words appear (or all if keyword is 1-2 words)
        const minWordsToMatch = Math.min(kwWords.length, 2);
        const wordsFound = kwWords.filter(w => w.length > 3 && combined.includes(w));
        if (wordsFound.length >= minWordsToMatch) {
            matchedKeywords.push(kw);
        }
    }

    // Check negative keywords
    for (const neg of negativeKeywords) {
        if (combined.includes(neg.toLowerCase())) {
            matchedNegatives.push(neg);
        }
    }

    // Decision logic
    if (matchedNegatives.length > 0 && matchedKeywords.length === 0) {
        return {
            status: 'discard',
            confidence: Math.min(90, 60 + matchedNegatives.length * 15),
            reason: `Contiene: ${matchedNegatives.join(', ')}`,
            matchedKeywords,
            matchedNegatives
        };
    }

    if (matchedKeywords.length > 0 && matchedNegatives.length === 0) {
        return {
            status: 'relevant',
            confidence: Math.min(95, 50 + matchedKeywords.length * 20),
            reason: `Coincide con: ${matchedKeywords.slice(0, 2).join(', ')}`,
            matchedKeywords,
            matchedNegatives
        };
    }

    if (matchedKeywords.length > 0 && matchedNegatives.length > 0) {
        // Mixed signals
        return {
            status: matchedKeywords.length >= matchedNegatives.length ? 'neutral' : 'discard',
            confidence: 40,
            reason: `Señales mixtas: +${matchedKeywords.length} / -${matchedNegatives.length}`,
            matchedKeywords,
            matchedNegatives
        };
    }

    // No matches at all — neutral
    return {
        status: 'neutral',
        confidence: 20,
        reason: 'Sin coincidencias claras',
        matchedKeywords,
        matchedNegatives
    };
}
