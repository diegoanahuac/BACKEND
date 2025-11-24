/**
 * Utilidad para manejo de JWT (JSON Web Tokens)
 * Provee funciones para generar y verificar tokens de autenticación
 */

const jwt = require('jsonwebtoken');
const { JWT_CONFIG, MENSAJES_ERROR } = require('./constants');

/**
 * Genera un token JWT para un usuario
 * @param {string} id - ID del usuario
 * @param {string} rol - Rol del usuario
 * @returns {string} Token JWT generado
 */
const generarToken = (id, rol) => {
    return jwt.sign(
        { id, rol },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || JWT_CONFIG.EXPIRACION_DEFAULT }
    );
};

/**
 * Verifica y decodifica un token JWT
 * @param {string} token - Token JWT a verificar
 * @returns {Object} Payload decodificado del token
 * @throws {Error} Si el token es inválido o ha expirado
 */
const verificarToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        throw new Error(MENSAJES_ERROR.TOKEN_INVALIDO);
    }
};

/**
 * Extrae el token del header Authorization
 * @param {string} authHeader - Header Authorization (formato: "Bearer <token>")
 * @returns {string|null} Token extraído o null si no existe
 */
const extraerToken = (authHeader) => {
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.split(' ')[1];
    }
    return null;
};

module.exports = {
    generarToken,
    verificarToken,
    extraerToken
};
