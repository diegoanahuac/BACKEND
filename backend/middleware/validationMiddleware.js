/**
 * Middleware de validación de datos de entrada
 * Usa express-validator para validar y sanitizar datos
 */

const { validationResult } = require('express-validator');
const { CATEGORIAS_ARRAY, DEPORTES_ARRAY, ESTADOS_ORDEN_ARRAY, ROLES_ARRAY } = require('../utils/constants');

/**
 * Middleware que procesa los resultados de validación de express-validator
 * Debe usarse después de las reglas de validación
 * 
 * @example
 * router.post('/', [
 *     body('email').isEmail().normalizeEmail(),
 *     body('password').isLength({ min: 6 }),
 *     validate
 * ], register);
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Datos de entrada inválidos',
            errors: errors.array().map(err => ({
                campo: err.path,
                mensaje: err.msg,
                valor: err.value
            }))
        });
    }
    
    next();
};

/**
 * Reglas de validación reutilizables para diferentes entidades
 */
const { body, param, query } = require('express-validator');

// Validaciones para Usuario
const userValidationRules = {
    register: [
        body('nombre')
            .trim()
            .notEmpty().withMessage('El nombre es requerido')
            .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres')
            .escape(),
        body('email')
            .trim()
            .notEmpty().withMessage('El email es requerido')
            .isEmail().withMessage('Debe ser un email válido')
            .normalizeEmail(),
        body('password')
            .notEmpty().withMessage('La contraseña es requerida')
            .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
    ],
    login: [
        body('email')
            .trim()
            .notEmpty().withMessage('El email es requerido')
            .isEmail().withMessage('Debe ser un email válido')
            .normalizeEmail(),
        body('password')
            .notEmpty().withMessage('La contraseña es requerida')
    ],
    update: [
        body('nombre')
            .optional()
            .trim()
            .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres')
            .escape(),
        body('email')
            .optional()
            .trim()
            .isEmail().withMessage('Debe ser un email válido')
            .normalizeEmail()
    ],
    changeRole: [
        body('rol')
            .notEmpty().withMessage('El rol es requerido')
            .isIn(ROLES_ARRAY).withMessage(`El rol debe ser uno de: ${ROLES_ARRAY.join(', ')}`)
    ]
};

// Validaciones para Producto
const productValidationRules = {
    create: [
        body('nombre')
            .trim()
            .notEmpty().withMessage('El nombre es requerido')
            .isLength({ max: 200 }).withMessage('El nombre no puede exceder 200 caracteres')
            .escape(),
        body('descripcion')
            .optional()
            .trim()
            .isLength({ max: 2000 }).withMessage('La descripción no puede exceder 2000 caracteres'),
        body('categoria')
            .notEmpty().withMessage('La categoría es requerida')
            .isIn(CATEGORIAS_ARRAY).withMessage(`La categoría debe ser una de: ${CATEGORIAS_ARRAY.join(', ')}`),
        body('deporte')
            .notEmpty().withMessage('El deporte es requerido')
            .isIn(DEPORTES_ARRAY).withMessage(`El deporte debe ser uno de: ${DEPORTES_ARRAY.join(', ')}`),
        body('precio')
            .notEmpty().withMessage('El precio es requerido')
            .isFloat({ min: 0 }).withMessage('El precio debe ser un número positivo')
            .toFloat(),
        body('stock')
            .optional()
            .isInt({ min: 0 }).withMessage('El stock debe ser un número entero positivo')
            .toInt(),
        body('marca')
            .optional()
            .trim()
            .isLength({ max: 100 }).withMessage('La marca no puede exceder 100 caracteres'),
        body('imagen')
            .optional()
            .trim()
            .isURL().withMessage('La imagen debe ser una URL válida')
    ],
    update: [
        body('nombre')
            .optional()
            .trim()
            .isLength({ max: 200 }).withMessage('El nombre no puede exceder 200 caracteres')
            .escape(),
        body('descripcion')
            .optional()
            .trim()
            .isLength({ max: 2000 }).withMessage('La descripción no puede exceder 2000 caracteres'),
        body('categoria')
            .optional()
            .isIn(CATEGORIAS_ARRAY).withMessage(`La categoría debe ser una de: ${CATEGORIAS_ARRAY.join(', ')}`),
        body('deporte')
            .optional()
            .isIn(DEPORTES_ARRAY).withMessage(`El deporte debe ser uno de: ${DEPORTES_ARRAY.join(', ')}`),
        body('precio')
            .optional()
            .isFloat({ min: 0 }).withMessage('El precio debe ser un número positivo')
            .toFloat(),
        body('marca')
            .optional()
            .trim()
            .isLength({ max: 100 }).withMessage('La marca no puede exceder 100 caracteres'),
        body('imagen')
            .optional()
            .trim()
            .isURL().withMessage('La imagen debe ser una URL válida')
    ],
    updateStock: [
        body('cantidad')
            .notEmpty().withMessage('La cantidad es requerida')
            .isInt().withMessage('La cantidad debe ser un número entero')
            .toInt()
    ]
};

