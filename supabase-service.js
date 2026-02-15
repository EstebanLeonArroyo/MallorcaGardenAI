/**
 * Servicio de Supabase para Mallorca Garden AI
 * Gestiona todas las operaciones de base de datos y almacenamiento
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

let supabaseClient = null;
let configLoaded = false;

/**
 * Inicializa el cliente de Supabase
 */
async function initSupabase() {
    if (supabaseClient) {
        return supabaseClient;
    }

    try {
        // Intentar cargar configuración local primero
        const localConfig = await import('./supabase-config.local.js');
        const { SUPABASE_URL, SUPABASE_ANON_KEY } = localConfig.supabaseConfig;

        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
            throw new Error('Supabase no está configurado');
        }

        supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        configLoaded = true;
        console.log('✅ Supabase inicializado correctamente');

        return supabaseClient;
    } catch (error) {
        console.log('ℹ️ Supabase no configurado:', error.message);
        try {
            // Intentar con configuración por defecto
            const defaultConfig = await import('./supabase-config.js');
            const { SUPABASE_URL, SUPABASE_ANON_KEY } = defaultConfig.supabaseConfig;

            if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
                throw new Error('Supabase no está configurado');
            }

            supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            configLoaded = true;
            console.log('✅ Supabase inicializado con configuración por defecto');

            return supabaseClient;
        } catch (err) {
            console.warn('⚠️ No se pudo inicializar Supabase');
            configLoaded = false;
            return null;
        }
    }
}

/**
 * Verifica si Supabase está configurado
 */
export function isSupabaseConfigured() {
    return configLoaded && supabaseClient !== null;
}

/**
 * Guarda un diseño completo en Supabase
 * @param {Object} designData - Datos del diseño
 * @param {Array} imageFiles - Array de objetos con {file, dataUrl}
 * @returns {Promise<string>} - ID del diseño guardado
 */
export async function saveDesign(designData, imageFiles = []) {
    const client = await initSupabase();
    if (!client) {
        throw new Error('Supabase no está configurado. Por favor, configura tus credenciales.');
    }

    try {
        console.log('💾 Guardando diseño en Supabase...');

        // Preparar datos para insertar
        const designRecord = {
            name: designData.name,
            soil_type: designData.inputs.soil,
            style: designData.inputs.style,
            budget: designData.inputs.budget,
            garden_length: designData.inputs.length || null,
            garden_width: designData.inputs.width || null,
            garden_area: designData.inputs.area || null,
            proposal_sustainable: designData.proposals.sustainable || null,
            proposal_aesthetic: designData.proposals.aesthetic || null,
            comparison_data: designData.comparisonData || null
        };

        // Insertar en la base de datos
        const { data, error } = await client
            .from('garden_designs')
            .insert([designRecord])
            .select()
            .single();

        if (error) {
            console.error('❌ Error al guardar diseño:', error);
            throw new Error(`Error al guardar diseño: ${error.message}`);
        }

        const designId = data.id;
        console.log(`✅ Diseño guardado con ID: ${designId}`);

        // Subir imágenes al Storage si hay
        if (imageFiles && imageFiles.length > 0) {
            console.log(`📸 Subiendo ${imageFiles.length} imágenes...`);
            await uploadImages(designId, imageFiles);
        }

        return designId;

    } catch (error) {
        console.error('❌ Error en saveDesign:', error);
        throw error;
    }
}

/**
 * Sube imágenes al Storage de Supabase
 * @param {string} designId - ID del diseño
 * @param {Array} imageFiles - Array de objetos con {file, dataUrl}
 */
