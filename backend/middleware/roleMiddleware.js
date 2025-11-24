/**
 * Middleware de autorización por roles
 * Verifica que el usuario tenga el rol requerido para acceder a la ruta
 */

const asyncHandler = require('express-async-handler');
const { ROLES, MENSAJES_ERROR } = require('../utils/constants');

/**
 * Middleware factory que verifica si el usuario tiene uno de los roles permitidos
 * 
 * @param {...string} rolesPermitidos - Roles que pueden acceder a la ruta
 * @returns {Function} Middleware de Express
 * 
 * @example
 * // Solo admin puede acceder
 * router.delete('/:id', protect, checkRole(ROLES.ADMIN), deleteUser);
 * 
 * // Admin y vendedor pueden acceder
 * router.post('/', protect, checkRole(ROLES.ADMIN, ROLES.VENDEDOR), createProduct);
 */
const checkRole = (...rolesPermitidos) => {
    return asyncHandler(async (req, res, next) => {
        // Verificar que el usuario esté autenticado (debe venir de protect middleware)
        if (!req.user) {
            res.status(401);
            throw new Error(MENSAJES_ERROR.NO_AUTORIZADO);
        }
        
        // Verificar que el usuario tenga uno de los roles permitidos
        if (!rolesPermitidos.includes(req.user.rol)) {
            res.status(403);
            throw new Error(MENSAJES_ERROR.ROL_INSUFICIENTE);
        }
        
        next();
    });
};

/**
 * Middleware que verifica si el usuario es admin
 */
const isAdmin = checkRole(ROLES.ADMIN);

/**
 * Middleware que verifica si el usuario es admin o vendedor
 */
const isAdminOrVendedor = checkRole(ROLES.ADMIN, ROLES.VENDEDOR);

/**
 * Middleware que verifica si el usuario es el dueño del recurso o es admin
 * Requiere que el recurso tenga un campo 'usuario' con el ID del dueño
 * 
 * @param {Function} getResource - Función async que obtiene el recurso dado req
 * @returns {Function} Middleware de Express
 * 
 * @example
 * // Verificar propiedad de una orden
 * router.get('/:id', protect, isOwnerOrAdmin(async (req) => {
 *     return await Order.findById(req.params.id);
 * }), getOrder);
 */
const isOwnerOrAdmin = (getResource) => {
    return asyncHandler(async (req, res, next) => {
        if (!req.user) {
            res.status(401);
            throw new Error(MENSAJES_ERROR.NO_AUTORIZADO);
        }
        
        // Los admins siempre tienen acceso
        if (req.user.rol === ROLES.ADMIN) {
            return next();
        }
        
        // Obtener el recurso
        const resource = await getResource(req);
        
        if (!resource) {
            res.status(404);
            throw new Error('Recurso no encontrado');
        }
        
        // Guardar el recurso en la request para evitar consultas duplicadas
        req.resource = resource;
        
        // Verificar propiedad
        const usuarioRecurso = resource.usuario?.toString() || resource.usuario;
        const usuarioActual = req.user._id.toString();
        
        if (usuarioRecurso !== usuarioActual) {
            res.status(403);
            throw new Error(MENSAJES_ERROR.ROL_INSUFICIENTE);
        }
        
        next();
    });
};

/**
 * Middleware que verifica si el usuario puede acceder a su propio recurso o es admin
 * Útil para rutas como /users/:id donde el usuario puede ver/editar su propio perfil
 * 
 * @example
 * router.get('/:id', protect, isSelfOrAdmin, getUser);
 */
const isSelfOrAdmin = asyncHandler(async (req, res, next) => {
    if (!req.user) {
        res.status(401);
        throw new Error(MENSAJES_ERROR.NO_AUTORIZADO);
    }
    
    // Los admins siempre tienen acceso
    if (req.user.rol === ROLES.ADMIN) {
        return next();
    }
    
    // Verificar si es su propio recurso
    if (req.params.id !== req.user._id.toString()) {
        res.status(403);
        throw new Error(MENSAJES_ERROR.ROL_INSUFICIENTE);
    }
    
    next();
});

module.exports = {
    checkRole,
    isAdmin,
    isAdminOrVendedor,
    isOwnerOrAdmin,
    isSelfOrAdmin
};
