/**
 * Utilidad para manejo de transacciones MongoDB
 * Provee funciones helper para ejecutar operaciones transaccionales
 * 
 * Las transacciones en MongoDB permiten ejecutar múltiples operaciones
 * de forma atómica, garantizando que todas se completen o ninguna.
 * 
 * IMPORTANTE: Las transacciones requieren un Replica Set en MongoDB.
 * En desarrollo local, puedes usar MongoDB Atlas o configurar un replica set local.
 */

const mongoose = require('mongoose');
const { MENSAJES_ERROR } = require('./constants');

/**
 * Ejecuta una función dentro de una transacción MongoDB
 * 
 * CÓMO FUNCIONA:
 * 1. Inicia una sesión de MongoDB
 * 2. Inicia una transacción en esa sesión
 * 3. Ejecuta la función de callback pasándole la sesión
 * 4. Si todo es exitoso, hace commit de la transacción
 * 5. Si hay un error, hace abort (rollback) de la transacción
 * 6. Finalmente, cierra la sesión
 * 
 * @param {Function} callback - Función async que recibe la sesión y ejecuta las operaciones
 * @returns {Promise<any>} Resultado de la operación
 * @throws {Error} Si ocurre un error durante la transacción
 * 
 * @example
 * // Ejemplo de uso para crear una orden con reducción de stock
 * const resultado = await ejecutarTransaccion(async (session) => {
 *     // Todas las operaciones deben incluir { session } como opción
 *     
 *     // Verificar y reducir stock
 *     const producto = await Product.findOneAndUpdate(
 *         { _id: productoId, stock: { $gte: cantidad } },
 *         { $inc: { stock: -cantidad } },
 *         { session, new: true }
 *     );
 *     
 *     if (!producto) {
 *         throw new Error('Stock insuficiente');
 *     }
 *     
 *     // Crear la orden
 *     const orden = await Order.create([{
 *         usuario: usuarioId,
 *         productos: [{ producto: productoId, cantidad }],
 *         total: producto.precio * cantidad
 *     }], { session });
 *     
 *     return orden[0];
 * });
 */
const ejecutarTransaccion = async (callback) => {
    // Paso 1: Iniciar una sesión de MongoDB
    // La sesión mantiene el contexto de la transacción
    const session = await mongoose.startSession();
    
    try {
        // Paso 2: Iniciar la transacción
        // Todas las operaciones siguientes serán parte de esta transacción
        session.startTransaction();
        
        // Paso 3: Ejecutar las operaciones del callback
        // El callback debe usar la sesión en todas sus operaciones
        const resultado = await callback(session);
        
        // Paso 4: Si llegamos aquí, todo fue exitoso
        // Commit confirma todos los cambios de forma permanente
        await session.commitTransaction();
        
        return resultado;
    } catch (error) {
        // Paso 5: Si hay error, hacer rollback
        // Abort revierte todos los cambios realizados en la transacción
        await session.abortTransaction();
        throw error;
    } finally {
        // Paso 6: Siempre cerrar la sesión
        // Esto libera los recursos de la conexión
        session.endSession();
    }
};

/**
 * Ejecuta una operación con reintentos en caso de conflicto de concurrencia
 * 
 * Útil cuando se usa optimistic locking con versionado (__v)
 * y pueden ocurrir errores VersionError por modificaciones concurrentes
 * 
 * @param {Function} operacion - Función async a ejecutar
 * @param {number} maxReintentos - Número máximo de reintentos (default: 3)
 * @param {number} delayBase - Delay base en ms entre reintentos (default: 100)
 * @returns {Promise<any>} Resultado de la operación
 * @throws {Error} Si se agotan los reintentos
 * 
 * @example
 * // Ejemplo de actualización de stock con reintentos
 * const resultado = await ejecutarConReintentos(async () => {
 *     const producto = await Product.findById(productoId);
 *     producto.stock += cantidad;
 *     return await producto.save(); // Puede fallar por VersionError
 * });
 */
const ejecutarConReintentos = async (operacion, maxReintentos = 3, delayBase = 100) => {
    let ultimoError;
    
    for (let intento = 1; intento <= maxReintentos; intento++) {
        try {
            return await operacion();
        } catch (error) {
            ultimoError = error;
            
            // Verificar si es un error de versión (conflicto de concurrencia)
            // MongoDB lanza VersionError cuando el documento fue modificado
            // por otro proceso entre la lectura y la escritura
            if (error.name === 'VersionError' || 
                (error.message && error.message.includes('version'))) {
                
                if (intento < maxReintentos) {
                    // Esperar con backoff exponencial antes de reintentar
                    // Esto reduce la probabilidad de colisiones repetidas
                    const delay = delayBase * Math.pow(2, intento - 1);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
            }
            
            // Si no es error de versión, lanzar inmediatamente
            throw error;
        }
    }
    
    // Si llegamos aquí, se agotaron los reintentos
    throw new Error(MENSAJES_ERROR.CONFLICTO_CONCURRENCIA);
};

/**
 * Wrapper para operaciones de stock que usa operadores atómicos
 * 
 * Los operadores atómicos ($inc, $set) garantizan que la operación
 * se ejecuta de forma atómica sin condiciones de carrera
 * 
 * @param {Model} modelo - Modelo de Mongoose
 * @param {ObjectId} id - ID del documento
 * @param {number} cantidad - Cantidad a incrementar (negativo para decrementar)
 * @param {Object} session - Sesión de transacción (opcional)
 * @returns {Promise<Document>} Documento actualizado
 * 
 * @example
 * // Reducir stock de forma segura
 * const producto = await actualizarStockAtomico(Product, productoId, -5);
 * 
 * // Incrementar stock dentro de una transacción
 * const producto = await actualizarStockAtomico(Product, productoId, 10, session);
 */
const actualizarStockAtomico = async (modelo, id, cantidad, session = null) => {
    const opciones = { 
        new: true,  // Retorna el documento actualizado
        runValidators: true  // Ejecuta las validaciones del schema
    };
    
    if (session) {
        opciones.session = session;
    }
    
    // findOneAndUpdate con $inc es una operación atómica
    // Esto significa que no hay condición de carrera entre leer y escribir
    const resultado = await modelo.findOneAndUpdate(
        { 
            _id: id,
            // Solo actualizar si el stock resultante será >= 0
            // Esto previene stock negativo
            ...(cantidad < 0 ? { stock: { $gte: Math.abs(cantidad) } } : {})
        },
        { 
            $inc: { stock: cantidad }
        },
        opciones
    );
    
    return resultado;
};

module.exports = {
    ejecutarTransaccion,
    ejecutarConReintentos,
    actualizarStockAtomico
};
