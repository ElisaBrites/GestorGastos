# Bolsillo

Gestor personal de finanzas con estética clara, modo oscuro, diseño responsive y datos sincronizados en PostgreSQL. La app conserva una copia local por usuario para tolerar cortes de conexión.

## Cómo funciona

- El acceso es con **usuario y contraseña**, sin email, OAuth ni redes sociales.
- Puedes **entrar** con una cuenta existente o **crear una cuenta nueva** desde la pantalla de acceso. Se admiten varios usuarios en la misma instalación.
- Cada usuario tiene sus propias billeteras, categorías, movimientos, transferencias, fijos y ajustes.
- La contraseña se guarda hasheada con bcrypt. La sesión usa una cookie `HttpOnly` y un token que se almacena hasheado en la base de datos.
- Los datos financieros se guardan en PostgreSQL (una fila JSONB por usuario) y también en `localStorage` como caché local.
- Si se pierde la conexión mientras la app está abierta, se sigue usando la copia local. Al volver la conexión, los cambios se sincronizan automáticamente.
- La moneda inicial es el **peso argentino (ARS)**. Se puede cambiar desde Ajustes.
- No hay datos de ejemplo: cada cuenta empieza con sus billeteras y categorías iniciales.

## Puesta en marcha en local

```bash
npm install
cp .env.example .env
```

Edita `.env` y configura `DATABASE_URL` con la cadena de conexión de PostgreSQL. Si usas Supabase:

1. Entra en **Connect** dentro del proyecto de Supabase.
2. Copia la cadena de **Transaction pooler** (o **Session pooler**).
3. El usuario debe ser `postgres.<project-ref>`.
4. El host del pooler debe corresponder a la región del proyecto. Si el host no coincide, la conexión falla con `tenant/user ... not found`.

Después crea las tablas:

```bash
npm run db:init
```

Para desarrollo, arranca el backend y Vite en dos terminales:

```bash
# Terminal 1: API en http://127.0.0.1:3001
npm run dev:server

# Terminal 2: app en http://localhost:5173
npm run dev
```

Vite redirige `/api` al backend, así que la cookie de sesión funciona igual que en producción.

Para probar la compilación de producción en local:

```bash
npm run build
npm run server
```

Abre `http://localhost:3001`. `npm run server` carga `.env`; `npm start` está pensado para Render y usa las variables de entorno del servicio.

En el primer acceso puedes crear tu usuario y contraseña. Para añadir otra cuenta, cierra sesión y usa **Crear cuenta** en la pantalla de acceso.

> Si venías de la versión local de Bolsillo, la primera cuenta que crees en PostgreSQL en este navegador hereda los datos locales si la cuenta todavía no tiene datos en la nube. Si ya tenías datos en PostgreSQL, puedes recuperar la copia local desde **Ajustes → Importar datos locales anteriores**. Las cuentas locales anteriores no se migran: crea una cuenta nueva en PostgreSQL.

## Despliegue en Render

Bolsillo debe desplegarse como un **Web Service**, no como un Static Site, porque necesita ejecutar el servidor Node y conectar con PostgreSQL.

Configuración del servicio:

- **Build command**: `npm install && npm run build`
- **Start command**: `npm start`
- **Health check**: `/api/health`

Variables de entorno:

- `DATABASE_URL`: cadena completa del pooler de Supabase. Debe usar el host de la región correcta y el usuario `postgres.<project-ref>`.
- `NODE_ENV`: `production`.
- `DATABASE_SSL`: `true` para Supabase.
- `PORT`: no hace falta definirla; Render la inyecta automáticamente.

El servidor crea las tablas `users`, `sessions` y `user_data` al arrancar si no existen. También puedes ejecutar `npm run db:init` apuntando a la base de producción.

> Importante: no pongas `DATABASE_URL` en una variable que empiece por `VITE_`. Esas variables se incluyen en el frontend. La cadena de conexión solo debe existir en el servidor y en `.env` local, que está ignorado por git.

## Base de datos

El esquema está en `server/schema.sql`:

- `users`: usuarios, contraseña hasheada y fecha de creación.
- `sessions`: sesiones activas con token hasheado y expiración.
- `user_data`: un documento JSONB por usuario con billeteras, categorías, movimientos, transferencias, fijos y ajustes.

`npm run db:init` es idempotente: se puede ejecutar varias veces sin borrar datos.

## Sincronización y datos