// Validaciones para Orden
const orderValidationRules = {
    create: [
        body('productos')
            .isArray({ min: 1 }).withMessage('Debe incluir al menos un producto'),
        body('productos.*.producto')
            .notEmpty().withMessage('El ID del producto es requerido')
            .isMongoId().withMessage('ID de producto inválido'),
        body('productos.*.cantidad')
            .notEmpty().withMessage('La cantidad es requerida')
            .isInt({ min: 1 }).withMessage('La cantidad debe ser al menos 1')
            .toInt(),
        body('direccionEnvio')
            .notEmpty().withMessage('La dirección de envío es requerida'),
        body('direccionEnvio.calle')
            .trim()
            .notEmpty().withMessage('La calle es requerida'),
        body('direccionEnvio.ciudad')
            .trim()
            .notEmpty().withMessage('La ciudad es requerida'),
        body('direccionEnvio.estado')
            .trim()
            .notEmpty().withMessage('El estado es requerido'),
        body('direccionEnvio.codigoPostal')
            .trim()
            .notEmpty().withMessage('El código postal es requerido')
    ],
    updateStatus: [
        body('estado')
            .notEmpty().withMessage('El estado es requerido')
            .isIn(ESTADOS_ORDEN_ARRAY).withMessage(`El estado debe ser uno de: ${ESTADOS_ORDEN_ARRAY.join(', ')}`)
    ]
};

// Validaciones para Rol
const roleValidationRules = {
    create: [
        body('nombre')
            .trim()
            .notEmpty().withMessage('El nombre es requerido')
            .isIn(ROLES_ARRAY).withMessage(`El nombre debe ser uno de: ${ROLES_ARRAY.join(', ')}`),
        body('descripcion')
            .optional()
            .trim()
            .isLength({ max: 500 }).withMessage('La descripción no puede exceder 500 caracteres'),
        body('privilegios')
            .optional()
            .isArray().withMessage('Los privilegios deben ser un array')
    ],
    update: [
        body('descripcion')
            .optional()
            .trim()
            .isLength({ max: 500 }).withMessage('La descripción no puede exceder 500 caracteres'),
        body('privilegios')
            .optional()
            .isArray().withMessage('Los privilegios deben ser un array')
    ]
};

// Validación de parámetros comunes
const paramValidation = {
    mongoId: [
        param('id')
            .isMongoId().withMessage('ID inválido')
    ]
};

// Validación de query params comunes para paginación
const queryValidation = {
    pagination: [
        query('page')
            .optional()
            .isInt({ min: 1 }).withMessage('La página debe ser un número entero positivo')
            .toInt(),
        query('limit')
            .optional()
            .isInt({ min: 1, max: 100 }).withMessage('El límite debe ser entre 1 y 100')
            .toInt()
    ]
};

module.exports = {
    validate,
    userValidationRules,
    productValidationRules,
    orderValidationRules,
    roleValidationRules,
    paramValidation,
    queryValidation
};
