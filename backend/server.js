/**
 * Servidor principal de la Tienda de Deportes
 * 
 * Este archivo configura y arranca el servidor Express con:
 * - Middlewares globales (cors, json, urlencoded)
 * - Conexión a MongoDB
 * - Registro de rutas API
 * - Manejo de errores centralizado
 */

const express = require('express');
const colors = require('colors');
const dotenv = require('dotenv').config();
const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');
const cors = require('cors');

const port = process.env.PORT || 3000;

// Conectar a la base de datos MongoDB
connectDB();

const app = express();

// ===========================================
// MIDDLEWARES GLOBALES
// ===========================================

// Habilitar CORS para todas las rutas
// En producción, configurar origins específicos
app.use(cors());

// Parsear JSON en el body de las requests
app.use(express.json());

// Parsear datos de formularios URL-encoded
app.use(express.urlencoded({ extended: false }));

// ===========================================
// HEADERS DE SEGURIDAD
// Consideraciones adicionales de seguridad
// ===========================================
app.use((req, res, next) => {
    // Prevenir clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    // Prevenir MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // Habilitar XSS protection en navegadores antiguos
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// ===========================================
// REGISTRO DE RUTAS API
// ===========================================

// Rutas de autenticación (público: registro, login)
app.use('/api/auth', require('./routes/authRoutes'));

// Rutas de administración de usuarios (requiere autenticación)
app.use('/api/users', require('./routes/usersRoutes'));

// Rutas de productos (público: consulta, privado: CRUD)
app.use('/api/products', require('./routes/productRoutes'));

// Rutas de órdenes (privado)
app.use('/api/orders', require('./routes/orderRoutes'));

// Rutas de roles (solo admin)
app.use('/api/roles', require('./routes/roleRoutes'));

// Ruta de bienvenida / health check
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Bienvenido a la API de Tienda de Deportes',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            users: '/api/users',
            products: '/api/products',
            orders: '/api/orders',
            roles: '/api/roles'
        }
    });
});

// ===========================================
// MANEJO DE ERRORES
// ===========================================

// Middleware para rutas no encontradas
app.use(notFound);

// Middleware de manejo de errores centralizado
app.use(errorHandler);

// ===========================================
// INICIAR SERVIDOR
// ===========================================
app.listen(port, () => {
    console.log(`Servidor iniciado en puerto ${port}`.green.bold);
    console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`.yellow);
});
