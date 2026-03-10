/**
 * Rutas de generación de diseños con Gemini AI
 * POST /api/gemini/generate — Genera propuestas de jardín usando IA
 */
import { Router } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { requireAuth } from '../middleware/auth.js';
import { geminiLimiter } from '../middleware/rateLimiter.js';
import { validateGenerateDesign } from '../middleware/sanitize.js';

const router = Router();

// Inicializar Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Construye el prompt para Gemini basado en los datos del jardín
 */
function buildPrompt(gardenData) {
    const { soil, style, budget, length, width, extraInfo } = gardenData;
    const area = (length && width) ? (length * width).toFixed(2) : null;
    const areaText = area ? `aproximadamente ${area} m²` : 'medidas no especificadas';

    return `Eres un experto diseñador de jardines mediterráneos especializado en Mallorca.

DATOS DEL JARDÍN:
- Tipo de suelo: ${soil}
- Estilo deseado: ${style}
- Presupuesto: ${budget}€
- Área: ${areaText}
${length && width ? `- Dimensiones: ${length}m × ${width}m` : ''}
${extraInfo ? `\nINFORMACIÓN ADICIONAL DEL USUARIO:\n${extraInfo}\n\nTen en cuenta esta información adicional al seleccionar plantas y diseñar las propuestas.` : ''}

ANÁLISIS DE IMAGEN REQUERIDO:
Las imágenes adjuntas muestran el terreno actual del jardín. DEBES analizar cuidadosamente:
1. Obstáculos visibles: paredes, rocas, estructuras existentes, desniveles del terreno
2. Zonas de sombra actuales: identifica áreas con sombra proyectada por edificios, árboles o muros
3. Color y textura de la tierra: observa si es arcillosa, arenosa, pedregosa para confirmar el tipo de suelo
4. Orientación y exposición solar: evalúa qué zonas reciben más o menos luz solar
5. Elementos existentes aprovechables: árboles, plantas, caminos que puedan integrarse en el diseño

IMPORTANTE: Analiza la imagen para identificar obstáculos (paredes, rocas), zonas de sombra actuales y el color de la tierra para ajustar la selección de plantas a la realidad visual del terreno.

DENSIDAD Y MEDIDAS - RESPETA EL ESPACIO DISPONIBLE:
- El jardín tiene ${areaText}${length && width ? ` (${length}m × ${width}m)` : ''}
- CALCULA la cantidad de plantas según el espacio real disponible
- Espaciamiento típico entre plantas: Arbustos pequeños 0.5-1m, Arbustos medianos 1-2m, Árboles pequeños 2-4m
- Densidad máxima recomendada: 4-8 plantas por m² para cubiertas/aromáticas, 1-2 plantas por m² para arbustos
- NO sugieras más plantas de las que físicamente caben en el espacio
- Si el jardín es pequeño (menos de 20m²), limita el número total de plantas a un máximo razonable (ej: 15-30 plantas pequeñas o 5-10 arbustos)
- Deja espacios para caminos, zonas de estar y crecimiento futuro de las plantas

TAREA:
Genera DOS propuestas de diseño de jardín en formato JSON ESTRICTO (sin comillas curvas).

FORMATO DE RESPUESTA REQUERIDO (USA SOLO COMILLAS RECTAS " ):
{
  "sustainable": {
    "title": "Nombre simple sin comillas",
    "description": "Breve descripcion",
    "plants": [
      {
        "name": "Nombre cientifico",
        "quantity": 5,
        "cost": 25,
        "waterNeeds": "low",
        "maintenance": "low"
      }
    ],
    "totalCost": 1500,
    "estimatedMaintenance": "low",
    "estimatedWaterConsumption": "low",
    "additionalNotes": "Recomendaciones especificas para Palma (Mallorca) sobre las plantas seleccionadas"
  },
  "aesthetic": {
    "title": "Nombre simple",
    "description": "Breve descripcion",
    "plants": [],
    "totalCost": 1500,
    "estimatedMaintenance": "medium",
    "estimatedWaterConsumption": "medium",
    "additionalNotes": "Recomendaciones especificas para Palma (Mallorca)"
  }
}

RECOMENDACIONES ADICIONALES (campo "additionalNotes"):
- Incluye consejos practicos especificos de cada planta seleccionada para el clima de Mallorca
- Menciona peculiaridades de cultivo: reaccion al suelo calcareo, necesidades especiales, precauciones
- Indica combinaciones de plantas que funcionan bien juntas (olores, colores, floracion)
- Advierte sobre plantas que pueden causar irritacion o requieren manejo especial
- Sugiere ubicaciones optimas segun el tamano final de cada planta
- Formato: texto corrido natural y cercano, como si fueras un jardinero local dando consejos

RESTRICCIONES CRITICAS:
- USA SOLO COMILLAS DOBLES RECTAS (") en el JSON
- NO uses comillas curvas, tipográficas ni apóstrofes decorativos
- El coste total debe estar cerca de ${budget}€ (±20%)
- Para sustainable: waterNeeds debe ser "very_low" o "low"
- Para aesthetic: prioriza el estilo ${style}

PRECIOS REALISTAS - EVITA ALUCINACIONES:
- Usa SOLO precios reales del mercado de Mallorca para plantas mediterráneas
- Precios orientativos por planta: Lavanda/Romero 3-8€, Olivo joven 25-60€, Palmera pequeña 40-100€, Buganvilla 15-35€
- Si no conoces el precio exacto de una planta, usa un precio conservador entre 5-30€
- El campo "cost" es el precio unitario por planta, NO el coste total de todas las unidades
- La suma de (quantity × cost) de todas las plantas debe aproximarse al totalCost
- NO inventes precios irreales: si una planta normalmente cuesta 10€, no pongas 200€

RESPONDE SOLO CON JSON VÁLIDO, SIN TEXTO ADICIONAL.`;
}

