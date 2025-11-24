/**
 * Modelo de Orden para la tienda de deportes
 * Incluye productos, estados y dirección de envío
 */

const mongoose = require('mongoose');
const { ESTADOS_ORDEN, ESTADOS_ORDEN_ARRAY } = require('../utils/constants');

// Sub-schema para los productos dentro de una orden
const productoOrdenSchema = mongoose.Schema({
    producto: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'El producto es requerido']
    },
    cantidad: {
        type: Number,
        required: [true, 'La cantidad es requerida'],
        min: [1, 'La cantidad mínima es 1']
    },
    precioUnitario: {
        type: Number,
        required: [true, 'El precio unitario es requerido'],
        min: [0, 'El precio no puede ser negativo']
    }
}, { _id: false });

// Sub-schema para la dirección de envío
const direccionEnvioSchema = mongoose.Schema({
    calle: {
        type: String,
        required: [true, 'La calle es requerida'],
        trim: true
    },
    numero: {
        type: String,
        trim: true
    },
    colonia: {
        type: String,
        trim: true
    },
    ciudad: {
        type: String,
        required: [true, 'La ciudad es requerida'],
        trim: true
    },
    estado: {
        type: String,
        required: [true, 'El estado es requerido'],
        trim: true
    },
    codigoPostal: {
        type: String,
        required: [true, 'El código postal es requerido'],
        trim: true
    },
    pais: {
        type: String,
        default: 'México',
        trim: true
    },
    telefono: {
        type: String,
        trim: true
    },
    instrucciones: {
        type: String,
        trim: true,
        maxlength: [500, 'Las instrucciones no pueden exceder 500 caracteres']
    }
}, { _id: false });

const orderSchema = mongoose.Schema({
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'El usuario es requerido']
    },
    productos: {
        type: [productoOrdenSchema],
        required: [true, 'Los productos son requeridos'],
        validate: {
            validator: function(v) {
                return v && v.length > 0;
            },
            message: 'La orden debe tener al menos un producto'
        }
    },
    total: {
        type: Number,
        required: [true, 'El total es requerido'],
        min: [0, 'El total no puede ser negativo']
    },
    estado: {
        type: String,
        enum: {
            values: ESTADOS_ORDEN_ARRAY,
            message: 'Estado no válido. Debe ser: pendiente, procesando, completada o cancelada'
        },
        default: ESTADOS_ORDEN.PENDIENTE
    },
    direccionEnvio: {
        type: direccionEnvioSchema,
        required: [true, 'La dirección de envío es requerida']
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
orderSchema.index({ usuario: 1 });
orderSchema.index({ estado: 1 });
orderSchema.index({ fechaCreacion: -1 });
orderSchema.index({ 'productos.producto': 1 });

/**
 * Método para calcular el total de la orden
 * Útil para verificar que el total enviado es correcto
 */
orderSchema.methods.calcularTotal = function() {
    return this.productos.reduce((total, item) => {
        return total + (item.cantidad * item.precioUnitario);
    }, 0);
};

/**
 * Pre-save hook para asegurar que el total es correcto
 */
orderSchema.pre('save', function(next) {
    const totalCalculado = this.calcularTotal();
    // Permitir pequeña diferencia por redondeo
    if (Math.abs(this.total - totalCalculado) > 0.01) {
        this.total = totalCalculado;
    }
    next();
});

/**
 * Método estático para verificar si una orden puede cambiar a un nuevo estado
 * Define la máquina de estados válidos
 */
orderSchema.statics.puedeTransicionar = function(estadoActual, nuevoEstado) {
    const transicionesValidas = {
        [ESTADOS_ORDEN.PENDIENTE]: [ESTADOS_ORDEN.PROCESANDO, ESTADOS_ORDEN.CANCELADA],
        [ESTADOS_ORDEN.PROCESANDO]: [ESTADOS_ORDEN.COMPLETADA, ESTADOS_ORDEN.CANCELADA],
        [ESTADOS_ORDEN.COMPLETADA]: [],  // Estado final
        [ESTADOS_ORDEN.CANCELADA]: []    // Estado final
    };
    
    return transicionesValidas[estadoActual]?.includes(nuevoEstado) || false;
};

module.exports = mongoose.model('Order', orderSchema);
