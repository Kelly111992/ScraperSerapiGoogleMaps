
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

        // 1. Google Maps Reviews Analysis (Activity & Life)
        // Usamos el data_id si existe, o buscamos por "Reviews de [Negocio]"
        let reviewsData: any = {};
        if (place.data_id) {
            try {
                // Nota: Esta llamada consume créditos de SerpApi. Solo usar en click de usuario.
                // Para demo/ahorro, podemos simular o limitar.
                // Implementación real:
                /*
               const reviewsResponse = await getJson({
                   engine: "google_maps_reviews",
                   data_id: place.data_id,
                   api_key: SERPAPI_KEY,
                   sort: "newestFirst" // Importante: ver actividad reciente
               });
               reviewsData = reviewsResponse;
               */
                // MOCK TEMPORAL PARA NO GASTAR CREDITOS EN DESARROLLO (El usuario puede descomentar)
                // Simular actividad basada en el rating count que ya tenemos
                reviewsData = { reviews: [] };
            } catch (e) {
                console.error("Error fetching reviews", e);
            }
        }

        // 2. Social Media Discovery (Identity)
        // Buscamos "Nombre Negocio City Facebook Instagram"
        const socialQuery = `${place.title} ${place.address || ''} Facebook Instagram`;
        let socialLinks: { facebook?: string, instagram?: string } = {};

        try {
            const searchResponse = await getJson({
                engine: "google",
                q: socialQuery,
                api_key: SERPAPI_KEY,
                num: 5 // Solo los primeros resultados
            });

            // Analizar snippets para encontrar links de FB/Insta
            const organicResults = searchResponse.organic_results || [];
            organicResults.forEach((result: any) => {
                if (result.link.includes("facebook.com") && !socialLinks.facebook) {
                    socialLinks.facebook = result.link;
                }
                if (result.link.includes("instagram.com") && !socialLinks.instagram) {
                    socialLinks.instagram = result.link;
                }
            });
        } catch (e) {
            console.error("Error searching social media", e);
        }

        // 3. Ad Detection (Money)
        // Buscar si aparecen en anuncios por su propio nombre (Brand Protection) o categoría
        // Esto es costoso de verificar reliably sin gastar mucho.
        // Usaremos un heurístico: Si tiene sitio web y buen rating, asumimos potencial.
        // Si queremos ser estrictos: Buscar "category in city" y ver si sale en ads.
        const hasAds = false; // Placeholder for now unless we implement heavy search

        // CALCULAR EL PREMIUM RANK
        // Algoritmo de Ranking CLAVE.AI
        // ---------------------------------------------------------
        let score = 0;
        const reasons: string[] = [];

        // Factor 1: Reputación (Base) - Max 40 pts
        if (place.rating && place.rating >= 4.5) {
            score += 40;
            reasons.push("Reputación Impecable (4.5+)");
        } else if (place.rating && place.rating >= 4.0) {
            score += 20;
            reasons.push("Buena Reputación");
        }

        // Factor 2: Actividad (Vida) - Max 30 pts
        // Si tiene muchas reviews, asumimos actividad
        if (place.reviews && place.reviews > 50) {
            score += 30;
            reasons.push("Alta Actividad de Clientes (+50 reviews)");
        } else if (place.reviews && place.reviews > 10) {
            score += 10;
        }

        // Factor 3: Identidad Digital (Social) - Max 20 pts
        if (socialLinks.facebook || socialLinks.instagram) {
            score += 20;
            reasons.push("Presencia Social Activa");
        }

        // Factor 4: Website (Profesionalismo) - Max 10 pts
        if (place.website) {
            score += 10;
            reasons.push("Sitio Web Profesional");
        }

        // Determinar Rank
        let rank: EnrichedProspectData['premiumRank'] = 'Bronze';
        if (score >= 90) rank = 'Diamond';
        else if (score >= 70) rank = 'Gold';
        else if (score >= 40) rank = 'Silver';

        const enrichedData: EnrichedProspectData = {
            lastDataCheck: new Date().toISOString(),
            hasActiveAds: hasAds,
            adsCount: 0,
            ownerResponds: false, // Necesitaríamos leer las reviews reales
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
