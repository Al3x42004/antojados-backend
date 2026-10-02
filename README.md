# Antojados - Servicios Web (Backend)

API REST del proyecto **Antojados**, desarrollada para la evidencia **GA7-220501096-AA5-EV03 - Diseño y desarrollo de servicios web**.

Antojados es una aplicación donde los estudiantes hacen pedidos de pancerottis, gelatinas, arepas y jugos naturales, y el administrador los recibe y los prepara.

## Tecnologías
- Node.js + Express
- MySQL (librería mysql2)
- JWT para el inicio de sesión
- bcryptjs para encriptar contraseñas

## Estructura
```
src/
  config/db.js            -> conexión a MySQL
  middlewares/auth.js     -> validación de token y roles
  controllers/            -> lógica de cada servicio
  routes/                 -> definición de las rutas
  app.js                  -> configuración de Express
  server.js               -> arranque del servidor
database/antojados.sql    -> script de la base de datos
postman/                  -> colección para probar los servicios
```

## Cómo ejecutarlo
1. Ejecutar el script `database/antojados.sql` en MySQL (Workbench, XAMPP o consola).
2. Copiar `.env.example` como `.env` y poner el usuario y la contraseña de MySQL.
3. Instalar dependencias:
   ```bash
   npm install
   ```
4. Iniciar el servidor:
   ```bash
   npm start
   ```
5. La API queda en `http://localhost:4000/api`

Usuario administrador de prueba: `admin@antojados.com` / `Admin123`

## Servicios

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| POST | /api/auth/registro | Público | Registrar estudiante |
| POST | /api/auth/login | Público | Iniciar sesión (devuelve token) |
| GET | /api/auth/perfil | Con sesión | Datos del usuario logueado |
| GET | /api/productos | Público | Listar productos (filtro `?categoria=`) |
| GET | /api/productos/:id | Público | Ver un producto |
| POST | /api/productos | Admin | Crear producto |
| PUT | /api/productos/:id | Admin | Actualizar producto |
| DELETE | /api/productos/:id | Admin | Quitar producto del menú |
| POST | /api/pedidos | Estudiante | Hacer un pedido |
| GET | /api/pedidos/mis-pedidos | Estudiante | Ver mis pedidos |
| PATCH | /api/pedidos/:id/cancelar | Estudiante | Cancelar pedido pendiente |
| GET | /api/pedidos | Admin | Ver todos los pedidos (filtro `?estado=`) |
| PATCH | /api/pedidos/:id/estado | Admin | Cambiar estado del pedido |
| GET | /api/pedidos/:id | Con sesión | Ver detalle de un pedido |

Estados de un pedido: `pendiente` → `en_preparacion` → `listo` → `entregado` (o `cancelado`).

## Pruebas
Importar en Postman el archivo `postman/Antojados_API.postman_collection.json`. Al ejecutar los login, los tokens se guardan solos en las variables de la colección.
