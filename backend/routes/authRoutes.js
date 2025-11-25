/**
 * Rutas de Autenticación
 * Maneja registro, login y perfil de usuarios
 */

const express = require('express');
const router = express.Router();
const { register, login, getProfile, updateProfile } = require('../controllers/usersControllers');
const { protect } = require('../middleware/authMiddleware');
const { userValidationRules, validate } = require('../middleware/validationMiddleware');

/**
 * @route   POST /api/auth/register
 * @desc    Registrar nuevo usuario
 * @access  Público
 */
router.post('/register', userValidationRules.register, validate, register);

/**
 * @route   POST /api/auth/login
 * @desc    Login de usuario
 * @access  Público
 */
router.post('/login', userValidationRules.login, validate, login);

/**
 * @route   GET /api/auth/profile
 * @desc    Obtener perfil del usuario autenticado
 * @access  Privado
 */
router.get('/profile', protect, getProfile);

/**
 * @route   PUT /api/auth/profile
 * @desc    Actualizar perfil del usuario autenticado
 * @access  Privado
 */
router.put('/profile', protect, userValidationRules.update, validate, updateProfile);

module.exports = router;