- Toda la app se guarda como un único documento `AppData` por usuario.
- Los cambios se envían al servidor con un retardo de 900 ms para no saturar la API.
- Si hay cambios desde dos dispositivos, gana la última escritura completa.
- La copia local de cada usuario vive en `localStorage` bajo `bolsillo.data.v1.<id>`.
- La sesión cacheada guarda solo el id y el nombre de usuario para recordar la sesión y usar la copia local si falla la conexión. No guarda la contraseña ni el token de sesión.
- **Ajustes → Exportar copia de seguridad** e **Importar copia** siguen disponibles para respaldos manuales.
- **Ajustes → Restablecer todo** vuelve a las billeteras y categorías iniciales del usuario activo.

## Funcionalidades

- **Fecha de referencia global**: una barra superior permite consultar toda la app tal como estaba —o estará— en cualquier fecha. Los saldos, totales, gráficos y listados se calculan hasta esa fecha. «Vista actual» usa hoy, «Vista histórica» oculta lo posterior y «Vista proyectada» incluye los movimientos programados hasta la fecha elegida. El botón **Hoy** vuelve a la fecha real.
- **Inicio**: balance total, ingresos y gastos del mes, ahorro, flujo de caja de 6 meses, gastos por categoría, movimientos recientes (incluidas transferencias), billeteras, movimientos programados y próximos fijos, todo calculado con la fecha de referencia.
- **Movimientos**: alta, edición y borrado de gastos, ingresos y transferencias. Búsqueda y filtros por tipo, categoría, billetera y periodo. Los selectores de billetera, categoría y subcategoría muestran su icono y color, y permiten crear categorías o subcategorías sin salir del formulario. Las transferencias se muestran junto al resto de movimientos, pero no cuentan como ingreso ni gasto.
- **Transferencias**: mueve dinero entre billeteras desde Inicio, Movimientos o Billeteras. Se pueden editar y eliminar; los saldos de origen y destino se actualizan automáticamente. Las transferencias con fecha futura quedan programadas.
- **Movimientos programados**: si un gasto, ingreso o transferencia tiene una fecha posterior a la fecha de referencia, queda marcado como programado y no afecta a los totales de esa vista. En la vista actual, el cambio a «registrado» es automático al pasar el día. En una vista histórica no se muestran los movimientos posteriores a la fecha consultada; en una vista proyectada se incluyen los programados hasta esa fecha.
- **Fijos programados**: ingresos y gastos recurrentes (semanal, mensual, trimestral o anual). Los automáticos se registran al abrir la app; los manuales quedan pendientes y se pueden registrar desde el aviso. Sus vencimientos siguen el calendario real y no se desplazan con la fecha de referencia.
- **Billeteras**: varias cuentas (efectivo, banco, ahorros…) con saldo inicial, saldo a la fecha de referencia e ingresos/gastos del mes. Cada billetera se puede excluir del balance total con el botón de visibilidad de la tarjeta o desde su ficha.
- **Categorías**: categorías y subcategorías con icono y color propios; se pueden crear y editar, incluso al vuelo desde el formulario de movimiento.
- **Presupuestos**: límite de gasto por categoría completa o por una subcategoría concreta, para el periodo de fechas que elijas (mes, trimestre, año o fechas personalizadas). Muestra gastado, disponible, porcentaje consumido y avisos al acercarse o superar el límite. Se calculan con los gastos hasta la fecha de referencia.
- **Estadísticas**: análisis por categoría y subcategoría para gastos, ingresos o **ambos juntos**, con tarjetas combinadas de ingresos, gastos, balance y actividad. Permite filtrar por mes/año/todo y **seleccionar varias billeteras a la vez** (o todas). Incluye evolución de 6 meses, subcategorías destacadas y paneles separados de ingresos y gastos cuando se usa el modo «Ambos». Solo se contabilizan los movimientos hasta la fecha de referencia.
- **Ajustes**: tema claro/oscuro/sistema, moneda (ARS por defecto), cuenta y cierre de sesión, estado de sincronización, exportación e importación JSON (incluye transferencias, presupuestos y billeteras excluidas del total) y restablecimiento.

## Tecnología

React 19, TypeScript, Vite, Tailwind CSS 4, Zustand, Recharts y Lucide. Backend con Express, PostgreSQL (`pg`), sesiones con cookie `HttpOnly` y contraseñas con bcrypt. La copia local por usuario permite seguir usando la app ante cortes de conexión.

## Diseño responsive

Bolsillo es un sitio web responsive: adapta la navegación y las tarjetas a celulares, tablets y escritorio. No se instala como aplicación. Se conserva un archivo de limpieza para retirar el service worker de la versión anterior; la copia local se usa para tolerar cortes de conexión mientras la pestaña está abierta.
