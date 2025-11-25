# 🏀 Tienda de Deportes - Backend API

Backend completo para una tienda de deportes desarrollado con Node.js, Express y MongoDB.

## 📋 Características

- **Autenticación JWT**: Sistema completo de registro, login y manejo de sesiones
- **Sistema de Roles**: Admin, Vendedor y Cliente con privilegios diferenciados
- **Transacciones MongoDB**: Operaciones atómicas para órdenes y manejo de stock
- **Control de Concurrencia**: Prevención de condiciones de carrera en operaciones críticas
- **Validación de Datos**: Validación robusta con express-validator
- **Manejo de Errores**: Middleware centralizado para respuestas consistentes

## 🛠️ Tecnologías

- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web
- **MongoDB** - Base de datos NoSQL
- **Mongoose** - ODM para MongoDB
- **JWT** - Autenticación con tokens
- **bcryptjs** - Hash de contraseñas
- **express-validator** - Validación de datos

## 📁 Estructura del Proyecto

```
backend/
├── config/
│   └── db.js                 # Configuración de MongoDB
├── controllers/
│   ├── usersControllers.js   # Controlador de autenticación
│   ├── userAdminController.js # Administración de usuarios
│   ├── productController.js  # CRUD de productos
│   ├── orderController.js    # Gestión de órdenes
│   └── roleController.js     # Gestión de roles
├── middleware/
│   ├── authMiddleware.js     # Verificación de JWT
│   ├── roleMiddleware.js     # Control de acceso por rol
│   ├── privilegeMiddleware.js # Control por privilegios
│   ├── validationMiddleware.js # Validación de datos
│   └── errorMiddleware.js    # Manejo de errores
├── models/
│   ├── usersModel.js         # Modelo de Usuario
│   ├── productModel.js       # Modelo de Producto
│   ├── orderModel.js         # Modelo de Orden
│   └── roleModel.js          # Modelo de Rol
├── routes/
│   ├── authRoutes.js         # Rutas de autenticación
│   ├── usersRoutes.js        # Rutas de usuarios
│   ├── productRoutes.js      # Rutas de productos
│   ├── orderRoutes.js        # Rutas de órdenes
│   └── roleRoutes.js         # Rutas de roles
├── utils/
│   ├── constants.js          # Constantes del sistema
│   ├── jwt.util.js           # Utilidades JWT
│   ├── bcrypt.util.js        # Utilidades de hash
│   └── transaction.util.js   # Helpers de transacciones
└── server.js                 # Punto de entrada
```

## 🚀 Instalación

1. **Clonar el repositorio**
```bash
git clone <url-del-repositorio>
cd BACKEND
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

4. **Iniciar MongoDB**
```bash
# Local
mongod

# O usar MongoDB Atlas (configurar MONGO_URI en .env)
```

5. **Iniciar el servidor**
```bash
# Desarrollo (con hot reload)
npm run dev

# Producción
npm start
```

## ⚙️ Variables de Entorno

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/tienda-deportes
JWT_SECRET=tu_secreto_jwt_muy_seguro
JWT_EXPIRE=7d
```

## 📡 Endpoints API

### Autenticación (`/api/auth`)

| Método | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| POST | /register | Registrar usuario | Público |
| POST | /login | Iniciar sesión | Público |
| GET | /profile | Ver perfil | Autenticado |
| PUT | /profile | Actualizar perfil | Autenticado |

### Usuarios (`/api/users`)

| Método | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| GET | / | Listar usuarios | Admin |
| GET | /:id | Ver usuario | Admin / Propio |
| PUT | /:id | Actualizar usuario | Admin / Propio |
| DELETE | /:id | Eliminar usuario | Admin |
| PUT | /:id/role | Cambiar rol | Admin |

### Productos (`/api/products`)

| Método | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| GET | / | Listar productos | Público |
| GET | /:id | Ver producto | Público |
| POST | / | Crear producto | Admin / Vendedor |
| PUT | /:id | Actualizar producto | Admin / Vendedor |
| DELETE | /:id | Eliminar producto | Admin |
| PUT | /:id/stock | Actualizar stock | Admin / Vendedor |

### Órdenes (`/api/orders`)

| Método | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| GET | / | Listar órdenes | Autenticado* |
| GET | /:id | Ver orden | Admin / Vendedor / Dueño |
| POST | / | Crear orden | Autenticado |
| PUT | /:id/status | Cambiar estado | Admin / Vendedor |
| DELETE | /:id | Cancelar orden | Admin / Dueño |

*Los clientes solo ven sus propias órdenes

### Roles (`/api/roles`)

