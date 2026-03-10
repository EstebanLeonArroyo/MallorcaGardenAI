/**
 * Rutas de generación de imágenes de jardín con Fal.ai Seedream v5
 * POST /api/image-design/:designId/generate
 */
import { Router } from 'express';
import { fal } from '@fal-ai/client';
import { requireAuth, supabase } from '../middleware/auth.js';
import { validateDesignId } from '../middleware/sanitize.js';

const router = Router();

// Configurar Fal.ai con la API key
fal.config({ credentials: process.env.FAL_KEY });

// Rate limiter específico para generación de imágenes (3 req / 15 min)
import rateLimit from 'express-rate-limit';
const imageGenLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 3,
    message: { error: 'Has alcanzado el límite de generación de imágenes. Espera 15 minutos.' },
    keyGenerator: (req) => req.user?.id || req.ip,
    standardHeaders: true,
    legacyHeaders: false,
});

router.use(requireAuth, imageGenLimiter);

/**
 * POST /api/image-design/:designId/generate
 * Body: { proposalType: 'sustainable' | 'aesthetic' }
 */
router.post('/:designId/generate', validateDesignId.slice(0, -1), async (req, res, next) => {
    try {
        const { designId } = req.params;
        const { proposalType } = req.body;

        if (!['sustainable', 'aesthetic'].includes(proposalType)) {
            return res.status(400).json({ error: 'proposalType debe ser "sustainable" o "aesthetic"' });
        }

        // 1. Obtener el diseño (verificar propiedad)
        const { data: design, error: designError } = await supabase
            .from('garden_designs')
            .select('*')
            .eq('id', designId)
            .eq('user_id', req.user.id)
            .single();

        if (designError || !design) {
            return res.status(404).json({ error: 'Diseño no encontrado' });
        }

        // 2. Obtener la primera imagen original del Storage
        const { data: files } = await supabase.storage
            .from('garden-photos')
            .list(designId, { limit: 10, sortBy: { column: 'name', order: 'asc' } });

        const originals = (files || []).filter(f => f.name.startsWith('original-'));
        if (originals.length === 0) {
            return res.status(400).json({ error: 'Este diseño no tiene fotos originales subidas' });
        }

        // Tomar solo la primera imagen
        const firstImage = originals[0];
        const { data: urlData } = supabase.storage
            .from('garden-photos')
            .getPublicUrl(`${designId}/${firstImage.name}`);

        const originalUrl = urlData.publicUrl;

        // 3. Construir el prompt con las plantas de la propuesta
        const proposal = proposalType === 'sustainable'
            ? design.proposal_sustainable
            : design.proposal_aesthetic;

        if (!proposal) {
            return res.status(400).json({ error: `No hay propuesta "${proposalType}" para este diseño` });
        }

        const prompt = buildGardenPrompt(proposal, design.style);

        console.log(`[ImageDesign] Generando imagen para diseño ${designId} (${proposalType})`);
        console.log(`[ImageDesign] Prompt: ${prompt.substring(0, 100)}...`);

        // 4. Llamar a Seedream v5 Lite Edit
        const result = await fal.subscribe('fal-ai/bytedance/seedream/v5/lite/edit', {
            input: {
                prompt,
                image_urls: [originalUrl],
                image_size: 'auto_2K',
                num_images: 1,
            },
            logs: true,
            onQueueUpdate: (update) => {
                if (update.status === 'IN_PROGRESS') {
                    update.logs?.map(log => log.message).forEach(msg => console.log(`[Fal.ai] ${msg}`));
                }
            },
        });

        if (!result.data?.images?.length) {
            throw new Error('Fal.ai no devolvió imágenes');
        }

        const generatedImageUrl = result.data.images[0].url;
        console.log(`[ImageDesign] Imagen generada: ${generatedImageUrl}`);

        // 5. Descargar imagen generada y subirla a Supabase Storage
        const imageResponse = await fetch(generatedImageUrl);
        const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
        const storagePath = `${designId}/generated-${proposalType}.jpg`;

        const { error: uploadError } = await supabase.storage
            .from('garden-photos')
            .upload(storagePath, imageBuffer, {
                contentType: 'image/jpeg',
                cacheControl: '3600',
                upsert: true,
            });

        if (uploadError) {
            console.error('[ImageDesign] Error subiendo imagen:', uploadError.message);
            throw new Error('Error al guardar la imagen generada');
        }

        const { data: storedUrlData } = supabase.storage
            .from('garden-photos')
            .getPublicUrl(storagePath);

        const storedUrl = storedUrlData.publicUrl;

        // 6. Guardar referencia en la columna generated_images
        const existingGenImages = design.generated_images || {};
        existingGenImages[proposalType] = {
            original_url: originalUrl,
            generated_url: storedUrl,
            created_at: new Date().toISOString(),
        };

        const { error: updateError } = await supabase
            .from('garden_designs')
            .update({ generated_images: existingGenImages })
            .eq('id', designId);

        if (updateError) {
            console.error('[ImageDesign] Error actualizando DB:', updateError.message);
        }

        console.log(`[ImageDesign] ✅ Imagen guardada para ${designId} (${proposalType})`);

        res.json({
            original_url: originalUrl,
            generated_url: storedUrl,
            proposalType,
        });

    } catch (err) {
        console.error('[ImageDesign] Error:', err.message);
        next(err);
    }
});

/**
 * Construye un prompt descriptivo para Seedream a partir de la propuesta
 */
function buildGardenPrompt(proposal, style) {
    const plantLines = (proposal.plants || [])
        .map(p => `- Exactly ${p.quantity || 1} units of ${p.name}`)
        .join('\n');

    const totalPlants = (proposal.plants || []).reduce((sum, p) => sum + (p.quantity || 1), 0);

    const styleNames = {
        mediterranean: 'Mediterranean classic (Possessió)',
        modern: 'Balearic minimalism',
        xerogardening: 'Eco-xerogarden, water-saving',
        tropical: 'Contemporary tropical',
        coastal: 'Coastal resilient',
        zen: 'Contemporary Zen',
    };

    const styleName = styleNames[style] || style;

    return `Edit this garden photo: completely remove and ignore ALL existing plants, grass, and vegetation visible in the original image, EXCEPT for lateral hedges (boundary hedges on the sides) which must be preserved as they are. Replace the rest with ONLY the following ${totalPlants} plants, respecting the EXACT quantity of each one — do not add more or fewer than specified:\n\n${plantLines}\n\nStyle: ${styleName} garden in Mallorca, Spain.\n\nIMPORTANT RULES:\n- Strictly respect the exact number of each plant listed above.\n- Remove any pre-existing vegetation from the original photo EXCEPT lateral/boundary hedges — keep those intact.\n- Keep ALL non-plant elements unchanged: walls, paths, buildings, fences, furniture, terrain shape.\n- Arrange the plants naturally within the garden space.\n- Photorealistic render, professional garden design, natural Mediterranean lighting.`;
}

export default router;
