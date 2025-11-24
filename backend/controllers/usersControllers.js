/**
 * Controlador de Autenticación
 * Maneja registro, login y perfil de usuarios
 */

const asyncHandler = require('express-async-handler');
const User = require('../models/usersModel');
const { generarToken } = require('../utils/jwt.util');
const { hashPassword, comparePassword } = require('../utils/bcrypt.util');
const { ROLES, MENSAJES_ERROR } = require('../utils/constants');

/**
 * @desc    Registrar nuevo usuario
 * @route   POST /api/auth/register
 * @access  Público
 */
const register = asyncHandler(async (req, res) => {
    const { nombre, email, password, rol } = req.body;
    
    // Verificar campos requeridos
    if (!nombre || !email || !password) {
        res.status(400);
        throw new Error('Faltan datos requeridos');
    }
    
    // Verificar si el usuario ya existe
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
        res.status(400);
        throw new Error('El email ya está registrado');
    }
    
    // Hash de la contraseña
    const passwordHashed = await hashPassword(password);
    
    // Crear usuario (solo admin puede asignar rol diferente a cliente)
    const nuevoRol = rol && req.user?.rol === ROLES.ADMIN ? rol : ROLES.CLIENTE;
    
    const user = await User.create({
        nombre,
        email: email.toLowerCase(),
        password: passwordHashed,
        rol: nuevoRol
    });
    
    if (user) {
        res.status(201).json({
            success: true,
            data: {
                _id: user._id,
                nombre: user.nombre,
                email: user.email,
                rol: user.rol,
                token: generarToken(user._id, user.rol)
            }
        });
    } else {
        res.status(400);
        throw new Error('No se pudo crear el usuario');
    }
});

/**
 * @desc    Login de usuario
 * @route   POST /api/auth/login
 * @access  Público
 */
const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    
    // Verificar campos requeridos
    if (!email || !password) {
        res.status(400);
        throw new Error('Email y contraseña son requeridos');
    }
    
    // Buscar usuario incluyendo password
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user) {
        res.status(401);
        throw new Error('Credenciales inválidas');
    }
    
    // Verificar que el usuario esté activo
    if (!user.activo) {
        res.status(401);
        throw new Error('Usuario desactivado');
    }
    
    // Verificar contraseña
    const isMatch = await comparePassword(password, user.password);
    
    if (!isMatch) {
        res.status(401);
        throw new Error('Credenciales inválidas');
    }
    
    res.status(200).json({
        success: true,
        data: {
            _id: user._id,
            nombre: user.nombre,
            email: user.email,
            rol: user.rol,
            token: generarToken(user._id, user.rol)
        }
    });
});

/**
 * @desc    Obtener perfil del usuario autenticado
 * @route   GET /api/auth/profile
 * @access  Privado
 */
const getProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    
    if (!user) {
        res.status(404);
        throw new Error(MENSAJES_ERROR.USUARIO_NO_ENCONTRADO);
    }
    
    res.status(200).json({
        success: true,
        data: user
    });
});

/**
 * @desc    Actualizar perfil del usuario autenticado
 * @route   PUT /api/auth/profile
 * @access  Privado
 */
const updateProfile = asyncHandler(async (req, res) => {
    const { nombre, email, password } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
        res.status(404);
        throw new Error(MENSAJES_ERROR.USUARIO_NO_ENCONTRADO);
    }
    
    // Verificar si el email nuevo ya existe
    if (email && email.toLowerCase() !== user.email) {
        const emailExists = await User.findOne({ email: email.toLowerCase() });
        if (emailExists) {
            res.status(400);
            throw new Error('El email ya está en uso');
        }
        user.email = email.toLowerCase();
    }
    
    if (nombre) user.nombre = nombre;
    if (password) user.password = await hashPassword(password);
    
    const updatedUser = await user.save();
    
    res.status(200).json({
        success: true,
        data: updatedUser
    });
});

module.exports = {
    register,
    login,
    getProfile,
    updateProfile
};