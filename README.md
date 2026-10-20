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

- **Fecha de referencia global**: una barra superior permite consultar toda la app tal como estaba —o estará— en cualquier fecha. Los saldos, totales, gráficos y listados se calculan hasta esa fecha. «Vista actual» usa hoy, «Vista histórica» oculta lo posterior y «Vista proyectada» incluye los movimientos programados hasta la fecha elegida. El botón **Hoy** vuelve a la fecha real.
- **Inicio**: balance total, ingresos y gastos del mes, ahorro, flujo de caja de 6 meses, gastos por categoría, movimientos recientes (incluidas transferencias), billeteras, movimientos programados y próximos fijos, todo calculado con la fecha de referencia.
- **Movimientos**: alta, edición y borrado de gastos, ingresos y transferencias. Búsqueda y filtros por tipo, categoría, billetera y periodo. Los selectores de billetera, categoría y subcategoría muestran su icono y color, y permiten crear categorías o subcategorías sin salir del formulario. Las transferencias se muestran junto al resto de movimientos, pero no cuentan como ingreso ni gasto.
- **Transferencias**: mueve dinero entre billeteras desde Inicio, Movimientos o Billeteras. Se pueden editar y eliminar; los saldos de origen y destino se actualizan automáticamente. Las transferencias con fecha futura quedan programadas.
- **Movimientos programados**: si un gasto, ingreso o transferencia tiene una fecha posterior a la fecha de referencia, queda marcado como programado y no afecta a los totales de esa vista. En la vista actual, el cambio a «registrado» es automático al pasar el día. En una vista histórica no se muestran los movimientos posteriores a la fecha consultada; en una vista proyectada se incluyen los programados hasta esa fecha.
- **Fijos programados**: ingresos y gastos recurrentes (semanal, mensual, trimestral o anual). Los automáticos se registran al abrir la app; los manuales quedan pendientes y se pueden registrar desde el aviso. Sus vencimientos siguen el calendario real y no se desplazan con la fecha de referencia.
- **Billeteras**: varias cuentas (efectivo, banco, ahorros…) con saldo inicial, saldo a la fecha de referencia e ingresos/gastos del mes. Cada billetera se puede excluir del balance total con el botón de visibilidad de la tarjeta o desde su ficha.
- **Categorías**: categorías y subcategorías con icono y color propios; se pueden crear y editar, incluso al vuelo desde el formulario de movimiento.
- **Estadísticas**: análisis por categoría y subcategoría para gastos, ingresos o **ambos juntos**, con tarjetas combinadas de ingresos, gastos, balance y actividad. Permite filtrar por mes/año/todo y **seleccionar varias billeteras a la vez** (o todas). Incluye evolución de 6 meses, subcategorías destacadas y paneles separados de ingresos y gastos cuando se usa el modo «Ambos». Solo se contabilizan los movimientos hasta la fecha de referencia.
- **Ajustes**: tema claro/oscuro/sistema, moneda, exportación e importación JSON (incluye transferencias y billeteras excluidas del total), datos de ejemplo y restablecimiento.

## Datos

Todo se guarda en `localStorage` bajo la clave `bolsillo.v1`; no hay servidor ni cuentas. La fecha de referencia es solo un estado de la interfaz: al recargar la app vuelve a hoy. Usa **Ajustes → Exportar copia de seguridad** para guardar un JSON y **Importar copia** para restaurarlo en otro navegador.

## Tecnología

React 19, TypeScript, Vite, Tailwind CSS 4, Zustand (persistencia), Recharts y Lucide.
