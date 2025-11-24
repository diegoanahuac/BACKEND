/**
 * Controlador de Roles
 * Maneja operaciones CRUD de roles (solo admin)
 */

const asyncHandler = require('express-async-handler');
const Role = require('../models/roleModel');
const { PRIVILEGIOS_POR_ROL, MENSAJES_ERROR } = require('../utils/constants');

/**
 * @desc    Listar roles
 * @route   GET /api/roles
 * @access  Admin
 */
const getRoles = asyncHandler(async (req, res) => {
    const roles = await Role.find({ activo: true }).sort({ nombre: 1 });
    
    res.status(200).json({
        success: true,
        data: roles
    });
});

/**
 * @desc    Obtener rol por ID
 * @route   GET /api/roles/:id
 * @access  Admin
 */
const getRoleById = asyncHandler(async (req, res) => {
    const role = await Role.findById(req.params.id);
    
    if (!role) {
        res.status(404);
        throw new Error('Rol no encontrado');
    }
    
    res.status(200).json({
        success: true,
        data: role
    });
});

/**
 * @desc    Crear rol
 * @route   POST /api/roles
 * @access  Admin
 */
const createRole = asyncHandler(async (req, res) => {
    const { nombre, descripcion, privilegios } = req.body;
    
    // Verificar si el rol ya existe
    const roleExists = await Role.findOne({ nombre: nombre.toLowerCase() });
    if (roleExists) {
        res.status(400);
        throw new Error('Ya existe un rol con ese nombre');
    }
    
    // Si no se proporcionan privilegios, usar los defaults
    const privilegiosFinales = privilegios || PRIVILEGIOS_POR_ROL[nombre.toLowerCase()] || [];
    
    const role = await Role.create({
        nombre: nombre.toLowerCase(),
        descripcion,
        privilegios: privilegiosFinales
    });
    
    res.status(201).json({
        success: true,
        data: role
    });
});

/**
 * @desc    Actualizar rol
 * @route   PUT /api/roles/:id
 * @access  Admin
 */
const updateRole = asyncHandler(async (req, res) => {
    const { descripcion, privilegios } = req.body;
    
    const role = await Role.findById(req.params.id);
    
    if (!role) {
        res.status(404);
        throw new Error('Rol no encontrado');
    }
    
    if (descripcion !== undefined) role.descripcion = descripcion;
    if (privilegios !== undefined) role.privilegios = privilegios;
    
    const updatedRole = await role.save();
    
    res.status(200).json({
        success: true,
        data: updatedRole
    });
});

/**
 * @desc    Eliminar rol (soft delete)
 * @route   DELETE /api/roles/:id
 * @access  Admin
 */
const deleteRole = asyncHandler(async (req, res) => {
    const role = await Role.findById(req.params.id);
    
    if (!role) {
        res.status(404);
        throw new Error('Rol no encontrado');
    }
    
    // Soft delete
    role.activo = false;
    await role.save();
    
    res.status(200).json({
        success: true,
        message: 'Rol eliminado correctamente',
        data: { id: role._id }
    });
});

/**
 * @desc    Inicializar roles predeterminados
 * @route   POST /api/roles/init
 * @access  Admin
 */
const initRoles = asyncHandler(async (req, res) => {
    const rolesCreados = [];
    
    for (const [rolNombre, privilegios] of Object.entries(PRIVILEGIOS_POR_ROL)) {
        const existente = await Role.findOne({ nombre: rolNombre });
        
        if (!existente) {
            const nuevoRol = await Role.create({
                nombre: rolNombre,
                privilegios,
                descripcion: `Rol ${rolNombre} con privilegios predeterminados`
            });
            rolesCreados.push(nuevoRol);
        }
    }
    
    res.status(201).json({
        success: true,
        message: `${rolesCreados.length} roles inicializados`,
        data: rolesCreados
    });
});

module.exports = {
    getRoles,
    getRoleById,
    createRole,
    updateRole,
    deleteRole,
    initRoles
};
