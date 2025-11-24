/**
 * Modelo de Rol para la tienda de deportes
 * Define los roles y sus privilegios en el sistema
 */

const mongoose = require('mongoose');
const { ROLES_ARRAY, PRIVILEGIOS } = require('../utils/constants');

const roleSchema = mongoose.Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre del rol es requerido'],
        unique: true,
        trim: true,
        lowercase: true,
        enum: {
            values: ROLES_ARRAY,
            message: 'Rol no válido. Debe ser: admin, vendedor o cliente'
        }
    },
    privilegios: {
        type: [String],
        default: [],
        validate: {
            validator: function(privilegios) {
                // Verificar que todos los privilegios son válidos
                const privilegiosValidos = Object.values(PRIVILEGIOS);
                return privilegios.every(p => privilegiosValidos.includes(p));
            },
            message: 'Uno o más privilegios no son válidos'
        }
    },
    descripcion: {
        type: String,
        trim: true,
        maxlength: [500, 'La descripción no puede exceder 500 caracteres']
    },
    activo: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Nota: nombre ya tiene índice único por la opción unique: true
// No necesitamos índice adicional

/**
 * Método para verificar si el rol tiene un privilegio específico
 * @param {string} privilegio - Privilegio a verificar
 * @returns {boolean} true si tiene el privilegio
 */
roleSchema.methods.tienePrivilegio = function(privilegio) {
    return this.privilegios.includes(privilegio);
};

/**
 * Método estático para obtener los privilegios de un rol por nombre
 * @param {string} nombreRol - Nombre del rol
 * @returns {Promise<string[]>} Array de privilegios
 */
roleSchema.statics.obtenerPrivilegiosPorRol = async function(nombreRol) {
    const rol = await this.findOne({ nombre: nombreRol.toLowerCase(), activo: true });
    return rol ? rol.privilegios : [];
};

module.exports = mongoose.model('Role', roleSchema);
