/**
 * Modelo de Usuario para la tienda de deportes
 * Incluye sistema de roles para control de acceso
 */

const mongoose = require('mongoose');
const { ROLES, ROLES_ARRAY } = require('../utils/constants');

const userSchema = mongoose.Schema({
    nombre: {
        type: String,
        required: [true, 'Por favor teclea tu nombre'],
        trim: true,
        maxlength: [100, 'El nombre no puede exceder 100 caracteres']
    },
    email: {
        type: String,
        required: [true, 'Por favor teclea tu email'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Por favor ingresa un email válido']
    },
    password: {
        type: String,
        required: [true, 'Por favor teclea tu password'],
        minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
        select: false  // No incluir password en queries por defecto
    },
    rol: {
        type: String,
        enum: {
            values: ROLES_ARRAY,
            message: 'Rol no válido. Debe ser: admin, vendedor o cliente'
        },
        default: ROLES.CLIENTE
    },
    activo: {
        type: Boolean,
        default: true
    },
    fechaCreacion: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    // Habilitar versionado para optimistic locking
    versionKey: '__v'
});

// Índices para mejorar rendimiento de búsquedas
// Nota: email ya tiene índice único por la opción unique: true
userSchema.index({ rol: 1 });
userSchema.index({ activo: 1 });

// Método para retornar datos del usuario sin información sensible
userSchema.methods.toJSON = function() {
    const usuario = this.toObject();
    delete usuario.password;
    return usuario;
};

module.exports = mongoose.model('User', userSchema);