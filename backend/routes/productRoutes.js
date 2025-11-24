/**
 * Rutas de Productos
 * CRUD de productos con control de acceso por roles
 */

const express = require('express');
const router = express.Router();
const {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    updateStock
} = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin, isAdminOrVendedor } = require('../middleware/roleMiddleware');
const { productValidationRules, validate, paramValidation } = require('../middleware/validationMiddleware');

/**
 * @route   GET /api/products
 * @desc    Listar productos (con filtros y paginación)
 * @access  Público
 * 
 * Query params:
 * - page: número de página
 * - limit: resultados por página
 * - categoria: filtrar por categoría
 * - deporte: filtrar por deporte
 * - marca: filtrar por marca
 * - precioMin: precio mínimo
 * - precioMax: precio máximo
 * - enStock: true para solo productos con stock
 * - busqueda: búsqueda por nombre/descripción
 * - ordenar: campo para ordenar (precio, nombre, createdAt)
 * - orden: asc o desc
 */
router.get('/', getProducts);

/**
 * @route   GET /api/products/:id
 * @desc    Obtener producto por ID
 * @access  Público
 */
router.get('/:id', paramValidation.mongoId, validate, getProductById);

/**
 * @route   POST /api/products
 * @desc    Crear producto
 * @access  Admin / Vendedor
 */
router.post(
    '/',
    protect,
    isAdminOrVendedor,
    productValidationRules.create,
    validate,
    createProduct
);

/**
 * @route   PUT /api/products/:id
 * @desc    Actualizar producto
 * @access  Admin / Vendedor
 */
router.put(
    '/:id',
    protect,
    isAdminOrVendedor,
    paramValidation.mongoId,
    productValidationRules.update,
    validate,
    updateProduct
);

/**
 * @route   DELETE /api/products/:id
 * @desc    Eliminar producto (soft delete)
 * @access  Admin
 */
router.delete('/:id', protect, isAdmin, paramValidation.mongoId, validate, deleteProduct);

/**
 * @route   PUT /api/products/:id/stock
 * @desc    Actualizar stock de producto
 * @access  Admin / Vendedor
 * 
 * Body: { cantidad: number }
 * - cantidad positiva: aumentar stock
 * - cantidad negativa: reducir stock
 */
router.put(
    '/:id/stock',
    protect,
    isAdminOrVendedor,
    paramValidation.mongoId,
    productValidationRules.updateStock,
    validate,
    updateStock
);

module.exports = router;
