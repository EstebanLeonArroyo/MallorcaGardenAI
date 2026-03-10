/**
 * Middleware de sanitización y validación de inputs
 * Usa express-validator para validar y limpiar todos los datos de entrada.
 */
import { body, param, validationResult } from 'express-validator';

// Valores permitidos — deben coincidir con los del frontend
const VALID_SOILS = ['clay', 'limestone', 'sandy'];
const VALID_STYLES = ['mediterranean', 'modern', 'xerogardening', 'tropical', 'coastal', 'zen'];

/**
 * Helper: procesa los errores de validación y devuelve 400 si hay alguno
 */
export function handleValidationErrors(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Datos inválidos',
            details: errors.array().map(e => ({
                field: e.path,
                message: e.msg,
            })),
        });
    }
    next();
}

/**
 * Validaciones para POST /api/gemini/generate
 */
export const validateGenerateDesign = [
    body('soil')
        .trim()
        .notEmpty().withMessage('El tipo de suelo es obligatorio')
        .isIn(VALID_SOILS).withMessage(`Tipo de suelo debe ser uno de: ${VALID_SOILS.join(', ')}`),

    body('style')
        .trim()
        .notEmpty().withMessage('El estilo es obligatorio')
        .isIn(VALID_STYLES).withMessage(`Estilo debe ser uno de: ${VALID_STYLES.join(', ')}`),

    body('budget')
        .notEmpty().withMessage('El presupuesto es obligatorio')
        .isFloat({ min: 50, max: 50000 }).withMessage('Presupuesto debe ser entre 50€ y 50.000€')
        .toFloat(),

    body('length')
        .optional({ nullable: true })
        .isFloat({ min: 0.1, max: 1000 }).withMessage('Longitud debe ser entre 0.1m y 1000m')
        .toFloat(),

    body('width')
        .optional({ nullable: true })
        .isFloat({ min: 0.1, max: 1000 }).withMessage('Anchura debe ser entre 0.1m y 1000m')
        .toFloat(),

    body('area')
        .optional({ nullable: true }),

    body('extraInfo')
        .optional({ nullable: true })
        .trim()
        .isLength({ max: 1000 }).withMessage('La información adicional no puede superar 1000 caracteres'),

    body('designName')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('El nombre debe tener máximo 100 caracteres'),

    // Validar array de imágenes base64
    body('images')
        .optional()
        .isArray({ max: 5 }).withMessage('Máximo 5 imágenes permitidas'),

    body('images.*.data')
        .optional()
        .isString()
        .isLength({ max: 10 * 1024 * 1024 }).withMessage('Cada imagen no puede superar 7MB en base64'),

    body('images.*.mimeType')
        .optional()
        .isIn(['image/jpeg', 'image/png', 'image/webp']).withMessage('Formato de imagen no soportado'),

    handleValidationErrors,
];

/**
 * Validaciones para rutas con parámetro :id (UUID)
 */
export const validateDesignId = [
    param('id')
        .isUUID().withMessage('ID de diseño inválido'),
    handleValidationErrors,
];

/**
 * Validaciones para POST /api/designs (guardar diseño)
 */
export const validateSaveDesign = [
    body('name')
        .trim()
        .notEmpty().withMessage('El nombre del diseño es obligatorio')
        .isLength({ min: 1, max: 100 }).withMessage('El nombre debe tener entre 1 y 100 caracteres')
        .escape(),

    body('inputs.soil')
        .trim()
        .isIn(VALID_SOILS).withMessage('Tipo de suelo inválido'),

    body('inputs.style')
        .trim()
        .isIn(VALID_STYLES).withMessage('Estilo inválido'),

    body('inputs.budget')
        .isFloat({ min: 50, max: 50000 }).withMessage('Presupuesto inválido')
        .toFloat(),

    body('inputs.length')
        .optional({ values: 'null' })
        .isFloat({ min: 0.1, max: 1000 })
        .toFloat(),

    body('inputs.width')
        .optional({ values: 'null' })
        .isFloat({ min: 0.1, max: 1000 })
        .toFloat(),

    body('proposals')
        .notEmpty().withMessage('Las propuestas son obligatorias')
        .isObject().withMessage('Las propuestas deben ser un objeto'),

    handleValidationErrors,
];

/**
 * Validaciones para PUT /api/designs/:id (actualizar propuestas)
 */
export const validateUpdateProposals = [
    param('id')
        .isUUID().withMessage('ID de diseño inválido'),

    body('proposals')
        .notEmpty().withMessage('Las propuestas son obligatorias')
        .isObject().withMessage('Las propuestas deben ser un objeto'),

    handleValidationErrors,
];
