/**
 * Constantes del sistema para la tienda de deportes
 * Este archivo centraliza todas las constantes utilizadas en la aplicación
 */

// Roles del sistema
const ROLES = {
    ADMIN: 'admin',
    VENDEDOR: 'vendedor',
    CLIENTE: 'cliente'
};

// Lista de roles válidos
const ROLES_ARRAY = Object.values(ROLES);

// Privilegios del sistema
const PRIVILEGIOS = {
    // Usuarios
    CREAR_USUARIO: 'crear_usuario',
    LEER_USUARIOS: 'leer_usuarios',
    ACTUALIZAR_USUARIO: 'actualizar_usuario',
    ELIMINAR_USUARIO: 'eliminar_usuario',
    CAMBIAR_ROL: 'cambiar_rol',
    
    // Productos
    CREAR_PRODUCTO: 'crear_producto',
    LEER_PRODUCTOS: 'leer_productos',
    ACTUALIZAR_PRODUCTO: 'actualizar_producto',
    ELIMINAR_PRODUCTO: 'eliminar_producto',
    ACTUALIZAR_STOCK: 'actualizar_stock',
    
    // Órdenes
    CREAR_ORDEN: 'crear_orden',
    LEER_ORDENES: 'leer_ordenes',
    LEER_TODAS_ORDENES: 'leer_todas_ordenes',
    ACTUALIZAR_ESTADO_ORDEN: 'actualizar_estado_orden',
    CANCELAR_ORDEN: 'cancelar_orden',
    
    // Roles
    GESTIONAR_ROLES: 'gestionar_roles'
};

// Privilegios por rol
const PRIVILEGIOS_POR_ROL = {
    [ROLES.ADMIN]: Object.values(PRIVILEGIOS),
    [ROLES.VENDEDOR]: [
        PRIVILEGIOS.CREAR_PRODUCTO,
        PRIVILEGIOS.LEER_PRODUCTOS,
        PRIVILEGIOS.ACTUALIZAR_PRODUCTO,
        PRIVILEGIOS.ACTUALIZAR_STOCK,
        PRIVILEGIOS.LEER_TODAS_ORDENES,
        PRIVILEGIOS.ACTUALIZAR_ESTADO_ORDEN
    ],
    [ROLES.CLIENTE]: [
        PRIVILEGIOS.LEER_PRODUCTOS,
        PRIVILEGIOS.CREAR_ORDEN,
        PRIVILEGIOS.LEER_ORDENES,
        PRIVILEGIOS.CANCELAR_ORDEN
    ]
};

// Estados de órdenes
const ESTADOS_ORDEN = {
    PENDIENTE: 'pendiente',
    PROCESANDO: 'procesando',
    COMPLETADA: 'completada',
    CANCELADA: 'cancelada'
};

// Lista de estados válidos
const ESTADOS_ORDEN_ARRAY = Object.values(ESTADOS_ORDEN);

// Categorías de productos
const CATEGORIAS = {
    CALZADO: 'calzado',
    ROPA: 'ropa',
    EQUIPAMIENTO: 'equipamiento',
    ACCESORIOS: 'accesorios'
};

// Lista de categorías válidas
const CATEGORIAS_ARRAY = Object.values(CATEGORIAS);

// Deportes disponibles
const DEPORTES = {
    FUTBOL: 'futbol',
    BASKETBALL: 'basketball',
    TENNIS: 'tennis',
    RUNNING: 'running',
    GYM: 'gym',
    OTROS: 'otros'
};

// Lista de deportes válidos
const DEPORTES_ARRAY = Object.values(DEPORTES);

// Configuración de JWT
const JWT_CONFIG = {
    EXPIRACION_DEFAULT: '7d',
    ALGORITMO: 'HS256'
};

// Configuración de bcrypt
const BCRYPT_CONFIG = {
    SALT_ROUNDS: 10
};

// Mensajes de error comunes
const MENSAJES_ERROR = {
    NO_AUTORIZADO: 'Acceso no autorizado',
    TOKEN_NO_PROPORCIONADO: 'Token no proporcionado',
    TOKEN_INVALIDO: 'Token inválido o expirado',
    ROL_INSUFICIENTE: 'No tienes los privilegios necesarios para realizar esta acción',
    USUARIO_NO_ENCONTRADO: 'Usuario no encontrado',
    PRODUCTO_NO_ENCONTRADO: 'Producto no encontrado',
    ORDEN_NO_ENCONTRADO: 'Orden no encontrada',
    STOCK_INSUFICIENTE: 'Stock insuficiente para el producto',
    DATOS_INVALIDOS: 'Datos inválidos',
    ERROR_SERVIDOR: 'Error interno del servidor',
    CONFLICTO_CONCURRENCIA: 'Conflicto de concurrencia, por favor intente nuevamente'
};

module.exports = {
    ROLES,
    ROLES_ARRAY,
    PRIVILEGIOS,
    PRIVILEGIOS_POR_ROL,
    ESTADOS_ORDEN,
    ESTADOS_ORDEN_ARRAY,
    CATEGORIAS,
    CATEGORIAS_ARRAY,
    DEPORTES,
    DEPORTES_ARRAY,
    JWT_CONFIG,
    BCRYPT_CONFIG,
    MENSAJES_ERROR
};
