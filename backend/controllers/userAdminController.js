/**
 * Controlador de Administración de Usuarios
 * Maneja operaciones CRUD de usuarios (solo admin)
 */

const asyncHandler = require('express-async-handler');
const User = require('../models/usersModel');
const { hashPassword } = require('../utils/bcrypt.util');
const { MENSAJES_ERROR, ROLES } = require('../utils/constants');

/**
 * @desc    Listar todos los usuarios
 * @route   GET /api/users
 * @access  Admin
 */
const getUsers = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Filtros opcionales
    const filter = {};
    if (req.query.rol) filter.rol = req.query.rol;
    if (req.query.activo !== undefined) filter.activo = req.query.activo === 'true';
    
    const [users, total] = await Promise.all([
        User.find(filter)
            .select('-password')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 }),
        User.countDocuments(filter)
    ]);
    
    res.status(200).json({
        success: true,
        data: users,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    });
});

/**
 * @desc    Obtener usuario por ID
 * @route   GET /api/users/:id
 * @access  Admin / Propio usuario
 */
const getUserById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    
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
 * @desc    Actualizar usuario
 * @route   PUT /api/users/:id
 * @access  Admin / Propio usuario
 */
const updateUser = asyncHandler(async (req, res) => {
    const { nombre, email, password, activo } = req.body;
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
        res.status(404);
        throw new Error(MENSAJES_ERROR.USUARIO_NO_ENCONTRADO);
    }
    
    // Solo admin puede cambiar estado activo
    if (activo !== undefined && req.user.rol === ROLES.ADMIN) {
        user.activo = activo;
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

/**
 * @desc    Eliminar usuario (soft delete - desactivar)
 * @route   DELETE /api/users/:id
 * @access  Admin
 */
const deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    
    if (!user) {
        res.status(404);
        throw new Error(MENSAJES_ERROR.USUARIO_NO_ENCONTRADO);
    }
    
    // No permitir eliminar al propio admin
    if (user._id.toString() === req.user._id.toString()) {
        res.status(400);
        throw new Error('No puedes eliminarte a ti mismo');
    }
    
    // Soft delete - solo desactivar
    user.activo = false;
    await user.save();
    
    res.status(200).json({
        success: true,
        message: 'Usuario desactivado correctamente',
        data: { id: user._id }
    });
});

/**
 * @desc    Cambiar rol de usuario
 * @route   PUT /api/users/:id/role
 * @access  Admin
 */
const changeUserRole = asyncHandler(async (req, res) => {
    const { rol } = req.body;
    
    if (!rol) {
        res.status(400);
        throw new Error('El rol es requerido');
    }
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
        res.status(404);
        throw new Error(MENSAJES_ERROR.USUARIO_NO_ENCONTRADO);
    }
    
    // No permitir que el admin se quite el rol de admin a sí mismo
    if (user._id.toString() === req.user._id.toString() && rol !== ROLES.ADMIN) {
        res.status(400);
        throw new Error('No puedes quitarte el rol de administrador');
    }
    
    user.rol = rol;
    const updatedUser = await user.save();
    
    res.status(200).json({
        success: true,
        message: `Rol actualizado a ${rol}`,
        data: updatedUser
    });
});

module.exports = {
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    changeUserRole
};
