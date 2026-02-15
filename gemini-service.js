/**
 * Servicio para integración con Google Gemini API
 * Genera propuestas de jardín basadas en imágenes y datos del usuario
 */

// Configuración cargada al iniciar
let apiConfig = {
    GEMINI_API_KEY: '',
    GEMINI_API_URL: '',
    USE_AI: false
};

// Cargar configuración inmediatamente cuando se importa el módulo
(async () => {
    try {
        const localConfig = await import('./config.local.js');
        apiConfig = localConfig.config;
        console.log('✅ Configuración local cargada con API key');
    } catch (e) {
        console.log('ℹ️ config.local.js no encontrado, usando configuración por defecto');
        try {
            const defaultConfig = await import('./config.js');
            apiConfig = defaultConfig.config;
        } catch (err) {
            console.warn('⚠️ No se pudo cargar ninguna configuración');
        }
    }
})();

/**
 * Convierte un archivo de imagen a base64
 * @param {File} file - Archivo de imagen
 * @returns {Promise<string>} - String base64 de la imagen
 */
async function convertImageToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            // Extraer solo la parte base64 (sin el prefijo data:image...)
            const base64String = reader.result.split(',')[1];
            resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Sanitiza texto JSON reemplazando caracteres problemáticos
 * @param {string} text - Texto JSON a limpiar
 * @returns {string} - JSON sanitizado
 */
function sanitizeJSON(text) {
    let cleaned = text;

    // PASO 1: Reemplazar comillas curvas por comillas rectas
    const replacements = {
        '\u201C': '"', '\u201D': '"', '\u201E': '"', '\u201F': '"',
        '\u2033': '"', '\u2036': '"',
        '\u2018': "'", '\u2019': "'", '\u201A': "'", '\u201B': "'",
        '\u2032': "'", '\u2035': "'"
    };

    for (const [bad, good] of Object.entries(replacements)) {
        cleaned = cleaned.split(bad).join(good);
    }

    // PASO 2: Eliminar trailing commas antes de } o ]
    cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');

    // PASO 3: Reemplazar TODOS los saltos de línea y tabs por espacios
    // Esto es más seguro que intentar escaparlos cuando el JSON ya está malformado
    cleaned = cleaned.replace(/\r\n/g, ' ');
    cleaned = cleaned.replace(/\r/g, ' ');
    cleaned = cleaned.replace(/\n/g, ' ');
    cleaned = cleaned.replace(/\t/g, ' ');

    // PASO 4: Eliminar caracteres de control invisibles
    cleaned = cleaned.replace(/[\x00-\x1F\x7F]/g, '');

    // PASO 5: Normalizar espacios múltiples a un solo espacio
    cleaned = cleaned.replace(/\s+/g, ' ');

    return cleaned;
}

/**
 * Construye el prompt para Gemini basado en los datos del jardín
 */
