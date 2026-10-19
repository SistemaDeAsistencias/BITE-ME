# Bite Me — tienda online de galletas artesanales

Aplicación de comercio electrónico con interfaz responsive, Node.js/Express, PostgreSQL, sesiones seguras, API REST y configuración Docker/Render. Los productos, precios, fotografías y stocks precargados son **datos de demostración editables**; no representan un catálogo comercial real. Los testimonios reales no se inventan y no se han incluido reseñas atribuidas a clientes.

## Funcionalidades incluidas

- Tienda responsive con catálogo, búsqueda, filtros por categoría, orden por precio, carrito local persistente y checkout.
- Registro e inicio/cierre de sesión con `bcryptjs`, cookies de sesión HttpOnly y límite de intentos.
- API con productos, categorías, pedidos, historial del cliente y suscripción al boletín.
- Creación transaccional de pedidos: vuelve a consultar precios en PostgreSQL, bloquea productos para controlar concurrencia, valida stock, registra detalles e historial, y descuenta existencias. El pedido y el pago quedan pendientes; elegir un método no simula un cobro exitoso.
- API de administración protegida para dashboard con consultas reales, productos, pedidos, cambio de estado y exportación CSV.
- Migración SQL, carga inicial idempotente, Dockerfile, Compose y plantilla Render.

## Requisitos

- Node.js 20 o 22 y npm, o Docker Desktop con Compose.
- PostgreSQL 14+ si ejecutas Node directamente.

## Ejecutar en Windows PowerShell (recomendado: Docker)

1. Descomprime la carpeta y abre PowerShell dentro de `bite-me`.
2. Crea tu archivo local de variables:

```powershell
Copy-Item .env.example .env
```

3. Edita `.env`. Cambia `SESSION_SECRET` por un valor largo aleatorio (32 caracteres como mínimo en producción), y cambia `ADMIN_PASSWORD` por una contraseña fuerte de al menos 12 caracteres. Para generar un secreto aleatorio en PowerShell:

```powershell
$b = New-Object byte[] 48
[Security.Cryptography.RandomNumberGenerator]::Fill($b)
[Convert]::ToBase64String($b)
```

4. Levanta los servicios:

```powershell
docker compose up --build -d
```

5. Comprueba estado y registros:

```powershell
docker compose ps
docker compose logs -f web
Invoke-RestMethod http://localhost:3000/health
```

Abre `http://localhost:3000`. El primer arranque ejecuta migraciones y datos iniciales. La base local persiste en el volumen `postgres_data`.

Para detener sin borrar la base de datos:

```powershell
docker compose down
```

**No ejecutes `docker compose down -v` si quieres conservar los datos**: esa opción elimina el volumen persistente.

## Ejecutar sin Docker

Necesitas PostgreSQL en ejecución y una base creada. En PowerShell:

```powershell
Copy-Item .env.example .env
npm install
npm run db:migrate
npm run db:seed
npm start
```

Configura `DATABASE_URL` para tu PostgreSQL local. Para desarrollo, `DATABASE_SSL=false` (si tu instalación no usa TLS). `DATABASE_SSL=true` activa TLS con validación de certificado desactivada; úsalo solo cuando el proveedor indique esta configuración y la conexión lo requiera. En Render, utiliza preferentemente la URL interna de PostgreSQL en la misma región y sigue la configuración TLS actual del proveedor.

## API esencial

