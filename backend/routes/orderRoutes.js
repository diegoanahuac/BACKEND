/**
 * Rutas de Órdenes
 * CRUD de órdenes con control de acceso
 */

const express = require('express');
const router = express.Router();
const {
    getOrders,
    getOrderById,
    createOrder,
    updateOrderStatus,
    cancelOrder
} = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');
const { isAdminOrVendedor } = require('../middleware/roleMiddleware');
const { orderValidationRules, validate, paramValidation } = require('../middleware/validationMiddleware');

/**
 * @route   GET /api/orders
 * @desc    Listar órdenes
 * @access  Admin/Vendedor: todas, Cliente: propias
 * 
 * Query params:
 * - page: número de página
 * - limit: resultados por página
 * - estado: filtrar por estado
 * - usuario: filtrar por usuario (solo admin/vendedor)
 */
router.get('/', protect, getOrders);

/**
 * @route   GET /api/orders/:id
 * @desc    Obtener orden por ID
 * @access  Admin/Vendedor/Dueño
 */
router.get('/:id', protect, paramValidation.mongoId, validate, getOrderById);

/**
 * @route   POST /api/orders
 * @desc    Crear orden
 * @access  Autenticado
 * 
 * Esta ruta usa transacciones MongoDB para:
 * 1. Verificar stock de productos
 * 2. Reducir stock de forma atómica
 * 3. Crear la orden
 * 
 * Si cualquier paso falla, se hace rollback.
 */
router.post('/', protect, orderValidationRules.create, validate, createOrder);

/**
 * @route   PUT /api/orders/:id/status
 * @desc    Actualizar estado de orden
 * @access  Admin / Vendedor
 * 
 * Estados válidos: pendiente, procesando, completada, cancelada
 * Transiciones válidas:
 * - pendiente -> procesando, cancelada
 * - procesando -> completada, cancelada
 * - completada -> (estado final)
 * - cancelada -> (estado final)
 */
router.put(
    '/:id/status',
    protect,
    isAdminOrVendedor,
    paramValidation.mongoId,
    orderValidationRules.updateStatus,
    validate,
    updateOrderStatus
);

/**
 * @route   DELETE /api/orders/:id
 * @desc    Cancelar orden
 * @access  Admin / Dueño
 * 
 * Esta ruta usa transacciones MongoDB para:
 * 1. Restaurar stock de productos
 * 2. Actualizar estado a "cancelada"
 */
router.delete('/:id', protect, paramValidation.mongoId, validate, cancelOrder);

module.exports = router;