function buildPromptForGemini(gardenData) {
    const { soil, style, budget, length, width, area } = gardenData;

    const areaText = area ? `aproximadamente ${area} m²` : 'medidas no especificadas';

    return `Eres un experto diseñador de jardines mediterráneos especializado en Mallorca.

DATOS DEL JARDÍN:
- Tipo de suelo: ${soil}
- Estilo deseado: ${style}
- Presupuesto: ${budget}€
- Área: ${areaText}
${length && width ? `- Dimensiones: ${length}m × ${width}m` : ''}

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
- Ejemplo de tono: "La Lavandula stoechas es tipica de Baleares pero si tu tierra es muy calcarea puede amarillear. Un poco de quelato de hierro una vez al ano y lista. El Lentisco aguanta lo que le echen, ponlo al fondo porque sera el punto mas alto."


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
 * Llama a la API de Gemini para generar propuestas de jardín
 */
export async function generateGardenProposalsWithAI(imageFiles, gardenData) {
    if (!apiConfig.GEMINI_API_KEY || apiConfig.GEMINI_API_KEY === '') {
        throw new Error('API key no configurada');
    }

    try {
        console.log('🤖 Llamando a Gemini API...');

        const imagePromises = imageFiles.map(file => convertImageToBase64(file));
        const imagesBase64 = await Promise.all(imagePromises);

        const prompt = buildPromptForGemini(gardenData);

        const parts = [{ text: prompt }];
        imagesBase64.forEach((base64Image, index) => {
            const mimeType = imageFiles[index].type || 'image/jpeg';
            parts.push({
                inline_data: {
                    mime_type: mimeType,
                    data: base64Image
                }
            });
        });

        const requestBody = {
            contents: [{ parts: parts }],
            generationConfig: {
                temperature: 0.4,
                maxOutputTokens: 8192,
            }
        };

        const url = `${apiConfig.GEMINI_API_URL}?key=${apiConfig.GEMINI_API_KEY}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            const errorMsg = errorData?.error?.message || JSON.stringify(errorData);
            console.error('Error de Gemini API:', errorMsg);
            throw new Error(`Error de API (${response.status}): ${errorMsg}`);
        }

        const data = await response.json();
        console.log('✅ Respuesta de Gemini recibida');

        // Verificar el finishReason para diagnosticar respuestas incompletas
        const candidate = data.candidates[0];
        console.log('🔍 finishReason:', candidate?.finishReason);
        console.log('🔍 Respuesta completa del candidato:', candidate);

        const generatedText = candidate?.content?.parts[0]?.text;
        if (!generatedText) {
            throw new Error('No se recibió texto en la respuesta');
        }

        // Si se alcanzó el límite de tokens, la respuesta está incompleta
        if (candidate?.finishReason === 'MAX_TOKENS') {
            throw new Error('La respuesta de Gemini se cortó por límite de tokens. Intenta con una descripción más corta o menos imágenes.');
        }

        console.log('📄 Texto recibido (primeros 300 chars):', generatedText.substring(0, 300));
        console.log('📏 Longitud total del texto recibido:', generatedText.length, 'caracteres');

        // PASO 1: Extraer JSON del texto (puede venir envuelto en markdown)
        let jsonText = generatedText.trim();

        // Eliminar bloques de código markdown
        jsonText = jsonText.replace(/^```(?:json)?\s*\n?/i, '');
        jsonText = jsonText.replace(/\n?```\s*$/i, '');
        jsonText = jsonText.trim();

        // Buscar el primer { y último } para extraer solo el objeto JSON
        const firstBrace = jsonText.indexOf('{');
        const lastBrace = jsonText.lastIndexOf('}');
        console.log('🔍 Posiciones de llaves: primera={', firstBrace, '} última={', lastBrace, '}');

        if (firstBrace !== -1 && lastBrace > firstBrace) {
            jsonText = jsonText.substring(firstBrace, lastBrace + 1);
        }

        console.log('📏 Longitud del JSON extraído:', jsonText.length, 'caracteres');
        console.log('📝 JSON extraído ANTES de sanitizar:', jsonText);

        // PASO 2: Sanitizar el JSON (comillas curvas, newlines, etc.)
        jsonText = sanitizeJSON(jsonText);
        console.log('JSON sanitizado (primeros 300 chars):', jsonText.substring(0, 300));
        console.log('JSON sanitizado (COMPLETO):', jsonText);

        // PASO 3: Parsear con manejo de errores detallado
        let proposals;
        try {
            proposals = JSON.parse(jsonText);
            console.log('✅ JSON parseado correctamente!', proposals);
        } catch (parseError) {
            console.error('❌ Error al parsear JSON:', parseError.message);

            // Intentar extraer la posición del error
            const match = parseError.message.match(/position (\d+)/);
            if (match) {
                const pos = parseInt(match[1]);
                const start = Math.max(0, pos - 50);
                const end = Math.min(jsonText.length, pos + 50);
                console.error('Contexto del error (posición ' + pos + '):');
                console.error(jsonText.substring(start, end));
                console.error(' '.repeat(pos - start) + '^ ERROR AQUÍ');
            }

            throw parseError;
        }

        return proposals;

    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    }
}

/**
 * Verifica si está configurada la API key de Gemini
 */
export function isGeminiConfigured() {
    return apiConfig && apiConfig.GEMINI_API_KEY && apiConfig.GEMINI_API_KEY !== '';
}
