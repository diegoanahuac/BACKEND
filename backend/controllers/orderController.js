/**
 * Controlador de Órdenes
 * Maneja operaciones de órdenes con transacciones MongoDB y control de concurrencia
 */

const asyncHandler = require('express-async-handler');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const { ejecutarTransaccion } = require('../utils/transaction.util');
const { MENSAJES_ERROR, ESTADOS_ORDEN, ROLES, PRIVILEGIOS } = require('../utils/constants');
const { tienePrivilegio } = require('../middleware/privilegeMiddleware');

/**
 * @desc    Listar órdenes
 * @route   GET /api/orders
 * @access  Admin/Vendedor: todas, Cliente: propias
 */
const getOrders = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Filtros base
    const filter = {};
    
    // Si es cliente, solo ver sus propias órdenes
    const puedeVerTodas = await tienePrivilegio(req.user, PRIVILEGIOS.LEER_TODAS_ORDENES);
    if (!puedeVerTodas) {
        filter.usuario = req.user._id;
    }
    
    // Filtros adicionales
    if (req.query.estado) filter.estado = req.query.estado;
    if (req.query.usuario && puedeVerTodas) filter.usuario = req.query.usuario;
    
    const [orders, total] = await Promise.all([
        Order.find(filter)
            .populate('usuario', 'nombre email')
            .populate('productos.producto', 'nombre precio imagen')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 }),
        Order.countDocuments(filter)
    ]);
    
    res.status(200).json({
        success: true,
        data: orders,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    });
});

/**
 * @desc    Obtener orden por ID
 * @route   GET /api/orders/:id
 * @access  Admin/Vendedor/Dueño
 */
const getOrderById = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id)
        .populate('usuario', 'nombre email')
        .populate('productos.producto', 'nombre precio imagen marca');
    
    if (!order) {
        res.status(404);
        throw new Error(MENSAJES_ERROR.ORDEN_NO_ENCONTRADO);
    }
    
    // Verificar acceso
    const puedeVerTodas = await tienePrivilegio(req.user, PRIVILEGIOS.LEER_TODAS_ORDENES);
    const esDueno = order.usuario._id.toString() === req.user._id.toString();
    
    if (!puedeVerTodas && !esDueno) {
        res.status(403);
        throw new Error(MENSAJES_ERROR.ROL_INSUFICIENTE);
    }
    
    res.status(200).json({
        success: true,
        data: order
    });
});

/**
 * @desc    Crear orden
 * @route   POST /api/orders
 * @access  Autenticado
 * 
 * TRANSACCIONES MONGODB:
 * Esta operación usa transacciones para garantizar que:
 * 1. Se verifica el stock de todos los productos
 * 2. Se reduce el stock de cada producto
 * 3. Se crea la orden
 * 
 * Si cualquier paso falla, se hace rollback de todos los cambios.
 */
const createOrder = asyncHandler(async (req, res) => {
    const { productos, direccionEnvio } = req.body;
    
    if (!productos || productos.length === 0) {
        res.status(400);
        throw new Error('Debe incluir al menos un producto');
    }
    
    if (!direccionEnvio) {
        res.status(400);
        throw new Error('La dirección de envío es requerida');
    }
    
    /**
     * EJEMPLO DE TRANSACCIÓN MONGODB:
     * 
     * ejecutarTransaccion() maneja todo el ciclo de vida de la transacción:
     * 1. Inicia una sesión de MongoDB
     * 2. Inicia la transacción
     * 3. Ejecuta las operaciones dentro de la transacción
     * 4. Si todo es exitoso, hace commit
     * 5. Si hay error, hace rollback (abort)
     * 6. Cierra la sesión
     * 
     * IMPORTANTE: Todas las operaciones dentro del callback DEBEN incluir
     * la opción { session } para que sean parte de la transacción.
     */
    const order = await ejecutarTransaccion(async (session) => {
        // Paso 1: Verificar y obtener precios de todos los productos
        const productosConPrecio = [];
        let total = 0;
        
        for (const item of productos) {
            // Obtener el producto actual
            const producto = await Product.findById(item.producto).session(session);
            
            if (!producto) {
                throw new Error(`Producto no encontrado: ${item.producto}`);
            }
            
            if (!producto.activo) {
                throw new Error(`Producto no disponible: ${producto.nombre}`);
            }
            
            // Paso 2: Verificar stock y reducirlo de forma atómica
            /**
             * CONTROL DE CONCURRENCIA:
             * Usamos findOneAndUpdate con condición de stock suficiente.
             * El operador $inc es atómico - si dos usuarios intentan comprar
             * el último producto al mismo tiempo, solo uno tendrá éxito.
             */
            const productoActualizado = await Product.findOneAndUpdate(
                { 
                    _id: item.producto, 
                    stock: { $gte: item.cantidad },  // Condición de stock suficiente
                    activo: true
                },
                { 
                    $inc: { stock: -item.cantidad }  // Operación atómica
                },
                { 
                    session,  // IMPORTANTE: incluir session para transacción
                    new: true 
                }
            );
            
            if (!productoActualizado) {
                throw new Error(`Stock insuficiente para: ${producto.nombre}. Disponible: ${producto.stock}`);
            }
            
            productosConPrecio.push({
                producto: item.producto,
                cantidad: item.cantidad,
                precioUnitario: producto.precio
            });
            
            total += producto.precio * item.cantidad;
        }
        
        // Paso 3: Crear la orden
        /**
         * NOTA: Al crear documentos dentro de una transacción, usamos
         * Model.create([data], { session }) con array para pasar la sesión
         */
        const [nuevaOrden] = await Order.create([{
            usuario: req.user._id,
            productos: productosConPrecio,
            total,
            estado: ESTADOS_ORDEN.PENDIENTE,
            direccionEnvio
        }], { session });  // IMPORTANTE: incluir session
        
        return nuevaOrden;
    });
    
    // Poblar la respuesta
    const orderPopulated = await Order.findById(order._id)
        .populate('usuario', 'nombre email')
        .populate('productos.producto', 'nombre precio imagen');
    
    res.status(201).json({
        success: true,
        message: 'Orden creada exitosamente',
        data: orderPopulated
    });
});

