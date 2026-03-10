/**
 * Rutas CRUD de diseños de jardín
 * Todas las operaciones pasan por el backend con service_role key.
 * Cada usuario solo puede ver/editar/eliminar sus propios diseños.
 */
import { Router } from 'express';
import { requireAuth, supabase } from '../middleware/auth.js';
import { generalLimiter } from '../middleware/rateLimiter.js';
import {
    validateDesignId,
    validateSaveDesign,
    validateUpdateProposals,
} from '../middleware/sanitize.js';

const router = Router();

// Aplicar auth y rate limiting a todas las rutas de diseños
router.use(requireAuth, generalLimiter);

/**
 * GET /api/designs — Obtener todos los diseños del usuario autenticado
 */
router.get('/', async (req, res, next) => {
    try {
        const { data, error } = await supabase
            .from('garden_designs')
            .select('*')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) throw new Error(`Error al obtener diseños: ${error.message}`);

        // Obtener URLs de imágenes para cada diseño
        const designsWithImages = await Promise.all(
            data.map(async (design) => {
                const imageUrls = await getImageUrls(design.id);
                return { ...design, imageUrls };
            })
        );

        res.json(designsWithImages);
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/designs/:id — Obtener un diseño específico (solo si es del usuario)
 */
router.get('/:id', validateDesignId, async (req, res, next) => {
    try {
        const { data, error } = await supabase
            .from('garden_designs')
            .select('*')
            .eq('id', req.params.id)
            .eq('user_id', req.user.id)
            .single();

        if (error) throw new Error(`Error al obtener diseño: ${error.message}`);
        if (!data) return res.status(404).json({ error: 'Diseño no encontrado' });

        const imageUrls = await getImageUrls(data.id);
        res.json({ ...data, imageUrls });
    } catch (err) {
        next(err);
    }
});

/**
 * POST /api/designs — Guardar un nuevo diseño
 */
router.post('/', validateSaveDesign, async (req, res, next) => {
    try {
        const { name, inputs, proposals, comparisonData, images } = req.body;

        const designRecord = {
            user_id: req.user.id,
            name,
            soil_type: inputs.soil,
            style: inputs.style,
            budget: inputs.budget,
            garden_length: inputs.length || null,
            garden_width: inputs.width || null,
            garden_area: inputs.area || null,
            proposal_sustainable: proposals.sustainable || null,
            proposal_aesthetic: proposals.aesthetic || null,
            comparison_data: comparisonData || null,
        };

        const { data, error } = await supabase
            .from('garden_designs')
            .insert([designRecord])
            .select()
            .single();

        if (error) throw new Error(`Error al guardar diseño: ${error.message}`);

        const designId = data.id;
        console.log(`[Designs] Diseño guardado: ${designId} por usuario ${req.user.id}`);

        // Subir imágenes si se proporcionan
        if (images && images.length > 0) {
            await uploadImages(designId, images);
        }

        res.status(201).json({ id: designId });
    } catch (err) {
        next(err);
    }
});

/**
 * PUT /api/designs/:id — Actualizar propuestas de un diseño existente
 */
router.put('/:id', validateUpdateProposals, async (req, res, next) => {
    try {
        // Verificar que el diseño pertenece al usuario
        const { data: existing } = await supabase
            .from('garden_designs')
            .select('id')
            .eq('id', req.params.id)
            .eq('user_id', req.user.id)
            .single();

        if (!existing) {
            return res.status(404).json({ error: 'Diseño no encontrado' });
        }

        const { proposals } = req.body;

        const { error } = await supabase
            .from('garden_designs')
            .update({
                proposal_sustainable: proposals.sustainable || null,
                proposal_aesthetic: proposals.aesthetic || null,
                comparison_data: {
                    sustainable: proposals.sustainable,
                    aesthetic: proposals.aesthetic,
                },
            })
            .eq('id', req.params.id);

        if (error) throw new Error(`Error al actualizar diseño: ${error.message}`);

        console.log(`[Designs] Propuestas actualizadas: ${req.params.id}`);
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

/**
 * DELETE /api/designs/:id — Eliminar un diseño y sus imágenes
 */
router.delete('/:id', validateDesignId, async (req, res, next) => {
    try {
        // Verificar que el diseño pertenece al usuario
        const { data: existing } = await supabase
            .from('garden_designs')
            .select('id')
            .eq('id', req.params.id)
            .eq('user_id', req.user.id)
            .single();

        if (!existing) {
            return res.status(404).json({ error: 'Diseño no encontrado' });
        }

        // Eliminar imágenes del storage
        const { data: files } = await supabase.storage
            .from('garden-photos')
            .list(req.params.id);

        if (files && files.length > 0) {
            const filePaths = files.map(file => `${req.params.id}/${file.name}`);
            await supabase.storage.from('garden-photos').remove(filePaths);
        }

        // Eliminar de la base de datos
        const { error } = await supabase
            .from('garden_designs')
            .delete()
            .eq('id', req.params.id);

        if (error) throw new Error(`Error al eliminar diseño: ${error.message}`);

        console.log(`[Designs] Diseño eliminado: ${req.params.id}`);
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

// --- Helpers ---

/**
 * Obtiene las URLs públicas de las imágenes de un diseño
 */
async function getImageUrls(designId) {
    try {
        const { data, error } = await supabase.storage
            .from('garden-photos')
            .list(designId, {
                limit: 100,
                offset: 0,
                sortBy: { column: 'name', order: 'asc' },
            });

        if (error || !data || data.length === 0) return [];

        return data.map(file => {
            const { data: urlData } = supabase.storage
                .from('garden-photos')
                .getPublicUrl(`${designId}/${file.name}`);
            return urlData.publicUrl;
        });
    } catch {
        return [];
    }
}

/**
 * Sube imágenes base64 al Storage de Supabase
 */
async function uploadImages(designId, images) {
    for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const buffer = Buffer.from(img.data, 'base64');
        const ext = img.mimeType === 'image/png' ? 'png' : img.mimeType === 'image/webp' ? 'webp' : 'jpg';
        const fileName = `${designId}/original-${i + 1}.${ext}`;

        const { error } = await supabase.storage
            .from('garden-photos')
            .upload(fileName, buffer, {
                contentType: img.mimeType,
                cacheControl: '3600',
                upsert: true,
            });

        if (error) {
            console.error(`[Designs] Error subiendo imagen ${i + 1}:`, error.message);
        } else {
            console.log(`[Designs] Imagen subida: ${fileName}`);
        }
    }
}

export default router;
