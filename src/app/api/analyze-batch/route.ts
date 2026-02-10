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

        const prompt = `Eres el Clasificador Estratégico de MARVELSA (Comercializadora Marvel). Tu misión es identificar prospectos que encajen estrictamente con nuestra razón de ser: la comercialización de equipos para la industria AGRÍCOLA, FORESTAL, JARDINERÍA y CONSTRUCCIÓN.

## TU "RAZÓN DE SER" (MARVELSA):
Solo buscamos negocios que vendan, reparen o utilicen maquinaria de estos 4 sectores:
1. **Agrícola/Forestal** (Tractores, motosierras, sistemas de riego, etc.).
2. **Jardinería Profesional** (Podadoras, desbrozadoras de mano, etc.).
3. **Construcción** (Maquinaria pesada, herramientas neumáticas, compresores, generadores).

## REGLA DE EXCLUSIÓN ABSOLUTA:
- **DESCARTA PERENTORIAMENTE** cualquier negocio de **HOGAR / LÍNEA BLANCA / COCINA**. 
- Si el negocio dice "Batidoras", "Licuadoras", "Cafeteras", "Estufas" o "Microondas", es IRRELEVANT. Aunque digan "Refacciones", si son refacciones de cocina, NO SON MARVELSA.

## NICHO ACTUAL DE BÚSQUEDA:
- Nombre: ${niche.name}
- Descripción: ${niche.description}

## NEGOCIOS A CLASIFICAR:
${businessList.map((b: any) => `[${b.idx}] "${b.name}" | Tipo: ${b.type} | Dir: ${b.address}`).join('\n')}

## CLASIFICACIÓN:
1. "prospect": Vende/repara herramientas eléctricas industriales, maquinaria pesada, equipo forestal o agrícola de marca profesional (STIHL, DeWalt, Makita, Cat, etc.).
2. "irrelevant": Es de otro rubro (comida, salud, hogar, ELECTRODOMÉSTICOS PEQUEÑOS de cocina) o no tiene nada que ver.
3. "uncertain": Una ferretería generalista donde hay duda de si venden marcas PRO.

Responde SOLO un JSON array:
[{"idx":0,"verdict":"prospect","reason":"Es un distribuidor oficial de equipo forestal"},{"idx":1,"verdict":"irrelevant","reason":"Es reparación de electrodomésticos domésticos, no industrial"}]`;

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
