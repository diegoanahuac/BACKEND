/**
 * Middleware de manejo centralizado de errores
 * Procesa todos los errores de la aplicación y retorna respuestas consistentes
 */

const { MENSAJES_ERROR } = require('../utils/constants');

/**
 * Middleware de manejo de errores
 * Debe ser el último middleware registrado en Express
 */
const errorHandler = (err, req, res, next) => {
    // Determinar el código de estado
    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    let message = err.message || MENSAJES_ERROR.ERROR_SERVIDOR;
    
    // Manejo de errores específicos de MongoDB/Mongoose
    
    // Error de validación de Mongoose
    if (err.name === 'ValidationError') {
        statusCode = 400;
        const errores = Object.values(err.errors).map(e => e.message);
        message = `Error de validación: ${errores.join(', ')}`;
    }
    
    // Error de Cast (ID inválido)
    if (err.name === 'CastError' && err.kind === 'ObjectId') {
        statusCode = 400;
        message = 'ID inválido';
    }
    
    // Error de duplicado (unique constraint)
    if (err.code === 11000) {
        statusCode = 400;
        const campo = Object.keys(err.keyValue)[0];
        message = `Ya existe un registro con ese ${campo}`;
    }
    
    // Error de versión (optimistic locking)
    if (err.name === 'VersionError') {
        statusCode = 409;
        message = MENSAJES_ERROR.CONFLICTO_CONCURRENCIA;
    }
    
    // Error de JWT
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = MENSAJES_ERROR.TOKEN_INVALIDO;
    }
    
    // Error de JWT expirado
    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expirado, por favor inicia sesión nuevamente';
    }
    
    // Respuesta de error
    res.status(statusCode).json({
        success: false,
        message: message,
        // Solo mostrar stack en desarrollo
        ...(process.env.NODE_ENV === 'development' && {
            stack: err.stack,
            error: err.name
        })
    });
};

/**
 * Middleware para rutas no encontradas (404)
 */
const notFound = (req, res, next) => {
    const error = new Error(`Ruta no encontrada: ${req.originalUrl}`);
    res.status(404);
    next(error);
};

module.exports = { errorHandler, notFound };