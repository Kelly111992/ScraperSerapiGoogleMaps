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

// --- Niche Relevance Match (v2 — Vocabulary-based) ---

export interface NicheMatchResult {
    status: 'relevant' | 'neutral' | 'discard';
    confidence: number; // 0-100
    reason: string;
    matchedTerms: string[];
    matchedNegatives: string[];
    score: number; // raw weighted score
}

// Spanish stop words to ignore during vocabulary extraction
const STOP_WORDS = new Set([
    'para', 'de', 'del', 'los', 'las', 'con', 'por', 'una', 'uno',
    'que', 'este', 'esta', 'estos', 'estas', 'como', 'más', 'pero',
    'sus', 'les', 'muy', 'sin', 'sobre', 'entre', 'todo', 'ser',
    'son', 'tiene', 'fue', 'desde', 'otros', 'otras', 'cada', 'tipo'
]);

/**
 * Extract a weighted vocabulary from all niche keywords.
 * Words that appear in multiple keywords get higher weight (they're core domain terms).
 * Returns Map<word, weight> where weight = number of keywords containing it.
 */
function buildVocabulary(keywords: string[]): Map<string, number> {
    const vocab = new Map<string, number>();
    for (const kw of keywords) {
        const words = kw.toLowerCase().split(/\s+/)
            .filter(w => w.length > 3 && !STOP_WORDS.has(w));
        // Deduplicate within same keyword phrase
        const unique = new Set(words);
        for (const word of unique) {
            vocab.set(word, (vocab.get(word) || 0) + 1);
        }
    }
    return vocab;
}

/**
 * Check if two words match via stem similarity.
 * "motosierra" ↔ "motosierras", "taller" ↔ "talleres", "refaccion" ↔ "refacciones"
 */
function stemMatch(vocabWord: string, textWord: string): boolean {
    if (vocabWord === textWord) return true;
    // One contains the other (handles plural/singular)
    if (vocabWord.length >= 4 && textWord.length >= 4) {
        if (textWord.startsWith(vocabWord) || vocabWord.startsWith(textWord)) return true;
    }
    return false;
}

export function calculateNicheMatch(
    place: any,
    nicheKeywords: string[],
    negativeKeywords: string[]
): NicheMatchResult {
    // Build vocabulary from ALL niche keywords
    const vocab = buildVocabulary(nicheKeywords);

    // Text sources with different weights
    const title = (place.title || '').toLowerCase();
    const type = (place.type || '').toLowerCase();
    const description = (place.description || '').toLowerCase();
    const address = (place.address || '').toLowerCase();

    // Tokenize each source
    const titleWords = title.split(/\s+/).filter((w: string) => w.length > 2);
    const typeWords = type.split(/\s+/).filter((w: string) => w.length > 2);
    const descWords = description.split(/\s+/).filter((w: string) => w.length > 2);

    const matchedTerms: string[] = [];
    let weightedScore = 0;

    // Check each vocab term against business text
    for (const [vocabWord, frequency] of vocab.entries()) {
        // Title match = strongest signal (x3 weight)
        const inTitle = titleWords.some((tw: string) => stemMatch(vocabWord, tw));
        // Type/category match = strong signal (x2 weight)
        const inType = typeWords.some((tw: string) => stemMatch(vocabWord, tw));
        // Description match = normal signal (x1 weight)
        const inDesc = descWords.some((dw: string) => stemMatch(vocabWord, dw));

        if (inTitle || inType || inDesc) {
            matchedTerms.push(vocabWord);
            // Score = frequency_weight * position_weight
            const positionWeight = inTitle ? 3 : inType ? 2 : 1;
            weightedScore += frequency * positionWeight;
        }
    }

    // GLOBAL NEGATIVES: Forcing discard on domestic appliances for all machinery niches
    const GLOBAL_NEGATIVES = ['batidora', 'licuadora', 'cocina', 'hogar', 'microondas', 'aspiradora', 'lavadora', 'refrigerador', 'plancha', 'electrodomesticos'];

    // Check local negative keywords AND Global ones
    const allText = `${title} ${type} ${description} ${address}`;
    const matchedNegatives: string[] = [];

    // Check niche-specific negatives
    for (const neg of negativeKeywords) {
        if (allText.includes(neg.toLowerCase())) {
            matchedNegatives.push(neg);
        }
    }

    // Check global negatives (high impact)
    for (const glob of GLOBAL_NEGATIVES) {
        // If it's in the TITLE, it's an immediate red flag
        const inTitle = title.includes(glob);
        const inGeneral = allText.includes(glob);

        if (inTitle) {
            matchedNegatives.push(glob);
            weightedScore = -50; // Force immediate discard if in title
        } else if (inGeneral) {
            matchedNegatives.push(glob);
            weightedScore -= 10;
        }
    }

    // Penalty for negatives
    const finalScore = Math.max(-100, weightedScore);

    // Decision thresholds
    // Score >= 3 = relevant (e.g., "motosierras" in title = freq(3) * title(3) = 9)
    // Score 1-2 = neutral
    // Score 0 with negatives = discard
    if (matchedNegatives.length > 0 && finalScore <= 1) {
        return {
            status: 'discard',
            confidence: Math.min(90, 60 + matchedNegatives.length * 15),
            reason: `❌ ${matchedNegatives.join(', ')}`,
            matchedTerms,
            matchedNegatives,
            score: finalScore
        };
    }

    if (finalScore >= 3) {
        const topTerms = matchedTerms.slice(0, 3).join(', ');
        return {
            status: 'relevant',
            confidence: Math.min(95, 40 + finalScore * 5),
            reason: `✅ ${topTerms}`,
            matchedTerms,
            matchedNegatives,
            score: finalScore
        };
    }

    if (finalScore >= 1) {
        return {
            status: 'neutral',
            confidence: 30 + finalScore * 10,
            reason: `⚠️ Coincidencia parcial: ${matchedTerms.join(', ')}`,
            matchedTerms,
            matchedNegatives,
            score: finalScore
        };
    }

    return {
        status: 'neutral',
        confidence: 10,
        reason: '⚠️ Sin coincidencias',
        matchedTerms,
        matchedNegatives,
        score: 0
    };
}
