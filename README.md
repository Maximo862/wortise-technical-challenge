# Wortise - prueba técnica fullstack junior

Aplicación web para gestionar artículos. Incluye autenticación con email y contraseña, operaciones privadas sobre artículos propios y una página pública con autores registrados y búsqueda de artículos

## Demo

(https://wortise.maximokugler.com.ar/)

## Funcionalidades

- Registro, inicio y cierre de sesión con persistencia de la sesión
- Protección de rutas privadas y redirección al login cuando no hay una sesión válida
- Creación de artículos con título, contenido y URL de portada opcional
- Listado paginado de los artículos del usuario autenticado
- Detalle con autor, fecha de creación y última actualización
- Edición y eliminación únicamente por el propietario del artículo
- Confirmación mediante modal antes de eliminar un artículo
- Página pública con todos los autores registrados, incluidos los que todavía no publicaron, y cantidad de artículos por autor
- Búsqueda server-side por título, contenido o nombre del autor, con paginación
- Estados de carga, error y listas vacías, y diseño adaptable a desktop y mobile

## Stack tecnológico

### Frontend

- React 19 y TypeScript
- Vite 8
- HeroUI y Tailwind CSS 4
- TanStack Router, Query y Form
- Zod
- Cliente de Better Auth para React.

### Backend

- Node.js y typescript.
- Hono con `@hono/node-server`.
- MongoDB mediante el driver nativo
- Better Auth con adaptador de MongoDB
- Zod

## Arquitectura

El repositorio es un monorepo administrado con npm workspaces:

```text
.
|-- client/                 # Aplicación React
|   `-- src/
|       |-- features/       # API, query keys y componentes de artículos ( preparado para escalar )
|       |-- lib/            # Cliente de autenticación
|       `-- routes/         # Rutas file-based de TanStack Router
|-- server/                 # API HTTP
|   `-- src/
|       |-- articles/       # Servicio y repositorio de artículos
|       |-- auth/           # Configuración de Better Auth
|       |-- config/         # Lectura y validación básica del entorno
|       |-- db/             # Conexión reutilizable a MongoDB
|       |-- middlewares/    # Sesión y requisito de autenticación
|       `-- routes/         # Endpoints de salud, artículos y página pública
|-- shared/                 # Esquemas Zod y tipos compartidos
|-- .env.example
`-- package.json
```

- `client` contiene la interfaz, las rutas, los formularios y el acceso HTTP a la API
- `server` contiene la autenticación, reglas de negocio, acceso a MongoDB y endpoints HTTP
- `shared` evita duplicar contratos: exporta esquemas Zod y tipos usados por frontend y backend

## Decisiones técnicas

### Hono

La API se organiza en rutas y middlewares pequeños. Un middleware carga la sesión de Better Auth y otro exige autenticación en TODA la rama `/api/articles`

### MongoDB native driver

El backend usa el driver oficial directamente. La conexión se crea al iniciar el servidor y se reutiliza. La paginación se ejecuta en MongoDB mediante `skip` y `limit`; la página pública usa agrupación para contar artículos por autor y consultas con expresiones regulares escapadas para buscar por título, contenido o autor

### Better Auth

Better Auth maneja usuarios, sesiones y almacenamiento en Mongo. El frontend usa `createAuthClient` para registro, login, logout y consulta de sesión. Las solicitudes trabajan con cookies y `credentials: "include"`; el servidor limita CORS y los orígenes confiables mediante variables de entorno

### TanStack Router

Las rutas se generan a partir de archivos. `_authenticated` es un layout sin segmento visible que ejecuta `beforeLoad` y protege sus rutas hijas. Los parámetros, como `$articleId`, se obtienen de forma tipada desde la ruta

### TanStack Query

El estado remoto se organiza con query keys jerárquicas para listados privados, detalles, autores públicos y búsquedas paginadas. Después de crear o editar se guarda el detalle recibido con `setQueryData` y se invalidan los listados afectados (marcarlos desactualizados). Al cerrar sesión, limpio la caché privada para evitar que queden datos expuestos entre diferentes usuarios

### TanStack Form y Zod

TanStack Form administra estado, envío y errores de los formularios. Los esquemas Zod compartidos validan artículos en frontend y API; los formularios de autenticación también usan Zod antes de llamar a Better Auth. Los botones se deshabilitan durante el envío para evitar solicitudes duplicadas.

### Ownership de artículos

El autor se obtiene siempre de la sesión y nunca del cuerpo enviado por el cliente. Para editar o eliminar, el repositorio filtra simultáneamente por `_id` y `authorId`. La interfaz oculta acciones no permitidas, pero la autorización efectiva se valida en el servidor

## Requisitos previos

- Node.js `^20.19.0` o `>=22.12.0`.
- npm.
- Una instancia accesible de MongoDB, local o en MongoDB Atlas.

## Instalación

1. Clonar o descargar el repositorio desde la URL de entrega y entrar en el directorio local:

```bash
cd wortise-technical-challenge
```

2. Instalar las dependencias de todos los workspaces:

```bash
npm install
```

3. Crear el archivo de entorno en la raíz:

```bash
# macOS / Linux
cp .env.example .env

# Windows PowerShell
Copy-Item .env.example .env
```

4. Completar `.env` con la conexión de MongoDB y los valores del entorno local. Para generar un secreto aleatorio para Better Auth se puede usar:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

## Variables de entorno

El cliente y el servidor leen el mismo archivo `.env` ubicado en la raíz.

| Variable | Descripción | Valor local esperado |
| --- | --- | --- |
| `PORT` | Puerto HTTP del backend. | `3000` |
| `MONGODB_URI` | URI de conexión a MongoDB. Debe contener credenciales válidas cuando correspondan. | URI local o de Atlas |
| `MONGODB_DB_NAME` | Nombre de la base de datos utilizada por la aplicación y Better Auth. | `wortise_dev` |
| `BETTER_AUTH_SECRET` | Secreto aleatorio usado por Better Auth. No debe publicarse ni reutilizarse entre entornos. | Cadena aleatoria segura |
| `BETTER_AUTH_URL` | URL base pública del backend donde está montado Better Auth. | `http://localhost:3000` |
| `CLIENT_ORIGIN` | Origen exacto permitido por CORS y considerado confiable por Better Auth. | `http://localhost:5173` |
| `VITE_API_URL` | URL base que utiliza el frontend para llamar a la API. | `http://localhost:3000` |

El archivo `.env.example` contiene únicamente placeholders. El archivo `.env` está ignorado por Git.

## Ejecución local

Desde la raíz, levantar el backend:

```bash
npm run dev:server
```

En otra terminal, levantar el frontend:

```bash
npm run dev:client
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`
- Health check: `http://localhost:3000/health`

Comandos adicionales disponibles:

```bash
# Build y typecheck del frontend
npm run build -w client

# Typecheck del backend
npm run typecheck -w server

# Typecheck de los contratos compartidos
npm run typecheck -w shared

# Tests de integración del backend
npm run test -w server

# Verificar escritura y lectura en MongoDB
npm run verify:db -w server
```

`verify:db` crea un documento temporal en la colección `_phase2_check`, lo lee y luego lo elimina.

## Cómo probar la aplicación

1. Abrir `/` y comprobar la lista de autores y la búsqueda pública
2. Registrar un usuario con nombre, email y una contraseña de al menos 8 caracteres
3. Entrar en `My articles` y crear un artículo, con o sin portada
4. Revisar su detalle, editarlo y comprobar que las fechas y listados se actualicen sin recargar manualmente
5. Eliminarlo desde el modal de confirmación y verificar que desaparezca de los resultados privados y públicos
6. Crear una segunda cuenta e intentar acceder manualmente a la edición de un artículo de la primera: la interfaz debe mostrar acceso denegado y la API debe impedir la operación
7. Cerrar sesión y confirmar que `/articles` redirija a `/login`
8. Probar la interfaz en viewport mobile y desktop

## Consideraciones de seguridad

- Las credenciales y secretos se mantienen fuera del repositorio mediante `.env`
- Producción debe usar un `BETTER_AUTH_SECRET` fuerte, HTTPS y orígenes configurados con sus URLs reales
- Las cookies de sesión se envían con credenciales y CORS acepta únicamente `CLIENT_ORIGIN`.
- Las rutas de artículos requieren una sesión válida
- El ownership de edición y eliminación se verifica en MongoDB usando el usuario autenticado.
- La validación del frontend mejora la experiencia, pero la API vuelve a validar los datos de artículos con Zod

## Verificación

El código fue revisado, ejecutado y testeado manualmente durante el desarrollo. También se verificaron el build del frontend y el typecheck de frontend, backend y contratos compartidos.

El backend incluye tests de integración para autenticación, autorización y validación. La suite utiliza Vitest, las solicitudes internas de Hono y una instancia temporal de MongoDB, aislada de las bases de desarrollo y producción.

## Uso de IA

Se utilizaron herramientas de IA como Claude y Codex como apoyo durante el desarrollo, principalmente para planificación, exploración de tecnologías nuevas, implementación asistida y parte de revisión de código. Las decisiones técnicas, integración, pruebas manuales y validación final fueron revisadas durante el desarrollo

## Posibles mejoras

Con más tiempo y crecimiento del proyecto, pensaria en :

- Ampliar los tests automatizados para búsqueda, paginación y el flujo CRUD completo
- Incorporar una pipeline de CI para ejecutar typecheck, tests y build antes de integrar cambios
- Centralizar el mapeo de errores HTTP mediante un error handler global de Hono si aumenta la cantidad de rutas
- Agregar índices y una estrategia de búsqueda más escalable en MongoDB si aumenta significativamente el volumen de artículos
- Extraer hooks/componentes reutilizables cuando la lógica de queries y formularios empiece a repetirse entre páginas