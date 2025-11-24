/**
 * Rutas de Roles
 * CRUD de roles (solo admin)
 */

const express = require('express');
const router = express.Router();
const {
    getRoles,
    getRoleById,
    createRole,
    updateRole,
    deleteRole,
    initRoles
} = require('../controllers/roleController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');
const { roleValidationRules, validate, paramValidation } = require('../middleware/validationMiddleware');

/**
 * @route   GET /api/roles
 * @desc    Listar todos los roles
 * @access  Admin
 */
router.get('/', protect, isAdmin, getRoles);

/**
 * @route   GET /api/roles/:id
 * @desc    Obtener rol por ID
 * @access  Admin
 */
router.get('/:id', protect, isAdmin, paramValidation.mongoId, validate, getRoleById);

/**
 * @route   POST /api/roles
 * @desc    Crear rol
 * @access  Admin
 */
router.post('/', protect, isAdmin, roleValidationRules.create, validate, createRole);

/**
 * @route   POST /api/roles/init
 * @desc    Inicializar roles predeterminados
 * @access  Admin
 */
router.post('/init', protect, isAdmin, initRoles);

/**
 * @route   PUT /api/roles/:id
 * @desc    Actualizar rol
 * @access  Admin
 */
router.put(
    '/:id',
    protect,
    isAdmin,
    paramValidation.mongoId,
    roleValidationRules.update,
    validate,
    updateRole
);

/**
 * @route   DELETE /api/roles/:id
 * @desc    Eliminar rol (soft delete)
 * @access  Admin
 */
router.delete('/:id', protect, isAdmin, paramValidation.mongoId, validate, deleteRole);

module.exports = router;
