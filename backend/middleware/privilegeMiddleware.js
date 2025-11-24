/**
 * Middleware de autorización por privilegios
 * Verifica que el usuario tenga los privilegios específicos requeridos
 */

const asyncHandler = require('express-async-handler');
const Role = require('../models/roleModel');
const { PRIVILEGIOS_POR_ROL, MENSAJES_ERROR } = require('../utils/constants');

/**
 * Middleware factory que verifica si el usuario tiene uno de los privilegios requeridos
 * Primero busca en la base de datos los privilegios del rol, si no existen usa los defaults
 * 
 * @param {...string} privilegiosRequeridos - Privilegios necesarios para acceder
 * @returns {Function} Middleware de Express
 * 
 * @example
 * // Requiere privilegio de crear producto
 * router.post('/', protect, checkPrivilege(PRIVILEGIOS.CREAR_PRODUCTO), createProduct);
 * 
 * // Requiere cualquiera de estos privilegios
 * router.get('/', protect, checkPrivilege(PRIVILEGIOS.LEER_ORDENES, PRIVILEGIOS.LEER_TODAS_ORDENES), getOrders);
 */
const checkPrivilege = (...privilegiosRequeridos) => {
    return asyncHandler(async (req, res, next) => {
        // Verificar que el usuario esté autenticado
        if (!req.user) {
            res.status(401);
            throw new Error(MENSAJES_ERROR.NO_AUTORIZADO);
        }
        
        // Obtener privilegios del rol desde la base de datos
        let privilegiosUsuario = await Role.obtenerPrivilegiosPorRol(req.user.rol);
        
        // Si no hay privilegios en BD, usar los defaults de constants
        if (privilegiosUsuario.length === 0) {
            privilegiosUsuario = PRIVILEGIOS_POR_ROL[req.user.rol] || [];
        }
        
        // Guardar privilegios en la request para uso posterior
        req.userPrivileges = privilegiosUsuario;
        
        // Verificar si tiene al menos uno de los privilegios requeridos
        const tienePrivilegio = privilegiosRequeridos.some(
            privilegio => privilegiosUsuario.includes(privilegio)
        );
        
        if (!tienePrivilegio) {
            res.status(403);
            throw new Error(MENSAJES_ERROR.ROL_INSUFICIENTE);
        }
        
        next();
    });
};

/**
 * Middleware que verifica si el usuario tiene TODOS los privilegios requeridos
 * 
 * @param {...string} privilegiosRequeridos - Todos estos privilegios son necesarios
 * @returns {Function} Middleware de Express
 */
const checkAllPrivileges = (...privilegiosRequeridos) => {
    return asyncHandler(async (req, res, next) => {
        if (!req.user) {
            res.status(401);
            throw new Error(MENSAJES_ERROR.NO_AUTORIZADO);
        }
        
        let privilegiosUsuario = await Role.obtenerPrivilegiosPorRol(req.user.rol);
        
        if (privilegiosUsuario.length === 0) {
            privilegiosUsuario = PRIVILEGIOS_POR_ROL[req.user.rol] || [];
        }
        
        req.userPrivileges = privilegiosUsuario;
        
        // Verificar que tenga TODOS los privilegios requeridos
        const tieneTodos = privilegiosRequeridos.every(
            privilegio => privilegiosUsuario.includes(privilegio)
        );
        
        if (!tieneTodos) {
            res.status(403);
            throw new Error(MENSAJES_ERROR.ROL_INSUFICIENTE);
        }
        
        next();
    });
};

/**
 * Helper para verificar privilegios en el código (no middleware)
 * Útil cuando necesitas verificar privilegios dentro de un controlador
 * 
 * @param {Object} user - Usuario de la request
 * @param {string} privilegio - Privilegio a verificar
 * @returns {Promise<boolean>} true si tiene el privilegio
 */
const tienePrivilegio = async (user, privilegio) => {
    if (!user || !user.rol) return false;
    
    let privilegios = await Role.obtenerPrivilegiosPorRol(user.rol);
    
    if (privilegios.length === 0) {
        privilegios = PRIVILEGIOS_POR_ROL[user.rol] || [];
    }
    
    return privilegios.includes(privilegio);
};

module.exports = {
    checkPrivilege,
    checkAllPrivileges,
    tienePrivilegio
};
