import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: Request) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'GEMINI_API_KEY no configurada' }, { status: 500 });
        }

        const { businesses, niche } = await request.json();

        if (!businesses || !Array.isArray(businesses) || businesses.length === 0) {
            return NextResponse.json({ error: 'Lista de negocios vacía' }, { status: 400 });
        }

        if (!niche || !niche.name || !niche.description) {
            return NextResponse.json({ error: 'Información de nicho requerida' }, { status: 400 });
        }

        // Prepare compact business list for AI (max 20 to control token usage)
        const businessList = businesses.slice(0, 20).map((b: any, i: number) => ({
            idx: i,
            name: b.title || '',
            type: b.type || '',
            address: b.address || '',
        }));

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const prompt = `Eres un clasificador de prospectos comerciales. Tu trabajo es determinar si cada negocio de la lista es un PROSPECTO REAL para el nicho target.

## NICHO TARGET:
- Nombre: ${niche.name}
- Descripción: ${niche.description}
- Keywords relevantes: ${niche.keywords?.slice(0, 5).join(', ')}

## NEGOCIOS A CLASIFICAR:
${businessList.map((b: any) => `[${b.idx}] "${b.name}" | Tipo: ${b.type} | Dir: ${b.address}`).join('\n')}

## INSTRUCCIONES:
Para CADA negocio, clasifica como:
- "prospect" = Es o PODRÍA SER cliente del nicho (vende, repara o usa productos/servicios del nicho)
- "irrelevant" = NO tiene relación con el nicho (ej: batidoras en un nicho de motosierras, restaurantes, hoteles)
- "uncertain" = No hay suficiente info para decidir

## CRITERIOS IMPORTANTES:
- Un taller de reparación es prospect si repara equipos del nicho
- Una ferretería general es "uncertain" (podrían vender productos del nicho)
- Un negocio de otro rubro (cocina, deportes, salud) es "irrelevant"
- El nombre del negocio es la pista más fuerte

Responde SOLO con un JSON array válido, sin markdown, sin explicaciones:
[{"idx":0,"verdict":"prospect","reason":"breve razón"},{"idx":1,"verdict":"irrelevant","reason":"breve razón"}]`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();

        // Parse JSON from response (handle potential markdown wrapping)
        let jsonStr = text;
        if (jsonStr.startsWith('```')) {
            jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
        }

        let verdicts;
        try {
            verdicts = JSON.parse(jsonStr);
        } catch {
            console.error('Failed to parse AI response:', text);
            return NextResponse.json({ error: 'Error parsing AI response', raw: text }, { status: 500 });
        }

        // Map verdicts back to place_ids for easy lookup
        const results: Record<string, { verdict: string; reason: string }> = {};
        for (const v of verdicts) {
            const biz = businesses[v.idx];
            if (biz) {
                const id = biz.place_id || biz.place_id_search || `idx_${v.idx}`;
                results[id] = {
                    verdict: v.verdict,
                    reason: v.reason
                };
            }
        }

        return NextResponse.json({ results, total: Object.keys(results).length });

    } catch (error: any) {
        console.error('Analyze batch error:', error);
        return NextResponse.json(
            { error: error.message || 'Error interno' },
            { status: 500 }
        );
    }
}