- `GET /health`: estado del servidor y comprobación de PostgreSQL.
- `GET /api/categories`, `GET /api/products`, `GET /api/products/:id`: endpoints públicos.
- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`: cuenta y sesión.
- `POST /api/orders`: checkout; requiere datos de entrega y artículos `{id, quantity}`. La sesión es opcional.
- `GET /api/orders/my-orders`, `GET /api/orders/:id`: sesión obligatoria; se comprueba propiedad del pedido salvo rol admin.
- `POST /api/newsletter`: suscripción.
- `/api/admin/dashboard`, `/api/admin/products`, `/api/admin/orders`, `/api/admin/reports/sales.csv`: requieren sesión de administrador. Crear productos usa `POST /api/admin/products`; actualizar usa `PATCH /api/admin/products/:id`; estado de pedido usa `PATCH /api/admin/orders/:id/status` con `{ "status": "Confirmado" }`.

La administración incluye una pantalla inicial en `/admin.html` con resumen, pedidos, cambios de estado, stock bajo, productos más vendidos y exportación CSV. La gestión CRUD gráfica completa de productos y categorías todavía requiere ampliarse. La recuperación de contraseña por correo, verificación de correo, carga de imágenes a almacenamiento de objetos y pasarela de pagos real requieren configuración e integración adicionales antes de producción. No se almacenan datos de tarjetas ni se afirma que una transferencia se haya pagado.

## Pruebas

```powershell
npm test
```

Las pruebas incluidas comprueban estructura de migración, presencia de controles críticos y archivos principales. No sustituyen pruebas de integración contra una base PostgreSQL real. Para verificar el flujo completo, levanta Docker, crea una cuenta, consulta el catálogo y realiza un pedido de prueba con datos ficticios; comprueba stock y pedido en PostgreSQL.

## Primer administrador

Configura `ADMIN_EMAIL`, `ADMIN_PASSWORD` (12 caracteres o más) y `ADMIN_NAME` en `.env` antes del primer `docker compose up`. `npm run db:seed` crea el administrador solo si ese correo aún no existe; no reemplaza una contraseña ya existente. No compartas `.env` ni lo subas a GitHub. El formulario público nunca permite escoger el rol admin.

## Publicar en GitHub

```powershell
git init
git add .
git commit -m "Crear tienda Bite Me"
git branch -M main
git remote add origin https://github.com/SistemaDeAsistencias/BITE-ME.git
git push -u origin main
```

Crea primero el repositorio vacío en GitHub y sustituye `TU_USUARIO` por tu cuenta. Verifica que `.env` no aparece en `git status`.

## Despliegue en Render

1. Sube el proyecto a GitHub.
2. En Render crea una base PostgreSQL y un Web Service con runtime Docker, preferiblemente en la misma región.
3. Configura `DATABASE_URL` con la URL interna de la base y establece `NODE_ENV=production`, `COOKIE_SECURE=true`, `SESSION_SECRET` fuerte, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`, `SHIPPING_FLAT_PEN` y `FREE_SHIPPING_FROM_PEN`.
4. Ejecuta una sola vez `node scripts/migrate.js` y `node scripts/seed.js` como pre-deploy/release command si el plan de Render lo permite; si no, ejecuta esos comandos de forma controlada con una consola conectada al servicio. No ejecutes migraciones concurrentes desde múltiples réplicas sin un proceso de despliegue coordinado.
5. Comprueba `/health`, crea una cuenta de cliente y realiza un pedido de prueba. Comprueba los logs y que el pedido y el stock persisten tras un redeploy.
6. Configura almacenamiento de objetos para fotos administrables; las fotos de ejemplo usan URLs externas. Configura dominio, políticas legales, datos de contacto, cobertura de entrega, privacidad y backups antes de abrir al público.

`render.yaml` es una plantilla inicial; confirma los planes y nombres de recursos disponibles en tu cuenta antes de usar Blueprint. Los planes, cuotas, suspensión por inactividad y precios de Render cambian, así que no se promete disponibilidad permanente en un plan gratuito.

## Antes de producción

- Configurar HTTPS, secretos y política de sesión apropiados para el dominio.
- Añadir protección CSRF si la aplicación se amplía con flujos sensibles basados en cookies y endurecer CSP una vez definidos los orígenes de imágenes y fuentes.
- Implementar recuperación/verificación de correo, política de privacidad, términos, consentimiento y retención de datos.
- Añadir tests de integración/E2E, monitoreo, backups verificados, y un procedimiento de restauración.
- Definir datos bancarios reales, zonas de entrega, descuentos autorizados y método de conciliación de pagos. El proyecto no integra aún una pasarela real.
- Completar la interfaz de administración y el control de acceso a acciones según el flujo comercial.

## Estructura

```text
bite-me/
├── public/ (HTML, CSS y JS de la tienda)
├── src/app.js (API, autenticación, pedidos y administración)
├── src/server.js
├── src/db/migrations/001_init.sql
├── scripts/migrate.js
├── scripts/seed.js
├── tests/app.test.js
├── Dockerfile
├── compose.yaml
├── render.yaml
├── .env.example
└── README.md
```