| Método | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| GET | / | Listar roles | Admin |
| POST | / | Crear rol | Admin |
| POST | /init | Inicializar roles | Admin |
| PUT | /:id | Actualizar rol | Admin |
| DELETE | /:id | Eliminar rol | Admin |

## 📝 Ejemplos de Uso

### Registro de Usuario
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Juan Pérez",
    "email": "juan@email.com",
    "password": "password123"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan@email.com",
    "password": "password123"
  }'
```

### Crear Producto (Admin/Vendedor)
```bash
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "nombre": "Balón de Fútbol Nike",
    "descripcion": "Balón oficial tamaño 5",
    "categoria": "equipamiento",
    "deporte": "futbol",
    "precio": 599.99,
    "stock": 50,
    "marca": "Nike"
  }'
```

### Crear Orden
```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "productos": [
      { "producto": "product_id_aqui", "cantidad": 2 }
    ],
    "direccionEnvio": {
      "calle": "Av. Principal 123",
      "ciudad": "Ciudad de México",
      "estado": "CDMX",
      "codigoPostal": "01000"
    }
  }'
```

### Actualizar Estado de Orden
```bash
curl -X PUT http://localhost:5000/api/orders/{id}/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "estado": "procesando"
  }'
```

## 🔐 Sistema de Roles y Privilegios

### Roles

| Rol | Descripción |
|-----|-------------|
| **admin** | Control total del sistema |
| **vendedor** | Gestión de productos y órdenes |
| **cliente** | Compras y consultas |

### Privilegios por Rol

**Admin:**
- Todas las operaciones CRUD en todos los recursos
- Gestión de usuarios y roles
- Cambio de roles de usuarios

**Vendedor:**
- CRUD de productos
- Ver y actualizar órdenes
- Actualizar stock

**Cliente:**
- Ver productos
- Crear órdenes propias
- Ver y cancelar órdenes propias

## 💾 Transacciones MongoDB

Las transacciones se utilizan en operaciones críticas:

### Creación de Orden
1. Verificar stock de todos los productos
2. Reducir stock de forma atómica
3. Crear la orden
4. Si falla cualquier paso → Rollback completo

### Cancelación de Orden
1. Restaurar stock de productos
2. Actualizar estado a "cancelada"
3. Si falla cualquier paso → Rollback completo

> **Nota:** Las transacciones requieren MongoDB con Replica Set. MongoDB Atlas lo tiene habilitado por defecto.

## 🔄 Control de Concurrencia

### Estrategias implementadas:

1. **Operadores Atómicos** (`$inc`)
   - Actualización de stock sin condiciones de carrera

2. **Optimistic Locking** (versionado con `__v`)
   - Detección de modificaciones concurrentes
   - Retry logic automático

3. **Validación Condicional**
   - Verificación de stock suficiente antes de reducir
   - Prevención de stock negativo

## 🛡️ Seguridad

- Contraseñas hasheadas con bcrypt (salt rounds: 10)
- JWT para autenticación stateless
- Validación de todos los inputs
- Sanitización de datos
- Headers de seguridad (X-Frame-Options, X-Content-Type-Options)
- Control de acceso basado en roles

## 📊 Modelos de Datos

### Usuario
```javascript
{
  nombre: String (requerido),
  email: String (único, requerido),
  password: String (hasheado),
  rol: 'admin' | 'vendedor' | 'cliente',
  activo: Boolean,
  fechaCreacion: Date
}
```

### Producto
```javascript
{
  nombre: String (requerido),
  descripcion: String,
  categoria: 'calzado' | 'ropa' | 'equipamiento' | 'accesorios',
  deporte: 'futbol' | 'basketball' | 'tennis' | 'running' | 'gym' | 'otros',
  precio: Number (requerido),
  stock: Number (default: 0),
  marca: String,
  imagen: String (URL),
  activo: Boolean
}
```

### Orden
```javascript
{
  usuario: ObjectId (ref: User),
  productos: [{
    producto: ObjectId,
    cantidad: Number,
    precioUnitario: Number
  }],
  total: Number,
  estado: 'pendiente' | 'procesando' | 'completada' | 'cancelada',
  direccionEnvio: {
    calle: String,
    ciudad: String,
    estado: String,
    codigoPostal: String,
    ...
  }
}
```

## 🐛 Manejo de Errores

El sistema incluye manejo centralizado de errores:

- **400** - Datos inválidos / Error de validación
- **401** - No autenticado / Token inválido
- **403** - No autorizado / Permisos insuficientes
- **404** - Recurso no encontrado
- **409** - Conflicto de concurrencia
- **500** - Error interno del servidor

## 📄 Licencia

ISC

## 👤 Autor

Diego