/**
 * Sanitiza texto JSON reemplazando caracteres problemáticos
 */
function sanitizeJSON(text) {
    let cleaned = text;

    const replacements = {
        '\u201C': '"', '\u201D': '"', '\u201E': '"', '\u201F': '"',
        '\u2033': '"', '\u2036': '"',
        '\u2018': "'", '\u2019': "'", '\u201A': "'", '\u201B': "'",
        '\u2032': "'", '\u2035': "'",
    };

    for (const [bad, good] of Object.entries(replacements)) {
        cleaned = cleaned.split(bad).join(good);
    }

    cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
    cleaned = cleaned.replace(/\r\n/g, ' ');
    cleaned = cleaned.replace(/\r/g, ' ');
    cleaned = cleaned.replace(/\n/g, ' ');
    cleaned = cleaned.replace(/\t/g, ' ');
    cleaned = cleaned.replace(/[\x00-\x1F\x7F]/g, '');
    cleaned = cleaned.replace(/\s+/g, ' ');

    return cleaned;
}

/**
 * POST /api/gemini/generate
 * Genera propuestas de jardín usando Gemini AI
 */
router.post('/generate', requireAuth, geminiLimiter, validateGenerateDesign, async (req, res, next) => {
    try {
        const { soil, style, budget, length, width, extraInfo, designName, images } = req.body;

        console.log(`[Gemini] Generando diseño para usuario ${req.user.id}: "${designName}"`);

        const prompt = buildPrompt({ soil, style, budget, length, width, extraInfo });

        // Preparar partes del contenido (texto + imágenes)
        const parts = [{ text: prompt }];

        if (images && images.length > 0) {
            for (const img of images) {
                parts.push({
                    inlineData: {
                        mimeType: img.mimeType,
                        data: img.data,
                    },
                });
            }
        }

        const model = genAI.getGenerativeModel({
            model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
        });

        const result = await model.generateContent({
            contents: [{ parts }],
            generationConfig: {
                temperature: 0.4,
                maxOutputTokens: 8192,
            },
        });

        const response = result.response;
        const generatedText = response.text();

        if (!generatedText) {
            throw new Error('No se recibió texto en la respuesta de Gemini');
        }

        // Extraer y parsear JSON
        let jsonText = generatedText.trim();
        jsonText = jsonText.replace(/^```(?:json)?\s*\n?/i, '');
        jsonText = jsonText.replace(/\n?```\s*$/i, '');
        jsonText = jsonText.trim();

        const firstBrace = jsonText.indexOf('{');
        const lastBrace = jsonText.lastIndexOf('}');

        if (firstBrace !== -1 && lastBrace > firstBrace) {
            jsonText = jsonText.substring(firstBrace, lastBrace + 1);
        }

        jsonText = sanitizeJSON(jsonText);
        const proposals = JSON.parse(jsonText);

        console.log('[Gemini] Propuestas generadas correctamente');
        res.json(proposals);
    } catch (err) {
        console.error('[Gemini] Error:', err.message);
        next(err);
    }
});

export default router;
