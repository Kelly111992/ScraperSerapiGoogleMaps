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

    const rating = place.rating || 0;
    const ratingScore = Math.min(Math.round(rating * 8), 40);
    total += ratingScore;

    const reviews = place.reviews || 0;
    const reviewScore = Math.min(Math.round(Math.log10(reviews + 1) * 5), 20);
    total += reviewScore;

    const websiteScore = place.website ? 15 : 0;
    total += websiteScore;

    const phoneScore = place.phone ? 15 : 0;
    total += phoneScore;

    const photoScore = (place.thumbnail || place.thumbnail_url || place.image || place.photo) ? 10 : 0;
    total += photoScore;

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

// --- Niche Relevance Match (v3 — MARVELSA DNA) ---

export interface NicheMatchResult {
    status: 'relevant' | 'neutral' | 'discard';
    confidence: number;
    reason: string;
    matchedTerms: string[];
    matchedNegatives: string[];
    score: number;
}

const STOP_WORDS = new Set(['para', 'de', 'del', 'los', 'las', 'con', 'por', 'una', 'uno', 'que', 'este', 'esta', 'estos', 'estas', 'como', 'más', 'pero', 'sus', 'les', 'muy', 'sin', 'sobre', 'entre', 'todo', 'ser', 'son', 'tiene', 'fue', 'desde', 'otros', 'otras', 'cada', 'tipo']);

function buildVocabulary(keywords: string[]): Map<string, number> {
    const vocab = new Map<string, number>();
    for (const kw of keywords) {
        const words = kw.toLowerCase().split(/\s+/)
            .filter(w => w.length > 3 && !STOP_WORDS.has(w));
        const unique = new Set(words);
        for (const word of unique) {
            vocab.set(word, (vocab.get(word) || 0) + 1);
        }
    }
    return vocab;
}

function stemMatch(vocabWord: string, textWord: string): boolean {
    if (vocabWord === textWord) return true;
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
    const vocab = buildVocabulary(nicheKeywords);

    const title = (place.title || '').toLowerCase();
    const type = (place.type || '').toLowerCase();
    const description = (place.description || '').toLowerCase();
    const address = (place.address || '').toLowerCase();
    const allText = `${title} ${type} ${description} ${address}`;

    // --- MARVELSA DNA CHECK ---
    const MARVELSA_CORE = ['agricola', 'forestal', 'construccion', 'jardineria', 'industrial', 'maquinaria', 'herramientas', 'refacciones'];
    const GLOBAL_NEGATIVES = ['batidora', 'licuadora', 'cocina', 'hogar', 'microondas', 'aspiradora', 'lavadora', 'refrigerador', 'plancha', 'electrodomesticos', 'cafetera', 'domestico', 'hogar'];

    let weightedScore = 0;
    const matchedTerms: string[] = [];
    const matchedNegatives: string[] = [];

    // 1. Mandatory DNA Exclusion
    for (const glob of GLOBAL_NEGATIVES) {
        if (allText.includes(glob)) {
            matchedNegatives.push(glob);
            return {
                status: 'discard',
                confidence: 99,
                reason: `❌ Giro no industrial (${glob})`,
                matchedTerms: [],
                matchedNegatives,
                score: -100
            };
        }
    }

    // 2. Vocabulary Match
    const titleWords = title.split(/\s+/);
    const typeWords = type.split(/\s+/);

    for (const [vocabWord, frequency] of vocab.entries()) {
        const inTitle = titleWords.some((tw: string) => stemMatch(vocabWord, tw));
        const inType = typeWords.some((tw: string) => stemMatch(vocabWord, tw));

        if (inTitle || inType) {
            matchedTerms.push(vocabWord);
            weightedScore += frequency * (inTitle ? 4 : 2);
        }
    }

    // 3. DNA Bonus
    if (MARVELSA_CORE.some(core => allText.includes(core))) {
        weightedScore += 5;
    }

    // 4. Local Negative Keywords
    for (const neg of negativeKeywords) {
        if (allText.includes(neg.toLowerCase())) {
            matchedNegatives.push(neg);
            weightedScore -= 10;
        }
    }

    // DECISION
    if (weightedScore >= 5) {
        return {
            status: 'relevant',
            confidence: 90,
            reason: `✅ Match MARVELSA: ${matchedTerms.slice(0, 2).join(', ')}`,
            matchedTerms,
            matchedNegatives,
            score: weightedScore
        };
    }

    if (weightedScore >= 1) {
        return {
            status: 'neutral',
            confidence: 50,
            reason: '⚠️ Interés parcial',
            matchedTerms,
            matchedNegatives,
            score: weightedScore
        };
    }

    return {
        status: 'discard',
        confidence: 80,
        reason: '❌ No alineado con MARVELSA',
        matchedTerms,
        matchedNegatives,
        score: 0
    };
}