async function uploadImages(designId, imageFiles) {
    const client = await initSupabase();
    if (!client) {
        throw new Error('Supabase no está configurado');
    }

    try {
        for (let i = 0; i < imageFiles.length; i++) {
            const imageFile = imageFiles[i].file;
            const fileName = `${designId}/original-${i + 1}.${getFileExtension(imageFile.name)}`;

            console.log(`📤 Subiendo: ${fileName}`);

            const { error } = await client.storage
                .from('garden-photos')
                .upload(fileName, imageFile, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (error) {
                console.error(`❌ Error al subir ${fileName}:`, error);
                throw new Error(`Error al subir imagen: ${error.message}`);
            }

            console.log(`✅ Imagen subida: ${fileName}`);
        }

        console.log('✅ Todas las imágenes subidas correctamente');

    } catch (error) {
        console.error('❌ Error en uploadImages:', error);
        throw error;
    }
}

/**
 * Obtiene todos los diseños (ordenados por fecha descendente)
 * @returns {Promise<Array>} - Lista de diseños
 */
export async function getAllDesigns() {
    const client = await initSupabase();
    if (!client) {
        throw new Error('Supabase no está configurado');
    }

    try {
        const { data, error } = await client
            .from('garden_designs')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Error al obtener diseños:', error);
            throw new Error(`Error al obtener diseños: ${error.message}`);
        }

        console.log(`✅ Obtenidos ${data.length} diseños`);
        return data;

    } catch (error) {
        console.error('❌ Error en getAllDesigns:', error);
        throw error;
    }
}

/**
 * Obtiene un diseño específico por ID
 * @param {string} id - ID del diseño
 * @returns {Promise<Object>} - Diseño completo
 */
export async function getDesignById(id) {
    const client = await initSupabase();
    if (!client) {
        throw new Error('Supabase no está configurado');
    }

    try {
        const { data, error } = await client
            .from('garden_designs')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('❌ Error al obtener diseño:', error);
            throw new Error(`Error al obtener diseño: ${error.message}`);
        }

        console.log(`✅ Diseño obtenido: ${data.name}`);

        // Obtener URLs de imágenes si existen
        const imageUrls = await getImageUrls(id);

        return {
            ...data,
            imageUrls
        };

    } catch (error) {
        console.error('❌ Error en getDesignById:', error);
        throw error;
    }
}

/**
 * Obtiene las URLs públicas de las imágenes de un diseño
 * @param {string} designId - ID del diseño
 * @returns {Promise<Array>} - Array de URLs públicas
 */
export async function getImageUrls(designId) {
    const client = await initSupabase();
    if (!client) {
        return [];
    }

    try {
        // Listar archivos en la carpeta del diseño
        const { data, error } = await client.storage
            .from('garden-photos')
            .list(designId, {
                limit: 100,
                offset: 0,
                sortBy: { column: 'name', order: 'asc' }
            });

        if (error) {
            console.error('❌ Error al listar imágenes:', error);
            return [];
        }

        if (!data || data.length === 0) {
            return [];
        }

        // Obtener URLs públicas
        const urls = data.map(file => {
            const { data: urlData } = client.storage
                .from('garden-photos')
                .getPublicUrl(`${designId}/${file.name}`);

            return urlData.publicUrl;
        });

        console.log(`✅ Obtenidas ${urls.length} URLs de imágenes`);
        return urls;

    } catch (error) {
        console.error('❌ Error en getImageUrls:', error);
        return [];
    }
}

/**
 * Elimina un diseño y sus imágenes
 * @param {string} id - ID del diseño a eliminar
 */
export async function deleteDesign(id) {
    const client = await initSupabase();
    if (!client) {
        throw new Error('Supabase no está configurado');
    }

    try {
        console.log(`🗑️ Eliminando diseño: ${id}`);

        // Eliminar imágenes del Storage
        const { data: files } = await client.storage
            .from('garden-photos')
            .list(id);

        if (files && files.length > 0) {
            const filePaths = files.map(file => `${id}/${file.name}`);

            const { error: storageError } = await client.storage
                .from('garden-photos')
                .remove(filePaths);

            if (storageError) {
                console.warn('⚠️ Error al eliminar imágenes:', storageError);
            } else {
                console.log(`✅ Eliminadas ${files.length} imágenes`);
            }
        }

        // Eliminar registro de la base de datos
        const { error } = await client
            .from('garden_designs')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('❌ Error al eliminar diseño:', error);
            throw new Error(`Error al eliminar diseño: ${error.message}`);
        }

        console.log('✅ Diseño eliminado correctamente');

    } catch (error) {
        console.error('❌ Error en deleteDesign:', error);
        throw error;
    }
}

/**
 * Obtiene la extensión de un archivo
 */
function getFileExtension(filename) {
    return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2) || 'jpg';
}
