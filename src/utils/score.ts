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
