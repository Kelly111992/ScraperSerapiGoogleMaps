
import { NextResponse } from 'next/server';
import { getJson } from 'serpapi';
import { EnrichedProspectData, Place } from '@/types';

const SERPAPI_KEY = process.env.SERPAPI_KEY;

export async function POST(request: Request) {
    if (!SERPAPI_KEY) {
        return NextResponse.json({ error: 'Falta SERPAPI_KEY' }, { status: 500 });
    }

    try {
        const { place } = await request.json() as { place: Place };

        if (!place?.title) {
            return NextResponse.json({ error: 'Datos de lugar inválidos' }, { status: 400 });
        }

        // --- BUSQUEDA DE SEÑALES DE NEGOCIO ---
        const searchQuery = `${place.title} ${place.address || ''}`;

        let socialLinks: { facebook?: string, instagram?: string } = {};
        let hasAds = false;
        let reasons: string[] = [];
        let score = 0;

        try {
            // Buscamos señales en una sola ráfaga de Search para ahorrar créditos y tiempo
            const searchResponse = await getJson({
                engine: "google",
                q: searchQuery,
                api_key: SERPAPI_KEY,
                num: 8
            });

            const organic = searchResponse.organic_results || [];
            const ads = searchResponse.ads || [];

            // 1. Detección de Inversión (Dinero)
            if (ads.length > 0) {
                hasAds = true;
                score += 35;
                reasons.push("Invierte en Publicidad (Google Ads)");
            }

            // 2. Presencia Digital (Identidad)
            organic.forEach((result: any) => {
                if (result.link.includes("facebook.com") && !socialLinks.facebook) {
                    socialLinks.facebook = result.link;
                    score += 15;
                    reasons.push("Marca activa en Facebook");
                }
                if (result.link.includes("instagram.com") && !socialLinks.instagram) {
                    socialLinks.instagram = result.link;
                    score += 10;
                    reasons.push("Presencia en Instagram");
                }
            });
        } catch (e) {
            console.error("Error en búsqueda de señales", e);
        }

        // 3. Análisis de Calidad Local (Google Maps Data)
        if (place.rating && place.rating >= 4.5) {
            score += 20;
            reasons.push("Reputación Excelente (Top 10%)");
        }

        if (place.reviews && place.reviews > 40) {
            score += 20;
            reasons.push("Flujo constante de clientes (+40 reviews)");
        }

        if (place.website) {
            score += 10;
            reasons.push("Infraestructura Web Propia");
        }

        // --- CLASIFICACIÓN FINAL ---
        let rank: EnrichedProspectData['premiumRank'] = 'Bronze';
        if (score >= 80) rank = 'Diamond';
        else if (score >= 60) rank = 'Gold';
        else if (score >= 30) rank = 'Silver';

        // Si no tiene nada de lo anterior, es Bronze por defecto
        if (reasons.length === 0) {
            reasons.push("Sin señales digitales claras detectadas");
        }

        const enrichedData: EnrichedProspectData = {
            lastDataCheck: new Date().toISOString(),
            hasActiveAds: hasAds,
            adsCount: hasAds ? 1 : 0,
            ownerResponds: false,
            facebookUrl: socialLinks.facebook,
            premiumRank: rank,
            premiumScore: score,
            analysisReason: reasons
        };

        return NextResponse.json({ enrichedData });

    } catch (error) {
        console.error('Error en enrich-prospect:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
