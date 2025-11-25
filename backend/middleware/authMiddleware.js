/**
 * Middleware de autenticación
 * Verifica el token JWT y carga el usuario en la request
 */

const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/usersModel');
const { extraerToken, verificarToken } = require('../utils/jwt.util');
const { MENSAJES_ERROR } = require('../utils/constants');

/**
 * Middleware para proteger rutas - verifica que el usuario esté autenticado
 * Extrae el token del header Authorization, lo verifica y carga el usuario
 */
const protect = asyncHandler(async (req, res, next) => {
    const token = extraerToken(req.headers.authorization);
    
    if (!token) {
        res.status(401);
        throw new Error(MENSAJES_ERROR.TOKEN_NO_PROPORCIONADO);
    }
    
    try {
        // Verificar y decodificar el token
        const decoded = verificarToken(token);
        
        // Obtener el usuario desde el token (sin incluir password)
        // Usamos .select('+password') solo cuando necesitamos verificar contraseña
        req.user = await User.findById(decoded.id).select('-password');
        
        if (!req.user) {
            res.status(401);
            throw new Error(MENSAJES_ERROR.USUARIO_NO_ENCONTRADO);
        }
        
        // Verificar que el usuario esté activo
        if (!req.user.activo) {
            res.status(401);
            throw new Error('Usuario desactivado');
        }
        
        next();
    } catch (error) {
        res.status(401);
        throw new Error(MENSAJES_ERROR.TOKEN_INVALIDO);
    }
});

/**
 * Middleware opcional de autenticación
 * Intenta cargar el usuario si hay token, pero no falla si no hay
 * Útil para rutas públicas que pueden tener comportamiento diferente si el usuario está autenticado
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
    const token = extraerToken(req.headers.authorization);
    
    if (token) {
        try {
            const decoded = verificarToken(token);
            req.user = await User.findById(decoded.id).select('-password');
        } catch {
            // Ignorar errores de token - el usuario simplemente no estará autenticado
            req.user = null;
        }
    }
    
    next();
});

module.exports = { protect, optionalAuth };