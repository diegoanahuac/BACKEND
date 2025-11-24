/**
 * Utilidad para manejo de contraseñas con bcrypt
 * Provee funciones para hashear y comparar contraseñas de forma segura
 */

const bcrypt = require('bcryptjs');
const { BCRYPT_CONFIG } = require('./constants');

/**
 * Genera un hash seguro de una contraseña
 * @param {string} password - Contraseña en texto plano
 * @returns {Promise<string>} Hash de la contraseña
 */
const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(BCRYPT_CONFIG.SALT_ROUNDS);
    return await bcrypt.hash(password, salt);
};

/**
 * Compara una contraseña en texto plano con un hash
 * @param {string} password - Contraseña en texto plano
 * @param {string} hashedPassword - Hash de la contraseña almacenada
 * @returns {Promise<boolean>} true si coinciden, false si no
 */
const comparePassword = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
};

module.exports = {
    hashPassword,
    comparePassword
};
