/**
 * Modelo de Producto para la tienda de deportes
 * Incluye categorías, deportes, control de stock y versionado para concurrencia
 */

const mongoose = require('mongoose');
const { CATEGORIAS_ARRAY, DEPORTES_ARRAY } = require('../utils/constants');

const productSchema = mongoose.Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre del producto es requerido'],
        trim: true,
        maxlength: [200, 'El nombre no puede exceder 200 caracteres']
    },
    descripcion: {
        type: String,
        trim: true,
        maxlength: [2000, 'La descripción no puede exceder 2000 caracteres']
    },
    categoria: {
        type: String,
        required: [true, 'La categoría es requerida'],
        enum: {
            values: CATEGORIAS_ARRAY,
            message: 'Categoría no válida. Debe ser: calzado, ropa, equipamiento o accesorios'
        }
    },
    deporte: {
        type: String,
        required: [true, 'El deporte es requerido'],
        enum: {
            values: DEPORTES_ARRAY,
            message: 'Deporte no válido. Debe ser: futbol, basketball, tennis, running, gym u otros'
        }
    },
    precio: {
        type: Number,
        required: [true, 'El precio es requerido'],
        min: [0, 'El precio no puede ser negativo']
    },
    stock: {
        type: Number,
        required: [true, 'El stock es requerido'],
        min: [0, 'El stock no puede ser negativo'],
        default: 0
    },
    marca: {
        type: String,
        trim: true,
        maxlength: [100, 'La marca no puede exceder 100 caracteres']
    },
    imagen: {
        type: String,
        trim: true,
        // Validación básica de URL
        match: [/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$|^$/, 'URL de imagen no válida']
    },
    activo: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    // Habilitar versionado para optimistic locking en control de concurrencia
    // Cada vez que se actualiza el documento, __v se incrementa
    // Esto permite detectar modificaciones concurrentes
    versionKey: '__v'
});

// Índices para mejorar rendimiento de búsquedas
productSchema.index({ nombre: 'text', descripcion: 'text' });  // Búsqueda de texto
productSchema.index({ categoria: 1 });
productSchema.index({ deporte: 1 });
productSchema.index({ precio: 1 });
productSchema.index({ activo: 1 });
productSchema.index({ marca: 1 });

/**
 * Método estático para verificar y reducir stock de forma atómica
 * Usa findOneAndUpdate con condición de stock suficiente
 * 
 * CONTROL DE CONCURRENCIA:
 * - Usa $inc que es una operación atómica en MongoDB
 * - La condición stock: { $gte: cantidad } previene stock negativo
 * - Si otro proceso modifica el stock antes, la operación fallará
 *   si no hay suficiente stock, evitando sobreventa
 * 
 * @param {ObjectId} productoId - ID del producto
 * @param {Number} cantidad - Cantidad a reducir
 * @param {Object} session - Sesión de MongoDB para transacciones
 * @returns {Document|null} Producto actualizado o null si no hay stock
 */
productSchema.statics.reducirStock = async function(productoId, cantidad, session = null) {
    const opciones = { 
        new: true,  // Retorna el documento después de la actualización
        runValidators: true
    };
    
    if (session) {
        opciones.session = session;
    }
    
    // Operación atómica: solo actualiza si hay stock suficiente
    return await this.findOneAndUpdate(
        { 
            _id: productoId, 
            stock: { $gte: cantidad },  // Condición de stock suficiente
            activo: true
        },
        { 
            $inc: { stock: -cantidad }  // Operador atómico de decremento
        },
        opciones
    );
};

/**
 * Método estático para restaurar stock de forma atómica
 * Útil para cancelación de órdenes
 * 
 * @param {ObjectId} productoId - ID del producto
 * @param {Number} cantidad - Cantidad a restaurar
 * @param {Object} session - Sesión de MongoDB para transacciones
 * @returns {Document} Producto actualizado
 */
productSchema.statics.restaurarStock = async function(productoId, cantidad, session = null) {
    const opciones = { 
        new: true,
        runValidators: true
    };
    
    if (session) {
        opciones.session = session;
    }
    
    return await this.findOneAndUpdate(
        { _id: productoId },
        { $inc: { stock: cantidad } },  // Operador atómico de incremento
        opciones
    );
};

module.exports = mongoose.model('Product', productSchema);
