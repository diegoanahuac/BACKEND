/**
 * Rutas de Administración de Usuarios
 * CRUD de usuarios (requiere autenticación y permisos)
 */

const express = require('express');
const router = express.Router();
const {
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    changeUserRole
} = require('../controllers/userAdminController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin, isSelfOrAdmin } = require('../middleware/roleMiddleware');
const { userValidationRules, validate, paramValidation } = require('../middleware/validationMiddleware');

/**
 * @route   GET /api/users
 * @desc    Listar todos los usuarios
 * @access  Admin
 */
router.get('/', protect, isAdmin, getUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Obtener usuario por ID
 * @access  Admin / Propio usuario
 */
router.get('/:id', protect, paramValidation.mongoId, validate, isSelfOrAdmin, getUserById);

/**
 * @route   PUT /api/users/:id
 * @desc    Actualizar usuario
 * @access  Admin / Propio usuario
 */
router.put(
    '/:id',
    protect,
    paramValidation.mongoId,
    userValidationRules.update,
    validate,
    isSelfOrAdmin,
    updateUser
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Eliminar usuario (soft delete)
 * @access  Admin
 */
router.delete('/:id', protect, paramValidation.mongoId, validate, isAdmin, deleteUser);

/**
 * @route   PUT /api/users/:id/role
 * @desc    Cambiar rol de usuario
 * @access  Admin
 */
router.put(
    '/:id/role',
    protect,
    paramValidation.mongoId,
    userValidationRules.changeRole,
    validate,
    isAdmin,
    changeUserRole
);

module.exports = router;