/**
 * @desc    Actualizar estado de orden
 * @route   PUT /api/orders/:id/status
 * @access  Admin / Vendedor
 */
const updateOrderStatus = asyncHandler(async (req, res) => {
    const { estado } = req.body;
    
    if (!estado) {
        res.status(400);
        throw new Error('El estado es requerido');
    }
    
    const order = await Order.findById(req.params.id);
    
    if (!order) {
        res.status(404);
        throw new Error(MENSAJES_ERROR.ORDEN_NO_ENCONTRADO);
    }
    
    // Verificar transición de estado válida
    if (!Order.puedeTransicionar(order.estado, estado)) {
        res.status(400);
        throw new Error(`No se puede cambiar de ${order.estado} a ${estado}`);
    }
    
    order.estado = estado;
    const updatedOrder = await order.save();
    
    res.status(200).json({
        success: true,
        message: `Estado actualizado a ${estado}`,
        data: updatedOrder
    });
});

/**
 * @desc    Cancelar orden
 * @route   DELETE /api/orders/:id
 * @access  Admin / Dueño
 * 
 * TRANSACCIÓN DE CANCELACIÓN:
 * Esta operación restaura el stock de los productos y actualiza el estado.
 */
const cancelOrder = asyncHandler(async (req, res) => {
    // Obtener la orden
    const order = await Order.findById(req.params.id);
    
    if (!order) {
        res.status(404);
        throw new Error(MENSAJES_ERROR.ORDEN_NO_ENCONTRADO);
    }
    
    // Verificar acceso (admin o dueño)
    const esAdmin = req.user.rol === ROLES.ADMIN;
    const esDueno = order.usuario.toString() === req.user._id.toString();
    
    if (!esAdmin && !esDueno) {
        res.status(403);
        throw new Error(MENSAJES_ERROR.ROL_INSUFICIENTE);
    }
    
    // Verificar que se puede cancelar
    if (!Order.puedeTransicionar(order.estado, ESTADOS_ORDEN.CANCELADA)) {
        res.status(400);
        throw new Error(`No se puede cancelar una orden en estado: ${order.estado}`);
    }
    
    /**
     * TRANSACCIÓN DE CANCELACIÓN:
     * 
     * 1. Restaurar el stock de cada producto
     * 2. Actualizar el estado de la orden a "cancelada"
     * 
     * Si cualquier paso falla, se hace rollback completo.
     */
    await ejecutarTransaccion(async (session) => {
        // Paso 1: Restaurar stock de cada producto
        for (const item of order.productos) {
            await Product.findByIdAndUpdate(
                item.producto,
                { $inc: { stock: item.cantidad } },  // Restaurar stock
                { session }
            );
        }
        
        // Paso 2: Actualizar estado de la orden
        await Order.findByIdAndUpdate(
            order._id,
            { estado: ESTADOS_ORDEN.CANCELADA },
            { session }
        );
    });
    
    // Obtener orden actualizada
    const cancelledOrder = await Order.findById(order._id)
        .populate('usuario', 'nombre email')
        .populate('productos.producto', 'nombre precio imagen');
    
    res.status(200).json({
        success: true,
        message: 'Orden cancelada exitosamente. Stock restaurado.',
        data: cancelledOrder
    });
});

module.exports = {
    getOrders,
    getOrderById,
    createOrder,
    updateOrderStatus,
    cancelOrder
};
