# Bolsillo

Gestor personal de finanzas con estética clara, modo oscuro y todos los datos guardados en el navegador.

## Puesta en marcha

```bash
npm install
npm run dev
```

Abre la URL que muestra la terminal (por defecto `http://localhost:5173`).

Otros comandos:

```bash
npm run typecheck   # comprobación de tipos
npm run build       # compilación de producción en dist/
npm run preview     # servir la compilación
```

## Funcionalidades

- **Inicio**: balance total, ingresos y gastos del mes, ahorro, flujo de caja de 6 meses, gastos por categoría, movimientos recientes (incluidas transferencias), billeteras, movimientos programados y próximos fijos.
- **Movimientos**: alta, edición y borrado de gastos, ingresos y transferencias. Búsqueda y filtros por tipo, categoría, billetera y periodo. Los selectores de billetera, categoría y subcategoría muestran su icono y color, y permiten crear categorías o subcategorías sin salir del formulario. Las transferencias se muestran junto al resto de movimientos, pero no cuentan como ingreso ni gasto.
- **Transferencias**: mueve dinero entre billeteras desde Inicio, Movimientos o Billeteras. Se pueden editar y eliminar; los saldos de origen y destino se actualizan automáticamente. Las transferencias con fecha futura quedan programadas.
- **Movimientos programados**: si un gasto, ingreso o transferencia tiene una fecha posterior a hoy, queda marcado como programado y no afecta al balance, a los totales del mes ni a las estadísticas hasta que llega su fecha. El cambio es automático al pasar el día.
- **Fijos programados**: ingresos y gastos recurrentes (semanal, mensual, trimestral, semestral o anual). Los automáticos se registran al abrir la app; los manuales quedan pendientes y se pueden registrar desde el aviso.
- **Billeteras**: varias cuentas (efectivo, banco, ahorros…) con saldo inicial, saldo actual e ingresos/gastos del mes. Cada billetera se puede excluir del balance total con el botón de visibilidad de la tarjeta o desde su ficha.
- **Categorías**: categorías y subcategorías con icono y color propios; se pueden crear y editar, incluso al vuelo desde el formulario de movimiento.
- **Estadísticas**: análisis por categoría y subcategoría para gastos e ingresos, filtros por mes/año/todo y por billetera, evolución de 6 meses y subcategorías destacadas. Solo se contabilizan los movimientos ya registrados; los programados se avisan aparte.
- **Ajustes**: tema claro/oscuro/sistema, moneda, exportación e importación JSON (incluye transferencias y billeteras excluidas del total), datos de ejemplo y restablecimiento.

## Datos

Todo se guarda en `localStorage` bajo la clave `bolsillo.v1`; no hay servidor ni cuentas. Usa **Ajustes → Exportar copia de seguridad** para guardar un JSON y **Importar copia** para restaurarlo en otro navegador.

## Tecnología

React 19, TypeScript, Vite, Tailwind CSS 4, Zustand (persistencia), Recharts y Lucide.
