/**
 * Controlador de Productos
 * Maneja operaciones CRUD de productos y control de stock
 */

const asyncHandler = require('express-async-handler');
const Product = require('../models/productModel');
const { ejecutarConReintentos } = require('../utils/transaction.util');
const { MENSAJES_ERROR, ROLES } = require('../utils/constants');

/**
 * @desc    Listar productos
 * @route   GET /api/products
 * @access  Público
 */
const getProducts = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Construir filtros
    const filter = { activo: true };
    
    if (req.query.categoria) filter.categoria = req.query.categoria;
    if (req.query.deporte) filter.deporte = req.query.deporte;
    if (req.query.marca) filter.marca = new RegExp(req.query.marca, 'i');
    if (req.query.precioMin || req.query.precioMax) {
        filter.precio = {};
        if (req.query.precioMin) filter.precio.$gte = parseFloat(req.query.precioMin);
        if (req.query.precioMax) filter.precio.$lte = parseFloat(req.query.precioMax);
    }
    if (req.query.enStock === 'true') filter.stock = { $gt: 0 };
    
    // Búsqueda por texto
    if (req.query.busqueda) {
        filter.$or = [
            { nombre: new RegExp(req.query.busqueda, 'i') },
            { descripcion: new RegExp(req.query.busqueda, 'i') }
        ];
    }
    
    // Ordenamiento
    let sort = { createdAt: -1 };
    if (req.query.ordenar) {
        const orden = req.query.orden === 'asc' ? 1 : -1;
        sort = { [req.query.ordenar]: orden };
    }
    
    const [products, total] = await Promise.all([
        Product.find(filter)
            .skip(skip)
            .limit(limit)
            .sort(sort),
        Product.countDocuments(filter)
    ]);
    
    res.status(200).json({
        success: true,
        data: products,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    });
});

/**
 * @desc    Obtener producto por ID
 * @route   GET /api/products/:id
 * @access  Público
 */
const getProductById = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
        res.status(404);
        throw new Error(MENSAJES_ERROR.PRODUCTO_NO_ENCONTRADO);
    }
    
    res.status(200).json({
        success: true,
        data: product
    });
});

/**
 * @desc    Crear producto
 * @route   POST /api/products
 * @access  Admin / Vendedor
 */
const createProduct = asyncHandler(async (req, res) => {
    const {
        nombre,
        descripcion,
        categoria,
        deporte,
        precio,
        stock,
        marca,
        imagen
    } = req.body;
    
    const product = await Product.create({
        nombre,
        descripcion,
        categoria,
        deporte,
        precio,
        stock: stock || 0,
        marca,
        imagen
    });
    
    res.status(201).json({
        success: true,
        data: product
    });
});

/**
 * @desc    Actualizar producto
 * @route   PUT /api/products/:id
 * @access  Admin / Vendedor
 */
const updateProduct = asyncHandler(async (req, res) => {
    const { nombre, descripcion, categoria, deporte, precio, marca, imagen, activo } = req.body;
    
    const product = await Product.findById(req.params.id);
    
    if (!product) {
        res.status(404);
        throw new Error(MENSAJES_ERROR.PRODUCTO_NO_ENCONTRADO);
    }
    
    // Actualizar campos
    if (nombre !== undefined) product.nombre = nombre;
    if (descripcion !== undefined) product.descripcion = descripcion;
    if (categoria !== undefined) product.categoria = categoria;
    if (deporte !== undefined) product.deporte = deporte;
    if (precio !== undefined) product.precio = precio;
    if (marca !== undefined) product.marca = marca;
    if (imagen !== undefined) product.imagen = imagen;
    if (activo !== undefined && req.user.rol === ROLES.ADMIN) {
        product.activo = activo;
    }
    
    const updatedProduct = await product.save();
    
    res.status(200).json({
        success: true,
        data: updatedProduct
    });
});

/**
 * @desc    Eliminar producto (soft delete)
 * @route   DELETE /api/products/:id
 * @access  Admin
 */
const deleteProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
        res.status(404);
        throw new Error(MENSAJES_ERROR.PRODUCTO_NO_ENCONTRADO);
    }
    
    // Soft delete
    product.activo = false;
    await product.save();
    
    res.status(200).json({
        success: true,
        message: 'Producto eliminado correctamente',
        data: { id: product._id }
    });
});

/**
 * @desc    Actualizar stock de producto
 * @route   PUT /api/products/:id/stock
 * @access  Admin / Vendedor
 * 
 * CONTROL DE CONCURRENCIA:
 * Esta operación usa operadores atómicos ($inc) para evitar condiciones de carrera.
 * También implementa retry logic en caso de conflictos de versión.
 */
const updateStock = asyncHandler(async (req, res) => {
    const { cantidad } = req.body;
    
    if (cantidad === undefined || cantidad === null) {
        res.status(400);
        throw new Error('La cantidad es requerida');
    }
    
    const cantidadNum = parseInt(cantidad);
    
    /**
     * EJEMPLO DE CONTROL DE CONCURRENCIA:
     * 
     * Usamos ejecutarConReintentos para manejar posibles conflictos de concurrencia.
     * Si dos operaciones intentan modificar el stock al mismo tiempo, una de ellas
     * puede fallar con VersionError. En ese caso, reintentamos la operación.
     * 
     * El operador $inc es atómico en MongoDB, lo que significa que incluso si
     * múltiples operaciones se ejecutan "al mismo tiempo", cada una se aplicará
     * de forma secuencial sin perder datos.
     */
    const product = await ejecutarConReintentos(async () => {
        // Usamos findOneAndUpdate con $inc para operación atómica
        // La condición stock: { $gte: -cantidadNum } (cuando cantidad es negativa)
        // previene que el stock sea negativo
        const updateQuery = { _id: req.params.id };
        
        // Si estamos reduciendo stock, verificar que hay suficiente
        if (cantidadNum < 0) {
            updateQuery.stock = { $gte: Math.abs(cantidadNum) };
        }
        
        const resultado = await Product.findOneAndUpdate(
            updateQuery,
            { $inc: { stock: cantidadNum } },
            { new: true, runValidators: true }
        );
        
        if (!resultado) {
            const producto = await Product.findById(req.params.id);
            if (!producto) {
                throw new Error(MENSAJES_ERROR.PRODUCTO_NO_ENCONTRADO);
            }
            throw new Error(MENSAJES_ERROR.STOCK_INSUFICIENTE);
        }
        
        return resultado;
    });
    
    res.status(200).json({
        success: true,
        message: `Stock actualizado. Nuevo stock: ${product.stock}`,
        data: product
    });
});

module.exports = {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    updateStock
};
